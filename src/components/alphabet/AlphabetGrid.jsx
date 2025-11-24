import LetterCard from "./LetterCard";

export default function AlphabetGrid({ items, onPick }) {
  return (
    <div
      className="
        grid
        grid-cols-4
        sm:grid-cols-6
        md:grid-cols-8
        lg:grid-cols-10
        gap-4 sm:gap-5

        mt-4

        /* fun breathing animation */
        animate-[fadeIn_0.6s_ease-out]
      "
    >
      {items.map((ch) => (
        <LetterCard key={ch} value={ch} onClick={onPick} />
      ))}
    </div>
  );
}
