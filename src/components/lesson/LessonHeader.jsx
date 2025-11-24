export default function LessonHeader({ hearts, progressPct, onExit }) {
    return (
        <div className="fixed top-0 left-0 w-full z-50">

            {/* Header Bar */}
            <div className="
                flex items-center justify-between 
                px-4 md:px-6 py-3 
                bg-[#2E1426]/70 backdrop-blur-xl 
                border-b border-white/20">

                <button
                    onClick={onExit}
                    className="text-sm text-red-300 hover:text-red-400 font-bold"
                >
                    ✖ Exit
                </button>

                <div className="flex items-center gap-2 text-[#FFE4FB] font-bold">
                    ❤️ <span>{hearts}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/10">
                <div
                    className="h-full bg-gradient-to-r from-[#FFC400] to-[#FF6AA5]
                    transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                />
            </div>

        </div>
    );
}
