import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import useGestureModel from "../hooks/useGestureModel";
import { Trophy, Timer, Star, Flame, Target, Gamepad2 } from "lucide-react";

export default function Arcade() {
  // 🧠 Use your original gesture model hook
  const {
    model,
    labels,
    loading: modelLoading,
    error: modelError,
    version,
  } = useGestureModel();

  const [session, setSession] = useState(null);
  const [arcadeActive, setArcadeActive] = useState(false);
  const [arcadeTarget, setArcadeTarget] = useState("—");
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeStreak, setArcadeStreak] = useState(0);
  const [arcadeTime, setArcadeTime] = useState(30);
  const [arcadeStatus, setArcadeStatus] = useState("Press Start to begin…");
  const [showModal, setShowModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [rewards, setRewards] = useState({ xp: 0, gems: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const videoRef = useRef(null);
  const timeBarRef = useRef(null);
  const detectedRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const hitCooldown = useRef(false);

  /* -------------------------------------------------------------
     INIT
  ------------------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/landing";
      else setSession(data.session);
    });
    loadLeaderboard("daily");
    return () => stopCamera();
  }, []);

  /* -------------------------------------------------------------
     CAMERA + HANDS
  ------------------------------------------------------------- */
  async function startCamera() {
    try {
      stopCamera();
      const video = videoRef.current;
      const hands = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      const camera = new Camera(video, {
        onFrame: async () => {
          if (video.readyState >= 2) await hands.send({ image: video });
        },
        width: 520,
        height: 380,
      });
      cameraRef.current = camera;
      camera.start();
      setArcadeStatus("🎮 Game on! Show the target sign.");
    } catch (err) {
      console.error("Camera error:", err);
      setArcadeStatus("❌ Camera permission denied.");
    }
  }

  function stopCamera() {
    try {
      cameraRef.current?.stop?.();
    } catch {}
    cameraRef.current = null;
  }

  function normalize(landmarks) {
    if (!landmarks?.length) return null;
    const b = landmarks[0];
    return landmarks.flatMap((p) => [p.x - b.x, p.y - b.y, p.z - b.z]);
  }

  /* -------------------------------------------------------------
     GAME LOGIC
  ------------------------------------------------------------- */
  function startArcade() {
    if (modelLoading) {
      alert("Please wait — model is still loading.");
      return;
    }
    if (!model) {
      alert("❌ Model not loaded yet!");
      return;
    }
    resetArcade();
    setArcadeStatus(`Starting camera (Model ${version || "latest"})…`);
    startCamera();
    setArcadeActive(true);
    setArcadeTarget(randomTarget());
    timerRef.current = setInterval(() => {
      setArcadeTime((t) => {
        if (t <= 1) {
          endArcade("⏳ Time’s up!");
          return 0;
        }
        updateTimeBar(t - 1);
        return t - 1;
      });
    }, 1000);
  }

  function resetArcade() {
    clearInterval(timerRef.current);
    setArcadeTime(30);
    setArcadeScore(0);
    setArcadeStreak(0);
    setArcadeActive(false);
    stopCamera();
  }

  function updateTimeBar(time) {
    if (timeBarRef.current)
      timeBarRef.current.style.width = `${(time / 30) * 100}%`;
  }

  function randomTarget() {
    const pool =
      labels.length > 0 ? labels : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function addScore() {
    setArcadeStreak((s) => {
      const newStreak = s + 1;
      const bonus = Math.min(newStreak - 1, 5);
      const gained = 10 + bonus;
      setArcadeScore((sc) => sc + gained);
      return newStreak;
    });
  }

  async function endArcade(reason) {
    setArcadeActive(false);
    clearInterval(timerRef.current);
    stopCamera();
    setArcadeStatus(reason);
    setFinalScore(arcadeScore);
    setFinalStreak(arcadeStreak);
    const result = await persistRewards(arcadeScore, arcadeStreak);
    setRewards(result);
    setShowModal(true);
  }

  /* -------------------------------------------------------------
     DETECTION
  ------------------------------------------------------------- */
  async function onResults(results) {
    if (!arcadeActive || !model || !results.multiHandLandmarks?.length) return;
    const input = normalize(results.multiHandLandmarks[0]);
    if (!input) return;

    const pred = model.predict(window.tf.tensor([input]));
    const arr = await pred.array();
    const maxIdx = arr[0].indexOf(Math.max(...arr[0]));
    const detected = labels[maxIdx] || "—";

    if (detectedRef.current) detectedRef.current.textContent = detected;

    if (detected === arcadeTarget && !hitCooldown.current) {
      hitCooldown.current = true;
      addScore();
      setArcadeTarget(randomTarget());
      setTimeout(() => (hitCooldown.current = false), 600);
    }
  }

  /* -------------------------------------------------------------
     SUPABASE REWARDS + LEADERBOARD
  ------------------------------------------------------------- */
  async function persistRewards(finalScore, finalStreak) {
    try {
      const xp = Math.round(finalScore * 0.3 + finalStreak * 5);
      const gems = Math.floor(xp / 10);
      const { data: s } = await supabase.auth.getSession();
      const userId = s?.session?.user?.id;
      if (!userId) return { xp: 0, gems: 0 };

      const now = new Date().toISOString();
      await supabase.from("arcade_runs").insert({
        user_id: userId,
        score: finalScore,
        max_streak: finalStreak,
        xp_earned: xp,
        gems_earned: gems,
        created_at: now,
      });
      await supabase
        .from("users")
        .update({ xp: xp, gems: gems })
        .eq("id", userId);
      return { xp, gems };
    } catch (e) {
      console.error("Reward error:", e);
      return { xp: 0, gems: 0 };
    }
  }

  async function loadLeaderboard(filterType) {
    setLoadingLeaderboard(true);
    const now = Date.now();
    const oneDay = new Date(now - 86400000).toISOString();
    const oneWeek = new Date(now - 7 * 86400000).toISOString();

    let q = supabase
      .from("arcade_best")
      .select(
        "user_id,score,max_streak,xp_earned,gems_earned,created_at,users(username)"
      )
      .order("score", { ascending: false });

    if (filterType === "daily") q = q.gte("created_at", oneDay);
    if (filterType === "weekly") q = q.gte("created_at", oneWeek);

    const { data } = await q;
    setLeaderboard(data || []);
    setLoadingLeaderboard(false);
  }

  /* -------------------------------------------------------------
     RENDER
  ------------------------------------------------------------- */
  return (
    <div className="flex bg-[#1C1B2E] text-white min-h-screen">
      {/* Sidebar */}
      <aside className="w-[250px] bg-[#14142B] border-r border-[#2a2a3c] p-6">
        <h2 className="text-4xl font-extrabold text-[#FFC400] text-center">
          Signify
        </h2>
        <nav className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => (window.location.href = "/homepage")}
            className="nav-btn"
          >
            Learn
          </button>
          <button
            onClick={() => (window.location.href = "/alphabet")}
            className="nav-btn"
          >
            Alphabet
          </button>
          <button className="nav-btn active">Arcade</button>
          <button
            onClick={() => (window.location.href = "/shop")}
            className="nav-btn"
          >
            Shop
          </button>
          <button
            onClick={() => (window.location.href = "/profile")}
            className="nav-btn"
          >
            Profile
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-[#27E1C1] flex items-center gap-2">
            <Gamepad2 className="w-7 h-7" /> Arcade Mode
          </h1>

          {modelLoading ? (
            <span className="text-gray-400">Loading model...</span>
          ) : modelError ? (
            <span className="text-red-400">Model error: {modelError}</span>
          ) : (
            <span className="text-sm text-gray-400">
              Model {version ? `v${version}` : "Loaded"} ({labels.length}{" "}
              labels)
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={startArcade}
              disabled={arcadeActive || modelLoading}
              className="bg-[#27E1C1] text-black font-bold px-4 py-2 rounded-lg"
            >
              Start
            </button>
            <button
              onClick={() => endArcade("🔚 Stopped")}
              disabled={!arcadeActive}
              className="bg-[#3B3B5E] text-white px-4 py-2 rounded-lg"
            >
              Stop
            </button>
          </div>
        </header>

        {/* Camera */}
        <div className="flex flex-col items-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="rounded-xl border-2 border-[#C5CAFF] w-[520px] bg-black shadow-xl"
          ></video>
          <div
            ref={detectedRef}
            className="mt-4 text-lg text-[#27E1C1] font-bold"
          >
            —
          </div>
          <div className="mt-4 flex gap-4">
            <div className="hud-pill flex gap-2 items-center">
              <Timer className="w-4 h-4 text-[#27E1C1]" /> Time: {arcadeTime}s
            </div>
            <div className="hud-pill flex gap-2 items-center">
              <Star className="w-4 h-4 text-[#FFC400]" /> Score: {arcadeScore}
            </div>
            <div className="hud-pill flex gap-2 items-center">
              <Flame className="w-4 h-4 text-[#ff6f3f]" /> Streak:{" "}
              {arcadeStreak}
            </div>
            <div className="hud-pill flex gap-2 items-center">
              <Target className="w-4 h-4 text-[#FFC400]" /> Target:{" "}
              {arcadeTarget}
            </div>
          </div>
          <div className="w-full max-w-md mt-4 bg-[#14142B] border border-[#2a2a3c] rounded-full h-3 overflow-hidden">
            <div
              ref={timeBarRef}
              className="timebar h-full"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-gray-400 text-sm mt-3">{arcadeStatus}</p>
        </div>
      </main>
    </div>
  );
}
