// worker/train_worker.mjs
import { createClient } from "@supabase/supabase-js";
import { runTraining } from "./train_model.mjs";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const POLL_INTERVAL = 5000; // ms

async function fetchPendingJob() {
  // pick oldest pending job
  const { data, error } = await supabase
    .from("training_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchPendingJob error:", error);
    return null;
  }
  return data || null;
}

async function claimJob(job) {
  const { data, error } = await supabase
    .from("training_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .select()
    .single();

  if (error) {
    console.error("claimJob error:", error);
    return null;
  }
  return data;
}

async function markJobDone(jobId, result) {
  await supabase
    .from("training_jobs")
    .update({ status: "done", finished_at: new Date().toISOString(), result })
    .eq("id", jobId);
}

async function markJobFailed(jobId, errorText) {
  await supabase
    .from("training_jobs")
    .update({ status: "failed", finished_at: new Date().toISOString(), error: errorText })
    .eq("id", jobId);
}

async function loop() {
  console.log("[worker] starting poll loop...");
  while (true) {
    try {
      const job = await fetchPendingJob();
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        continue;
      }

      console.log(`[worker] found job id=${job.id}, claiming...`);
      const claimed = await claimJob(job);
      if (!claimed) {
        console.warn("[worker] failed to claim job, skipping");
        continue;
      }

      try {
        console.log(`[worker] running training for job ${claimed.id} ...`);
        const result = await runTraining(claimed); // returns result object
        console.log(`[worker] job ${claimed.id} completed, result:`, result);

        // mark done and attach result
        await markJobDone(claimed.id, result);
      } catch (err) {
        console.error(`[worker] job ${claimed.id} failed:`, err);
        await markJobFailed(claimed.id, (err && err.stack) || String(err));
      }
    } catch (err) {
      console.error("[worker] loop top-level error:", err);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }
}

loop().catch((e) => {
  console.error("worker crashed:", e);
  process.exit(1);
});
