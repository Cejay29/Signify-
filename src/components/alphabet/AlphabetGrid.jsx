import LetterCard from "./LetterCard";

export default function AlphabetGrid({ items, onPick }) {
  return (
    <div
      className="
        grid
        grid-cols-4        /* mobile */
        sm:grid-cols-6     /* small screens */
        md:grid-cols-8     /* tablets */
        lg:grid-cols-10    /* desktops */
        gap-3 sm:gap-4     /* better spacing on small screens */
      "
    >
      {items.map((ch) => (
        <LetterCard key={ch} value={ch} onClick={onPick} />
      ))}
    </div>
  );
}
