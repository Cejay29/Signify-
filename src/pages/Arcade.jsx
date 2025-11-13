import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import * as tf from "@tensorflow/tfjs";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import {
  Trophy,
  PlayCircle,
  Timer,
  Star,
  Flame,
  Target,
  Gamepad2,
} from "lucide-react";

export default function Arcade() {
  const [session, setSession] = useState(null);
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Arcade states
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

  // DOM refs
  const videoRef = useRef(null);
  const timeBarRef = useRef(null);
  const detectedRef = useRef(null);

  let hands = useRef(null);
  let camera = useRef(null);
  let predictionBuffer = useRef([]);
  let targetPool = useRef([]);
  let timerInterval = useRef(null);
  let hitCooldown = useRef(false);

  /* -------------------------------------------------------------
     INIT: Auth + Model
  ------------------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/landing";
      else setSession(data.session);
    });
    loadModel();
    loadLeaderboard("daily");
    return () => stopCamera();
  }, []);

  async function loadModel() {
    try {
      const modelUrl = "/model/model.json";
      const labelsUrl = "/model/labels.json";
      const mdl = await tf.loadLayersModel(modelUrl);
      const res = await fetch(labelsUrl);
      const lbls = await res.json();
      setModel(mdl);
      setLabels(lbls);
      console.log("✅ Model loaded:", lbls.length, "labels");
    } catch (e) {
      console.error("Failed to load model:", e);
    }
  }

  /* -------------------------------------------------------------
     CAMERA + HANDS
  ------------------------------------------------------------- */
  async function startCamera() {
    try {
      stopCamera();
      const video = videoRef.current;
      const h = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      h.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });
      h.onResults(onResults);
      hands.current = h;

      camera.current = new Camera(video, {
        onFrame: async () => {
          if (video.readyState >= 2) await h.send({ image: video });
        },
        width: 520,
        height: 380,
      });
      camera.current.start();
      setArcadeStatus("🎮 Game on! Show the target sign.");
    } catch (err) {
      console.error("Camera error:", err);
      setArcadeStatus("❌ Camera permission denied.");
    }
  }

  function stopCamera() {
    try {
      camera.current?.stop?.();
    } catch {}
    camera.current = null;
  }

  function normalize(landmarks) {
    if (!landmarks?.length) return null;
    const b = landmarks[0];
    return landmarks.flatMap((p) => [p.x - b.x, p.y - b.y, p.z - b.z]);
  }

  /* -------------------------------------------------------------
     ARCADE GAME LOGIC
  ------------------------------------------------------------- */
  function startArcade() {
    if (!model) {
      alert("Model not loaded yet!");
      return;
    }
    resetArcade();
    setArcadeStatus("Starting camera…");
    startCamera();
    setArcadeActive(true);
    setArcadeTarget(randomTarget());
    timerInterval.current = setInterval(() => {
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
    clearInterval(timerInterval.current);
    setArcadeTime(30);
    setArcadeScore(0);
    setArcadeStreak(0);
    setArcadeActive(false);
    stopCamera();
  }

  function updateTimeBar(time) {
    if (timeBarRef.current) {
      timeBarRef.current.style.width = Math.max(0, (time / 30) * 100) + "%";
    }
  }

  function randomTarget() {
    const pool =
      targetPool.current.length > 0
        ? targetPool.current
        : labels.length > 0
        ? labels
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
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
    clearInterval(timerInterval.current);
    stopCamera();
    setArcadeStatus(reason);
    setFinalScore(arcadeScore);
    setFinalStreak(arcadeStreak);
    const result = await persistRewards(arcadeScore, arcadeStreak);
    setRewards(result);
    setShowModal(true);
  }

  /* -------------------------------------------------------------
     HANDS ONRESULTS CALLBACK
  ------------------------------------------------------------- */
  async function onResults(results) {
    if (!arcadeActive || !model) return;
    if (!results.multiHandLandmarks?.length) return;
    const input = normalize(results.multiHandLandmarks[0]);
    if (!input) return;

    const pred = model.predict(tf.tensor([input]));
    const arr = await pred.array();
    const maxIdx = arr[0].indexOf(Math.max(...arr[0]));
    const detected = labels[maxIdx] || "—";

    if (detectedRef.current) detectedRef.current.textContent = detected;

    if (detected === arcadeTarget && !hitCooldown.current) {
      hitCooldown.current = true;
      addScore();
      setArcadeTarget(randomTarget());
      setTimeout(() => {
        hitCooldown.current = false;
      }, 600);
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
        <h2 className="text-4xl font-extrabold text-[#FFC400] text-center tracking-wide">
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
          <div className="flex gap-2">
            <button
              onClick={startArcade}
              disabled={arcadeActive}
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

        {/* Leaderboard */}
        <section className="mt-10 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-[#C5CAFF] flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6" /> Leaderboard
          </h3>

          <div className="flex gap-3 mb-6">
            {["daily", "weekly", "all"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilter(t);
                  loadLeaderboard(t);
                }}
                className={`lb-tab ${filter === t ? "active" : ""}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {loadingLeaderboard ? (
            <p className="text-gray-400 text-center py-4">Loading…</p>
          ) : (
            <table className="leaderboard-table w-full text-sm">
              <thead className="bg-[#2a2a3c] text-[#C5CAFF]">
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Streak</th>
                  <th>XP</th>
                  <th>Gems</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#3a3a55] text-center hover:bg-[#2a2a3c]"
                  >
                    <td>{i + 1}</td>
                    <td>{row.users?.username || "Player"}</td>
                    <td>{row.score}</td>
                    <td>{row.max_streak}</td>
                    <td>{row.xp_earned}</td>
                    <td>{row.gems_earned}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Finish Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-8 w-[350px] text-center shadow-2xl">
              <h2 className="text-3xl font-extrabold text-[#27E1C1] mb-4">
                Arcade Finished!
              </h2>
              <p className="text-gray-300 mb-3">{arcadeStatus}</p>
              <div className="bg-[#14142B] rounded-xl p-4 border border-[#2a2a3c] mb-5">
                <p className="text-lg font-bold text-[#FFC400]">
                  Final Score: {finalScore}
                </p>
                <p className="text-lg font-bold text-[#FFC400]">
                  Max Streak: {finalStreak}
                </p>
              </div>
              <div className="mb-5">
                <p className="text-[#27E1C1] font-semibold">Rewards Earned:</p>
                <p className="text-gray-200">+{rewards.xp} XP</p>
                <p className="text-gray-200">+{rewards.gems} Gems</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-[#27E1C1] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#1dd4b4]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
