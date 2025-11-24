// src/pages/Arcade.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseClient";
import { loadGestureLibraries } from "../utils/libLoader";
import { normalize } from "../utils/normalize";
import { checkArcadeAchievements } from "../hooks/arcade/arcadeAchievementChecker";
import useGestureModel from "../hooks/useGestureModel";
import useHands from "../hooks/useHands";
import AchievementPopup from "../components/AchievementPopup";

/* ---------------- HUD ---------------- */

function HUD({ hearts = 0, gems = 0, streak = 0 }) {
  return (
    <header
      className="
        fixed top-6 right-8 z-30
        flex items-center gap-4
        bg-white/15 backdrop-blur-xl
        px-5 py-3 rounded-2xl
        shadow-lg shadow-black/30
        border border-white/40
      "
    >
      <div className="hud-pill flex items-center gap-1 bg-white/15 border border-white/30 px-3 py-1.5 rounded-xl">
        <img src="/img/fire.png" className="w-6 h-6" />
        <span className="font-bold text-white">{streak}</span>
      </div>
      <div className="hud-pill flex items-center gap-1 bg-white/15 border border-white/30 px-3 py-1.5 rounded-xl">
        <img src="/img/gem.png" className="w-6 h-6" />
        <span className="font-bold text-white">{gems}</span>
      </div>
      <div className="hud-pill flex items-center gap-1 bg-white/15 border border-white/30 px-3 py-1.5 rounded-xl">
        <img src="/img/heart.png" className="w-6 h-6" />
        <span className="font-bold text-white">{hearts}</span>
      </div>
    </header>
  );
}

/* ---------------- Controls ---------------- */

function Controls({ hard, onHard, sounds, onSounds, onStart, onStop, disabled }) {
  return (
    <section
      className="
        mb-8
        bg-white/15 backdrop-blur-lg
        border border-white/30
        rounded-3xl p-6
        shadow-xl shadow-black/30
      "
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <i className="w-6 h-6 text-[#FFC400] lucide lucide-play-circle" />
          Timed Challenge
        </h2>
        <div className="flex items-center gap-4 text-sm text-white/90">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-[#FFC400]"
              checked={hard}
              onChange={(e) => onHard(e.target.checked)}
              disabled={disabled}
            />
            <span>Hard mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-[#FFC400]"
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
          className="
            bg-gradient-to-r from-[#FFC400] to-[#FF8A3C]
            text-[#2B1021] font-bold px-4 py-2 rounded-xl
            shadow-md shadow-[#FFC400]/40
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 hover:-translate-y-0.5
            transition
          "
          disabled={disabled}
        >
          Start
        </button>
        <button
          onClick={onStop}
          className="
            bg-[#3A2033]/90 text-white font-semibold px-4 py-2 rounded-xl
            border border-white/25
            shadow-md shadow-black/40
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#4A2541]
            transition
          "
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
      <span className="text-lg text-white/80">Target:</span>
      <span
        className={`
          text-5xl font-extrabold tracking-wide drop-shadow-[0_0_12px_rgba(255,196,0,0.7)]
          ${flash ? "animate-pulse text-[#FFC400]" : "text-[#FFC400]"}
        `}
      >
        {target || "—"}
      </span>
    </div>
  );
}

function Feedback({ detected, isCorrect }) {
  return (
    <div
      className={`
        mt-4 px-5 py-2 rounded-xl
        border bg-white/10 text-lg font-bold tracking-wide
        shadow-md shadow-black/40
        flex items-center gap-2
        ${detected === "—" ? "" : isCorrect ? "good" : "bad"}
      `}
      style={{ borderColor: "rgba(255,255,255,0.3)" }}
    >
      <i className="w-5 h-5 text-[#FFC400] lucide lucide-scan-eye" />
      <span className="text-white/80">Detected:</span>
      <span className="text-[#FFE4FB] ml-1">{detected || "—"}</span>
    </div>
  );
}

function StatsRow({ time, score, streak, target }) {
  const pill =
    "hud-pill flex justify-center items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white/90";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-5">
      <div className={pill}>
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-timer" />
        <span>Time:</span>
        <span className="font-bold ml-1">{time}</span>s
      </div>
      <div className={pill}>
        <i className="w-4 h-4 text-[#FFC400] lucide lucide-star" />
        <span>Score:</span>
        <span className="font-bold ml-1">{score}</span>
      </div>
      <div className={pill}>
        <i className="w-4 h-4 text-[#FF8A3C] lucide lucide-flame" />
        <span>Streak:</span>
        <span className="font-bold ml-1">{streak}</span>
      </div>
      <div className={pill}>
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
      <div
        className="
          bg-[#3A2033]/95 border border-white/25
          rounded-3xl p-8 w-[350px] text-center
          shadow-2xl shadow-black/70
        "
      >
        <h2 className="text-3xl font-extrabold text-[#FFC400] mb-3 drop-shadow-[0_0_12px_rgba(255,196,0,0.7)]">
          Arcade Finished!
        </h2>
        <p className="text-white/80 mb-4">{reason}</p>

        <div className="bg-black/30 rounded-2xl p-4 border border-white/15 mb-5">
          <p className="text-lg font-bold text-[#FFC400]">
            Final Score: <span>{score}</span>
          </p>
          <p className="text-lg font-bold text-[#FFC400] mt-1">
            Max Streak: <span>{streak}</span>
          </p>
        </div>

        {xp != null && (
          <div className="mb-5 text-white/90">
            <p className="text-[#FFE4FB] font-semibold mb-1">Rewards Earned</p>
            <p>+{xp} XP</p>
            <p>+{gems} Gems</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="
            mt-2 bg-gradient-to-r from-[#FFC400] to-[#FF8A3C]
            text-[#2B1021] font-bold px-5 py-2 rounded-xl
            shadow-md shadow-[#FFC400]/40
            hover:opacity-90 hover:-translate-y-0.5
            transition
          "
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

  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    rarity: "common",
  });

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
        return labels.filter((l) => /^[A-Z0-9]$/.test(l)); // letters & numbers
      case "lessons":
        return labels.filter((l) => l.startsWith("L-"));
      case "custom":
        return customPool.length ? customPool : labels;
      case "all":
      default:
        return labels;
    }
  }, [category, labels, customPool]);

  const showAchievementPopup = (achievement) => {
    setPopup({
      visible: true,
      title: achievement.title,
      rarity: achievement.rarity,
    });

    setTimeout(() => {
      setPopup({
        visible: false,
        title: "",
        rarity: "common",
      });
    }, 2200);
  };

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

      const bonus = Math.min(newStreak - 1, 5);
      const gained = 10 + bonus;

      setScore((prevScore) => {
        const ns = prevScore + gained;
        scoreRef.current = ns;
        return ns;
      });

      return newStreak;
    });

    predictionBufferRef.current = [];
    consecutiveRef.current = 0;
    lastTopRef.current = "-";

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
        const rewards = await persistRewards(finalScore, finalStreak);

        const newlyUnlocked = await checkArcadeAchievements(
          finalScore,
          finalStreak
        );

        if (newlyUnlocked.length > 0) {
          let delay = 0;
          newlyUnlocked.forEach((ach) => {
            setTimeout(() => showAchievementPopup(ach), delay);
            delay += 2500;
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
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
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
    getPoolByCategory,
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#3A1630] text-gray-200">
        <p className="text-2xl font-semibold mb-2">Loading Gesture Model…</p>
        <p className="text-sm text-gray-400">
          Initializing TensorFlow &amp; MediaPipe
        </p>
      </div>
    );
  }

  if (modelError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#3A1630] text-red-300">
        <p className="text-2xl font-semibold mb-2">Model Load Error</p>
        <p className="text-sm">{modelError}</p>
      </div>
    );
  }

  /* ----- MAIN UI ----- */

  return (
    <div
      className="
        relative flex min-h-screen font-['Inter'] text-white overflow-hidden
        bg-[#92487A]
      "
    >
      {/* Background shapes to match homepage/alphabet */}
      <img
        src="/bg/upper-left.png"
        className="absolute top-[-120px] left-[-80px] w-72 opacity-55 pointer-events-none"
      />
      <img
        src="/bg/upper-right.png"
        className="absolute top-[-140px] right-[-80px] w-80 opacity-65 pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute top-[18%] left-[15%] w-72 opacity-25 rotate-[-12deg] pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute top-[55%] right-[10%] w-64 opacity-20 rotate-[15deg] pointer-events-none"
      />
      <img
        src="/bg/shape-bottom-left.png"
        className="absolute bottom-[-150px] left-[-80px] w-80 opacity-45 pointer-events-none"
      />
      <img
        src="/bg/lower-right.png"
        className="absolute bottom-[-160px] right-[-80px] w-96 opacity-40 pointer-events-none"
      />

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Achievement Popup */}
      <AchievementPopup
        visible={popup.visible}
        title={popup.title}
        rarity={popup.rarity}
      />

      <main
        className="
          flex-1 overflow-y-auto p-6 sm:p-10 relative z-10
          md:ml-16 xl:ml-[250px]
        "
      >
        <HUD hearts={hud.hearts} gems={hud.gems} streak={hud.streak} />

        <h1
          className="
            text-4xl sm:text-5xl text-center font-extrabold
            mt-32 mb-6
            text-[#FFE4FB]
            drop-shadow-[0_0_14px_rgba(0,0,0,0.4)]
          "
        >
          Arcade Mode
        </h1>

        {/* Category Section */}
        <section
          className="
            bg-white/15 backdrop-blur-lg
            border border-white/30
            rounded-3xl p-6 mb-8
            shadow-xl shadow-black/30
          "
        >
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
            Categories
          </h2>

          <div className="flex flex-wrap gap-3">
            {[
              { id: "all", label: "All Signs" },
              { id: "alphabet", label: "Alphabet & Numbers" },
              { id: "lessons", label: "Lesson Signs" },
              { id: "custom", label: "Custom Mix" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-semibold transition
                  ${category === cat.id
                    ? "bg-gradient-to-r from-[#FFC400] to-[#FF8A3C] text-[#2B1021] shadow-md shadow-[#FFC400]/40"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {category === "custom" && (
            <div className="mt-4 p-3 bg-black/25 rounded-2xl border border-white/20">
              <p className="text-white/80 mb-2 text-sm">
                Pick custom gestures:
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto text-xs">
                {labels?.map((lbl) => (
                  <label key={lbl} className="flex items-center gap-2 text-white/90">
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
        <section
          className="
            mb-10
            bg-white/15 backdrop-blur-lg
            border border-white/30
            rounded-3xl p-6
            shadow-xl shadow-black/40
          "
        >
          <div className="flex flex-col items-center relative w-full">
            <TargetDisplay target={target} flash={flash} />

            <div className="relative flex flex-col items-center w-full max-w-[560px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="
                  rounded-2xl border-2 border-white/40
                  w-full max-w-[520px]
                  bg-black/80 shadow-2xl shadow-black/60
                "
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
        <section
          className="
            mt-10
            bg-white/15 backdrop-blur-lg
            border border-white/30
            rounded-3xl p-6
            shadow-xl shadow-black/30
            mb-16
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <i className="lucide lucide-trophy w-6 h-6 text-[#FFC400]" />
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
                  className={`
                    px-3 py-1 rounded-full text-sm font-semibold transition
                    ${leaderFilter === f
                      ? "bg-gradient-to-r from-[#FFC400] to-[#FF8A3C] text-[#2B1021] shadow-md shadow-[#FFC400]/40"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    }
                  `}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {leaderLoading ? (
            <p className="text-gray-200 text-center py-5">
              Loading leaderboard...
            </p>
          ) : leaderRows.length === 0 ? (
            <p className="text-gray-200 text-center py-5">
              No records yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/20 text-[#FFC400]">
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
                      className={`border-b border-white/10 ${r.user_id === currentUserId
                          ? "bg-[#FFC400]/15"
                          : "hover:bg-white/5"
                        }`}
                    >
                      <td className="py-2 px-3 font-bold text-white/90">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#FFE4FB]">
                        {r.username}
                      </td>
                      <td className="py-2 px-3 text-white/90">{r.score}</td>
                      <td className="py-2 px-3 text-white/90">
                        {r.max_streak}
                      </td>
                      <td className="py-2 px-3 text-[#FFC400] font-semibold">
                        +{r.xp_earned}
                      </td>
                      <td className="py-2 px-3 text-[#FFC400] font-semibold">
                        +{r.gems_earned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
