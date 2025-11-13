// src/hooks/useHands.js
import { useCallback, useRef } from "react";

export default function useHands({ onResults }) {
    const videoRef = useRef(null);
    const mpHandsRef = useRef(null);
    const cameraRef = useRef(null);

    const start = useCallback(async () => {
        if (!videoRef.current) return false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            const Hands = window.Hands;
            const Camera = window.Camera;
            if (!Hands || !Camera) throw new Error("MediaPipe libs not loaded");

            const hands = new Hands({
                locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
            });
            hands.setOptions({
                maxNumHands: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
                modelComplexity: 1,
            });
            hands.onResults(onResults);
            mpHandsRef.current = hands;

            const cam = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current.readyState >= 2) {
                        await hands.send({ image: videoRef.current });
                    }
                },
                width: 520,
                height: 380,
            });
            cameraRef.current = cam;
            cam.start();
            return true;
        } catch (e) {
            console.error("Camera start failed:", e);
            return false;
        }
    }, [onResults]);

    const stop = useCallback(() => {
        try {
            cameraRef.current?.stop?.();
        } catch { }
        cameraRef.current = null;

        const vid = videoRef.current;
        if (vid?.srcObject) {
            vid.srcObject.getTracks().forEach((t) => t.stop());
            vid.srcObject = null;
        }
    }, []);

    return { videoRef, start, stop };
}
