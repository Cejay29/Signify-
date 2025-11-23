import { unlockAchievement } from "./unlockAchievement";

export async function checkArcadeAchievements(score, streak) {
    const unlocked = [];

    async function tryUnlock(code) {
        const res = await unlockAchievement(code);
        if (res?.unlocked) unlocked.push(res.achievement);
    }

    if (score >= 100) await tryUnlock("arcade_100");
    if (score >= 300) await tryUnlock("arcade_300");
    if (score >= 500) await tryUnlock("arcade_500");

    if (streak >= 10) await tryUnlock("arcade_combo10");
    if (streak >= 20) await tryUnlock("arcade_combo20");

    return unlocked; // return array of unlocked achievements
}
