// utils/modelLoader.js
let GLOBAL_MODEL = null;
let GLOBAL_LABELS = null;

const MODEL_BASE =
    "https://lxetbblytlvihitapazv.supabase.co/storage/v1/object/public/models/";

export async function ensureTF() {
    if (window.tf) return;

    await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

export async function loadGestureModelOnce() {
    // ✅ Ensure TF.js is available
    await ensureTF();
    const tf = window.tf;

    if (GLOBAL_MODEL && GLOBAL_LABELS) {
        return { model: GLOBAL_MODEL, labels: GLOBAL_LABELS };
    }

    // ✅ Load model
    GLOBAL_MODEL = await tf.loadLayersModel(MODEL_BASE + "model.json");

    // ✅ Load labels
    GLOBAL_LABELS = await fetch(MODEL_BASE + "labels.json").then((r) => r.json());

    return { model: GLOBAL_MODEL, labels: GLOBAL_LABELS };
}
