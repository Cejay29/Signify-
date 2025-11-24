import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PracticePreview from "./PracticePreview";
import AlphabetGrid from "./AlphabetGrid";
import NumberGrid from "./NumberGrid";
import { ALPHABET, NUMBERS } from "../../utils/alphabetUtils";
import { loadGestureLibraries } from "../../utils/libLoader";
import { normalize } from "../../utils/normalize";
import useGestureModel from "../../hooks/useGestureModel";
import useGestureEngine from "../../hooks/useGestureEngine";
import useHands from "../../hooks/useHands";

export default function PracticeModal({ open, onClose, target, onPickTarget }) {
  const [libsReady, setLibsReady] = useState(false);
  const [detected, setDetected] = useState("—");
  const [running, setRunning] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    async function initLibs() {
      try {
        await loadGestureLibraries();
        setLibsReady(true);
      } catch (err) {
        console.error("❌ Failed to load gesture libs:", err);
      }
    }
    initLibs();
  }, []);

  const { model, labels, loading, error: modelError } = useGestureModel();
  const { handleDetect, reset } = useGestureEngine({
    labels,
    model,
    hardMode: false,
    sounds: true,
    targetPool: labels,
    onFinish: () => { },
  });

  const {
    videoRef: camRef,
    start: startCamera,
    stop: stopCamera,
  } = useHands({
    onResults: async (results) => {
      if (!model || !labels?.length) return setDetected("—");
      if (!results.multiHandLandmarks?.length) return setDetected("—");

      const lm = results.multiHandLandmarks[0];
      const tf = window.tf;
      const input = normalize(lm);
      if (!input) return;

      const pred = model.predict(tf.tensor([input]));
      const arr = await pred.array();
      const idx = arr[0].indexOf(Math.max(...arr[0]));
      const label = labels[idx] || "?";
      setDetected(label);
      handleDetect(label);
    },
  });

  const handleStart = async () => {
    if (cameraBusy || running) return;
    setCameraBusy(true);
    try {
      if (!libsReady || !model || !labels?.length) {
        alert("Gesture libraries or model still loading...");
        return;
      }
      await startCamera();
      setRunning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
    } finally {
      setCameraBusy(false);
    }
  };

  const handleStop = () => {
    stopCamera();
    setRunning(false);
    setDetected("—");
  };

  useEffect(() => reset(), [target, reset]);
  useEffect(() => {
    if (!open) handleStop();
  }, [open]);

  if (!open) return null;

  /* -------------------- UI -------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { handleStop(); onClose(); }}
      />

      <div
        className="
      relative w-full max-w-[1100px]
      bg-white/15 backdrop-blur-2xl
      rounded-3xl border border-white/30
      shadow-[0_0_40px_rgba(255,63,127,0.25)]
      p-6
      max-h-[90vh] overflow-y-auto
    "
      >
        {/* Close Button */}
        <button
          onClick={() => { handleStop(); onClose(); }}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <PracticePreview target={target} />

          <div>
            <h3 className="text-xl font-bold text-white drop-shadow mb-3">
              Webcam
            </h3>

            <video
              ref={camRef}
              autoPlay
              playsInline
              className="
            rounded-2xl border border-[#FFC400]
            shadow-[0_0_25px_rgba(255,196,0,0.4)]
            w-full h-[260px] sm:h-[220px] md:h-[300px]
            bg-black object-cover
          "
            />

            <div className="flex gap-3 mt-3">
              <button
                onClick={handleStart}
                disabled={!libsReady || !model || cameraBusy || running}
                className="
              px-4 py-2 rounded-xl font-bold
              bg-gradient-to-r from-[#FFC400] to-[#FF3F7F]
              text-[#1C1B2E]
              shadow-lg shadow-[#FF3F7F]/40
              hover:opacity-90
              disabled:opacity-40
            "
              >
                {cameraBusy ? "Starting…" : running ? "Running" : "Start"}
              </button>

              <button
                onClick={handleStop}
                disabled={!running}
                className="
              px-4 py-2 rounded-xl
              bg-white/20 text-white
              border border-white/30
              shadow-inner disabled:opacity-40
            "
              >
                Stop
              </button>
            </div>

            {running && (
              <div className="mt-4 text-white text-sm">
                Detected: <span className="font-bold">{detected}</span>

                {detected === target && (
                  <div className="mt-2 text-[#27E1C1] font-semibold animate-pulse">
                    ✋ Perfect Sign!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sign Picker */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-[#C5CAFF] mb-3">Pick a Sign</h3>

          {/* Alphabet Grid */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Alphabet
            </h4>
            <div className="max-h-[200px] overflow-y-auto pr-1">
              <AlphabetGrid items={ALPHABET} onPick={onPickTarget} />
            </div>
          </div>

          {/* Number Grid */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Numbers
            </h4>
            <div className="max-h-[150px] overflow-y-auto pr-1">
              <NumberGrid items={NUMBERS} onPick={onPickTarget} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
