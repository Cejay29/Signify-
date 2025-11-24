export default function LetterCard({ value, onClick }) {
  return (
    <button
      onClick={() => onClick?.(value)}
      className="
        w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20
        flex items-center justify-center

        text-3xl font-extrabold text-white
        rounded-2xl

        bg-white/20 backdrop-blur-lg
        border border-white/40
        shadow-lg shadow-[#FF3F7F]/20

        transition-all duration-200
        hover:scale-110 hover:shadow-[#FFC400]/40 hover:border-[#FFC400]
        active:scale-95

        select-none
      "
    >
      {value}
    </button>
  );
}
