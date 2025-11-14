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
    onFinish: () => {},
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          handleStop();
          onClose();
        }}
      />

      {/* Modal */}
      <div
        className="
          relative bg-[#2A2A3C] rounded-2xl border border-[#3e3e58] shadow-2xl
          w-full max-w-[1100px] sm:max-w-[950px] md:max-w-[1000px]
          p-4 sm:p-6
          flex flex-col
          max-h-[90vh]
          overflow-y-auto
        "
      >
        {/* Close */}
        <button
          onClick={() => {
            handleStop();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Target Preview */}
          <div className="flex flex-col justify-center">
            <PracticePreview target={target} />
          </div>

          {/* Right: Camera */}
          <div>
            <h3 className="text-lg font-bold text-[#C5CAFF] mb-2">Webcam</h3>

            {!libsReady || loading ? (
              <p className="text-gray-400 text-sm mb-3">
                Loading Gesture Model…
              </p>
            ) : modelError ? (
              <p className="text-red-400 text-sm mb-3">{modelError}</p>
            ) : null}

            <video
              ref={camRef}
              autoPlay
              playsInline
              className="rounded-xl w-full h-[260px] sm:h-[220px] md:h-[360] object-cover border border-[#C5CAFF] bg-black"
            />

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleStart}
                disabled={!libsReady || !model || cameraBusy || running}
                className="bg-[#FFC400] text-black font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {cameraBusy ? "Starting…" : running ? "Running" : "Start"}
              </button>

              <button
                onClick={handleStop}
                disabled={!running}
                className="bg-[#3B3B5E] text-white px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                Stop
              </button>
            </div>

            {/* Detected Sign */}
            {running && (
              <div className="text-white mt-3 text-sm">
                Detected:{" "}
                <span className="font-semibold">{detected ?? "—"}</span>
                {target ? (
                  detected === target ? (
                    <span className="text-green-400 font-bold ml-2">
                       Correct
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold ml-2"></span>
                  )
                ) : null}
                {detected === target && target && (
                  <div className="animate-pulse text-[#27E1C1] font-semibold mt-2">
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
