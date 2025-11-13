import { useEffect, useRef, useState } from "react";

/**
 * Handles arcade scoring, timer, and round logic.
 */
export default function useGestureEngine({
  labels = [],
  model = null,
  onFinish = () => {},
  targetPool = [],
  roundTime = 30, // seconds
  maxRounds = 10,
  hardMode = false,
  sounds = false,
}) {
  const [target, setTarget] = useState(null);
  const [time, setTime] = useState(roundTime);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef(null);
  const active = useRef(false);
  const lastDetectedRef = useRef(null);
  const correctHoldTime = useRef(0);
  const currentRound = useRef(1);

  /* ---------------------- Utility functions ---------------------- */

  function pickRandomTarget() {
    if (!targetPool?.length) return null;
    const pool = [...targetPool];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function playSound(type) {
    if (!sounds) return;
    const audio = new Audio(
      type === "correct"
        ? "/sounds/correct.mp3"
        : type === "wrong"
        ? "/sounds/wrong.mp3"
        : "/sounds/start.mp3"
    );
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  /* ---------------------- Countdown before start ---------------------- */

  function startCountdown() {
    return new Promise((resolve) => {
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setCountdown(null);
          resolve();
        }
      }, 1000);
    });
  }

  /* ---------------------- Start/Stop/Reset ---------------------- */

  async function start() {
    if (active.current || !model || !labels?.length) return false;
    setScore(0);
    setStreak(0);
    currentRound.current = 1;
    correctHoldTime.current = 0;
    setTime(roundTime);
    setTarget(pickRandomTarget());
    await startCountdown();
    active.current = true;
    playSound("start");

    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          stop("⏰ Time up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return true;
  }

  function stop(reason = "Stopped") {
    if (!active.current) return;
    active.current = false;
    clearInterval(timerRef.current);
    onFinish({ reason, score, streak });
  }

  function reset() {
    setScore(0);
    setStreak(0);
    setTime(roundTime);
    setTarget(null);
    setCountdown(3);
  }

  /* ---------------------- Detection handler ---------------------- */

  function handleDetect(label) {
    if (!active.current || !target) return;

    // ✅ Check if the detected sign matches the current target
    if (label === target) {
      correctHoldTime.current += 1;
      if (correctHoldTime.current >= 5) {
        // Held correct sign for 5 consecutive frames
        const addScore = hardMode ? 20 : 10;
        setScore((prev) => prev + addScore);
        setStreak((prev) => prev + 1);
        playSound("correct");

        // Pick a new target
        setTarget(pickRandomTarget());
        correctHoldTime.current = 0;
        currentRound.current += 1;

        if (currentRound.current > maxRounds) {
          stop("🏁 All rounds complete!");
        }
      }
    } else {
      // wrong sign resets hold time
      correctHoldTime.current = 0;
    }
  }

  /* ---------------------- Cleanup ---------------------- */
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  return {
    target,
    time,
    score,
    streak,
    countdown,
    start,
    stop,
    reset,
    handleDetect,
  };
}
