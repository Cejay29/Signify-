// hooks/alphabet/usePracticeEngine.js
import { useCallback, useEffect, useRef, useState } from "react";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

function normalize(landmarks) {
  if (!landmarks?.length) return null;
  const base = landmarks[0];
  return landmarks.flatMap((pt) => [
    pt.x - base.x,
    pt.y - base.y,
    pt.z - base.z,
  ]);
}

export default function usePracticeEngine({ model, labels }) {
  const [running, setRunning] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [status, setStatus] = useState("Press Start then show the sign.");
  const [detected, setDetected] = useState(null);
  const [target, _setTarget] = useState(null);

  const handsRef = useRef(null);
  const mpCameraRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);

  const setTarget = useCallback((t) => {
    _setTarget(t);
    setDetected(null);
  }, []);

  // Ensure Mediapipe libs
  const ensureHands = useCallback(async () => {
    if (!window.Hands) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js"
      );
    }
    if (!window.Camera) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
      );
    }
    if (!handsRef.current) {
      handsRef.current = new window.Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      handsRef.current.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        modelComplexity: 1,
      });
    }
    return handsRef.current;
  }, []);

  const stop = useCallback(() => {
    try {
      if (mpCameraRef.current?.stop) mpCameraRef.current.stop();
    } catch {}
    mpCameraRef.current = null;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    streamRef.current = null;

    if (videoRef.current) {
      try {
        videoRef.current.pause?.();
      } catch {}
      videoRef.current.srcObject = null;
    }
    setRunning(false);
    setCameraBusy(false);
    setStatus("Stopped.");
  }, []);

  const start = useCallback(
    async (videoEl) => {
      if (!model || !labels?.length) {
        setStatus("Model not ready.");
        return;
      }
      if (!videoEl) return;
      if (running || cameraBusy) return;

      setCameraBusy(true);
      setStatus("Starting camera…");
      videoRef.current = videoEl;

      stop(); // clear any prior instance (safe)

      try {
        const hands = await ensureHands();

        // stream
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        videoEl.srcObject = streamRef.current;
        await new Promise((res) => (videoEl.onloadedmetadata = res));
        await videoEl.play().catch(() => {});

        hands.onResults(async (results) => {
          // ✅ No hand detected → keep the “show your hand clearly” message
          if (!results?.multiHandLandmarks?.length) {
            setDetected(null);
            return; // ✅ Do NOT change the status text
          }

          const input = normalize(results.multiHandLandmarks[0]);
          if (!input) return;

          const tf = window.tf;
          const pred = model.predict(tf.tensor([input]));
          const arr = await pred.array();
          const maxIdx = arr[0].indexOf(Math.max(...arr[0]));
          const label = labels[maxIdx] || "?";

          setDetected(label);

          // ✅ Only update status when a valid detection occurs
          if (target) {
            setStatus(
              label === target ? ` Correct: ${label}` : ` Detected: ${label}`
            );
          } else {
            setStatus(`Detected: ${label}`);
          }
        });

        // camera loop
        mpCameraRef.current = new window.Camera(videoEl, {
          onFrame: async () => {
            if (videoEl.readyState >= 2) {
              await hands.send({ image: videoEl });
            }
          },
          width: 720,
          height: 720,
        });
        await mpCameraRef.current.start();

        setRunning(true);
        setStatus("✋ Show the sign to the camera.");
      } catch (e) {
        console.error(e);
        setStatus(`Camera error: ${e?.message || e}`);
        stop();
      } finally {
        setCameraBusy(false);
      }
    },
    [model, labels, ensureHands, running, cameraBusy, target, stop]
  );

  // auto-stop on tab hide
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", stop);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", stop);
    };
  }, [stop]);

  return {
    start,
    stop,
    running,
    cameraBusy,
    status,
    detected,
    target,
    setTarget,
  };
}
