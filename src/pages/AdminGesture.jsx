import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import AdminSidebar from "../components/AdminSidebar";

import { Hand, BarChart } from "lucide-react";

// MediaPipe imports
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function AdminGestures() {
  const webcamRef = useRef(null);

  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");
  const [samples, setSamples] = useState({});
  const gestureSamples = useRef([]); // store locally

  let currentLandmarks = useRef(null);

  /** ===============================
   *  MEDIA PIPE SETUP
   *  =============================== */
  useEffect(() => {
    const hands = new Hands({
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

    if (webcamRef.current) {
      try {
        const cam = new Camera(webcamRef.current, {
          onFrame: async () =>
            await hands.send({ image: webcamRef.current }),
          width: 640,
          height: 480,
        });

        cam.start();
      } catch (e) {
        setStatus("⚠️ Camera failed to start.");
      }
    }

    loadSummary();
  }, []);

  /** ===============================
   *  START CAPTURE
   *  =============================== */
  const startCapture = async () => {
    if (!label.trim()) {
      setStatus("⚠️ Enter a gesture name first.");
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
    const interval = 200;
    const end = Date.now() + duration;

    let count = 0;

    const intervalId = setInterval(async () => {
      if (Date.now() >= end) {
        clearInterval(intervalId);
        setStatus(`✅ Done! Captured ${count} samples.`);
        loadSummary();
        return;
      }

      if (currentLandmarks.current) {
        const sample = {
          gloss,
          landmarks: currentLandmarks.current,
        };

        const { error } = await supabase
          .from("gesture_sample")
          .insert([sample]);

        if (!error) {
          gestureSamples.current.push(sample);
          count++;
          setStatus(`📸 Capturing... ${count}`);
        } else {
          setStatus("❌ Error saving sample.");
        }
      } else {
        setStatus("⚠️ No hand detected.");
      }
    }, interval);
  };

  /** ===============================
   *  LOAD SUMMARY
   *  =============================== */
  const loadSummary = async () => {
    const { data } = await supabase
      .from("gesture_sample")
      .select("gloss");

    if (!data) return;

    const grouped = data.reduce((acc, row) => {
      acc[row.gloss] = (acc[row.gloss] || 0) + 1;
      return acc;
    }, {});

    setSamples(grouped);
  };

  /** ===============================
   *  DOWNLOAD JSON
   *  =============================== */
  const downloadJSON = () => {
    if (gestureSamples.current.length === 0) {
      alert("No samples yet!");
      return;
    }

    const blob = new Blob(
      [JSON.stringify(gestureSamples.current, null, 2)],
      { type: "application/json" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gesture_data.json";
    link.click();
  };

  /** ===============================
   *  LOGOUT
   *  =============================== */
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /** ===============================
   *  RENDER UI
   *  =============================== */
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

            <ul className="text-sm text-gray-700">
              {Object.keys(samples).length === 0 ? (
                <li className="text-gray-500">No samples yet.</li>
              ) : (
                Object.entries(samples).map(([g, count]) => (
                  <li
                    key={g}
                    className="flex justify-between border-b py-1"
                  >
                    <span>{g}</span>
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
