import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Mail,
  Lock,
  PartyPopper,
  Hand,
  MessageCircle,
  Loader2,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    gender: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [toast, setToast] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [pw2Visible, setPw2Visible] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToastMsg = (msg, color = "bg-red-500") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 2000);
  };

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Password Rules
  const rules = useMemo(() => {
    const p = form.password;
    return {
      length: p.length >= 8,
      lower: /[a-z]/.test(p),
      upper: /[A-Z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }, [form.password]);

  const allRulesPassed = Object.values(rules).every(Boolean);

  const canSubmit =
    form.firstName &&
    form.gender &&
    form.email &&
    allRulesPassed &&
    form.password === form.confirm;

  async function handleSignup(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);

    console.log("Attempting signup with:", form);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          birthday: form.birthday,
          gender: form.gender,
        },
      },
    });

    console.log("AUTH RESULT:", data, error);

    if (error) {
      setLoading(false);
      return showToastMsg(error.message);
    }

    const user = data.user;

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      username: form.firstName,
      email: form.email,
      birthday: form.birthday,
      gender: form.gender,
    });

    if (insertError) {
      setLoading(false);
      return showToastMsg(insertError.message);
    }

    showToastMsg(
      <span className="flex items-center gap-2">
        Signup successful! <PartyPopper size={16} />
      </span>,
      "bg-green-600"
    );

    setTimeout(() => navigate("/login"), 1500);
  }

  return (
    <div className="bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/bg/upper-left.png"
          className="absolute top--20 left-0 w-32 sm:w-40 md:w-56 lg:w-72 xl:w-80"
        />
        <img
          src="/bg/upper-right.png"
          className="absolute top-20 right-0 w-48 sm:w-60 md:w-80 lg:w-[380px] xl:w-[420px]"
        />
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-0 left-0 w-40 sm:w-56 md:w-72 lg:w-96 opacity-70"
        />
        <img
          src="/bg/lower-right.png"
          className="absolute bottom-0 right-0 w-48 sm:w-72 md:w-96 lg:w-[420px] xl:w-[480px] opacity-30"
        />
        <img
          src="/bg/shape-center.png"
          className="absolute top-[150px] left-[25%] w-60 sm:w-72 md:w-[360px] lg:w-[480px] xl:w-[520px] rotate-[-8deg] opacity-70"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-xl text-white ${toast.color} z-50 text-sm`}
        >
          {toast.msg}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 text-[#FFC400] text-3xl z-50 hover:text-[#FF3F7F] transition"
      >
        ✕
      </button>

      {/* Card */}
      <div className="z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl px-4 py-6 sm:py-8 mx-auto">
        <div className="bg-white/95 backdrop-blur-sm text-black p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-[#FFC400] relative overflow-hidden">
          {/* soft glow behind mascot */}
          <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#FF3F7F]/15 blur-3xl" />

          {/* Header with mascot */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-[#FFC400]/50 blur-xl opacity-70" />
              <div className="relative bg-white rounded-full p-2 shadow-md">
                <img
                  src="/img/big-logo.gif"
                  alt="Signify mascot"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs tracking-[0.25em] uppercase text-[#FF3F7F] font-semibold">
                Welcome to Signify
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#8C00FF] mt-1">
                Let&apos;s create your account!
              </h1>
              <p className="text-xs sm:text-sm text-[#450693]/80 mt-1">
                Join a playful world where your hands do the talking.
                <span className="inline-flex items-center gap-1 ml-2 text-[#8C00FF]">
                  <Hand size={16} /> <MessageCircle size={16} />
                </span>
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4 mt-3">
            {/* First & Last Name */}
            <div>
              <label className="text-sm font-semibold text-[#450693] flex items-center gap-1">
                Your name
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  name="firstName"
                  placeholder="First name"
                  required
                  onChange={update}
                  className="p-3 border rounded-2xl w-1/2 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                />
                <input
                  name="lastName"
                  placeholder="Last name"
                  required
                  onChange={update}
                  className="p-3 border rounded-2xl w-1/2 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                />
              </div>
            </div>

            {/* Birthday & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#450693]">
                  Birthday
                </label>
                <input
                  type="date"
                  name="birthday"
                  required
                  onChange={update}
                  className="p-3 border rounded-2xl w-full mt-1 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#450693]">
                  Gender
                </label>
                <select
                  name="gender"
                  required
                  onChange={update}
                  className="p-3 border rounded-2xl w-full mt-1 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-[#450693]">
                Email
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C00FF]">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  onChange={update}
                  className="p-3 pl-10 border rounded-2xl w-full bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-[#450693]">
                Password
              </label>

              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C00FF]">
                  <Lock size={18} />
                </span>
                <input
                  type={pwVisible ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  required
                  onChange={update}
                  className="p-3 pl-10 border rounded-2xl w-full pr-12 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm"
                />

                <button
                  type="button"
                  onClick={() => setPwVisible(!pwVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C00FF]"
                >
                  {pwVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Rules */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs sm:text-sm">
                {[
                  ["length", "At least 8 characters"],
                  ["lower", "1 lowercase letter"],
                  ["upper", "1 uppercase letter"],
                  ["number", "1 number"],
                  ["special", "1 special character"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {rules[key] ? (
                      <Check className="text-green-600" size={16} />
                    ) : (
                      <X className="text-gray-400" size={16} />
                    )}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold text-[#450693]">
                Confirm Password
              </label>

              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C00FF]">
                  <Lock size={18} />
                </span>
                <input
                  type={pw2Visible ? "text" : "password"}
                  name="confirm"
                  placeholder="Type it again"
                  required
                  onChange={update}
                  className={`p-3 pl-10 border rounded-2xl w-full pr-12 bg-[#F9F5FF] focus:bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition text-sm ${
                    form.confirm
                      ? form.confirm === form.password
                        ? "border-green-600"
                        : "border-red-600"
                      : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setPw2Visible(!pw2Visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C00FF]"
                >
                  {pw2Visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-600 mt-1">
                  Oops! Those don&apos;t match yet.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`mt-3 py-3 rounded-2xl font-semibold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                !canSubmit || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F] hover:opacity-95 hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating account...
                </>
              ) : (
                "Start signing with Signify"
              )}
            </button>

            <Link
              to="/login"
              className="text-center text-[#8C00FF] text-sm hover:text-[#FF3F7F] hover:underline mt-2 transition"
            >
              Already have an account? Log in
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
