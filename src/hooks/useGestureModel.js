import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

let cachedModel = null;
let cachedLabels = null;
let cachedVersion = null;

/**
 * Waits until TFJS is available globally.
 */
async function waitForTFJS(maxRetries = 30, interval = 300) {
  let tries = 0;
  while (!window.tf && tries < maxRetries) {
    await new Promise((r) => setTimeout(r, interval));
    tries++;
  }
  if (!window.tf)
    throw new Error(
      "TensorFlow.js not loaded yet — please call loadGestureLibraries() first."
    );
  return window.tf;
}

export default function useGestureModel() {
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadModel() {
      try {
        setLoading(true);

        // ✅ Wait for TFJS library
        const tf = await waitForTFJS();

        // ✅ Use cached version if already loaded
        if (cachedModel && cachedLabels && cachedVersion) {
          console.log(
            `⚡ Using cached gesture model version: ${cachedVersion}`
          );
          setModel(cachedModel);
          setLabels(cachedLabels);
          setLoading(false);
          return;
        }

        // ✅ List folders in "models" bucket
        const { data: files, error: listError } = await supabase.storage
          .from("models")
          .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });

        if (listError) throw listError;

        const versions = files.filter((f) => f.name.startsWith("v"));
        if (!versions.length)
          throw new Error("No versioned folders found in 'models' bucket.");

        // ✅ Get the latest version folder (sorted by name)
        const latest = versions.sort((a, b) => (a.name > b.name ? -1 : 1))[0]
          .name;
        cachedVersion = latest;
        console.log(`📦 Loading latest model version: ${latest}`);

        // ✅ Build public URLs
        const base = `${supabase.storageUrl}/object/public/models/${latest}`;
        const modelUrl = `${base}/model.json`;
        const labelsUrl = `${base}/labels.json`;

        // ✅ Fetch labels.json
        const res = await fetch(labelsUrl);
        if (!res.ok)
          throw new Error(`Failed to fetch labels.json (${res.status})`);
        cachedLabels = await res.json();
        if (mounted) setLabels(cachedLabels);

        // ✅ Load TensorFlow model
        cachedModel = await tf.loadLayersModel(modelUrl);
        if (mounted) {
          setModel(cachedModel);
          console.log(
            "✅ Gesture model loaded successfully from Supabase bucket."
          );
        }
      } catch (err) {
        console.error("❌ useGestureModel error:", err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadModel();
    return () => {
      mounted = false;
    };
  }, []);

  return { model, labels, loading, error, version: cachedVersion };
}
