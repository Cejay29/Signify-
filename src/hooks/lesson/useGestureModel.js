import { useEffect, useState } from "react";
import { loadScript } from "../../utils/libLoader";
import { loadGestureModelOnce } from "../../utils/modelLoader";

export default function useGestureModel() {
    const [ready, setReady] = useState(false);
    const [model, setModel] = useState(null);
    const [labels, setLabels] = useState(null);

    useEffect(() => {
        (async () => {
            await Promise.all([
                loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js"),
                loadScript(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js"
                ),
                loadScript(
                    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js"
                ),
            ]);

            const res = await loadGestureModelOnce();

            setModel(res.model);
            setLabels(res.labels);
            setReady(true);
        })();
    }, []);

    return { model, labels, ready };
}
