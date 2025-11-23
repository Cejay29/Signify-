"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  BookOpen,
  Type,
  Gamepad2,
  ShoppingBag,
  User,
  MoreHorizontal,
  LogOut,
  Trophy,
  Star,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

/* --------------------- HELPER FUNCTIONS --------------------- */
function xpNeededFor(level) {
  return 100 + level * 20; // Your XP formula
}

function rarityLabel(r) {
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function getRandomGradient() {
  const gradients = [
    "from-pink-500 via-red-500 to-yellow-500",
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-green-400 via-blue-500 to-indigo-600",
    "from-yellow-400 via-red-500 to-pink-500",
    "from-blue-500 via-teal-500 to-green-400",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
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
      return "border-gray-600";
  }
}

/* --------------------- COMPONENT --------------------- */
export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [dropdown, setDropdown] = useState(false);

  /* --------------------- LOAD USER --------------------- */
  async function loadUserData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userInfo = session?.user;
    if (!userInfo) return;

    setUser(userInfo);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userInfo.id)
      .single();

    if (error || !data) return;
    let { username, level, xp } = data;

    level = level || 0;
    xp = xp || 0;

    // Auto level-up logic
    let leveledUp = false;
    while (xp >= xpNeededFor(level)) {
      xp -= xpNeededFor(level);
      level++;
      leveledUp = true;
    }

    if (leveledUp) {
      await supabase.from("users").update({ level, xp }).eq("id", userInfo.id);
    }

    setUserData({ ...data, level, xp });
  }

  /* --------------------- LOAD ACHIEVEMENTS --------------------- */
  async function loadAchievements() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userInfo = session?.user;
    if (!userInfo) return;

    const { data: unlocked } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userInfo.id);

    setUnlockedIds(unlocked?.map((a) => a.achievement_id) || []);

    const { data: all } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at");

    setAchievements(all || []);
  }

  /* --------------------- LOGOUT --------------------- */
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/landing.html";
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
    <div className="flex h-screen bg-gradient-to-br from-[#1C1B2E] to-[#14142B] text-white font-[Inter,sans-serif]">
      {/* ✅ SIDEBAR FIXED */}
      <Sidebar onLogout={logout} />

      {/* Main */}
      <main
        className="
    flex-1 overflow-y-auto p-8
    md:ml-16        /* Tablet offset (icon-only sidebar width) */
    xl:ml-[250px]   /* Desktop offset (full sidebar width) */
  "
      >
        <section className="pt-40 max-w-4xl mx-auto text-white">
          {/* User Info */}
          <div className="flex items-center gap-6 mb-6">
            <div
              id="avatar"
              className={`w-28 h-28 flex items-center justify-center text-3xl font-bold rounded-full border-4 text-white shadow-xl bg-gradient-to-br ${avatarGradient}`}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">{username}</h2>
              <p className="text-gray-400">{email}</p>
            </div>
          </div>

          <hr className="border-gray-700 mb-8" />

          {/* XP Progress */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Star className="w-6 h-6 text-[#FFC400]" /> Your Progress
            </h3>
            <div className="bg-[#2A2A3C] p-5 rounded-xl shadow-inner border border-[#3a3a55]">
              <div className="w-full bg-[#1C1B2E] rounded-full h-4 overflow-hidden">
                <div
                  className="progress-bar h-4 bg-gradient-to-r from-[#FFC400] to-[#FF6B00] rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>Lvl {level}</span>
                <span>Lvl {level + 1}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 text-right">
                {xp} / {xpNeeded} XP
              </p>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" /> Achievements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((a) => {
                const isUnlocked = unlockedIds.includes(a.id);

                return (
                  <div
                    key={a.id}
                    className={`border rounded-xl p-5 ${rarityClass(a.rarity)}
          ${isUnlocked ? "bg-[#2A2A3C]" : "bg-[#1C1B2E] opacity-70"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <AchievementIcon icon={a.icon} size={28} />
                      <h4 className="text-xl font-bold">{a.title}</h4>
                    </div>

                    <p className="text-gray-300 text-sm mb-3">
                      {a.description || ""}
                    </p>

                    <div className={`text-sm ${isUnlocked ? "text-green-400" : "text-gray-500"
                      }`}>
                      {isUnlocked ? "✅ Unlocked" : "🔒 Locked"}
                      <span className="italic ml-1">· {rarityLabel(a.rarity)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
