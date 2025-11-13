// hooks/alphabet/useAlphabetModel.js
import { useEffect, useRef, useState } from "react";
import { loadScript } from "../../utils/libLoader";
import { loadGestureModelOnce } from "../../utils/modelLoader";

export default function useAlphabetModel() {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    const modelRef = useRef(null);
    const labelsRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                // ✅ Load TFJS once
                if (!window.tf) {
                    await loadScript(
                        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4/dist/tf.min.js"
                    );
                }

                // ✅ Reuse the model loader from your Lesson.jsx system
                const { model, labels } = await loadGestureModelOnce();

                if (!mounted) return;

                modelRef.current = model;
                labelsRef.current = labels;
                setReady(true);
            } catch (e) {
                console.error("Alphabet model load error", e);
                if (mounted) setError(e.message || String(e));
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        model: modelRef.current,
        labels: labelsRef.current,
        ready,
        error,
    };
}
