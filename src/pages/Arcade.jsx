// src/pages/Arcade.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Trophy,
  PlayCircle,
  Timer,
  Star,
  Flame,
  Target,
  Gamepad2,
} from "lucide-react";
import { loadGestureLibraries } from "../utils/libLoader";
import { loadGestureModelOnce } from "../utils/modelLoader";

const DEFAULT_TIME = 30;
const DEFAULT_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Arcade() {
  // session + user
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);

  // model & labels
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [modelVersion, setModelVersion] = useState(null);

  // levels/lessons/targets
  const [levels, setLevels] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const targetPoolRef = useRef([]); // current allowed targets

  // arcade / gameplay states
  const [arcadeActive, setArcadeActive] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [soundsOn, setSoundsOn] = useState(true);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [target, setTarget] = useState("—");
  const [statusText, setStatusText] = useState("Press Start to begin…");

  // leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbFilter, setLbFilter] = useState("daily");
  const [loadingLB, setLoadingLB] = useState(false);

  // UI modal (finish)
  const [showFinish, setShowFinish] = useState(false);
  const [finishInfo, setFinishInfo] = useState({ reason: "", xp: 0, gems: 0 });

  // refs for DOM & libs
  const videoRef = useRef(null);
  const floatLayerRef = useRef(null);
  const detectedRef = useRef(null);
  const timeBarRef = useRef(null);

  // mediapipe & camera refs (persist across renders)
  const mpHandsRef = useRef(null);
  const mpCameraRef = useRef(null);

  // prediction buffers / logic
  const predictionBufferRef = useRef([]);
  const consecutiveAgreeRef = useRef(0);
  const lastTopRef = useRef("-");
  const lastHitTargetRef = useRef(null);
  const hitCooldownRef = useRef(false);

  // timers
  const timerIntervalRef = useRef(null);

  // ---------- lifecycle: auth, load libs & model, load levels ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Auth
        const { data: s } = await supabase.auth.getSession();
        if (!s?.session) {
          // not logged in -> redirect to landing
          window.location.href = "/landing";
          return;
        }
        if (!mounted) return;
        setSession(s.session);
        setUserId(s.session.user.id);

        // Load libs + model
        setModelLoading(true);
        await loadGestureLibraries(); // ensures window.tf, window.Hands, window.Camera exist

        try {
          const {
            model: mdl,
            labels: lbls,
            version,
          } = await loadGestureModelOnce();
          if (!mounted) return;
          setModel(mdl);
          setLabels(lbls || []);
          setModelVersion(version || null);
          console.log("Arcade: model loaded, labels:", lbls?.length);
        } catch (err) {
          console.error("Arcade model load error:", err);
          setModelError(err?.message || String(err));
        }
      } catch (err) {
        console.error("Arcade init error:", err);
      } finally {
        if (mounted) setModelLoading(false);
      }
    })();

    loadLevels();
    loadLeaderboard(lbFilter);

    return () => {
      mounted = false;
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Load levels / lessons ----------
  async function loadLevels() {
    try {
      const { data, error } = await supabase
        .from("levels")
        .select("id,title,order")
        .order("order", { ascending: true });
      if (!error) setLevels(data || []);
    } catch (e) {
      console.warn("loadLevels error:", e);
    }
  }

  async function loadLessonsForLevel(levelId) {
    setLessons([]);
    setSelectedLesson("");
    targetPoolRef.current = [];
    if (!levelId) return;
    try {
      const { data, error } = await supabase
        .from("lesson")
        .select("id,title,order")
        .eq("level_id", levelId)
        .order("order", { ascending: true });
      if (!error) setLessons(data || []);
    } catch (e) {
      console.warn("loadLessonsForLevel error:", e);
    }
  }

  // ---------- build target pool from lesson_signs + gesture questions ----------
  async function buildTargetsForLesson(lessonId) {
    targetPoolRef.current = [];
    if (!lessonId) return updatePoolInfo();

    try {
      const [{ data: signs }, { data: qs }] = await Promise.all([
        supabase
          .from("lesson_signs")
          .select("word,gloss")
          .eq("lesson_id", lessonId),
        supabase
          .from("lesson_questions")
          .select("type,answer")
          .eq("lesson_id", lessonId),
      ]);

      const candidates = new Set();
      (signs || []).forEach((s) => {
        if (s?.word) candidates.add(s.word.trim());
        if (s?.gloss) candidates.add(s.gloss.trim());
      });
      (qs || []).forEach((q) => {
        if ((q?.type || "").toLowerCase() === "gesture" && q?.answer) {
          candidates.add(q.answer.trim());
        }
      });

      // filter by labels that actually exist
      const labelSet = new Set(labels || []);
      targetPoolRef.current = Array.from(candidates).filter((x) =>
        labelSet.has(x)
      );
    } catch (e) {
      console.warn("buildTargetsForLesson error:", e);
      targetPoolRef.current = [];
    }
    updatePoolInfo();
  }

  function updatePoolInfo() {
    // nothing to render here; frontend reads targetPoolRef when needed
  }

  // ---------- Leaderboard ----------
  async function loadLeaderboard(filterType = "daily") {
    setLoadingLB(true);
    try {
      const now = Date.now();
      const oneDay = new Date(now - 1 * 86400 * 1000).toISOString();
      const oneWeek = new Date(now - 7 * 86400 * 1000).toISOString();

      let q = supabase
        .from("arcade_best")
        .select(
          "user_id,score,max_streak,xp_earned,gems_earned,created_at,users(username)"
        )
        .order("score", { ascending: false });

      if (filterType === "daily") q = q.gte("created_at", oneDay);
      if (filterType === "weekly") q = q.gte("created_at", oneWeek);

      const { data, error } = await q;
      if (error) {
        // fallback manual
        const res = await supabase
          .from("arcade_best")
          .select("user_id,score,max_streak,xp_earned,gems_earned,created_at")
          .order("score", { ascending: false });
        if (res.error) throw res.error;
        const rows = res.data || [];
        const ids = [...new Set(rows.map((r) => r.user_id))];
        let nameMap = {};
        if (ids.length) {
          const ures = await supabase
            .from("users")
            .select("id,username")
            .in("id", ids);
          if (!ures.error)
            ures.data.forEach((u) => (nameMap[u.id] = u.username || "Player"));
        }
        setLeaderboard(
          rows.map((r) => ({
            ...r,
            users: { username: nameMap[r.user_id] || "Player" },
          }))
        );
      } else {
        setLeaderboard(data || []);
      }
    } catch (e) {
      console.warn("loadLeaderboard error:", e);
      setLeaderboard([]);
    } finally {
      setLoadingLB(false);
    }
  }

  // ---------- Camera / Mediapipe integration ----------
  async function startCameraAndHands() {
    if (!videoRef.current) throw new Error("No video ref");

    // ensure mediapipe hands exists on window (libLoader ensures this)
    const Hands = window.Hands;
    const CameraCtor = window.Camera;

    if (!Hands || !CameraCtor) throw new Error("MediaPipe Hands missing");

    // create hands instance (idempotent)
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

    hands.onResults(onResultsArcade);
    mpHandsRef.current = hands;

    // Camera
    mpCameraRef.current = new CameraCtor(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current.readyState >= 2)
          await hands.send({ image: videoRef.current });
      },
      width: 520,
      height: 380,
    });
    mpCameraRef.current.start();
  }

  function stopCamera() {
    try {
      mpCameraRef.current?.stop?.();
    } catch (e) {
      // ignore
    }
    mpCameraRef.current = null;
    mpHandsRef.current = null;
    predictionBufferRef.current = [];
    consecutiveAgreeRef.current = 0;
    lastTopRef.current = "-";
    lastHitTargetRef.current = null;
    hitCooldownRef.current = false;
  }

  function cleanupAll() {
    clearInterval(timerIntervalRef.current);
    stopCamera();
  }

  // ---------- Arcade controls ----------
  function randomTarget() {
    const pool =
      targetPoolRef.current.length > 0
        ? targetPoolRef.current
        : labels.length > 0
        ? labels
        : DEFAULT_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function startArcade() {
    if (!model) {
      alert("Model not loaded yet.");
      return;
    }
    setScore(0);
    setStreak(0);
    setTimeLeft(DEFAULT_TIME);
    setShowFinish(false);
    setStatusText("Starting camera…");

    try {
      await startCameraAndHands();
    } catch (e) {
      console.error("startCameraAndHands error:", e);
      setStatusText("❌ Camera permission denied.");
      return;
    }

    setTarget(randomTarget());
    setArcadeActive(true);
    setStatusText("Game on! Show the target sign.");

    // timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (timeBarRef.current)
          timeBarRef.current.style.width = `${Math.max(
            0,
            (next / DEFAULT_TIME) * 100
          )}%`;
        if (next <= 0) {
          endArcade("⏳ Time’s up!");
          return 0;
        }
        return next;
      });
    }, 1000);
  }

  function stopArcade() {
    endArcade("🔚 Stopped");
  }

  async function endArcade(reason = "Finished") {
    // guard
    if (!arcadeActive) {
      // if not active, still ensure cleanup
      cleanupAll();
      setArcadeActive(false);
      setStatusText(reason);
      return;
    }

    setArcadeActive(false);
    clearInterval(timerIntervalRef.current);
    stopCamera();
    setStatusText(reason);

    // persist results
    try {
      const xp = Math.round(score * 0.3 + streak * 5);
      const gems = Math.floor(xp / 10);
      const now = new Date().toISOString();

      // upsert best
      await supabase.from("arcade_best").upsert(
        {
          user_id: userId,
          score,
          max_streak: streak,
          xp_earned: xp,
          gems_earned: gems,
          created_at: now,
        },
        { onConflict: "user_id" }
      );

      // insert run
      await supabase.from("arcade_runs").insert({
        user_id: userId,
        score,
        max_streak: streak,
        xp_earned: xp,
        gems_earned: gems,
        created_at: now,
      });

      // update user xp/gems atomically: fetch then update
      const { data: u } = await supabase
        .from("users")
        .select("xp,gems")
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

      setFinishInfo({ reason, xp, gems });
      setShowFinish(true);

      // reload leaderboard
      loadLeaderboard(lbFilter);
    } catch (e) {
      console.error("endArcade persist error:", e);
      setFinishInfo({ reason, xp: 0, gems: 0 });
      setShowFinish(true);
    }
  }

  // ---------- Detection callback ----------
  async function onResultsArcade(results) {
    try {
      if (!arcadeActive || !model) return;
      if (!results.multiHandLandmarks?.length) {
        // show blank
        if (detectedRef.current) detectedRef.current.textContent = "—";
        return;
      }

      const normalized = normalizeLandmarks(results.multiHandLandmarks[0]);
      if (!normalized) return;

      // predict
      const inputTensor = window.tf.tensor([normalized]); // window.tf was loaded by libLoader
      let pred;
      try {
        pred = model.predict(inputTensor);
      } catch (err) {
        console.error("model.predict error:", err);
        inputTensor.dispose?.();
        return;
      }
      const arr = await pred.array();
      inputTensor.dispose?.();
      pred.dispose?.();

      const scores = arr[0];
      const maxIdx = scores.indexOf(Math.max(...scores));
      const detected = (labels && labels[maxIdx]) || "—";

      // show detected
      if (detectedRef.current) detectedRef.current.textContent = detected;

      // buffering & majority vote
      predictionBufferRef.current.push(detected);
      const maxBuf = 9;
      if (predictionBufferRef.current.length > maxBuf)
        predictionBufferRef.current.shift();

      const counts = predictionBufferRef.current.reduce((m, c) => {
        m[c] = (m[c] || 0) + 1;
        return m;
      }, {});
      const top =
        Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "?";
      const topCount = counts[top] || 0;

      // consecutive agree
      if (top === lastTopRef.current) consecutiveAgreeRef.current++;
      else {
        lastTopRef.current = top;
        consecutiveAgreeRef.current = 1;
      }

      const framesNeeded = hardMode ? 4 : 6;
      // hit condition: top equals target, enough buffer agreement and consecutive frames and not cooldown and not same as last hit
      if (
        top === target &&
        topCount >= Math.ceil(maxBuf * 0.45) &&
        consecutiveAgreeRef.current >= framesNeeded &&
        !hitCooldownRef.current &&
        lastHitTargetRef.current !== target
      ) {
        // score!
        addScorePopup();
        lastHitTargetRef.current = target;
        hitCooldownRef.current = true;
        setTimeout(() => {
          hitCooldownRef.current = false;
        }, 600);
        predictionBufferRef.current = [];
        consecutiveAgreeRef.current = 0;
        lastTopRef.current = "-";
        // new target not equal to previous
        let next = randomTarget();
        let tries = 0;
        while (next === target && tries++ < 8) next = randomTarget();
        setTarget(next);
      }
    } catch (err) {
      console.error("onResultsArcade error:", err);
    }
  }

  function normalizeLandmarks(landmarks) {
    if (!landmarks?.length) return null;
    const base = landmarks[0];
    return landmarks.flatMap((p) => [p.x - base.x, p.y - base.y, p.z - base.z]);
  }

  // ---------- scoring UI & sound ----------
  function addScorePopup() {
    // update logic: increment streak and score
    setStreak((prev) => {
      const newStreak = prev + 1;
      const bonus = Math.min(newStreak - 1, 5);
      const gained = 10 + bonus;
      setScore((s) => s + gained);
      // float popup
      showFloatingScore(`+${gained}`);
      if (soundsOn) beep(880, 90);
      return newStreak;
    });
  }

  function showFloatingScore(text) {
    if (!floatLayerRef.current) return;
    const el = document.createElement("span");
    el.className = "float-score";
    el.style.left = "50%";
    el.style.top = "10px";
    el.style.transform = "translateX(-50%) translateY(10px)";
    el.style.color = "#27E1C1";
    el.style.position = "absolute";
    el.style.fontWeight = "900";
    el.textContent = text;
    floatLayerRef.current.appendChild(el);
    setTimeout(() => {
      floatLayerRef.current?.removeChild(el);
    }, 900);
  }

  function beep(freq = 600, ms = 120) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, ms + 50);
    } catch {}
  }

  // ---------- UI handlers ----------
  function handleLevelChange(e) {
    const id = e.target.value;
    setSelectedLevel(id);
    loadLessonsForLevel(id);
    targetPoolRef.current = [];
    setSelectedLesson("");
  }

  function handleLessonChange(e) {
    const id = e.target.value;
    setSelectedLesson(id);
    buildTargetsForLesson(id);
  }

  // ---------- Render ----------
  return (
    <div className="flex min-h-screen bg-[#1C1B2E] text-white">
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
              className="bg-[#27E1C1] text-black font-bold px-4 py-2 rounded-lg"
              onClick={startArcade}
              disabled={arcadeActive || modelLoading}
            >
              <PlayCircle className="w-4 h-4 inline-block mr-2" />
              Start
            </button>
            <button
              className="bg-[#3B3B5E] text-white px-4 py-2 rounded-lg"
              onClick={stopArcade}
              disabled={!arcadeActive}
            >
              Stop
            </button>
          </div>
        </header>

        {/* HUD */}
        <div className="fixed top-6 right-8 flex items-center gap-4 bg-[#2A2A3C] px-5 py-3 rounded-2xl shadow-lg border border-[#C5CAFF] z-10">
          <div className="hud-pill flex items-center gap-2">
            <img src="/img/fire.png" alt="streak" className="w-6 h-6" />
            <span className="streak-value font-bold">{streak}</span>
          </div>
          <div className="hud-pill flex items-center gap-2">
            <img src="/img/gem.png" alt="gems" className="w-6 h-6" />
            <span className="gems-value font-bold">—</span>
          </div>
          <div className="hud-pill flex items-center gap-2">
            <img src="/img/heart.png" alt="hearts" className="w-6 h-6" />
            <span className="hearts-value font-bold">—</span>
          </div>
        </div>

        {/* Controls */}
        <section className="mb-6 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#C5CAFF] flex items-center gap-2">
              <Timer className="w-5 h-5 text-[#27E1C1]" /> Timed Challenge
            </h2>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hardMode}
                  onChange={(e) => setHardMode(e.target.checked)}
                  className="accent-[#27E1C1]"
                />
                <span>Hard mode</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={soundsOn}
                  onChange={(e) => setSoundsOn(e.target.checked)}
                  className="accent-[#27E1C1]"
                />
                <span>Sounds</span>
              </label>

              <div className="ml-2 text-xs text-gray-300">
                {modelLoading
                  ? "Loading model..."
                  : modelError
                  ? `Model error: ${modelError}`
                  : model
                  ? `Model ready${modelVersion ? ` (v:${modelVersion})` : ""}`
                  : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedLevel}
              onChange={handleLevelChange}
              className="bg-[#1F1F34] border border-[#2a2a3c] rounded-lg px-3 py-2"
            >
              <option value="">— Select Category —</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <select
              value={selectedLesson}
              onChange={handleLessonChange}
              className="bg-[#1F1F34] border border-[#2a2a3c] rounded-lg px-3 py-2"
              disabled={!selectedLevel}
            >
              <option value="">— Select Lesson —</option>
              {lessons.map((ls) => (
                <option key={ls.id} value={ls.id}>
                  {ls.title}
                </option>
              ))}
            </select>

            <div className="text-gray-400 text-sm ml-4">
              Targets in lesson: {targetPoolRef.current.length || "all labels"}
            </div>
          </div>
        </section>

        {/* Camera & HUD */}
        <section className="mb-8 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <div className="flex flex-col items-center relative">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-lg text-gray-300">Target:</span>
              <span className="text-5xl font-extrabold text-[#FFC400] tracking-wide drop-shadow-lg">
                {target}
              </span>
            </div>

            <div className="relative flex flex-col items-center w-full max-w-[560px]">
              <video
                ref={videoRef}
                className="rounded-xl border-2 border-[#C5CAFF] w-[520px] bg-black shadow-xl"
                autoPlay
                playsInline
                muted
              ></video>
              <div
                ref={floatLayerRef}
                className="pointer-events-none absolute inset-0"
              ></div>
            </div>

            <div className="mt-4 px-5 py-2 rounded-lg border border-[#3e3e58] bg-[#2A2A3C] text-lg font-bold tracking-wide shadow-md flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[#27E1C1]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M3 3v18h18" />
              </svg>
              Detected:
              <span ref={detectedRef} className="text-[#27E1C1] ml-1">
                —
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-5">
              <div className="hud-pill flex justify-center items-center gap-2">
                <Timer className="w-4 h-4 text-[#27E1C1]" /> Time: {timeLeft}s
              </div>
              <div className="hud-pill flex justify-center items-center gap-2">
                <Star className="w-4 h-4 text-[#FFC400]" /> Score: {score}
              </div>
              <div className="hud-pill flex justify-center items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff6f3f]" /> Streak: {streak}
              </div>
              <div className="hud-pill flex justify-center items-center gap-2">
                <Target className="w-4 h-4 text-[#FFC400]" /> Target:{" "}
                <span className="font-bold ml-1">{target}</span>
              </div>
            </div>

            <div className="w-full mt-4 bg-[#14142B] border border-[#2a2a3c] rounded-full overflow-hidden h-[12px] shadow-inner">
              <div
                ref={timeBarRef}
                className="timebar h-full"
                style={{ width: "100%" }}
              ></div>
            </div>

            <p className="text-gray-400 text-sm mt-3">{statusText}</p>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mb-10 bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-[#C5CAFF] flex items-center gap-2">
              <Trophy className="w-6 h-6" /> Arcade Leaderboards
            </h3>
            <div className="flex gap-3">
              {["daily", "weekly", "all"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setLbFilter(t);
                    loadLeaderboard(t);
                  }}
                  className={`lb-tab ${lbFilter === t ? "active" : ""}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loadingLB ? (
            <p className="text-gray-400 py-6 text-center">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="leaderboard-table w-full rounded-xl overflow-hidden">
                <thead>
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
                <tbody className="text-center">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-gray-400 py-4">
                        No leaderboard records found.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, i) => {
                      const rank = i + 1;
                      const username = row.users?.username || "Player";
                      const avatar = username.charAt(0).toUpperCase();
                      const highlight =
                        row.user_id === userId ? "lb-highlight" : "";
                      let badge = rank;
                      if (rank === 1) badge = "🥇";
                      else if (rank === 2) badge = "🥈";
                      else if (rank === 3) badge = "🥉";
                      return (
                        <tr key={i} className={`lb-row ${highlight}`}>
                          <td>{badge}</td>
                          <td>
                            <div className="lb-avatar inline-flex items-center justify-center mr-2">
                              {avatar}
                            </div>
                            <div className="mt-1 font-semibold inline-block align-middle">
                              {username}
                            </div>
                          </td>
                          <td>{row.score}</td>
                          <td>{row.max_streak}</td>
                          <td>{row.xp_earned}</td>
                          <td>{row.gems_earned}</td>
                          <td>{new Date(row.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Finish Modal */}
        {showFinish && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1F1F34] border border-[#2a2a3c] rounded-2xl p-8 w-[380px] text-center shadow-2xl">
              <h2 className="text-3xl font-extrabold text-[#27E1C1] mb-4">
                Arcade Finished!
              </h2>
              <p className="text-gray-300 mb-3">{finishInfo.reason}</p>

              <div className="bg-[#14142B] rounded-xl p-4 border border-[#2a2a3c] mb-5">
                <p className="text-lg font-bold text-[#FFC400]">
                  Final Score: <span className="ml-2">{score}</span>
                </p>
                <p className="text-lg font-bold text-[#FFC400]">
                  Max Streak: <span className="ml-2">{streak}</span>
                </p>
              </div>

              <div className="mb-5">
                <p className="text-[#27E1C1] font-semibold">Rewards Earned:</p>
                <p className="text-gray-200">+{finishInfo.xp || 0} XP</p>
                <p className="text-gray-200">+{finishInfo.gems || 0} Gems</p>
              </div>

              <button
                onClick={() => setShowFinish(false)}
                className="bg-[#27E1C1] text-black font-bold px-5 py-2 rounded-lg"
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
