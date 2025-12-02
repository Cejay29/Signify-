import { useState, useEffect } from "react";
import useLessonData from "./lesson/useLessonData";
import useGestureModel from "./useGestureModel";   // <-- FIX your import path
import useGestureEngine from "./lesson/UseGestureEngine";
import useScoring from "./lesson/useScoring";
import { loadGestureLibraries } from "../utils/libLoader";

export default function useLesson(lessonId) {
    const [libsReady, setLibsReady] = useState(false);

    const { steps, rewards, hearts, setHearts, loading } =
        useLessonData(lessonId);

    const { model, labels, loading: modelLoading } = useGestureModel();

    const gestureEngine = useGestureEngine(model, labels);

    const { correctCount, setCorrectCount, applyScore } = useScoring(
        rewards,
        hearts,
        setHearts
    );

    const [idx, setIdx] = useState(0);
    const current = steps[idx];
    const done = idx >= steps.length;

    // ✅ Load TFJS + MediaPipe Hands BEFORE everything else
    useEffect(() => {
        (async () => {
            await loadGestureLibraries();
            setLibsReady(true);
        })();
    }, []);

    // STOP camera when lesson finishes
    useEffect(() => {
        if (!steps.length) return;

        if (done && model && libsReady) {
            gestureEngine.stop();
            applyScore(steps, lessonId);
        }
    }, [done, steps, model, libsReady]);

    return {
        loading: loading || !libsReady || modelLoading,
        current,
        steps,
        idx,
        setIdx,
        hearts,
        rewards,
        done,
        correctCount,
        setCorrectCount,
        gestureEngine,
    };
}
