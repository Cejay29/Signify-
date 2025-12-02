import { useRef } from "react";

export default function useGestureEngine(model, labels) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);

    const state = useRef({
        expected: null,
        buffer: [],
        timer: null,
    });

    /* -----------------------------------------------------------
     * NORMALIZE GLOSS (Fixes uppercase & spacing mismatches)
     * ----------------------------------------------------------- */
    function normalizeGloss(str) {
        if (!str) return "";
        return str.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function clearTimer() {
        if (state.current.timer) {
            clearTimeout(state.current.timer);
            state.current.timer = null;
        }
    }

    function normalize(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;

        const base = landmarks[0];

        return landmarks.flatMap(p => [
            p.x - base.x,
            p.y - base.y,
            p.z - base.z
        ]);
    }

    /* -----------------------------------------------------------
     * ON HAND RESULTS — Push predicted LABEL into buffer
     * ----------------------------------------------------------- */
    function onResults(results) {
        if (!state.current.expected) return;
        if (!results.multiHandLandmarks) return;

        const hand = results.multiHandLandmarks[0];
        if (!hand) return;

        const input = normalize(hand);
        if (!input) return;

        const tf = window.tf;
        const pred = model.predict(tf.tensor([input]));

        pred.array().then(arr => {
            const scores = arr[0];
            const maxIndex = scores.indexOf(Math.max(...scores));

            // NORMALIZE predicted label
            const predicted = normalizeGloss(labels[maxIndex]);

            state.current.buffer.push(predicted);
        });
    }

    /* -----------------------------------------------------------
     * START GESTURE SESSION
     * ----------------------------------------------------------- */
    async function startGesture(expected, callback) {
        state.current.expected = normalizeGloss(expected); // Normalize expected label
        state.current.buffer = [];

        clearTimer();

        // Timer extended to 3 seconds (3000 ms)
        state.current.timer = setTimeout(() => {
            const counts = {};

            state.current.buffer.forEach(label => {
                counts[label] = (counts[label] || 0) + 1;
            });

            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

            const success =
                normalizeGloss(top) === state.current.expected;

            callback(success);

            // reset
            state.current.expected = null;
            state.current.buffer = [];
            clearTimer();
        }, 3000); // ← LONGER TIMER (3 seconds)

        /* ---------------------- SETUP MEDIAPIPE ---------------------- */
        if (!handsRef.current) {
            handsRef.current = new window.Hands({
                locateFile: f =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
            });

            handsRef.current.setOptions({
                maxNumHands: 1,
                minDetectionConfidence: 0.70,
                minTrackingConfidence: 0.60,
                modelComplexity: 1,
            });

            handsRef.current.onResults(onResults);
        }

        /* ---------------------- START CAMERA ---------------------- */
        const video = videoRef.current;

        streamRef.current = await navigator.mediaDevices.getUserMedia({
            video: true,
        });

        video.srcObject = streamRef.current;

        await new Promise(res => (video.onloadeddata = res));

        cameraRef.current = new window.Camera(video, {
            onFrame: async () => {
                if (video.readyState >= 2) {
                    await handsRef.current.send({ image: video });
                }
            },
        });

        cameraRef.current.start();
    }

    /* -----------------------------------------------------------
     * STOP SESSION
     * ----------------------------------------------------------- */
    function stop() {
        try {
            if (cameraRef.current?.stop) cameraRef.current.stop();
            if (streamRef.current)
                streamRef.current.getTracks().forEach(t => t.stop());
        } catch { }

        clearTimer();
    }

    return { videoRef, startGesture, stop };
}
