export default function LetterCard({ value, onClick }) {
  return (
    <button
      className="
        letter-card 
        w-16 h-16 text-2xl          /* mobile */
        sm:w-20 sm:h-20 sm:text-3xl /* tablets */
        lg:w-20 lg:h-20 lg:text-3xl /* desktop */
        
        flex items-center justify-center
        bg-[#2A2A3C] border-2 border-[#C5CAFF] text-[#FFC400] rounded-xl 
        font-extrabold transition
        hover:bg-[#34344A] hover:border-[#FFD849] hover:-translate-y-1
        hover:shadow-[0_10px_20px_rgba(197,202,255,0.08)]
      "
      onClick={() => onClick?.(value)}
    >
      {value}
    </button>
  );
}
