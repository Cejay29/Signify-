export default function PracticePreview({ target }) {
  // image folder should be: /public/img/signs/a.png etc.
  const src = target
    ? `/img/signs/${String(target).toLowerCase()}.png`
    : "/img/signs/placeholder.png";

  return (
    <div className="flex flex-col items-start md:items-start w-full">
      <h3 className="text-lg font-bold text-[#C5CAFF] mb-2">Target</h3>

      <span className="pill mb-1 border border-[#C5CAFF] bg-[#2A2A3C] text-[#C5CAFF] rounded-full px-2 py-0.5 text-xs font-bold">
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
            w-40 h-40 
            sm:w-44 sm:h-44 
            md:w-48 md:h-48 
            lg:w-52 lg:h-52
            xl:w-56 xl:h-56
            border-2 border-[#FFC400] 
            rounded-xl 
            object-contain 
            bg-[#1F1F34]
            transition-all
          "
        />
      </div>
    </div>
  );
}
