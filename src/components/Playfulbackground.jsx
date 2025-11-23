import { Hand, Sparkles, Gamepad2, Wand2 } from "lucide-react";

export default function PlayfulBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white"
    >
      {/* Purple → Pink soft gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#450693]/20 via-[#8C00FF]/10 to-[#FF3F7F]/10" />

      {/* Glowing Blobs (SignUp theme colors) */}
      <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#8C00FF]/35 blur-3xl animate-float-slow" />
      <div className="absolute right-[-100px] top-24 h-72 w-72 rounded-full bg-[#FF3F7F]/30 blur-3xl animate-float-medium" />
      <div className="absolute left-1/2 bottom-[-140px] h-96 w-96 -translate-x-1/2 rounded-full bg-[#450693]/30 blur-3xl animate-float-slower" />

      {/* Subtle dotted grid */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#450693_1px,transparent_0)] bg-[length:34px_34px]" />
      </div>

      {/* Floating "fun chips" using Lucide icons */}
      <div className="absolute inset-0">
        <div className="animate-bob-slow absolute left-10 top-28">
          <Badge icon={<Hand size={16} />} label="ASL" />
        </div>

        <div className="animate-bob-medium absolute right-12 top-40">
          <Badge icon={<Gamepad2 size={16} />} label="Game-based" />
        </div>

        <div className="animate-bob-slower absolute left-16 bottom-40">
          <Badge icon={<Wand2 size={16} />} label="AI-powered" />
        </div>

        <div className="animate-bob-medium absolute right-8 bottom-20">
          <Badge icon={<Sparkles size={16} />} label="Friendly" />
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label }) {
  return (
    <div
      className="rounded-2xl border border-[#8C00FF]/30 
      bg-white/70 px-4 py-2 shadow-xl backdrop-blur-md text-[#450693]
      flex items-center gap-2 text-xs font-medium"
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
