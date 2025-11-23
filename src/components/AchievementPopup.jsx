export default function AchievementPopup({ visible, title, rarity }) {
    if (!visible) return null;

    const rarityColors = {
        common: "text-gray-200",
        rare: "text-blue-400",
        epic: "text-purple-400",
        legendary: "text-yellow-400",
    };

    const borderColors = {
        common: "border-gray-600",
        rare: "border-blue-400",
        epic: "border-purple-500",
        legendary: "border-yellow-400",
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] animate-fadeSlide">
            <div
                className={`
          bg-[#1F1F34] px-6 py-4 rounded-2xl shadow-2xl border
          ${borderColors[rarity] || "border-gray-600"}
          flex items-center gap-4
        `}
            >
                <i className="lucide lucide-trophy w-8 h-8 text-[#FFC400]" />
                <div>
                    <p className="font-bold text-white text-lg">Achievement Unlocked!</p>
                    <p className={`text-sm ${rarityColors[rarity] || "text-gray-300"}`}>
                        {title}
                    </p>
                </div>
            </div>
        </div>
    );
}
