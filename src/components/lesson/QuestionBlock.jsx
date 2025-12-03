export default function QuestionBlock({
    questionData,
    setCorrectCount,
    next,
}) {
    const q = questionData;

    let choices = [];
    try {
        choices = typeof q.choices === "string" ? JSON.parse(q.choices) : q.choices;
    } catch {
        choices = q.choices || [];
    }

    const handlePick = (choice, btnEl) => {
        const correct = choice === q.answer;

        const buttons = btnEl.parentElement.querySelectorAll("button[data-choice]");
        buttons.forEach((b) => (b.disabled = true));

        buttons.forEach((b) => {
            const val = b.getAttribute("data-choice");

            if (val === q.answer) {
                b.classList.add("bg-green-500", "text-white");
            } else if (b === btnEl && !correct) {
                b.classList.add("bg-red-500", "text-white", "shake");
            }
        });

        if (correct) setCorrectCount((x) => x + 1);

        // Remove old Next button if exists
        const container = document.getElementById("lesson-container-react");
        const oldNext = container.querySelector(".next-btn-auto");
        if (oldNext) oldNext.remove();

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next →";
        nextBtn.className =
            "next-btn-auto mt-6 px-6 py-3 bg-gradient-to-r from-[#FFC400] to-[#FF6AA5] text-[#2E1426] font-bold rounded-full shadow-md hover:opacity-90 transition";
        nextBtn.onclick = next;

        container.appendChild(nextBtn);
    };

    return (
        <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-[#FFE4FB] drop-shadow">
                {q.question}
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {choices.map((c, i) => {
                    const isImg = typeof c === "string" && /^https?:\/\//.test(c);

                    return (
                        <button
                            key={i}
                            data-choice={String(c)}
                            className="
                            bg-white/10 backdrop-blur-xl 
                            border border-white/20 
                            rounded-xl p-4 transition 
                            hover:bg-[#FFC400] hover:text-[#2E1426]
                            shadow-md shadow-[#FF6AA5]/20"
                            onClick={(e) => handlePick(String(c), e.currentTarget)}
                        >
                            {isImg ? (
                                <img src={c} className="rounded-lg w-full h-40 object-contain" />
                            ) : (
                                <span className="text-lg">{String(c)}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ⭐ NEW: SKIP BUTTON */}
            <button
                className="
                mt-8 px-6 py-2 
                text-sm text-white/80 underline hover:text-white transition
                "
                onClick={next}
            >
                Skip →
            </button>
        </div>
    );
}
