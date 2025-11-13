import { useEffect, useRef, useState } from "react";
import { loadGestureLibraries } from "../utils/libLoader";
import { normalize } from "../utils/normalize";
import Sidebar from "../components/Sidebar";
import useGestureModel from "../hooks/useGestureModel";
import useGestureEngine from "../hooks/useGestureEngine";
import useHands from "../hooks/useHands";
import useArcadeLeaderboard from "../hooks/arcade/useArcadeLeaderboard";
import useArcadeRewards from "../hooks/arcade/useArcadeRewards";
import { supabase } from "../lib/supabaseClient";

/* ----------------------- UI COMPONENTS ----------------------- */

function HUD({ hearts = 0, gems = 0, streak = 0 }) {
  return (
    <header className="fixed top-6 right-8 flex items-center gap-4 bg-[#2A2A3C] px-5 py-3 rounded-2xl shadow-lg border border-[#C5CAFF] z-10">
      <div className="hud-pill flex items-center gap-1">
        <img src="/img/fire.png" className="w-6 h-6" />
        <span className="font-bold">{streak}</span>
      </div>
      <div className="hud-pill flex items-center gap-1">
        <img src="/img/gem.png" className="w-6 h-6" />
        <span className="font-bold">{gems}</span>
      </div>
      <div className="hud-pill flex items-center gap-1">
        <img src="/img/heart.png" className="w-6 h-6" />
        <span className="font-bold">{hearts}</span>
      </div>
    </header>
  );
}

function Controls({
  hard,
  onHard,
  sounds,
  onSounds,
  onStart,
  onStop,
  disabled,
}) {
  return (
    <section className="mb-8 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#C5CAFF] flex items-center gap-2">
          <i className="w-6 h-6 text-[#27E1C1] lucide lucide-play-circle"></i>
          Timed Challenge
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-[#27E1C1]"
              checked={hard}
              onChange={(e) => onHard(e.target.checked)}
              disabled={disabled}
            />
            <span>Hard mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-[#27E1C1]"
              checked={sounds}
              onChange={(e) => onSounds(e.target.checked)}
              disabled={disabled}
            />
            <span>Sounds</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onStart}
          className="bg-[#27E1C1] text-black font-bold px-4 py-2 rounded-lg"
          disabled={disabled}
        >
          Start
        </button>
        <button
          onClick={onStop}
          className="bg-[#3B3B5E] text-white font-semibold px-4 py-2 rounded-lg"
          disabled={disabled}
        >
          Stop
        </button>
      </div>
    </section>
  );
}

function TargetDisplay({ target, flash }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-lg text-gray-300">Target:</span>
      <span
        className={`text-5xl font-extrabold tracking-wide drop-shadow-lg ${
          flash ? "animate-ping text-[#27E1C1]" : "text-[#FFC400]"
        }`}
      >
        {target || "—"}
      </span>
    </div>
  );
}

function Feedback({ detected, isCorrect }) {
  return (
    <div
      className={`mt-4 px-5 py-2 rounded-lg border bg-[#2A2A3C] text-lg font-bold tracking-wide shadow-md flex items-center gap-2 ${
        detected === "—" ? "" : isCorrect ? "good" : "bad"
      }`}
      style={{ borderColor: "#3e3e58" }}
    >
      <i className="w-5 h-5 text-[#27E1C1] lucide lucide-scan-eye"></i>
      Detected:<span className="text-[#27E1C1] ml-1">{detected || "—"}</span>
    </div>
  );
}

function StatsRow({ time, score, streak, target }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-5">
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#27E1C1] lucide lucide-timer"></i>
        <span>Time:</span>
        <span className="font-bold ml-1">{time}</span>s
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-star"></i>
        <span>Score:</span>
        <span className="font-bold ml-1">{score}</span>
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#ff6f3f] lucide lucide-flame"></i>
        <span>Streak:</span>
        <span className="font-bold ml-1">{streak}</span>
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-target"></i>
        <span>Target:</span>
        <span className="font-bold text-[#FFC400] ml-1">{target || "—"}</span>
      </div>
    </div>
  );
}

function FinishModal({ open, data, onClose }) {
  if (!open) return null;
  const { reason, score, streak, xp, gems } = data || {};
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-8 w-[350px] text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-[#27E1C1] mb-4">
          Arcade Finished!
        </h2>
        <p className="text-gray-300 mb-3">{reason}</p>
        <div className="bg-[#14142B] rounded-xl p-4 border border-[#2a2a3c] mb-5">
          <p className="text-lg font-bold text-[#FFC400]">
            Final Score: <span>{score}</span>
          </p>
          <p className="text-lg font-bold text-[#FFC400]">
            Max Streak: <span>{streak}</span>
          </p>
        </div>
        {xp != null && (
          <div className="mb-5">
            <p className="text-[#27E1C1] font-semibold">Rewards Earned:</p>
            <p className="text-gray-200">+{xp} XP</p>
            <p className="text-gray-200">+{gems} Gems</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-2 bg-[#27E1C1] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#1dd4b4] transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ----------------------- MAIN COMPONENT ----------------------- */

export default function Arcade() {
  const [libsReady, setLibsReady] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [detected, setDetected] = useState("—");
  const [flash, setFlash] = useState(false);
  const [finishData, setFinishData] = useState(null);
  const [hud, setHud] = useState({ hearts: 0, gems: 0, streak: 0 });
  const [gameStarted, setGameStarted] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/landing.html";
  };

  const { persistArcadeRun } = useArcadeRewards();
  const { filter, setFilter, rows, load, loading, currentUserId } =
    useArcadeLeaderboard();
  const finishGuard = useRef(false);

  /* -------------------------
     ✅ Load User Stats (HUD)
  ------------------------- */
  async function fetchUserStats() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("hearts, gems, streak")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setHud({
        hearts: data.hearts ?? 0,
        gems: data.gems ?? 0,
        streak: data.streak ?? 0,
      });
    } catch (err) {
      console.error("❌ Failed to fetch user stats:", err);
    }
  }

  useEffect(() => {
    fetchUserStats();
    load();
  }, []);

  // ✅ Load gesture libraries
  useEffect(() => {
    (async () => {
      try {
        await loadGestureLibraries();
        setLibsReady(true);
      } catch (err) {
        console.error("❌ Failed to load gesture libs:", err);
      }
    })();
  }, []);

  const { model, labels, loading: modelLoading, error } = useGestureModel();

  const {
    target,
    time,
    score,
    streak,
    countdown,
    start,
    stop,
    reset,
    handleDetect,
  } = useGestureEngine({
    labels,
    model,
    hardMode,
    sounds,
    targetPool: labels,
    onFinish: async ({ reason, score, streak }) => {
      if (!gameStarted || finishGuard.current) return;
      finishGuard.current = true;
      try {
        const rewards = await persistArcadeRun({ score, streak });
        setFinishData({ reason, score, streak, ...rewards });
        await fetchUserStats(); // refresh HUD stats
        load(filter); // refresh leaderboard
      } catch (err) {
        console.error("❌ Arcade finish error:", err);
      } finally {
        setTimeout(() => {
          finishGuard.current = false;
          setGameStarted(false);
        }, 1000);
      }
    },
  });

  const {
    videoRef,
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

  const begin = async () => {
    if (!libsReady || !model || !labels?.length) {
      alert("Libraries or model still loading. Please wait...");
      return;
    }
    setGameStarted(true);
    reset();
    const ok = start();
    if (!ok) return;
    let tries = 0;
    const iv = setInterval(async () => {
      tries++;
      if (tries > 10 || countdown === 0) {
        clearInterval(iv);
        await startCamera();
      }
    }, 300);
  };

  const end = () => {
    stopCamera();
    stop("🔚 Stopped");
    setGameStarted(false);
  };

  /* --- LOADING STATES --- */
  if (!libsReady || modelLoading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1B2E] text-gray-300">
        <p className="text-2xl font-semibold mb-2">Loading Gesture Model…</p>
        <p className="text-sm text-gray-400">
          Initializing TensorFlow & MediaPipe
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1B2E] text-red-400">
        <p className="text-2xl font-semibold mb-2">Model Load Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );

  /* --- MAIN UI --- */
  return (
    <div className="flex min-h-screen bg-[#1C1B2E] text-white">
      {/* 🟨 Sidebar */}
      <Sidebar onLogout={handleLogout} />

      <main
        className="
    flex-1 overflow-y-auto p-8
    md:ml-16        /* Tablet offset (icon-only sidebar width) */
    xl:ml-[250px]   /* Desktop offset (full sidebar width) */
  "
      >
        <HUD hearts={hud.hearts} gems={hud.gems} streak={hud.streak} />

        <h1 className="text-4xl text-center font-extrabold mt-32 mb-6 text-[#27E1C1]">
          Arcade Mode
        </h1>

        <Controls
          hard={hardMode}
          onHard={setHardMode}
          sounds={sounds}
          onSounds={setSounds}
          onStart={begin}
          onStop={end}
          disabled={modelLoading || !model}
        />

        {/* Gameplay Section */}
        <section className="mb-10 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <div className="flex flex-col items-center relative w-full">
            <TargetDisplay
              target={countdown ? countdown.toString() : target}
              flash={flash}
            />
            <div className="relative flex flex-col items-center w-full max-w-[560px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="rounded-xl border-2 border-[#C5CAFF] w-[520px] bg-black shadow-xl"
              />
              <Feedback
                detected={detected}
                isCorrect={detected === target && !!target && target !== "—"}
              />
              <StatsRow
                time={time}
                score={score}
                streak={streak}
                target={target}
              />
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="mt-10 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#C5CAFF] flex items-center gap-2">
              <i className="lucide lucide-trophy w-6 h-6 text-[#FFC400]"></i>{" "}
              Leaderboard
            </h2>
            <div className="flex gap-2">
              {["daily", "weekly", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    load(f);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filter === f
                      ? "bg-[#27E1C1] text-black"
                      : "bg-[#2A2A3C] text-gray-300 hover:bg-[#333353]"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400 text-center py-5">
              Loading leaderboard...
            </p>
          ) : rows.length === 0 ? (
            <p className="text-gray-500 text-center py-5">No records yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a3c] text-[#27E1C1]">
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Player</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Streak</th>
                  <th className="py-2 px-3">XP</th>
                  <th className="py-2 px-3">Gems</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.user_id}
                    className={`border-b border-[#2a2a3c] ${
                      r.user_id === currentUserId ? "bg-[#27E1C1]/10" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-gray-300">
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#C5CAFF]">
                      {r.username}
                    </td>
                    <td className="py-2 px-3">{r.score}</td>
                    <td className="py-2 px-3">{r.max_streak}</td>
                    <td className="py-2 px-3 text-[#27E1C1] font-semibold">
                      +{r.xp_earned}
                    </td>
                    <td className="py-2 px-3 text-[#FFC400] font-semibold">
                      +{r.gems_earned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <FinishModal
        open={!!finishData}
        data={finishData}
        onClose={() => setFinishData(null)}
      />
    </div>
  );
}
