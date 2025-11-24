import LetterCard from "./LetterCard";

export default function NumberGrid({ items, onPick }) {
  return (
    <div
      className="
        grid
        grid-cols-5
        sm:grid-cols-6
        md:grid-cols-8
        lg:grid-cols-10
        gap-3 sm:gap-4
      "
    >
      {items.map((num) => (
        <LetterCard key={num} value={num} onClick={onPick} />
      ))}
    </div>
  );
}
