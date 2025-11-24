export default function LetterCard({ value, onClick }) {
  return (
    <button
      onClick={() => onClick?.(value)}
      className="
        w-16 h-16 text-2xl
        sm:w-20 sm:h-20 sm:text-3xl
        flex items-center justify-center

        bg-[#3A2033] 
        border-2 border-[#B97DA6]/40 
        text-[#FFDDEE]
        
        rounded-xl font-extrabold
        transition-all duration-150

        hover:border-[#FFC400]
        hover:bg-[#4A2541]
        hover:shadow-[0_4px_12px_rgba(255,196,0,0.25)]
        active:scale-95
      "
    >
      {value}
    </button>
  );
}
