// src/utils/normalize.js
// Converts MediaPipe 21 hand landmarks → flat 63-number array
// Tries both mirrored and non-mirrored normalization
// so your model works whether trained on flipped webcam data or not.

export function normalize(landmarks, tryBoth = false) {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length !== 21) {
    console.warn("⚠️ Invalid landmarks input");
    return null;
  }

  // --- Helper to normalize relative to wrist landmark ---
  const normalizeSet = (points) => {
    const base = points[0];
    const norm = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = p.x - base.x;
      const y = p.y - base.y;
      const z = p.z - base.z;
      if (isNaN(x) || isNaN(y) || isNaN(z)) return null;
      norm.push(x, y, z);
    }

    return norm.length === 63 ? norm : null;
  };

  // --- 1️⃣ Try non-mirrored first ---
  const normal = normalizeSet(landmarks);

  if (!tryBoth) {
    return normal;
  }

  // --- 2️⃣ Try mirrored version too (flip X) ---
  const mirrored = landmarks.map((p) => ({
    x: 1 - p.x,
    y: p.y,
    z: p.z,
  }));
  const mirroredNorm = normalizeSet(mirrored);

  // Return both for experimentation
  return { normal, mirrored: mirroredNorm };
}
