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
        gap-3 sm:gap-4
      "
    >
      {items.map((ch) => (
        <LetterCard key={ch} value={ch} onClick={onPick} />
      ))}
    </div>
  );
}
