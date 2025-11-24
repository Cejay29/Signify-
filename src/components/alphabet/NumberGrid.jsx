import LetterCard from "./LetterCard";

export default function NumberGrid({ items, onPick }) {
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
        animate-[fadeIn_0.6s_ease-out]
      "
    >
      {items.map((n) => (
        <LetterCard key={n} value={n} onClick={onPick} />
      ))}
    </div>
  );
}
