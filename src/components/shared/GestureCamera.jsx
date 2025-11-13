// src/components/shared/GestureCamera.jsx
export default function GestureCamera({ videoRef, onStart }) {
    return (
        <div className="flex flex-col items-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="rounded-xl border w-[480px] bg-black"
            />

            <button
                onClick={onStart}
                className="mt-4 bg-[#27E1C1] text-black font-bold px-4 py-2 rounded-xl"
            >
                Start Detection
            </button>
        </div>
    );
}
