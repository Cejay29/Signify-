"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Star, Trophy } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AchievementIcon from "../components/AchievementIcon";

function xpNeededFor(level) {
  return 100 + level * 20;
}

function rarityLabel(r) {
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function rarityClass(r) {
  switch (r) {
    case "rare":
      return "border-blue-400";
    case "epic":
      return "border-purple-400";
    case "legendary":
      return "border-yellow-400";
    default:
      return "border-pink-300/40";
  }
}

function getRandomGradient() {
  const gradients = [
    "from-pink-400 via-fuchsia-500 to-purple-600",
    "from-purple-500 via-pink-400 to-yellow-400",
    "from-rose-400 via-fuchsia-500 to-purple-600",
    "from-yellow-300 via-rose-400 to-pink-500",
    "from-indigo-400 via-purple-500 to-pink-400",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState([]);

  async function loadUserData() {
    const { data: { session } } = await supabase.auth.getSession();
    const userInfo = session?.user;
    if (!userInfo) return;

    setUser(userInfo);

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userInfo.id)
      .single();

    if (!data) return;

    let { xp, level } = data;

    xp = xp || 0;
    level = level || 0;

    let leveledUp = false;
    while (xp >= xpNeededFor(level)) {
      xp -= xpNeededFor(level);
      level++;
      leveledUp = true;
    }

    if (leveledUp) {
      await supabase.from("users").update({ level, xp }).eq("id", userInfo.id);
    }

    setUserData({ ...data, xp, level });
  }

  async function loadAchievements() {
    const { data: { session } } = await supabase.auth.getSession();
    const userInfo = session?.user;
    if (!userInfo) return;

    const { data: unlocked } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userInfo.id);

    setUnlockedIds(unlocked?.map((a) => a.achievement_id) || []);

    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at");

    setAchievements(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/landing";
  }

  useEffect(() => {
    loadUserData();
    loadAchievements();
  }, []);

  const username = userData?.username || "Anonymous";
  const email = user?.email || "";
  const level = userData?.level || 0;
  const xp = userData?.xp || 0;
  const xpNeeded = xpNeededFor(level);
  const percent = Math.min(100, (xp / xpNeeded) * 100);

  const avatarGradient =
    sessionStorage.getItem("userGradient") ||
    (() => {
      const g = getRandomGradient();
      sessionStorage.setItem("userGradient", g);
      return g;
    })();

  return (
    <div className="
      relative flex min-h-screen font-['Inter']
      bg-[#92487A] text-white overflow-hidden
    ">

      {/* 🍇 Matching Homepage Background Shapes */}
      <img src="/bg/upper-left.png" className="absolute top-[-130px] left-[-80px] w-72 opacity-55 pointer-events-none" />
      <img src="/bg/upper-right.png" className="absolute top-[-150px] right-[-60px] w-96 opacity-65 pointer-events-none" />
      <img src="/bg/shape-center.png" className="absolute top-[20%] left-[10%] w-72 opacity-25 rotate-[12deg] pointer-events-none" />
      <img src="/bg/shape-center.png" className="absolute top-[55%] right-[12%] w-64 opacity-20 rotate-[-18deg] pointer-events-none" />
      <img src="/bg/shape-bottom-left.png" className="absolute bottom-[-150px] left-[-70px] w-96 opacity-40 pointer-events-none" />
      <img src="/bg/lower-right.png" className="absolute bottom-[-160px] right-[-70px] w-96 opacity-35 pointer-events-none" />

      <Sidebar onLogout={logout} />

      <main className="flex-1 overflow-y-auto p-10 md:ml-16 xl:ml-[250px] relative z-10">

        {/* USER SECTION */}
        <section className="pt-40 max-w-4xl mx-auto">

          {/* USER INFO + MASCOT */}
          <div className="flex items-center gap-6 mb-6 relative">

            {/* Avatar */}
            <div
              className={`
                w-28 h-28 rounded-full border-4 border-white/40 
                bg-gradient-to-br ${avatarGradient}
                flex items-center justify-center text-3xl font-bold shadow-xl
              `}
            >
              {username.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-[#FFE4FB]">{username}</h2>
              <p className="text-white/70">{email}</p>
            </div>

            {/* Mascot */}
            <img
              src="/img/big-logo.gif"
              className="absolute right-[-80px] top-[-10px] w-28 h-28 animate-bounce-slow pointer-events-none"
            />
          </div>

          <hr className="border-white/20 mb-8" />

          {/* XP PROGRESS */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2 text-[#FFE4FB]">
              <Star className="w-6 h-6 text-[#FFC400]" /> Your Progress
            </h3>

            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/20">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 bg-gradient-to-r from-[#FFC400] to-[#FF3F7F] rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-white/70 mt-1">
                <span>Lvl {level}</span>
                <span>Lvl {level + 1}</span>
              </div>

              <p className="text-sm text-white/70 mt-1 text-right">
                {xp} / {xpNeeded} XP
              </p>
            </div>
          </div>

          {/* ACHIEVEMENTS */}
          <div className="mb-20">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-[#FFE4FB] relative">
              <Trophy className="w-6 h-6 text-yellow-300" />
              Achievements
              <img
                src="/img/big-logo.gif"
                className="w-12 h-12 absolute right-[-50px] top-[-5px] animate-bounce pointer-events-none"
              />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((a) => {
                const unlocked = unlockedIds.includes(a.id);

                return (
                  <div
                    key={a.id}
                    className={`border rounded-xl p-5 ${rarityClass(a.rarity)}
                      ${unlocked ? "bg-white/15 backdrop-blur-xl border-white/40" : "bg-white/5 border-white/10 opacity-70"}
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <AchievementIcon icon={a.icon} size={28} />
                      <h4 className="text-xl font-bold">{a.title}</h4>
                    </div>

                    <p className="text-white/70 text-sm mb-3">
                      {a.description}
                    </p>

                    <div className={`text-sm ${unlocked ? "text-green-300" : "text-white/40"}`}>
                      {unlocked ? "✅ Unlocked" : "🔒 Locked"}
                      <span className="italic ml-1">· {rarityLabel(a.rarity)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* FLOATING MASCOT */}
        <img
          src="/img/big-logo.gif"
          className="fixed bottom-6 right-6 w-24 h-24 drop-shadow-xl animate-float pointer-events-none"
        />

      </main>

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2.8s infinite;
          }
        `}
      </style>
    </div>
  );
}
