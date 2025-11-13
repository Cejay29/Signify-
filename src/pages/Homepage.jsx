// Homepage.jsx
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Lock, Check } from "lucide-react";

export default function Homepage() {
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [stats, setStats] = useState({ hearts: 0, gems: 0, streak: 0 });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    await updateStreak(user.id);
    await loadLevelsAndLessons(user.id);
    await window.checkUserAchievements?.(user.id);
  }

  async function updateStreak(userId) {
    const { data } = await supabase
      .from("users")
      .select("hearts, gems, streak, last_active")
      .eq("id", userId)
      .single();

    if (!data) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    let updatedStreak = data.streak || 0;

    if (data.last_active) {
      const last = new Date(data.last_active);
      const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
      updatedStreak =
        diff === 1 ? updatedStreak + 1 : diff > 1 ? 1 : updatedStreak;
    } else {
      updatedStreak = 1;
    }

    if (
      updatedStreak !== data.streak ||
      !data.last_active ||
      data.last_active.split("T")[0] !== todayStr
    ) {
      await supabase
        .from("users")
        .update({ streak: updatedStreak, last_active: todayStr })
        .eq("id", userId);
    }

    setStats({
      hearts: data.hearts,
      gems: data.gems,
      streak: updatedStreak,
    });
  }

  async function loadLevelsAndLessons(userId) {
    const { data: levelsData } = await supabase
      .from("levels")
      .select("*")
      .order("order", { ascending: true });

    const { data: lessonsData } = await supabase
      .from("lesson")
      .select("*")
      .order("order", { ascending: true });

    const { data: progress } = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("is_completed", true);

    setCompleted(new Set(progress?.map((p) => p.lesson_id) || []));
    setLevels(levelsData || []);
    setLessons(lessonsData || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/landing");
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#1C1B2E] via-[#1C1B2E] to-[#14142B] font-['Inter']">
      {/* ✅ SIDEBAR FIXED */}
      <Sidebar onLogout={logout} />

      {/* ✅ MAIN CONTENT AREA */}
      <main
        className="
    flex-1 overflow-y-auto p-8
    md:ml-16        /* Tablet offset (icon-only sidebar width) */
    xl:ml-[250px]   /* Desktop offset (full sidebar width) */
  "
      >
        {/* ✅ HUD */}
        <header className="fixed top-6 right-8 flex items-center gap-4 bg-[#2A2A3C] px-5 py-3 rounded-2xl shadow-lg border border-[#C5CAFF] z-10">
          <div className="hud-pill">
            <img src="/img/fire.png" className="w-6 h-6" />
            <span>{stats.streak}</span>
          </div>
          <div className="hud-pill">
            <img src="/img/gem.png" className="w-6 h-6" />
            <span>{stats.gems}</span>
          </div>
          <div className="hud-pill">
            <img src="/img/heart.png" className="w-6 h-6" />
            <span>{stats.hearts}</span>
          </div>
        </header>

        {/* ✅ LEVEL + LESSONS */}
        <section className="pt-40 flex flex-col items-center gap-10">
          {levels.map((level, i) => {
            const levelLessons = lessons.filter((l) => l.level_id === level.id);
            const completedCount = levelLessons.filter((l) =>
              completed.has(l.id)
            ).length;

            const unlocked =
              i === 0 ||
              levels.slice(0, i).every((prev) => {
                const prevLessons = lessons.filter(
                  (l) => l.level_id === prev.id
                );
                return (
                  prevLessons.length &&
                  prevLessons.every((l) => completed.has(l.id))
                );
              });

            return (
              <div
                key={level.id}
                className="w-full max-w-3xl bg-[#2A2A3C] p-6 rounded-2xl border border-[#C5CAFF] text-white animate-fade-in-up"
              >
                <div className="mb-4">
                  <div className="text-[#C5CAFF] text-sm font-semibold uppercase">
                    Unit {level.order}
                  </div>
                  <div className="text-xl font-bold">{level.title}</div>

                  <div className="w-full h-2 bg-[#3a3a55] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-[#C5CAFF]"
                      style={{
                        width: `${
                          (completedCount / levelLessons.length) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="text-sm text-gray-300">
                    Progress: {completedCount}/{levelLessons.length}
                  </div>
                </div>

                {/* ✅ Lessons */}
                <div className="flex flex-col gap-3 mt-4">
                  {levelLessons.map((lesson, idx) => {
                    const done = completed.has(lesson.id);
                    const prev = levelLessons[idx - 1];
                    const lessonUnlocked =
                      idx === 0 ? unlocked : completed.has(prev?.id);

                    return (
                      <button
                        key={lesson.id}
                        disabled={!lessonUnlocked || done}
                        onClick={() =>
                          navigate(
                            `/lesson?level_id=${lesson.level_id}&lesson_id=${lesson.id}`
                          )
                        }
                        className={`flex justify-between items-center px-4 py-3 rounded-lg border transition
                                                    ${
                                                      !lessonUnlocked
                                                        ? "bg-gray-700 border-gray-600 text-gray-400 opacity-50"
                                                        : "bg-[#1C1B2E] hover:bg-[#383857] border-[#C5CAFF]"
                                                    }`}
                      >
                        <div>
                          <span className="font-semibold flex items-center gap-1">
                            {lesson.title}
                            {!lessonUnlocked ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              done && (
                                <Check className="w-4 h-4 text-green-400" />
                              )
                            )}
                          </span>

                          <span className="text-sm text-gray-400">
                            {done
                              ? "Completed"
                              : !lessonUnlocked
                              ? "Locked"
                              : "Start"}
                          </span>
                        </div>

                        <div className="text-sm text-[#FFC400] font-medium text-right">
                          +{lesson.xp_reward} XP <br />+{lesson.gem_reward} Gems
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
