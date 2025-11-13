// pages/Alphabet.jsx
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import AlphabetGrid from "../components/alphabet/AlphabetGrid";
import NumberGrid from "../components/alphabet/NumberGrid";
import PracticeModal from "../components/alphabet/PracticeModal";
import { supabase } from "../lib/supabaseClient";

export default function Alphabet() {
  const [stats, setStats] = useState({ hearts: 0, gems: 0, streak: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState(null);

  /* --------------------------------------------------
       🔐 AUTH CHECK + HUD LOAD
    --------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        window.location.href = "/landing.html";
        return;
      }

      const uid = sessionData.session.user.id;

      const { data } = await supabase
        .from("users")
        .select("hearts,gems,streak")
        .eq("id", uid)
        .single();

      if (mounted && data) {
        setStats({
          hearts: data.hearts ?? 0,
          gems: data.gems ?? 0,
          streak: data.streak ?? 0,
        });
      }
    })();

    return () => (mounted = false);
  }, []);

  /* --------------------------------------------------
       🎯 PICK SIGN → OPEN MODAL
    --------------------------------------------------- */
  const openPracticeWith = useCallback((value) => {
    setTarget(value);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTarget(null);
  }, []);

  /* --------------------------------------------------
       🔡 Alphabet + Numbers
    --------------------------------------------------- */
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  /* --------------------------------------------------
       🚪 Logout
    --------------------------------------------------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/landing.html";
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1C1B2E] via-[#1C1B2E] to-[#14142B] font-['Inter']">
      {/* 🟨 Sidebar */}
      <Sidebar onLogout={handleLogout} />

      <main
        className="
    flex-1 overflow-y-auto p-8
    md:ml-16        /* Tablet offset (icon-only sidebar width) */
    xl:ml-[250px]   /* Desktop offset (full sidebar width) */
  "
      >
        {/* 🎮 HUD (Streak / Gems / Hearts) */}
        <header
          className="
                        fixed top-4 right-4 
                        flex items-center gap-3 
                        bg-[#2A2A3C]/90
                        px-4 py-2 rounded-xl shadow-lg border border-[#C5CAFF] z-20
                        backdrop-blur-md
                    "
        >
          <div className="hud-pill flex items-center gap-2 border border-[#C5CAFF] px-3 py-1.5 rounded-xl bg-[#2A2A3C]">
            <img src="/img/fire.png" className="w-5 h-5" />
            <span className="font-bold">{stats.streak}</span>
          </div>

          <div className="hud-pill flex items-center gap-2 border border-[#C5CAFF] px-3 py-1.5 rounded-xl bg-[#2A2A3C]">
            <img src="/img/gem.png" className="w-5 h-5" />
            <span className="font-bold">{stats.gems}</span>
          </div>

          <div className="hud-pill flex items-center gap-2 border border-[#C5CAFF] px-3 py-1.5 rounded-xl bg-[#2A2A3C]">
            <img src="/img/heart.png" className="w-5 h-5" />
            <span className="font-bold">{stats.hearts}</span>
          </div>
        </header>

        {/* TITLE */}
        <h1 className="text-3xl sm:text-4xl text-center font-extrabold mt-28 sm:mt-32 mb-8 text-[#FFC400]">
          ASL Alphabet & Numbers
        </h1>

        {/* 🟣 Practice Mode Card */}
        <section className="mb-10 grid lg:grid-cols-2 gap-6">
          <div
            className="practice-card bg-gradient-to-br from-[#1F1F34] to-[#26263F]
                                    border border-[rgba(197,202,255,0.15)] rounded-2xl p-7 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#C5CAFF] flex items-center gap-2">
                <span className="text-[#FFC400] text-2xl">✋</span>
                Practice Mode
              </h2>

              <span
                className="pill border border-[#C5CAFF] bg-[#2A2A3C] text-[#C5CAFF]
                                        rounded-full px-2 py-0.5 text-xs font-bold"
              >
                Free practice
              </span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              Open the practice window and try signing any alphabet or number
              using your webcam. Pick a sign and the model will verify if your
              gesture is correct.
            </p>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#FFC400] text-[#1C1B2E] font-bold px-4 py-2 rounded-xl hover:bg-[#ffda66] transition"
            >
              Open Practice
            </button>
          </div>
        </section>

        {/* 🅰 Alphabet */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-[#C5CAFF] mb-4">
            Alphabet
          </h3>
          <AlphabetGrid items={alphabet} onPick={openPracticeWith} />
        </section>

        {/* 🔢 Numbers */}
        <section className="mb-12 pb-10">
          <h3 className="text-2xl font-semibold text-[#C5CAFF] mb-4">
            Numbers
          </h3>
          <NumberGrid items={numbers} onPick={openPracticeWith} />
        </section>
      </main>

      {/* ✋ Practice Modal */}
      <PracticeModal
        open={modalOpen}
        onClose={closeModal}
        target={target}
        onPickTarget={setTarget}
      />
    </div>
  );
}
