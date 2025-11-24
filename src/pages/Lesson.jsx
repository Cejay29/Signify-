import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";

import useLesson from "../hooks/useLesson";

import LessonHeader from "../components/lesson/LessonHeader";
import GestureBlock from "../components/lesson/GestureBlock";
import QuestionBlock from "../components/lesson/QuestionBlock";
import LessonComplete from "../components/lesson/LessonComplete";

export default function Lesson() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const lessonId = searchParams.get("lesson_id");

  const {
    loading,
    current,
    steps,
    idx,
    setIdx,
    hearts,
    rewards,
    done,
    correctCount,
    setCorrectCount,
    gestureEngine,
  } = useLesson(lessonId);

  const [showExit, setShowExit] = useState(false);

  const progressPct = steps.length > 0 ? ((idx + 1) / steps.length) * 100 : 0;

  const next = () => setIdx((i) => i + 1);

  return (
    <div
      className="
      relative min-h-screen font-['Inter'] text-white overflow-hidden
      bg-gradient-to-br from-[#70385E] via-[#4A2541] to-[#2E1426]
    "
    >
      {/* Background Shapes */}
      <img
        src="/bg/upper-left.png"
        className="absolute top-[-120px] left-[-80px] w-64 opacity-35 pointer-events-none"
      />
      <img
        src="/bg/upper-right.png"
        className="absolute top-[-140px] right-[-60px] w-72 opacity-40 pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute top-[18%] left-[8%] w-64 opacity-20 rotate-[10deg] pointer-events-none"
      />
      <img
        src="/bg/shape-center.png"
        className="absolute bottom-[20%] right-[12%] w-64 opacity-15 rotate-[-20deg] pointer-events-none"
      />

      {/* LESSON HEADER */}
      <LessonHeader
        hearts={hearts}
        progressPct={progressPct}
        onExit={() => setShowExit(true)}
      />

      {/* MAIN LESSON BODY */}
      <div
        id="lesson-container-react"
        className="pt-28 md:pt-32 px-4 md:px-6 max-w-6xl mx-auto relative z-20"
      >
        {loading && (
          <div className="text-center text-white/70 text-lg">
            Loading lesson…
          </div>
        )}

        {!loading && !done && current && (
          <>
            {(current.type === "sign" || current.data?.type === "gesture") && (
              <GestureBlock
                data={current.data}
                isSign={current.type === "sign"}
                videoRef={gestureEngine.videoRef}
                startGesture={gestureEngine.startGesture}
                setCorrectCount={setCorrectCount}
                next={next}
              />
            )}

            {current.type === "question" &&
              current.data?.type !== "gesture" && (
                <QuestionBlock
                  questionData={current.data}
                  setCorrectCount={setCorrectCount}
                  next={next}
                />
              )}
          </>
        )}

        {!loading && done && (
          <LessonComplete xp={rewards.xp} gems={rewards.gems} />
        )}
      </div>

      {/* EXIT CONFIRMATION MODAL */}
      {showExit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="
            bg-white/10 backdrop-blur-xl border border-white/20 
            p-6 rounded-2xl w-80 shadow-xl
          "
          >
            <h2 className="text-xl font-bold text-[#FFE4FB] mb-3">
              Exit Lesson?
            </h2>

            <p className="text-white/70 text-sm mb-6">
              Your progress for this lesson may not be saved.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowExit(false)}
                className="
                px-4 py-2 rounded-lg bg-white/10 border border-white/20
                text-white hover:bg-white/20 transition
              "
              >
                Cancel
              </button>

              <button
                onClick={() => navigate('/homepage')}
                className="
                px-4 py-2 rounded-lg 
                bg-gradient-to-r from-[#FF6AA5] to-[#FFC400]
                text-[#2E1426] font-bold shadow-lg hover:opacity-90 transition
              "
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes flash-green { 
            0%{background-color:transparent} 
            50%{background-color:#32CD32} 
            100%{background-color:transparent} 
          }

          @keyframes flash-red { 
            0%{background-color:transparent} 
            50%{background-color:#FF4D4F} 
            100%{background-color:transparent} 
          }

          @keyframes shake { 
            0%,100%{transform:translateX(0)} 
            25%{transform:translateX(-6px)} 
            75%{transform:translateX(6px)} 
          }

          .flash-green{ animation:flash-green .6s ease-in-out }
          .flash-red{ animation:flash-red .6s ease-in-out }
          .shake{ animation:shake .4s ease-in-out }
        `}
      </style>
    </div>
  );
}
