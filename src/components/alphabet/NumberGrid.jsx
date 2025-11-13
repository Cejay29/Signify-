import LetterCard from "./LetterCard";

export default function NumberGrid({ items, onPick }) {
  return (
    <div
      className="
        grid 
        grid-cols-5           /* mobile */
        sm:grid-cols-6        /* small tablets */
        md:grid-cols-8        /* tablets */
        lg:grid-cols-10       /* desktop */
        gap-4
      "
    >
      {items.map((n) => (
        <LetterCard key={n} value={n} onClick={onPick} />
      ))}
    </div>
  );
}
