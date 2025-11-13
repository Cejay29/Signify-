// worker/train_model.mjs
import * as tf from "@tensorflow/tfjs-node";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL_OUTPUT_DIR = process.env.MODEL_OUTPUT_DIR || "./worker_output";
const BUCKET = "models";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function log(...args) {
  console.log("[ML]", ...args);
}

function canonicalize(gloss) {
  if (!gloss) return "UNKNOWN";
  return gloss.trim().toUpperCase();
}

function normalizeLandmarks(landmarks) {
  // landmarks is array of 21 {x,y,z}
  const base = landmarks[0];
  const flat = [];
  for (const p of landmarks) {
    flat.push(p.x - base.x, p.y - base.y, p.z - base.z);
  }
  return flat;
}

async function fetchAllSamples() {
  log("Loading gesture samples from Supabase...");
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("gesture_sample")
      .select("gloss, landmarks")
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    from += PAGE;
  }
  log("Loaded samples:", all.length);
  return all;
}

function splitArray(xs, ys) {
  const idx = xs.map((_, i) => i);
  tf.util.shuffle(idx);
  const total = xs.length;
  const a = Math.floor(total * 0.7);
  const b = Math.floor(total * 0.85);
  const pick = (arr, ids) => ids.map((i) => arr[i]);
  return {
    xTrain: pick(xs, idx.slice(0, a)),
    yTrain: pick(ys, idx.slice(0, a)),
    xVal: pick(xs, idx.slice(a, b)),
    yVal: pick(ys, idx.slice(a, b)),
    xTest: pick(xs, idx.slice(b)),
    yTest: pick(ys, idx.slice(b))
  };
}

async function uploadFileToBucket(localPath, remotePath, contentType = "application/octet-stream") {
  const buff = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(remotePath, buff, {
    upsert: true,
    contentType,
  });
  if (error) {
    throw error;
  }
}

export async function runTraining(job = {}) {
  // job param is optional; we return a summary object at the end
  log("Training started (job id)", job.id ?? "-");

  // 1) Fetch samples
  const raw = await fetchAllSamples();
  const valid = raw.filter((s) => Array.isArray(s.landmarks) && s.landmarks.length === 21);

  // canonicalize labels and build counts
  const counts = {};
  valid.forEach((s) => {
    const label = canonicalize(s.gloss || "UNKNOWN");
    counts[label] = (counts[label] || 0) + 1;
  });

  const labels = Object.keys(counts).sort(); // alphabetical
  if (labels.length === 0) throw new Error("No labels/samples available");

  const labelMap = Object.fromEntries(labels.map((l, i) => [l, i]));
  log("Labels:", labels);

  // Filter only valid samples
  const filtered = valid.filter((s) => labels.includes(canonicalize(s.gloss)));

  // Prepare X and Y arrays
  const xs = filtered.map((s) => normalizeLandmarks(s.landmarks));
  const ys = filtered.map((s) => labelMap[canonicalize(s.gloss)]);

  if (xs.length < 10) {
    log("Not enough samples to train:", xs.length);
    return { ok: false, reason: "not_enough_samples", samples: xs.length };
  }

  // Split
  const { xTrain, yTrain, xVal, yVal, xTest, yTest } = splitArray(xs, ys);

  const xTrainT = tf.tensor2d(xTrain);
  const yTrainT = tf.oneHot(tf.tensor1d(yTrain, "int32"), labels.length);
  const xValT = tf.tensor2d(xVal);
  const yValT = tf.oneHot(tf.tensor1d(yVal, "int32"), labels.length);
  const xTestT = tf.tensor2d(xTest);
  const yTestT = tf.oneHot(tf.tensor1d(yTest, "int32"), labels.length);

  // compute simple class weights
  const countsTrain = {};
  yTrain.forEach((v) => (countsTrain[v] = (countsTrain[v] || 0) + 1));
  const totalTrain = yTrain.length;
  const classWeight = {};
  for (let i = 0; i < labels.length; i++) {
    classWeight[i] = totalTrain / (labels.length * Math.max(1, countsTrain[i] || 0));
  }

  // model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, inputShape: [63], activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: labels.length, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  log("Start model.fit...");
  const history = await model.fit(xTrainT, yTrainT, {
    epochs: 60,
    batchSize: 32,
    validationData: [xValT, yValT],
    classWeight,
    verbose: 1,
    callbacks: [tf.callbacks.earlyStopping({ patience: 6 })],
  });

  // evaluate
  const evalResult = await model.evaluate(xTestT, yTestT);
  const testLoss = evalResult[0].arraySync();
  const testAcc = evalResult[1].arraySync();
  log(`Test acc=${(testAcc * 100).toFixed(2)}% loss=${testLoss.toFixed(4)}`);

  // confusion matrix
  const pred = model.predict(xTestT).argMax(-1);
  const trueIdx = yTestT.argMax(-1);
  const predArr = Array.from(await pred.data());
  const trueArr = Array.from(await trueIdx.data());
  const numClasses = labels.length;
  const confusion = Array(numClasses).fill(0).map(() => Array(numClasses).fill(0));
  trueArr.forEach((t, i) => {
    confusion[t][predArr[i]]++;
  });

  // metrics per class
  const precision = [], recall = [], f1 = [];
  for (let i = 0; i < numClasses; i++) {
    const tp = confusion[i][i];
    const fp = confusion.reduce((acc, r) => acc + r[i], 0) - tp;
    const fn = confusion[i].reduce((a, b) => a + b, 0) - tp;
    const prec = tp / (tp + fp + 1e-8);
    const rec = tp / (tp + fn + 1e-8);
    const f1i = (2 * prec * rec) / (prec + rec + 1e-8);
    precision.push(prec);
    recall.push(rec);
    f1.push(f1i);
  }

  const macroPrecision = precision.reduce((a, b) => a + b, 0) / numClasses;
  const macroRecall = recall.reduce((a, b) => a + b, 0) / numClasses;
  const macroF1 = f1.reduce((a, b) => a + b, 0) / numClasses;

  // save artifacts locally
  const version = `v${Date.now()}`;
  const modelDir = path.join(MODEL_OUTPUT_DIR, version);
  fs.mkdirSync(modelDir, { recursive: true });

  // tfjs-node save to local path (file://)
  await model.save(`file://${modelDir}`);

  // write history and labels
  const historyObj = {
    epochs: history.epoch.map((e) => e + 1),
    train_acc: (history.history?.acc || history.history?.accuracy || []).map((n) => Number(n)),
    val_acc: (history.history?.val_acc || history.history?.val_accuracy || []).map((n) => Number(n)),
    train_loss: history.history?.loss || [],
    val_loss: history.history?.val_loss || [],
    test_acc: testAcc,
    test_loss: testLoss,
    precision: macroPrecision,
    recall: macroRecall,
    f1_score: macroF1,
    confusion_matrix: confusion,
    labels,
    created_at: new Date().toISOString()
  };

  const histPath = path.join(modelDir, "training_history.json");
  const labelsPath = path.join(modelDir, "labels.json");
  const mapPath = path.join(modelDir, "label_map.json");

  fs.writeFileSync(histPath, JSON.stringify(historyObj, null, 2));
  fs.writeFileSync(labelsPath, JSON.stringify(labels, null, 2));
  fs.writeFileSync(mapPath, JSON.stringify(labelMap, null, 2));

  // Upload files to Supabase storage under bucket 'models' in folder version/
  const baseKey = `${version}/`;
  log("Uploading artifacts to Supabase storage at:", baseKey);
  await uploadFileToBucket(path.join(modelDir, "model.json"), `${baseKey}model.json`, "application/json");
  // weights.bin is usually present under modelDir
  const weightsPath = path.join(modelDir, "weights.bin");
  if (fs.existsSync(weightsPath)) {
    await uploadFileToBucket(weightsPath, `${baseKey}weights.bin`, "application/octet-stream");
  }
  await uploadFileToBucket(labelsPath, `${baseKey}labels.json`, "application/json");
  await uploadFileToBucket(mapPath, `${baseKey}label_map.json`, "application/json");
  await uploadFileToBucket(histPath, `${baseKey}training_history.json`, "application/json");

  // create record in model_versions table
  const { error: insertError } = await supabase.from("model_versions").insert([
    {
      version,
      accuracy: Number((testAcc * 100).toFixed(2)),
      loss: Number(testLoss.toFixed(4)),
      file_path: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${baseKey}model.json`,
      created_at: new Date().toISOString()
    }
  ]);

  if (insertError) throw insertError;

  log(`Training complete. Uploaded and recorded version ${version}`);

  return {
    ok: true,
    version,
    accuracy: Number((testAcc * 100).toFixed(2)),
    loss: Number(testLoss.toFixed(4)),
    labels
  };
}

// If called directly: run one-off
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("train_model.mjs")) {
  (async () => {
    try {
      const res = await runTraining();
      console.log("One-off training result:", res);
      process.exit(0);
    } catch (err) {
      console.error("runTraining error:", err);
      process.exit(1);
    }
  })();
}
