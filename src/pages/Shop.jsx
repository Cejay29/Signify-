"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ShoppingBag,
  Heart,
  BookOpen,
  Type,
  Gamepad2,
  ShoppingCart,
  User,
  MoreHorizontal,
  LogOut,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

// ✅ Fallback confetti loader (works even without npm install)
let confetti;
(async () => {
  if (typeof window !== "undefined" && !window.confetti) {
    await import(
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs"
    )
      .then((mod) => {
        confetti = mod.default;
        window.confetti = confetti;
      })
      .catch((e) => console.error("Failed to load confetti:", e));
  } else {
    confetti = window.confetti;
  }
})();

/* --------------------- COMPONENT --------------------- */
export default function Shop() {
  const [user, setUser] = useState(null);
  const [hearts, setHearts] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState("");
  const [dropdown, setDropdown] = useState(false);

  /* --------------------- LOAD USER --------------------- */
  async function loadUserData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userData = session?.user;
    if (!userData) {
      alert("You must be logged in.");
      return;
    }
    setUser(userData);

    const { data, error } = await supabase
      .from("users")
      .select("hearts, gems, streak")
      .eq("id", userData.id)
      .single();

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    setHearts(data.hearts || 0);
    setGems(data.gems || 0);
    setStreak(data.streak || 0);
  }

  /* --------------------- SHOP ACTION --------------------- */
  async function buyHearts(amount, cost) {
    if (gems < cost) {
      setMsg("❌ Not enough gems!");
      return;
    }

    const newHearts = hearts + amount;
    const newGems = gems - cost;

    const { error } = await supabase
      .from("users")
      .update({ hearts: newHearts, gems: newGems })
      .eq("id", user.id);

    if (error) {
      setMsg("❌ Purchase failed.");
      return;
    }

    setHearts(newHearts);
    setGems(newGems);
    setMsg(`✅ You bought ${amount} heart${amount > 1 ? "s" : ""}!`);

    if (confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  /* --------------------- LOGOUT --------------------- */
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/landing.html";
  }

  useEffect(() => {
    loadUserData();
  }, []);

  const disabled3 = gems < 30;
  const disabled5 = gems < 45;

  /* --------------------- UI --------------------- */
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
        {/* ✅ HUD with image icons instead of Lucide */}
        <header className="fixed top-6 right-8 flex items-center gap-4 bg-[#2A2A3C]/90 px-5 py-3 rounded-2xl shadow-lg border border-[#C5CAFF] z-10 backdrop-blur-md">
          <div className="hud-pill flex items-center gap-2 bg-[#2A2A3C] border border-[#C5CAFF] px-3 py-2 rounded-2xl shadow-inner">
            <img src="/img/fire.png" alt="Streak" className="w-6 h-6" />
            <span className="font-bold">{streak}</span>
          </div>
          <div className="hud-pill flex items-center gap-2 bg-[#2A2A3C] border border-[#C5CAFF] px-3 py-2 rounded-2xl shadow-inner">
            <img src="/img/gem.png" alt="Gems" className="w-6 h-6" />
            <span className="font-bold">{gems}</span>
          </div>
          <div className="hud-pill flex items-center gap-2 bg-[#2A2A3C] border border-[#C5CAFF] px-3 py-2 rounded-2xl shadow-inner">
            <img src="/img/heart.png" alt="Hearts" className="w-6 h-6" />
            <span className="font-bold">{hearts}</span>
          </div>
        </header>

        {/* Shop Section */}
        <section className="pt-40 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-[#FFC400] mb-6 flex justify-center items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Signify Shop
          </h2>
          <p className="text-gray-300 mb-12">
            Exchange your hard-earned gems for extra hearts to keep learning!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buy 3 Hearts */}
            <div className="bg-[#2a2a3c] p-6 rounded-2xl shop-card border border-[#C5CAFF] flex flex-col items-center">
              <img
                src="/img/heart.png"
                className="w-16 h-16 mb-3"
                alt="Heart"
              />
              <h3 className="text-lg font-bold mb-1">Buy 3 Hearts</h3>
              <p className="text-gray-300 mb-4">
                Cost:{" "}
                <span className="text-[#FFC400] font-semibold">30 Gems</span>
              </p>
              <button
                onClick={() => buyHearts(3, 30)}
                disabled={disabled3}
                className={`${
                  disabled3
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#ffda66]"
                } bg-[#FFC400] text-black font-semibold px-6 py-2 rounded-lg transition flex items-center gap-2`}
              >
                <ShoppingCart className="w-4 h-4" /> Buy
              </button>
            </div>

            {/* Buy 5 Hearts */}
            <div className="bg-[#2a2a3c] p-6 rounded-2xl shop-card border border-[#C5CAFF] flex flex-col items-center">
              <img
                src="/img/heart.png"
                className="w-16 h-16 mb-3"
                alt="Heart"
              />
              <h3 className="text-lg font-bold mb-1">Buy 5 Hearts</h3>
              <p className="text-gray-300 mb-4">
                Cost:{" "}
                <span className="text-[#FFC400] font-semibold">45 Gems</span>
              </p>
              <button
                onClick={() => buyHearts(5, 45)}
                disabled={disabled5}
                className={`${
                  disabled5
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#ffda66]"
                } bg-[#FFC400] text-black font-semibold px-6 py-2 rounded-lg transition flex items-center gap-2`}
              >
                <ShoppingCart className="w-4 h-4" /> Buy
              </button>
            </div>
          </div>

          {msg && (
            <div className="mt-8 text-[#FFC400] font-semibold text-lg">
              {msg}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
