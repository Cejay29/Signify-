// src/hooks/arcade/useArcadeRewards.js
import { supabase } from "../../lib/supabaseClient";

export default function useArcadeRewards() {
  const persistArcadeRun = async ({ score, streak, xp, gems }) => {
    try {
      // -------------------------------
      // 1) Get logged-in user
      // -------------------------------
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const user_id = sessionData?.session?.user?.id;
      if (!user_id) return { xp: 0, gems: 0 };

      // -------------------------------
      // 2) Compute XP/Gems
      // -------------------------------
      const earnedXp = xp ?? Math.round(score * 0.3 + streak * 5);
      const earnedGems = gems ?? Math.floor(earnedXp / 10);
      const now = new Date().toISOString();

      // -------------------------------
      // 3) Insert history (arcade_runs)
      // -------------------------------
      await supabase.from("arcade_runs").insert({
        user_id,
        score,
        max_streak: streak,
        xp_earned: earnedXp,
        gems_earned: earnedGems,
        created_at: now,
      });

      // -------------------------------
      // 4) Update/create arcade_best
      // -------------------------------
      const { data: bestData } = await supabase
        .from("arcade_best")
        .select("score")
        .eq("user_id", user_id)
        .maybeSingle();

      if (!bestData) {
        await supabase.from("arcade_best").insert({
          user_id,
          score,
          max_streak: streak,
          xp_earned: earnedXp,
          gems_earned: earnedGems,
          created_at: now,
        });
      } else if (score > bestData.score) {
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
      // 5) Update user XP & gems
      // -------------------------------
      const { data: userData } = await supabase
        .from("users")
        .select("xp, gems")
        .eq("id", user_id)
        .single();

      const newXp = (userData?.xp || 0) + earnedXp;
      const newGems = (userData?.gems || 0) + earnedGems;

      await supabase
        .from("users")
        .update({
          xp: newXp,
          gems: newGems,
          last_active: now,
        })
        .eq("id", user_id);

      // -------------------------------
      // 6) ACHIEVEMENTS
      // -------------------------------
      await checkArcadeAchievements({
        user_id,
        score,
        streak,
        totalXp: newXp,
      });

      // return earned rewards
      return { xp: earnedXp, gems: earnedGems };
    } catch (err) {
      console.error("❌ persistArcadeRun error:", err);
      return { xp: 0, gems: 0 };
    }
  };

  return { persistArcadeRun };
}

/* ================================================================
   🎯 ACHIEVEMENT HANDLER
================================================================ */
async function checkArcadeAchievements({ user_id, score, streak, totalXp }) {
  // Achievement requirements mapped to achievement.code
  const unlockList = [];

  // Score milestones
  if (score >= 100) unlockList.push("arcade_100");
  if (score >= 300) unlockList.push("arcade_300");
  if (score >= 500) unlockList.push("arcade_500");

  // Combo streak achievements
  if (streak >= 10) unlockList.push("arcade_combo10");
  if (streak >= 20) unlockList.push("arcade_combo20");

  // XP milestones (based on lifetime XP)
  if (totalXp >= 100) unlockList.push("xp_100");
  if (totalXp >= 500) unlockList.push("xp_500");

  if (unlockList.length === 0) return;

  // Get achievement IDs for these codes
  const { data: achievements } = await supabase
    .from("achievements")
    .select("id,code")
    .in("code", unlockList);

  if (!achievements?.length) return;

  // Check already unlocked ones
  const { data: already } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user_id);

  const unlockedIds = new Set(already?.map((a) => a.achievement_id));

  // Filter new ones
  const toInsert = achievements
    .filter((a) => !unlockedIds.has(a.id))
    .map((a) => ({
      user_id,
      achievement_id: a.id,
      unlocked_at: new Date().toISOString(),
    }));

  if (toInsert.length > 0) {
    await supabase.from("user_achievements").insert(toInsert);
    console.log("🏆 Unlocked achievements:", toInsert.length);
  }
}
