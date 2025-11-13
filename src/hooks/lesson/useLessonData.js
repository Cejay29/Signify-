import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function useLessonData(lessonId) {
    const [steps, setSteps] = useState([]);
    const [rewards, setRewards] = useState({ xp: 0, gems: 0 });
    const [hearts, setHearts] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lessonId) return;

        (async () => {
            setLoading(true);

            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) return;

            // Load rewards
            const { data: reward } = await supabase
                .from("lesson")
                .select("xp_reward, gem_reward")
                .eq("id", lessonId)
                .single();

            setRewards({
                xp: reward?.xp_reward || 0,
                gems: reward?.gem_reward || 0,
            });

            // Load steps
            const [{ data: signs }, { data: questions }] = await Promise.all([
                supabase
                    .from("lesson_signs")
                    .select("*")
                    .eq("lesson_id", lessonId)
                    .order("order"),
                supabase
                    .from("lesson_questions")
                    .select("*")
                    .eq("lesson_id", lessonId),
            ]);

            const seq = [];
            const used = new Set();

            // SIGN → GESTURE Q pairing
            (signs || []).forEach((s) => {
                seq.push({ type: "sign", data: s });

                const g = (questions || []).find(
                    (q) => q.type === "gesture" && q.answer === s.gloss
                );

                if (g) {
                    seq.push({ type: "question", data: g });
                    used.add(g.id);
                }
            });

            // Add remaining MC + flashcards
            (questions || []).forEach((q) => {
                if (
                    !used.has(q.id) &&
                    (q.type === "flashcard" || q.type === "multiple-choice")
                ) {
                    seq.push({ type: "question", data: q });
                }
            });

            setSteps(seq);

            // Load hearts
            const { data: session } = await supabase.auth.getSession();
            const userId = session?.session?.user?.id;

            const { data: u } = await supabase
                .from("users")
                .select("hearts")
                .eq("id", userId)
                .single();

            setHearts(u?.hearts || 0);

            setLoading(false);
        })();
    }, [lessonId]);

    return { steps, rewards, hearts, setHearts, loading };
}
