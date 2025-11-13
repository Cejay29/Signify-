import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import AdminSidebar from "../components/AdminSidebar";
import { Hand, BarChart } from "lucide-react";

export default function AdminGestures() {
  const webcamRef = useRef(null);

  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");
  const [samples, setSamples] = useState({});

  const gestureSamples = useRef([]);
  const currentLandmarks = useRef(null);

  /* ============================================================
     LOAD MEDIAPIPE FROM CDN (the only method Vercel accepts)
  ============================================================ */
  useEffect(() => {
    const scriptHands = document.createElement("script");
    scriptHands.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js";

    const scriptCamera = document.createElement("script");
    scriptCamera.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

    const scriptDrawing = document.createElement("script");
    scriptDrawing.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js";

    document.body.appendChild(scriptHands);
    document.body.appendChild(scriptCamera);
    document.body.appendChild(scriptDrawing);

    scriptDrawing.onload = () => {
      initMediaPipe();
      loadSummary();
    };

    return () => {
      document.body.removeChild(scriptHands);
      document.body.removeChild(scriptCamera);
      document.body.removeChild(scriptDrawing);
    };
  }, []);

  /* ============================================================
     INIT MEDIAPIPE
  ============================================================ */
  function initMediaPipe() {
    const hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks?.length > 0) {
        currentLandmarks.current = results.multiHandLandmarks[0].map((pt) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z,
        }));
      }
    });

    const camera = new window.Camera(webcamRef.current, {
      onFrame: async () => {
        await hands.send({ image: webcamRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }

  /* ============================================================
     START CAPTURE
  ============================================================ */
  const startCapture = () => {
    if (!label.trim()) {
      setStatus("⚠️ Enter a gesture name.");
      return;
    }

    let countdown = 3;
    setStatus(`⏳ Get ready... ${countdown}`);

    const timer = setInterval(() => {
      countdown--;
      if (countdown === 0) {
        clearInterval(timer);
        captureSamples(label.toUpperCase());
      } else {
        setStatus(`⏳ Get ready... ${countdown}`);
      }
    }, 1000);
  };

  const captureSamples = async (gloss) => {
    const duration = 6000;
    const intervalMs = 200;
    const end = Date.now() + duration;

    let captured = 0;

    const interval = setInterval(async () => {
      if (Date.now() >= end) {
        clearInterval(interval);
        setStatus(`✅ Done! Captured ${captured} samples.`);
        loadSummary();
        return;
      }

      if (!currentLandmarks.current) {
        setStatus("⚠️ No hand detected.");
        return;
      }

      const sample = {
        gloss,
        landmarks: currentLandmarks.current,
      };

      const { error } = await supabase.from("gesture_sample").insert([sample]);
      if (!error) {
        gestureSamples.current.push(sample);
        captured++;
        setStatus(`📸 Capturing... ${captured}`);
      } else {
        setStatus("❌ Error saving sample.");
      }
    }, intervalMs);
  };

  /* ============================================================
     LOAD SUMMARY
  ============================================================ */
  const loadSummary = async () => {
    const { data } = await supabase.from("gesture_sample").select("gloss");

    if (!data) return;

    const grouped = data.reduce((acc, row) => {
      acc[row.gloss] = (acc[row.gloss] || 0) + 1;
      return acc;
    }, {});

    setSamples(grouped);
  };

  /* ============================================================
     DOWNLOAD JSON
  ============================================================ */
  const downloadJSON = () => {
    if (gestureSamples.current.length === 0) {
      alert("No samples collected yet!");
      return;
    }

    const blob = new Blob([JSON.stringify(gestureSamples.current, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gesture_data.json";
    link.click();
  };

  /* ============================================================
     LOGOUT
  ============================================================ */
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar onLogout={logout} />

      <main className="flex-1 p-8 ml-0 md:ml-20 xl:ml-[250px]">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Hand className="w-8 h-8 text-indigo-600" />
          Gesture Collector
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CAMERA SECTION */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow p-6">
            <video
              ref={webcamRef}
              width="640"
              height="480"
              autoPlay
              playsInline
              className="rounded-xl border mx-auto"
            ></video>

            <label className="block mt-4 text-sm font-medium text-gray-700">
              Gesture Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
              placeholder="HELLO, WATER, THANK YOU"
            />

            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={startCapture}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
              >
                Start Capture
              </button>
              <button
                onClick={downloadJSON}
                className="bg-gray-700 text-white px-5 py-2 rounded-lg"
              >
                Download JSON
              </button>
            </div>

            <p className="text-indigo-600 text-center mt-3">{status}</p>
          </div>

          {/* SUMMARY */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <BarChart className="w-5 h-5 text-indigo-600" />
              Sample Summary
            </h3>

            <ul className="text-sm">
              {Object.keys(samples).length === 0 ? (
                <li className="text-gray-500">No samples yet.</li>
              ) : (
                Object.entries(samples).map(([gloss, count]) => (
                  <li
                    key={gloss}
                    className="flex justify-between border-b py-1"
                  >
                    <span>{gloss}</span>
                    <span className="font-semibold text-indigo-600">
                      {count}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
