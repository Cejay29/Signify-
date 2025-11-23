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
    <div className="relative flex min-h-screen bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] text-white overflow-hidden font-[Inter]">

      {/* 🌟 Background Floating Shapes */}
      <img src="/bg/upper-left.png" className="absolute top-[-100px] left-[-80px] w-72 opacity-60 pointer-events-none" />
      <img src="/bg/upper-right.png" className="absolute top-[-140px] right-[-60px] w-96 opacity-60 pointer-events-none" />
      <img src="/bg/shape-bottom-left.png" className="absolute bottom-[-180px] left-[-90px] w-96 opacity-70 pointer-events-none" />
      <img src="/bg/lower-right.png" className="absolute bottom-[-150px] right-[-60px] w-96 opacity-40 pointer-events-none" />

      {/* Sidebar */}
      <Sidebar onLogout={logout} />

      {/* MAIN CONTENT */}
      <main
        className="
          flex-1 overflow-y-auto p-10
          md:ml-16 xl:ml-[250px]
        "
      >

        {/* HUD */}
        <header className="fixed top-6 right-8 flex items-center gap-4 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl border border-white/40 z-20">
          <div className="flex items-center gap-2">
            <img src="/img/fire.png" className="w-6 h-6" />
            <span className="font-bold">{stats.streak}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="/img/gem.png" className="w-6 h-6" />
            <span className="font-bold">{stats.gems}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="/img/heart.png" className="w-6 h-6" />
            <span className="font-bold">{stats.hearts}</span>
          </div>
        </header>

        {/* TITLE */}
        <h1 className="text-4xl font-extrabold text-center mt-32 mb-10 drop-shadow-lg text-yellow-300">
          Your Learning Path
        </h1>

        {/* LEVEL + LESSON BUBBLE PATH */}
        <section className="flex flex-col items-center gap-24 pb-20">
          {levels.map((level, i) => {
            const levelLessons = lessons.filter((l) => l.level_id === level.id);
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
              <div key={level.id} className="flex flex-col items-center w-full">
                {/* UNIT BUBBLE */}
                <div
                  className="
                    bg-white/90 text-[#450693] px-6 py-4
                    rounded-full shadow-2xl text-xl font-bold
                    border-2 border-[#FFC400]
                    backdrop-blur-xl
                    animate-fade-in-up
                    mb-6
                  "
                >
                  Unit {level.order}: {level.title}
                </div>

                {/* CURVED PATH OF BUBBLES */}
                <div className="flex flex-col gap-10 w-full items-center relative">
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
                          relative flex flex-col items-center justify-center
                          w-44 h-44 rounded-full
                          text-center p-4 transition-all
                          shadow-xl border-4
                          ${!lessonUnlocked
                            ? "bg-gray-400 border-gray-300 opacity-40"
                            : done
                              ? "bg-gradient-to-br from-[#27E1C1] to-[#00a896] border-[#C5FFE1]"
                              : "bg-gradient-to-br from-[#FFC400] to-[#FF3F7F] border-white cursor-pointer hover:scale-105"
                          }
                        `}
                      >
                        <span className="text-lg font-bold drop-shadow-md text-white">
                          {lesson.title}
                        </span>

                        {done ? (
                          <Check className="w-10 h-10 mt-2 text-white drop-shadow-lg" />
                        ) : !lessonUnlocked ? (
                          <Lock className="w-10 h-10 mt-2 text-gray-700" />
                        ) : (
                          <span className="text-xs font-semibold mt-3 text-white drop-shadow-lg">
                            +{lesson.xp_reward} XP · +{lesson.gem_reward} Gems
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Connector Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/30"></div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
