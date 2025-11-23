// src/hooks/useGestureEngine.js
import { useRef, useState, useCallback } from "react";

export default function useGestureEngine({
    labels,
    model,
    hardMode = false,
    sounds = true,
    onFinish,     // ({reason, score, streak, xp, gems})
    targetPool,   // optional string[] to restrict targets
}) {
    const effectivePool = (targetPool?.length ? targetPool : labels) || [];
    const [target, setTarget] = useState("—");
    const [time, setTime] = useState(30);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [active, setActive] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const timerRef = useRef(null);
    const bufferRef = useRef([]);
    const lastTopRef = useRef("-");
    const agreeRef = useRef(0);
    const hitCooldownRef = useRef(false);
    const lastHitTargetRef = useRef(null);

    function beep(freq = 600, ms = 120) {
        if (!sounds) return;
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
            setTimeout(() => { o.stop(); ctx.close(); }, ms + 50);
        } catch { }
    }

    const randomTarget = useCallback(() => {
        if (!effectivePool?.length) return "A";
        return effectivePool[Math.floor(Math.random() * effectivePool.length)];
    }, [effectivePool]);

    const reset = useCallback(() => {
        setActive(false);
        setTime(30);
        setScore(0);
        setStreak(0);
        setTarget("—");
        setCountdown(0);
        bufferRef.current = [];
        agreeRef.current = 0;
        lastTopRef.current = "-";
        hitCooldownRef.current = false;
        lastHitTargetRef.current = null;
        clearInterval(timerRef.current);
    }, []);

    const start = useCallback(() => {
        if (!model || !labels?.length) return false;
        reset();
        // 3-2-1 countdown
        let c = 3;
        setCountdown(c);
        const id = setInterval(() => {
            c -= 1;
            setCountdown(c);
            if (c <= 0) {
                clearInterval(id);
                setCountdown(0);

                setActive(true);
                const first = randomTarget();
                setTarget(first);
                lastHitTargetRef.current = null;

                timerRef.current = setInterval(() => {
                    setTime((t) => {
                        if (t <= 1) {
                            clearInterval(timerRef.current);
                            setActive(false);
                            onFinish?.({ reason: "⏳ Time’s up!", score, streak });
                            return 0;
                        }
                        return t - 1;
                    });
                }, 1000);
            }
        }, 1000);
        return true;
    }, [labels, model, onFinish, randomTarget, reset, score, streak]);

    const stop = useCallback((reason = "🔚 Stopped") => {
        clearInterval(timerRef.current);
        setActive(false);
        onFinish?.({ reason, score, streak });
    }, [onFinish, score, streak]);

    const handleDetect = useCallback((label) => {
        if (!active || !label || label === "—") return;
        const framesNeeded = hardMode ? 4 : 6;

        bufferRef.current.push(label);
        if (bufferRef.current.length > 9) bufferRef.current.shift();

        const counts = bufferRef.current.reduce((m, c) => ((m[c] = (m[c] || 0) + 1), m), {});
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top = sorted[0]?.[0] || "?";
        const topCount = sorted[0]?.[1] || 0;

        if (top === lastTopRef.current) agreeRef.current++;
        else { agreeRef.current = 1; lastTopRef.current = top; }

        if (top !== target) return;

        if (topCount >= 4 && agreeRef.current >= framesNeeded && !hitCooldownRef.current && lastHitTargetRef.current !== target) {
            setStreak((s) => s + 1);
            // Use *updated* streak in score bonus: pre-calc local
            const nextStreak = streak + 1;
            const bonus = Math.min(nextStreak - 1, 5);
            const gained = 10 + bonus;
            setScore((s) => s + gained);
            beep(880, 80);

            hitCooldownRef.current = true;
            lastHitTargetRef.current = target;
            setTimeout(() => { hitCooldownRef.current = false; }, 600);

            let next = randomTarget();
            let tries = 0;
            while (next === target && tries < 5) { next = randomTarget(); tries++; }
            setTarget(next);

            bufferRef.current = [];
            agreeRef.current = 0;
            lastTopRef.current = "-";
        }
    }, [active, hardMode, randomTarget, target, streak]);

    return {
        // state
        target, time, score, streak, active, countdown,
        // controls
        start, stop, reset, handleDetect,
    };
}
