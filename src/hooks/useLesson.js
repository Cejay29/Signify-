import { useState, useEffect } from "react";
import useLessonData from "./lesson/useLessonData";
import useGestureModel from "./useGestureModel";
import useGestureEngine from "./lesson/UseGestureEngine";
import useScoring from "./lesson/useScoring";

export default function useLesson(lessonId) {
    const { steps, rewards, hearts, setHearts, loading } =
        useLessonData(lessonId);

    const { model, labels, ready: modelReady } = useGestureModel();

    const gestureEngine = useGestureEngine(model, labels);

    const { correctCount, setCorrectCount, applyScore } = useScoring(
        rewards,
        hearts,
        setHearts
    );

    const [idx, setIdx] = useState(0);
    const current = steps[idx];
    const done = idx >= steps.length;

    useEffect(() => {
        if (!steps.length) return;
        if (done && modelReady) {
            gestureEngine.stop();
            applyScore(steps, lessonId);
        }
    }, [done, steps, modelReady]);

    return {
        loading,
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
