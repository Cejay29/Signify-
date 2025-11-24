// Shop.jsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import { ShoppingBag, ShoppingCart } from "lucide-react";

const MASCOT = "/img/big-logo.gif";

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

export default function Shop() {
  const [user, setUser] = useState(null);
  const [hearts, setHearts] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState("");

  async function loadUserData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("You must be logged in.");
      return;
    }
    setUser(session.user);

    const { data } = await supabase
      .from("users")
      .select("hearts, gems, streak")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setHearts(data.hearts || 0);
      setGems(data.gems || 0);
      setStreak(data.streak || 0);
    }
  }

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
    setMsg(`✨ You bought ${amount} heart${amount > 1 ? "s" : ""}!`);

    const mascot = document.getElementById("mascot-shop");
    if (mascot) {
      mascot.classList.add("animate-spin");
      setTimeout(() => mascot.classList.remove("animate-spin"), 700);
    }

    if (confetti) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.65 },
      });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/landing";
  }

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-[#70385E] via-[#4A2541] to-[#2E1426] text-white font-['Inter'] overflow-hidden">

      {/* BG SHAPES */}
      <img src="/bg/upper-left.png" className="absolute top-[-120px] left-[-60px] w-64 opacity-20 pointer-events-none" />
      <img src="/bg/upper-right.png" className="absolute top-[-140px] right-[-80px] w-72 opacity-25 pointer-events-none" />
      <img src="/bg/shape-center.png" className="absolute top-[20%] left-[10%] w-64 opacity-15 rotate-[10deg]" />
      <img src="/bg/shape-center.png" className="absolute bottom-[25%] right-[10%] w-72 opacity-10 rotate-[-20deg]" />

      <Sidebar onLogout={logout} />

      <main className="flex-1 overflow-y-auto p-10 md:ml-16 xl:ml-[250px] relative z-10">

        {/* HUD (unchanged) */}
        <header className="fixed top-6 right-8 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-lg border border-white/20 z-20">
          <div className="flex items-center gap-1">
            <img src="/img/fire.png" className="w-6 h-6" />
            <span>{streak}</span>
          </div>
          <div className="flex items-center gap-1">
            <img src="/img/gem.png" className="w-6 h-6" />
            <span>{gems}</span>
          </div>
          <div className="flex items-center gap-1">
            <img src="/img/heart.png" className="w-6 h-6" />
            <span>{hearts}</span>
          </div>
        </header>

        {/* TITLE */}
        <section className="pt-40 max-w-4xl mx-auto text-center relative">

          <h2 className="text-4xl font-extrabold text-[#FFC400] mb-2 flex justify-center items-center gap-3">
            <img src={MASCOT} className="w-12 h-12 drop-shadow-lg animate-bounce" />

            {/* 🟡 Bubble ShoppingBag Icon */}
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-[#FFC400] drop-shadow" />
            </div>

            Signify Shop
          </h2>

          <p className="text-white/70 mb-10 text-lg">
            Trade your gems for hearts and keep practicing!
          </p>

          {msg && (
            <p className="text-center text-[#FFC400] font-bold mb-4">{msg}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* 3 Hearts */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center shadow-lg">
              <img src="/img/heart.png" className="w-16 h-16 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Buy 3 Hearts</h3>
              <p className="text-white/70 mt-1 mb-4">
                Cost: <span className="text-[#FFC400]">30 Gems</span>
              </p>

              <button
                onClick={() => buyHearts(3, 30)}
                disabled={gems < 30}
                className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 mx-auto transition
                  ${gems < 30 ? "opacity-40 cursor-not-allowed bg-[#FFC400]" : "bg-[#FFC400] hover:bg-[#ffd45c] text-black"}`}
              >

                {/* 🟣 Bubble ShoppingCart Icon */}
                <div className="p-2 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40">
                  <ShoppingCart className="w-4 h-4 text-black" />
                </div>

                Buy
              </button>
            </div>

            {/* 5 Hearts */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center shadow-lg">
              <img src="/img/heart.png" className="w-16 h-16 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Buy 5 Hearts</h3>
              <p className="text-white/70 mt-1 mb-4">
                Cost: <span className="text-[#FFC400]">45 Gems</span>
              </p>

              <button
                onClick={() => buyHearts(5, 45)}
                disabled={gems < 45}
                className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 mx-auto transition
                  ${gems < 45 ? "opacity-40 cursor-not-allowed bg-[#FFC400]" : "bg-[#FFC400] hover:bg-[#ffd45c] text-black"}`}
              >

                {/* 🟣 Bubble ShoppingCart Icon */}
                <div className="p-2 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40">
                  <ShoppingCart className="w-4 h-4 text-black" />
                </div>

                Buy
              </button>
            </div>
          </div>
        </section>

        {/* FLOATING MASCOT */}
        <img
          id="mascot-shop"
          src={MASCOT}
          className="w-20 h-20 fixed bottom-6 right-6 drop-shadow-xl animate-bounce"
        />
      </main>
    </div>
  );
}
