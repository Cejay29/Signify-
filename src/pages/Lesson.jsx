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

  // Compute progress
  const progressPct = steps.length > 0 ? ((idx + 1) / steps.length) * 100 : 0;

  const next = () => setIdx((i) => i + 1);

  return (
    <div className="bg-[#1C1B2E] text-white font-sans min-h-screen">
      {/* HEADER */}
      <LessonHeader
        hearts={hearts}
        progressPct={progressPct}
        onExit={() => setShowExit(true)}
      />

      {/* BODY */}
      <div
        id="lesson-container-react"
        className="pt-28 md:pt-32 px-4 md:px-6 max-w-6xl mx-auto"
      >
        {loading && (
          <div className="text-center text-gray-300">Loading lesson…</div>
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

      {/* EXIT MODAL */}
      {showExit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#24243A] rounded-xl p-6 w-80 text-center">
            <h2 className="text-xl font-bold mb-4 text-white">Exit Lesson?</h2>
            <p className="mb-6 text-gray-300 text-sm">
              Your progress may not be saved.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowExit(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={() => navigate("/homepage")}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
