import { useNavigate } from "react-router-dom";

export default function LessonComplete({ xp, gems }) {
    const navigate = useNavigate();

    return (
        <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-4">🎉 Lesson Complete!</h2>
            <p className="text-lg mb-4 text-green-400 font-semibold animate-pulse">
                +{xp} XP • +{gems} Gems
            </p>

            <button
                onClick={() => navigate("/homepage")}
                className="mt-4 px-6 py-3 bg-green-500 text-white text-lg rounded-lg hover:bg-green-600"
            >
                Go Home
            </button>
        </div>
    );
}
