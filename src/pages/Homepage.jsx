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
    <div
      className="
      relative flex min-h-screen font-['Inter']
      bg-[#92487A] text-white overflow-hidden
    "
    >
      {/* 🍇 Same Background Shapes as Arcade & Alphabet */}
      <img
        src="/bg/upper-left.png"
        className="absolute top-[-120px] left-[-80px] w-72 opacity-55 pointer-events-none"
      />
      <img
        src="/bg/upper-right.png"
        className="absolute top-[-140px] right-[-60px] w-96 opacity-65 pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute top-[20%] left-[10%] w-72 opacity-25 rotate-[15deg] pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute top-[50%] right-[12%] w-64 opacity-20 rotate-[-20deg] pointer-events-none"
      />
      <img
        src="/bg/shape-bottom-left.png"
        className="absolute bottom-[-150px] left-[-80px] w-96 opacity-45 pointer-events-none"
      />
      <img
        src="/bg/lower-right.png"
        className="absolute bottom-[-160px] right-[-60px] w-96 opacity-40 pointer-events-none"
      />

      {/* Sidebar */}
      <Sidebar onLogout={logout} />

      {/* MAIN CONTENT */}
      <main
        className="
          flex-1 overflow-y-auto p-10 relative z-10
          md:ml-16 xl:ml-[250px]
        "
      >
        {/* HUD */}
        <header
          className="
          fixed top-6 right-8 flex items-center gap-4
          bg-white/15 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-lg
          border border-white/30 z-20
        "
        >
          <div className="hud-pill flex items-center gap-1">
            <img src="/img/fire.png" className="w-6 h-6" />
            <span>{stats.streak}</span>
          </div>
          <div className="hud-pill flex items-center gap-1">
            <img src="/img/gem.png" className="w-6 h-6" />
            <span>{stats.gems}</span>
          </div>
          <div className="hud-pill flex items-center gap-1">
            <img src="/img/heart.png" className="w-6 h-6" />
            <span>{stats.hearts}</span>
          </div>
        </header>

        {/* Title */}
        <h1 className="text-4xl text-center font-extrabold mt-32 mb-8 text-[#FFE4FB] drop-shadow-lg">
          Choose Your Lesson
        </h1>

        {/* LEVELS + LESSONS */}
        <section className="flex flex-col items-center gap-12 pb-20">
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
                className="
                  w-full max-w-4xl
                  bg-white/15 backdrop-blur-xl
                  p-6 rounded-3xl shadow-2xl border border-white/30
                "
              >
                <div className="mb-4">
                  <div className="text-[#FFE4FB] text-sm font-semibold uppercase tracking-wider">
                    Unit {level.order}
                  </div>
                  <div className="text-2xl font-extrabold">{level.title}</div>

                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-[#FFC400]"
                      style={{
                        width: `${(completedCount / levelLessons.length) * 100 || 0}%`,
                      }}
                    />
                  </div>

                  <div className="text-sm text-white/70 mt-1">
                    {completedCount}/{levelLessons.length} completed
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                        className={`
                          flex justify-between items-center px-5 py-4 rounded-2xl
                          shadow-md transition-all border
                          ${!lessonUnlocked
                            ? "bg-white/10 border-white/20 text-white/40"
                            : done
                              ? "bg-gradient-to-r from-green-400 to-green-600 text-white border-green-300 shadow-xl hover:scale-[1.02]"
                              : "bg-gradient-to-br from-[#FFC400] to-[#FF3F7F] text-[#1C1B2E] border-white shadow-xl hover:scale-[1.03]"
                          }
                        `}
                      >
                        <div>
                          <span className="font-bold flex items-center gap-1 text-lg">
                            {lesson.title}
                            {!lessonUnlocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              done && <Check className="w-4 h-4" />
                            )}
                          </span>
                          <span className="text-sm opacity-80">
                            {done
                              ? "Completed"
                              : !lessonUnlocked
                                ? "Locked"
                                : "Start Lesson"}
                          </span>
                        </div>
                        <div className="text-right text-sm font-bold opacity-90">
                          +{lesson.xp_reward} XP
                          <br />+{lesson.gem_reward} Gems
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
