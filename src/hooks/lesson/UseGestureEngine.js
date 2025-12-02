import { useRef } from "react";

export default function useGestureEngine(model, labels) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);

    const state = useRef({
        expected: null,
        buffer: [],
        timer: null
    });

    /* -------- Normalization (Capital letters → lowercase, remove spaces) -------- */
    function normalizeGloss(str) {
        if (!str) return "";
        return str.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    /* ---------------------------------------------------------------------------- */

    function clearTimer() {
        if (state.current.timer) {
            clearTimeout(state.current.timer);
            state.current.timer = null;
        }
    }

    function normalize(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;
        const base = landmarks[0];
        return landmarks.flatMap((p) => [p.x - base.x, p.y - base.y, p.z - base.z]);
    }

    function onResults(results) {
        const expected = state.current.expected;
        if (!expected || !results.multiHandLandmarks) return;

        const hand = results.multiHandLandmarks[0];
        if (!hand) return;

        const input = normalize(hand);
        if (!input) return;

        const tf = window.tf;
        const pred = model.predict(tf.tensor([input]));

        pred.array().then(arr => {
            const scores = arr[0];
            const maxIndex = scores.indexOf(Math.max(...scores));

            const rawLabel = labels[maxIndex];
            const normalized = normalizeGloss(rawLabel);

            state.current.buffer.push(normalized);

            // DEBUG LOG
            console.log("[Predict Raw]:", rawLabel, "| [Normalized]:", normalized);
        });
    }

    async function startGesture(expected, callback) {
        const normalizedExpected = normalizeGloss(expected);

        console.log("🔥 Expected gloss:", expected, "| normalized:", normalizedExpected);

        state.current.expected = normalizedExpected;
        state.current.buffer = [];

        clearTimer();

        // ⏳ Increase timer from 1800 → 3000ms
        state.current.timer = setTimeout(() => {
            const counts = {};
            state.current.buffer.forEach(l => counts[l] = (counts[l] || 0) + 1);

            const top = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

            const success = normalizeGloss(top) === normalizedExpected;

            console.log("🟡 Final Prediction:", top, "| Expected:", normalizedExpected);
            console.log("🟢 Success:", success);

            callback(success);

            state.current.expected = null;
            state.current.buffer = [];
            clearTimer();
        }, 3000); // 3 seconds

        // Initialize hands only once
        if (!handsRef.current) {
            handsRef.current = new window.Hands({
                locateFile: (f) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
            });

            handsRef.current.setOptions({
                maxNumHands: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6,
                modelComplexity: 1,
            });

            handsRef.current.onResults(onResults);
        }

        // Webcam setup
        const video = videoRef.current;
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = streamRef.current;

        await new Promise((res) => (video.onloadeddata = res));

        cameraRef.current = new window.Camera(video, {
            onFrame: async () => {
                if (video.readyState >= 2) {
                    await handsRef.current.send({ image: video });
                }
            }
        });

        cameraRef.current.start();
    }

    function stop() {
        try {
            if (cameraRef.current?.stop) cameraRef.current.stop();
            if (streamRef.current)
                streamRef.current.getTracks().forEach((t) => t.stop());
        } catch { }

        clearTimer();
    }

    return { videoRef, startGesture, stop };
}
