// src/pages/Arcade.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseClient";
import { loadGestureLibraries } from "../utils/libLoader";
import { normalize } from "../utils/normalize";
import { checkArcadeAchievements } from "../lib/arcadeAchievementChecker";
import useGestureModel from "../hooks/useGestureModel";
import useHands from "../hooks/useHands";
import AchievementPopup from "../components/AchievementPopup";


/* ---------------- HUD ---------------- */

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

function showAchievementPopup(achievement) {
  setPopup({
    visible: true,
    title: achievement.title,
    rarity: achievement.rarity,
  });

  setTimeout(() => {
    setPopup({ visible: false, title: "", rarity: "common" });
  }, 2200);
}


/* ---------------- Controls ---------------- */

function Controls({ hard, onHard, sounds, onSounds, onStart, onStop, disabled }) {
  return (
    <section className="mb-8 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#C5CAFF] flex items-center gap-2">
          <i className="w-6 h-6 text-[#27E1C1] lucide lucide-play-circle" />
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
          className="bg-[#27E1C1] text-black font-bold px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={disabled}
        >
          Start
        </button>
        <button
          onClick={onStop}
          className="bg-[#3B3B5E] text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={disabled}
        >
          Stop
        </button>
      </div>
    </section>
  );
}

/* ---------------- Target / Feedback / Stats ---------------- */

function TargetDisplay({ target, flash }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-lg text-gray-300">Target:</span>
      <span
        className={`text-5xl font-extrabold tracking-wide drop-shadow-lg ${flash ? "animate-ping text-[#27E1C1]" : "text-[#FFC400]"
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
      className={`mt-4 px-5 py-2 rounded-lg border bg-[#2A2A3C] text-lg font-bold tracking-wide shadow-md flex items-center gap-2 ${detected === "—" ? "" : isCorrect ? "good" : "bad"
        }`}
      style={{ borderColor: "#3e3e58" }}
    >
      <i className="w-5 h-5 text-[#27E1C1] lucide lucide-scan-eye" />
      Detected:<span className="text-[#27E1C1] ml-1">{detected || "—"}</span>
    </div>
  );
}

function StatsRow({ time, score, streak, target }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-5">
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#27E1C1] lucide lucide-timer" />
        <span>Time:</span>
        <span className="font-bold ml-1">{time}</span>s
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-star" />
        <span>Score:</span>
        <span className="font-bold ml-1">{score}</span>
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#ff6f3f] lucide lucide-flame" />
        <span>Streak:</span>
        <span className="font-bold ml-1">{streak}</span>
      </div>
      <div className="hud-pill flex justify-center items-center gap-2">
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-target" />
        <span>Target:</span>
        <span className="font-bold text-[#FFC400] ml-1">{target || "—"}</span>
      </div>
    </div>
  );
}

/* ---------------- Finish Modal ---------------- */

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

/* ============================================================
   MAIN ARCADE COMPONENT
   ============================================================ */

export default function Arcade() {
  // ----- UI / game state -----
  const [libsReady, setLibsReady] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [detected, setDetected] = useState("—");
  const [isCorrect, setIsCorrect] = useState(false);
  const [flash, setFlash] = useState(false);
  const [finishData, setFinishData] = useState(null);

  const [hud, setHud] = useState({ hearts: 0, gems: 0, streak: 0 });

  const [gameStarted, setGameStarted] = useState(false);
  const gameStartedRef = useRef(false);

  const [target, setTarget] = useState(null);
  const targetRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);

  // detection stability
  const predictionBufferRef = useRef([]);
  const consecutiveRef = useRef(0);
  const lastTopRef = useRef("-");
  const lastHitRef = useRef(null);
  const hitCooldownRef = useRef(false);

  // leaderboard
  const [leaderFilter, setLeaderFilter] = useState("daily");
  const [leaderRows, setLeaderRows] = useState([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [category, setCategory] = useState("all");
  const [customPool, setCustomPool] = useState([]);


  // ----- auth + logout -----
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/landing.html";
  };

  // ----- load libs, model, hands -----
  useEffect(() => {
    (async () => {
      try {
        await loadGestureLibraries();
        setLibsReady(true);
      } catch (e) {
        console.error("❌ Failed to load gesture libraries:", e);
      }
    })();
  }, []);

  const { model, labels, loading: modelLoading, error: modelError } =
    useGestureModel();

  // keep ref of gameStarted, target
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // ----- HUD stats -----
  const fetchUserStats = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;
      const { data, error } = await supabase
        .from("users")
        .select("hearts, gems, streak")
        .eq("id", session.user.id)
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
  }, []);

  const getPoolByCategory = useCallback(() => {
    if (!labels || !labels.length) return [];

    switch (category) {
      case "alphabet":
        return labels.filter(l => /^[A-Z]$/.test(l)); // A–Z
      case "numbers":
        return labels.filter(l => /^[0-9]$/.test(l)); // 0–9
      case "lessons":
        return labels.filter(l => l.startsWith("L-"));
      // Example: L-hello, L-thankyou (depends on your label naming)
      case "custom":
        return customPool.length ? customPool : labels;
      case "all":
      default:
        return labels;
    }
  }, [category, labels, customPool]);


  // ----- leaderboard -----
  const loadLeaderboard = useCallback(
    async (filter = "daily") => {
      setLeaderLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id || null);

        const now = Date.now();
        const oneDay = new Date(now - 1 * 86400 * 1000).toISOString();
        const oneWeek = new Date(now - 7 * 86400 * 1000).toISOString();

        let q = supabase
          .from("arcade_best")
          .select("user_id, score, max_streak, xp_earned, gems_earned, created_at")
          .order("score", { ascending: false });

        if (filter === "daily") q = q.gte("created_at", oneDay);
        if (filter === "weekly") q = q.gte("created_at", oneWeek);

        const { data, error } = await q;
        if (error) throw error;

        const rows = data || [];
        if (!rows.length) {
          setLeaderRows([]);
          return;
        }

        const ids = [...new Set(rows.map((r) => r.user_id))];
        let nameMap = {};
        if (ids.length) {
          const { data: users, error: userErr } = await supabase
            .from("users")
            .select("id, username")
            .in("id", ids);
          if (!userErr && users) {
            users.forEach((u) => {
              nameMap[u.id] = u.username || "Player";
            });
          }
        }

        setLeaderRows(
          rows.map((r) => ({
            ...r,
            username: nameMap[r.user_id] || "Player",
          }))
        );
      } catch (e) {
        console.error("❌ Leaderboard load error:", e);
        setLeaderRows([]);
      } finally {
        setLeaderLoading(false);
      }
    },
    []
  );

  // ----- rewards persistence -----
  const persistRewards = useCallback(async (finalScore, finalStreak) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return {};

      const xp = Math.round(finalScore * 0.3 + finalStreak * 5);
      const gems = Math.floor(xp / 10);
      const now = new Date().toISOString();

      // 1. upsert best
      const { error: bestErr } = await supabase
        .from("arcade_best")
        .upsert(
          {
            user_id: userId,
            score: finalScore,
            max_streak: finalStreak,
            xp_earned: xp,
            gems_earned: gems,
            created_at: now,
          },
          { onConflict: "user_id" }
        );

      if (bestErr) console.warn("❌ arcade_best error:", bestErr.message);

      // 2. insert history
      const { error: runsErr } = await supabase.from("arcade_runs").insert({
        user_id: userId,
        score: finalScore,
        max_streak: finalStreak,
        xp_earned: xp,
        gems_earned: gems,
        created_at: now,
      });

      if (runsErr) console.warn("❌ arcade_runs error:", runsErr.message);

      // 3. update user xp/gems
      const { data: u } = await supabase
        .from("users")
        .select("xp, gems")
        .eq("id", userId)
        .single();

      if (u) {
        await supabase
          .from("users")
          .update({
            xp: (u.xp || 0) + xp,
            gems: (u.gems || 0) + gems,
            last_active: now,
          })
          .eq("id", userId);
      }

      return { xp, gems };
    } catch (err) {
      console.error("❌ persistRewards error:", err);
      return {};
    }
  }, []);

  // ----- initial auth + HUD + leaderboard -----
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // no auth
        window.location.href = "/landing.html";
        return;
      }
      await fetchUserStats();
      await loadLeaderboard("daily");
    })();
  }, [fetchUserStats, loadLeaderboard]);

  // ----- gesture handling / camera via useHands -----

  const randomTarget = useCallback(() => {
    const pool = getPoolByCategory();
    if (!pool.length) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }, [getPoolByCategory]);

  const handleHitTarget = useCallback(() => {
    hitCooldownRef.current = true;
    setTimeout(() => {
      hitCooldownRef.current = false;
    }, 600);

    lastHitRef.current = targetRef.current;

    setStreak((prev) => {
      const newStreak = prev + 1;
      streakRef.current = newStreak;

      const bonus = Math.min(newStreak - 1, 5); // like HTML: small streak bonus
      const gained = 10 + bonus;

      setScore((prevScore) => {
        const ns = prevScore + gained;
        scoreRef.current = ns;
        return ns;
      });

      return newStreak;
    });

    // reset stability buffer
    predictionBufferRef.current = [];
    consecutiveRef.current = 0;
    lastTopRef.current = "-";

    // pick different target
    setTarget((prevTarget) => {
      if (!labels || !labels.length) return prevTarget;
      let next = randomTarget();
      let tries = 0;
      while (next === prevTarget && tries < 5) {
        next = randomTarget();
        tries++;
      }
      targetRef.current = next;
      return next;
    });
  }, [labels, randomTarget]);

  const onResults = useCallback(
    async (results) => {
      if (!gameStartedRef.current || !model || !labels?.length || !targetRef.current) {
        setDetected("—");
        setIsCorrect(false);
        return;
      }

      if (!results.multiHandLandmarks?.length) {
        setDetected("—");
        setIsCorrect(false);
        return;
      }

      const lm = results.multiHandLandmarks[0];
      const tf = window.tf;
      const input = normalize(lm);
      if (!input) return;

      const pred = model.predict(tf.tensor([input]));
      const arr = await pred.array();
      const idx = arr[0].indexOf(Math.max(...arr[0]));
      const label = labels[idx] || "?";

      // buffer / stability
      const buf = predictionBufferRef.current;
      const maxBuf = 9;
      buf.push(label);
      if (buf.length > maxBuf) buf.shift();

      const counts = {};
      for (const c of buf) counts[c] = (counts[c] || 0) + 1;
      let top = null;
      let topCount = 0;
      for (const [k, v] of Object.entries(counts)) {
        if (v > topCount) {
          top = k;
          topCount = v;
        }
      }

      if (top === lastTopRef.current) {
        consecutiveRef.current += 1;
      } else {
        lastTopRef.current = top;
        consecutiveRef.current = 1;
      }

      const currentTarget = targetRef.current;
      const correct =
        top === currentTarget && currentTarget && currentTarget !== "—";

      setDetected(top || "—");
      setIsCorrect(correct);
      if (correct) {
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }

      const framesNeeded = hardMode ? 4 : 6;

      if (
        correct &&
        topCount >= Math.ceil(maxBuf * 0.45) &&
        consecutiveRef.current >= framesNeeded &&
        !hitCooldownRef.current &&
        lastHitRef.current !== currentTarget
      ) {
        handleHitTarget();
      }
    },
    [model, labels, hardMode, handleHitTarget]
  );

  const { videoRef, start: startCamera, stop: stopCamera } = useHands({
    onResults,
  });

  // ----- game lifecycle -----

  const resetGameState = useCallback(() => {
    setGameStarted(false);
    gameStartedRef.current = false;

    setTimeLeft(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setScore(0);
    setStreak(0);
    scoreRef.current = 0;
    streakRef.current = 0;

    setTarget(null);
    targetRef.current = null;

    setDetected("—");
    setIsCorrect(false);
    setFlash(false);

    predictionBufferRef.current = [];
    consecutiveRef.current = 0;
    lastTopRef.current = "-";
    lastHitRef.current = null;
    hitCooldownRef.current = false;
  }, []);

  const finishGame = useCallback(
    async (reason) => {
      if (!gameStartedRef.current) return;
      gameStartedRef.current = false;
      setGameStarted(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopCamera();

      const finalScore = scoreRef.current;
      const finalStreak = streakRef.current;

      try {
        // ⭐ Save XP/Gems/Run History
        const rewards = await persistRewards(finalScore, finalStreak);

        // ⭐ Auto-check achievements here (NEW)
        const newlyUnlocked = await checkArcadeAchievements(finalScore, finalStreak);

        // Show each newly unlocked achievement one by one
        if (newlyUnlocked.length > 0) {
          let delay = 0;
          newlyUnlocked.forEach((ach) => {
            setTimeout(() => showAchievementPopup(ach), delay);
            delay += 2500; // queue
          });
        }


        setFinishData({
          reason,
          score: finalScore,
          streak: finalStreak,
          ...rewards,
        });

        await fetchUserStats();
        await loadLeaderboard(leaderFilter);
      } catch (e) {
        console.error("❌ finishGame error:", e);
        setFinishData({
          reason,
          score: finalScore,
          streak: finalStreak,
        });
      }
    },
    [fetchUserStats, loadLeaderboard, leaderFilter, persistRewards, stopCamera]
  );


  const startTimer = useCallback(() => {
    setTimeLeft(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const totalTime = 30;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // time's up
          finishGame("⏳ Time’s up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [finishGame]);

  const begin = useCallback(async () => {
    if (!libsReady || modelLoading || !model || !labels?.length) {
      alert("Model or libraries still loading. Please wait…");
      return;
    }

    resetGameState();
    setGameStarted(true);
    gameStartedRef.current = true;

    // pick initial target
    const pool = getPoolByCategory();
    if (!pool.length) {
      alert("No gestures available in this category.");
      return;
    }
    const t = randomTarget();

    setTarget(t);
    targetRef.current = t;

    try {
      await startCamera();
    } catch (e) {
      console.error("Camera start error:", e);
      alert("Camera permission denied or unavailable.");
      resetGameState();
      return;
    }

    startTimer();
  }, [
    libsReady,
    modelLoading,
    model,
    labels,
    randomTarget,
    resetGameState,
    startCamera,
    startTimer,
  ]);

  const end = useCallback(() => {
    finishGame("🔚 Stopped");
  }, [finishGame]);

  // ESC to stop
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && gameStartedRef.current) {
        finishGame("🔚 Arcade cancelled");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finishGame]);

  /* ----- Loading / error screens ----- */

  if (!libsReady || modelLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1B2E] text-gray-300">
        <p className="text-2xl font-semibold mb-2">Loading Gesture Model…</p>
        <p className="text-sm text-gray-400">
          Initializing TensorFlow &amp; MediaPipe
        </p>
      </div>
    );
  }

  if (modelError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1C1B2E] text-red-400">
        <p className="text-2xl font-semibold mb-2">Model Load Error</p>
        <p className="text-sm">{modelError}</p>
      </div>
    );
  }

  /* ----- MAIN UI ----- */

  return (
    <div className="flex min-h-screen bg-[#1C1B2E] text-white">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* 🔥 Achievement Popup appears ABOVE HUD */}
      <AchievementPopup
        visible={popup.visible}
        title={popup.title}
        rarity={popup.rarity}
      />

      <main
        className="
          flex-1 overflow-y-auto p-6 sm:p-10 relative
          lg:ml-[250px]
          mt-[70px] lg:mt-0
        "
      >
        <HUD hearts={hud.hearts} gems={hud.gems} streak={hud.streak} />

        <h1 className="text-4xl text-center font-extrabold mt-32 mb-6 text-[#27E1C1]">
          Arcade Mode
        </h1>

        <section className="bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[#C5CAFF]">Category</h2>

          <div className="flex flex-wrap gap-3">
            {[
              { id: "all", label: "All Signs" },
              { id: "alphabet", label: "Alphabet (A–Z)" },
              { id: "numbers", label: "Numbers (0–9)" },
              { id: "lessons", label: "Lesson Signs" },
              { id: "custom", label: "Custom Mix" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-sm transition font-semibold ${category === cat.id
                  ? "bg-[#27E1C1] text-black"
                  : "bg-[#2A2A3C] text-gray-300 hover:bg-[#333353]"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Optional Custom Category UI */}
          {category === "custom" && (
            <div className="mt-4 p-3 bg-[#14142B] rounded-lg border border-[#2a2a3c]">
              <p className="text-gray-300 mb-2">Pick custom gestures:</p>
              <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto">
                {labels?.map((lbl) => (
                  <label key={lbl} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customPool.includes(lbl)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setCustomPool((prev) => [...prev, lbl]);
                        else
                          setCustomPool((prev) =>
                            prev.filter((x) => x !== lbl)
                          );
                      }}
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

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
            <TargetDisplay target={target} flash={flash} />

            <div className="relative flex flex-col items-center w-full max-w-[560px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="rounded-xl border-2 border-[#C5CAFF] w-[520px] bg-black shadow-xl"
              />
              <Feedback detected={detected} isCorrect={isCorrect} />
              <StatsRow
                time={timeLeft}
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
              <i className="lucide lucide-trophy w-6 h-6 text-[#FFC400]" />{" "}
              Leaderboard
            </h2>
            <div className="flex gap-2">
              {["daily", "weekly", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setLeaderFilter(f);
                    loadLeaderboard(f);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${leaderFilter === f
                    ? "bg-[#27E1C1] text:black text-black"
                    : "bg-[#2A2A3C] text-gray-300 hover:bg-[#333353]"
                    }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {leaderLoading ? (
            <p className="text-gray-400 text-center py-5">
              Loading leaderboard...
            </p>
          ) : leaderRows.length === 0 ? (
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
                {leaderRows.map((r, i) => (
                  <tr
                    key={`${r.user_id}-${i}`}
                    className={`border-b border-[#2a2a3c] ${r.user_id === currentUserId ? "bg-[#27E1C1]/10" : ""
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
