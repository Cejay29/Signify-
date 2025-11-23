import { supabase } from "../../lib/supabaseClient";

export async function unlockAchievement(code) {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return { unlocked: false };

    const userId = session.user.id;

    // 1. Load the achievement by code
    const { data: achievement } = await supabase
        .from("achievements")
        .select("*")
        .eq("code", code)
        .single();

    if (!achievement) return { unlocked: false };

    // 2. Check if already unlocked
    const { data: existing } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id)
        .maybeSingle();

    if (existing) return { unlocked: false }; // already unlocked

    // 3. Insert unlock
    await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
    });

    return {
        unlocked: true,
        achievement: achievement,
    };
}
