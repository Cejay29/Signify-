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

                document.getElementById(
                    "gesture-feedback"
                ).innerHTML = `<div class="text-green-400 font-bold text-xl">✅ Correct!</div>`;

                btn.textContent = "Continue";
                btn.disabled = false;

                btn.onclick = () => {
                    setCorrectCount((x) => x + 1);
                    next();
                };
            } else {
                video.classList.add("flash-red", "shake");
                setTimeout(() => video.classList.remove("flash-red", "shake"), 600);

                document.getElementById(
                    "gesture-feedback"
                ).innerHTML = `<div class="text-red-400 font-bold text-xl">❌ Try Again</div>`;

                btn.textContent = "Try Again";
                btn.disabled = false;
            }
        });
    };

    const isYT = (data.video_url || "").includes("youtu");

    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
            {/* LEFT */}
            <div className="w-full md:w-1/2 bg-[#24243A] p-5 md:p-6 rounded-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-[#FFC400] mb-4">
                    {isSign ? `Learn: ${data.word}` : data.question}
                </h2>

                {isSign && (
                    <>
                        {isYT ? (
                            <iframe
                                className="w-full rounded mb-4 aspect-video"
                                src={`https://www.youtube.com/embed/${ytId(data.video_url)}`}
                            />
                        ) : (
                            <video
                                src={data.video_url}
                                controls
                                className="w-full rounded mb-4 max-h-64"
                            />
                        )}
                        <p className="text-sm md:text-base">{data.description}</p>
                    </>
                )}
            </div>

            {/* RIGHT */}
            <div className="w-full md:w-1/2 text-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="rounded-xl border border-gray-500 w-full aspect-video bg-black"
                />

                <div id="gesture-feedback" className="mt-3 text-lg font-semibold"></div>

                <button
                    className="mt-4 px-6 py-3 bg-[#FFC400] text-black font-bold rounded-full"
                    onClick={(e) => tryGesture(e.currentTarget)}
                >
                    Try Gesture
                </button>
            </div>
        </div>
    );
}
