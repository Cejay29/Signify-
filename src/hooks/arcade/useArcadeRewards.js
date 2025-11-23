// src/hooks/arcade/useArcadeRewards.js
import { supabase } from "../../lib/supabaseClient";

/**
 * useArcadeRewards hook
 * Saves arcade results to arcade_runs (history) and arcade_best (personal best)
 */
export default function useArcadeRewards() {
  const persistArcadeRun = async ({ score, streak, xp, gems }) => {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user_id = sessionData?.session?.user?.id;
      if (!user_id) {
        console.warn("❌ No user session found. Run not saved.");
        return { xp: 0, gems: 0 };
      }

      const earnedXp = xp ?? Math.round(score * 0.3 + streak * 5);
      const earnedGems = gems ?? Math.floor(earnedXp / 10);
      const now = new Date().toISOString();

      // ✅ Save run history
      const { error: runErr } = await supabase.from("arcade_runs").insert({
        user_id,
        score,
        max_streak: streak,
        xp_earned: earnedXp,
        gems_earned: earnedGems,
        created_at: now,
      });
      if (runErr) console.error("❌ arcade_runs insert error:", runErr.message);

      // ✅ Check & update best
      const { data: bestData, error: bestFetchErr } = await supabase
        .from("arcade_best")
        .select("score")
        .eq("user_id", user_id)
        .single();

      if (bestFetchErr && bestFetchErr.code === "PGRST114") {
        await supabase.from("arcade_best").insert({
          user_id,
          score,
          max_streak: streak,
          xp_earned: earnedXp,
          gems_earned: earnedGems,
          created_at: now,
        });
      } else if (bestData && score > bestData.score) {
        await supabase
          .from("arcade_best")
          .update({
            score,
            max_streak: streak,
            xp_earned: earnedXp,
            gems_earned: earnedGems,
            created_at: now,
          })
          .eq("user_id", user_id);
      }

      // ✅ Update user XP/gems
      const { data: userData } = await supabase
        .from("users")
        .select("xp, gems")
        .eq("id", user_id)
        .single();

      if (userData) {
        await supabase
          .from("users")
          .update({
            xp: (userData.xp || 0) + earnedXp,
            gems: (userData.gems || 0) + earnedGems,
            last_active: now,
          })
          .eq("id", user_id);
      }

      return { xp: earnedXp, gems: earnedGems };
    } catch (err) {
      console.error("❌ persistArcadeRun unexpected error:", err);
      return { xp: 0, gems: 0 };
    }
  };

  return { persistArcadeRun };
}
