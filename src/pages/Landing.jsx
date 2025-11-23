import { Link } from "react-router-dom";
import PlayfulBackground from "../components/Playfulbackground";

export default function Landing() {
  return (
    <div className="relative min-h-screen w-screen font-[Inter] overflow-x-hidden">
      <PlayfulBackground />
      {/* HEADER */}
      <header className="w-full flex items-center justify-between px-6 md:px-10 lg:px-12 pt-6">
        {/* LOGO + TEXT */}
        <div className="flex items-center gap-3">
          <img
            src="/img/logo.png"
            alt="Signify"
            className="w-20 sm:w-24 md:w-28 lg:w-32 h-auto"
          />
        </div>
      </header>

      {/* MAIN SECTION */}
      <div
        className="
          flex flex-col md:flex-row
          items-center justify-center
          px-6 sm:px-10 md:px-14 lg:px-20
          mt-20 sm:mt-24 md:mt-32 lg:mt-40
          gap-10 sm:gap-14 md:gap-20 lg:gap-28
        "
      >
        {/* MASCOT */}
        <div className="flex justify-center md:w-1/2">
          <img
            src="/img/big-logo.gif"
            alt="Main GIF"
            className="
              w-48 sm:w-64 md:w-[200%] lg:w-[200%]
              max-w-[480px]
            "
          />
        </div>

        {/* TEXT + BUTTONS */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2">
          {/* TITLE */}
          <h1
            className="
              text-3xl sm:text-4xl md:text-[3rem] lg:text-[3.5rem]
              leading-snug
              text-[#020033]
              max-w-[40rem]
            "
          >
            The fun, friendly way to speak
            <br />
            with your hands!
          </h1>

          {/* BUTTONS */}
          <div
            className="
              flex flex-col gap-4
              mt-8
              w-[260px] sm:w-[300px] md:w-[340px] lg:w-[400px]
            "
          >
            <Link
              to="/signup"
              className="
                bg-[#0a0035] text-white 
                text-base sm:text-lg font-bold 
                h-14 sm:h-16 rounded-xl shadow-lg 
                hover:bg-[#1a1a66] transition
                flex items-center justify-center
              "
            >
              GET STARTED
            </Link>

            <Link
              to="/login"
              className="
                bg-[#d6d6ff] text-[#0a0035] 
                border border-[#8282ff]
                text-base sm:text-lg font-bold 
                h-14 sm:h-16 rounded-xl shadow-lg 
                hover:bg-[#c2c2ff] transition
                flex items-center justify-center
              "
            >
              I ALREADY HAVE AN ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
