import { ytId } from "../../utils/libLoader";

export default function GestureBlock({
    data,
    isSign,
    videoRef,
    startGesture,
    setCorrectCount,
    next,
}) {
    const expectedGloss = isSign ? data.gloss : data.answer;

    const tryGesture = (btn) => {
        btn.disabled = true;
        btn.textContent = "Analyzing…";

        startGesture(expectedGloss, (ok) => {
            const video = videoRef.current;

            if (ok) {
                video.classList.add("flash-green");
                setTimeout(() => video.classList.remove("flash-green"), 600);

                document.getElementById("gesture-feedback").innerHTML =
                    `<div class="text-green-300 font-bold text-xl">✨ Correct!</div>`;

                btn.textContent = "Continue";
                btn.disabled = false;

                btn.onclick = () => {
                    setCorrectCount((x) => x + 1);
                    next();
                };
            } else {
                video.classList.add("flash-red", "shake");
                setTimeout(() => video.classList.remove("flash-red", "shake"), 600);

                document.getElementById("gesture-feedback").innerHTML =
                    `<div class="text-red-300 font-bold text-xl">❌ Try Again</div>`;

                btn.textContent = "Try Again";
                btn.disabled = false;
            }
        });
    };

    const isYT = (data.video_url || "").includes("youtu");

    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">

            {/* LEFT PANEL */}
            <div className="w-full md:w-1/2 
                bg-white/10 backdrop-blur-xl 
                border border-white/20 
                p-6 rounded-2xl shadow-lg shadow-[#FF6AA5]/30">

                <h2 className="text-3xl font-bold text-[#FFC400] mb-4">
                    {isSign ? `Learn: ${data.word}` : data.question}
                </h2>

                {isSign && (
                    <>
                        {isYT ? (
                            <iframe
                                className="w-full rounded-xl mb-4 aspect-video border border-white/20"
                                src={`https://www.youtube.com/embed/${ytId(data.video_url)}`}
                            />
                        ) : (
                            <video
                                src={data.video_url}
                                controls
                                className="w-full rounded-xl mb-4 max-h-64 border border-white/20"
                            />
                        )}
                        <p className="text-white/80 text-sm">{data.description}</p>
                    </>
                )}
            </div>

            {/* RIGHT: CAMERA */}
            <div className="w-full md:w-1/2 text-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="rounded-2xl border-2 border-[#FFC400]/40 
                    bg-black w-full aspect-video shadow-lg"
                />

                <div id="gesture-feedback" className="mt-4 text-lg font-semibold"></div>

                <button
                    className="
                    mt-5 px-6 py-3 
                    bg-gradient-to-r from-[#FFC400] to-[#FF6AA5] 
                    text-[#2E1426] font-bold rounded-full 
                    shadow-lg shadow-[#FF6AA5]/40 
                    hover:opacity-90 transition"
                    onClick={(e) => tryGesture(e.currentTarget)}
                >
                    Try Gesture
                </button>
            </div>
        </div>
    );
}
