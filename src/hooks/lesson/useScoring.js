import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function useScoring(rewards, hearts, setHearts) {
    const [correctCount, setCorrectCount] = useState(0);

    async function applyScore(steps, lessonId) {
        const totalQuestions = steps.filter((s) => s.type === "question").length;
        const accuracy = (correctCount / totalQuestions) * 100;

        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (!userId) return;

        // Deduct heart if < 80%
        if (accuracy < 80) {
            const { data: row } = await supabase
                .from("users")
                .select("hearts")
                .eq("id", userId)
                .single();

            const newHearts = Math.max((row?.hearts || 1) - 1, 0);

            await supabase.from("users").update({ hearts: newHearts }).eq("id", userId);
            setHearts(newHearts);
        }

        // Add XP + Gems
        const { data: row } = await supabase
            .from("users")
            .select("xp, gems")
            .eq("id", userId)
            .single();

        await supabase
            .from("users")
            .update({
                xp: (row?.xp || 0) + rewards.xp,
                gems: (row?.gems || 0) + rewards.gems,
            })
            .eq("id", userId);

        // Mark lesson complete
        await supabase.from("user_progress").upsert(
            {
                user_id: userId,
                lesson_id: lessonId,
                is_completed: true,
                completed_at: new Date().toISOString(),
            },
            { onConflict: ["user_id", "lesson_id"] }
        );
    }

    return { correctCount, setCorrectCount, applyScore };
}
