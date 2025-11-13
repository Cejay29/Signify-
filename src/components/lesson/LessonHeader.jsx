export default function LessonHeader({ hearts, progressPct, onExit }) {
    return (
        <div className="fixed top-0 left-0 w-full z-50">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#14142B] border-b border-[#2a2a3c]">
                <button
                    onClick={onExit}
                    className="text-sm text-red-400 hover:text-red-600 font-medium"
                >
                    ✖ Exit
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-400">❤️</span>
                    <span>{hearts}</span>
                </div>
            </div>

            <div className="h-2 bg-gray-700">
                <div
                    className="h-full bg-[#FFC400] transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                />
            </div>
        </div>
    );
}
