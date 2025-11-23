// src/hooks/arcade/useArcadeRewards.js
import { supabase } from "../../lib/supabaseClient";

export default function useArcadeRewards() {
  const persistArcadeRun = async ({ score, streak, xp, gems }) => {
    try {
      // -------------------------------
      // 1) Get User
      // -------------------------------
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) throw sessionErr;

      const user_id = sessionData?.session?.user?.id;
      if (!user_id) {
        console.warn("❌ No user logged in.");
        return { xp: 0, gems: 0 };
      }

      // -------------------------------
      // 2) Calculate XP & Gems
      // -------------------------------
      const earnedXp = xp ?? Math.round(score * 0.3 + streak * 5);
      const earnedGems = gems ?? Math.floor(earnedXp / 10);
      const now = new Date().toISOString();

      // -------------------------------
      // 3) Insert full run history
      // -------------------------------
      const { error: runErr } = await supabase
        .from("arcade_runs")
        .insert({
          user_id,
          score,
          max_streak: streak,
          xp_earned: earnedXp,
          gems_earned: earnedGems,
          created_at: now,
        });

      if (runErr)
        console.error("❌ arcade_runs insert error:", runErr.message);

      // -------------------------------
      // 4) Handle arcade_best (upsert)
      // -------------------------------
      const { data: bestData, error: bestError } = await supabase
        .from("arcade_best")
        .select("score")
        .eq("user_id", user_id)
        .maybeSingle();

      if (!bestData) {
        // No record exists → create first best
        await supabase.from("arcade_best").insert({
          user_id,
          score,
          max_streak: streak,
          xp_earned: earnedXp,
          gems_earned: earnedGems,
          created_at: now,
        });
      } else if (score > bestData.score) {
        // Update best if better
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

      // -------------------------------
      // 5) Add XP/Gems to user stats
      // -------------------------------
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

      // -------------------------------
      // 6) Return rewards to React
      // -------------------------------
      return {
        xp: earnedXp,
        gems: earnedGems,
      };
    } catch (err) {
      console.error("❌ persistArcadeRun error:", err);
      return { xp: 0, gems: 0 };
    }
  };

  return { persistArcadeRun };
}
