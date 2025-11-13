export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center 
                    bg-white/95 backdrop-blur-sm z-[9999] transition-opacity 
                    duration-500 animate-fadeIn">

            {/* Mascot Animation */}
            <img
                src="../img/big-logo.gif"
                alt="Loading mascot"
                className="w-40 h-40 mb-6 animate-bounce-slow"
            />

            {/* Soft Glow Text */}
            <p className="text-[#0c0731] text-lg font-semibold tracking-wide animate-pulse">
                Loading your experience…
            </p>
        </div>
    );
}
