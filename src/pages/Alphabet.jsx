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
    <div className="relative flex min-h-screen font-['Inter'] overflow-hidden bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693]">

      {/* 🌈 Background Shapes */}
      <img src="/bg/upper-left.png" className="absolute top-[-120px] left-[-80px] w-72 opacity-60 pointer-events-none" />
      <img src="/bg/upper-right.png" className="absolute top-[-140px] right-[-80px] w-80 opacity-70 pointer-events-none" />
      <img src="/bg/shape-center.png" className="absolute top-[180px] left-[25%] w-80 rotate-[-10deg] opacity-30 pointer-events-none" />
      <img src="/bg/lower-right.png" className="absolute bottom-[-150px] right-[-80px] w-[420px] opacity-30 pointer-events-none" />

      {/* 🟨 Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* MAIN CONTENT */}
      <main
        className="
        flex-1 overflow-y-auto p-8 relative z-10
        md:ml-16
        xl:ml-[250px]
      "
      >
        {/* HUD */}
        <header
          className="
          fixed top-6 right-8 flex items-center gap-4 z-30
          px-5 py-3 rounded-2xl
          bg-white/15 backdrop-blur-xl
          shadow-lg shadow-[#FF3F7F]/30
          border border-white/40
        "
        >
          <div className="hud-pill bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/30">
            <img src="/img/fire.png" className="w-5 h-5" />
            <span className="font-bold text-white">{stats.streak}</span>
          </div>

          <div className="hud-pill bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/30">
            <img src="/img/gem.png" className="w-5 h-5" />
            <span className="font-bold text-white">{stats.gems}</span>
          </div>

          <div className="hud-pill bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/30">
            <img src="/img/heart.png" className="w-5 h-5" />
            <span className="font-bold text-white">{stats.hearts}</span>
          </div>
        </header>

        {/* TITLE */}
        <h1 className="
        text-center text-4xl sm:text-5xl font-extrabold 
        text-[#FFC400] drop-shadow-[0_0_12px_rgba(255,196,0,0.6)]
        mt-32 mb-10
        animate-[float_3s_ease-in-out_infinite]
      ">
          ASL Alphabet & Numbers
        </h1>

        {/* PRACTICE CARD */}
        <section className="mb-12">
          <div className="
          bg-white/20 backdrop-blur-lg 
          border border-white/40 
          rounded-3xl shadow-xl shadow-[#FF3F7F]/20 
          p-7
        ">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ✋ Practice Mode
              </h2>

              <span className="
              text-xs px-3 py-1 rounded-full font-semibold 
              bg-[#FFC400] text-[#1C1B2E]
            ">
                Free Practice
              </span>
            </div>

            <p className="text-white/80 text-sm leading-relaxed mb-5">
              Test your skills! Choose a letter or number and practice signing it
              using your webcam. The model will verify your hand gestures.
            </p>

            <button
              onClick={() => setModalOpen(true)}
              className="
              bg-gradient-to-r from-[#FFC400] to-[#FF3F7F]
              text-[#1C1B2E] font-bold px-5 py-2.5 rounded-xl 
              shadow-lg shadow-[#FF3F7F]/30
              hover:opacity-90 transition
            "
            >
              Open Practice
            </button>
          </div>
        </section>

        {/* ALPHABET */}
        <section className="mb-12">
          <h3 className="text-3xl font-semibold text-white mb-4 drop-shadow">
            Alphabet
          </h3>
          <AlphabetGrid items={alphabet} onPick={openPracticeWith} />
        </section>

        {/* NUMBERS */}
        <section className="mb-24">
          <h3 className="text-3xl font-semibold text-white mb-4 drop-shadow">
            Numbers
          </h3>
          <NumberGrid items={numbers} onPick={openPracticeWith} />
        </section>
      </main>

      {/* ✋ PRACTICE MODAL */}
      <PracticeModal
        open={modalOpen}
        onClose={closeModal}
        target={target}
        onPickTarget={setTarget}
      />
    </div>
  );
}
