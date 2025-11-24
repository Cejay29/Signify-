export default function PracticePreview({ target }) {
  const src = target
    ? `/img/signs/${String(target).toLowerCase()}.png`
    : "/img/signs/placeholder.png";

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-lg font-bold text-[#FFDDEE] mb-2">
        Target
      </h3>

      <span className="
        text-xs font-semibold px-3 py-1 rounded-full
        bg-white/10 border border-white/20 text-white mb-1
      ">
        Sign:
      </span>

      <span className="text-3xl font-extrabold text-[#FFC400] mb-3">
        {target ?? "—"}
      </span>

      <div className="w-full flex justify-center md:justify-start">
        <img
          src={src}
          alt={target ?? "preview"}
          className="
            w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52 xl:w-56 xl:h-56
            object-contain rounded-xl
            border-2 border-[#FFC400]
            bg-[#3A2033]
            shadow-lg shadow-[rgba(0,0,0,0.3)]
            transition
          "
        />
      </div>
    </div>
  );
}
