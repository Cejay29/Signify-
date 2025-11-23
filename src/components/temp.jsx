export default function PlayfulBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Purple → Pink soft gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#450693]/20 via-[#8C00FF]/10 to-[#FF3F7F]/10" />

      {/* Glowing Blobs (SignUp theme colors) */}
      <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#8C00FF]/35 blur-3xl animate-float-slow" />
      <div className="absolute right-[-100px] top-24 h-72 w-72 rounded-full bg-[#FF3F7F]/30 blur-3xl animate-float-medium" />
      <div className="absolute left-1/2 bottom-[-140px] h-96 w-96 -translate-x-1/2 rounded-full bg-[#450693]/30 blur-3xl animate-float-slower" />

      {/* Floating Bubbles (kid-friendly) */}
      <Bubble className="top-10 left-12 h-10 w-10 bg-[#8C00FF]/25 animate-bubble-slow" />
      <Bubble className="top-1/3 left-1/4 h-16 w-16 bg-[#FF3F7F]/20 animate-bubble-medium" />
      <Bubble className="top-1/2 right-10 h-12 w-12 bg-[#450693]/25 animate-bubble-slower" />
      <Bubble className="bottom-20 left-10 h-14 w-14 bg-[#8C00FF]/20 animate-bubble-medium" />
      <Bubble className="bottom-10 right-16 h-8 w-8 bg-[#FF3F7F]/25 animate-bubble-slow" />
      <Bubble className="top-1/4 right-1/3 h-20 w-20 bg-[#8C00FF]/15 animate-bubble-slower" />

      {/* Soft twinkling sparkle */}
      <div className="absolute top-1/3 left-1/2 animate-twinkle pointer-events-none">
        <div className="h-10 w-10 bg-[#FFC400]/40 rounded-full blur-xl"></div>
      </div>

      {/* Subtle dotted grid */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#450693_1px,transparent_0)] bg-[length:34px_34px]" />
      </div>
    </div>
  );
}

function Bubble({ className }) {
  return (
    <div className={`absolute rounded-full blur-xl opacity-70 ${className}`} />
  );
}
