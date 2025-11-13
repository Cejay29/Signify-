// src/utils/libLoader.js

let libsLoaded = false;

/**
 * Load external script dynamically.
 */
export const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

/**
 * Extract YouTube video ID.
 */
export const ytId = (url = "") => {
  const m = url.match(/^.*(?:youtu\.be\/|v=|embed\/)([^#&?]{11}).*$/);
  return m ? m[1] : null;
};

/**
 * ✅ Loads TensorFlow.js + MediaPipe Hands + Camera Utils
 * Only ONCE for the whole app.
 */
// src/utils/libLoader.js
// utils/libLoader.js
export async function loadGestureLibraries() {
  if (window.tf && window.Hands && window.Camera && window.drawConnectors) {
    console.log("⚡ Gesture Libraries already loaded");
    return;
  }

  console.log("📦 Loading TFJS + MediaPipe…");

  await Promise.all([
    import(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"
    ),
    import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js"
    ),
    import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.min.js"
    ),
    import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.min.js"
    ),
  ]);

  // ✅ Expose drawing functions to window
  if (window) {
    window.drawConnectors = window.drawConnectors || window.drawConnectors;
    window.drawLandmarks = window.drawLandmarks || window.drawLandmarks;
  }

  console.log("✅ TFJS ready:", window.tf);
  console.log("✅ MediaPipe Hands ready:", window.Hands);
  console.log("✅ CameraUtils ready:", window.Camera);
  console.log("✅ DrawingUtils ready");
}
