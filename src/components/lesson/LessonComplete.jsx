import { useNavigate } from "react-router-dom";

export default function LessonComplete({ xp, gems }) {
    const navigate = useNavigate();

    return (
        <div className="text-center mt-20">

            <h2 className="text-4xl font-extrabold text-[#FFE4FB] drop-shadow mb-4">
                🎉 Lesson Complete!
            </h2>

            <p className="text-2xl mb-6 text-green-300 font-bold animate-pulse">
                +{xp} XP • +{gems} Gems
            </p>

            <button
                onClick={() => navigate("/homepage")}
                className="
                px-8 py-3 
                bg-gradient-to-r from-[#FFC400] to-[#FF6AA5] 
                text-[#2E1426] text-xl font-bold rounded-xl
                shadow-lg shadow-[#FF6AA5]/40
                hover:opacity-90 transition"
            >
                Go Home
            </button>
        </div>
    );
}
