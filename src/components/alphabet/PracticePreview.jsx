export default function PracticePreview({ target }) {
  const src = target
    ? `/img/signs/${String(target).toLowerCase()}.png`
    : "/img/signs/placeholder.png";

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-xl font-bold text-white drop-shadow mb-2">
        Target Sign
      </h3>

      <span className="
        text-xs font-bold uppercase tracking-wide
        px-3 py-1 rounded-full
        bg-white/20 text-white border border-white/30
        w-fit mb-2
      ">
        Sign:
      </span>

      <span className="text-4xl font-extrabold text-[#FFC400] drop-shadow mb-4">
        {target ?? "—"}
      </span>

      <div className="flex justify-center md:justify-start">
        <img
          src={src}
          alt={target ?? "preview"}
          className="
            w-44 h-44 sm:w-48 sm:h-48 md:w-56 md:h-56
            rounded-2xl
            border-2 border-[#FFC400]
            shadow-[0_0_25px_rgba(255,196,0,0.4)]
            bg-white/10 backdrop-blur
            object-contain
          "
        />
      </div>
    </div>
  );
}
