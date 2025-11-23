import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Hand,
  MessageCircle,
  Loader2,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToastMsg = (msg, color = "bg-red-500") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 2000);
  };

  // ---------------------------------------------------
  // ✅ AUTO-CREATE USER PROFILE WHEN FIRST LOGGING IN
  // ---------------------------------------------------
  async function ensureUserProfile(user) {
    if (!user) return;

    const { id, email, user_metadata } = user;

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) return;

    await supabase.from("users").insert({
      id,
      username: user_metadata?.firstName || "",
      email,
      birthday: user_metadata?.birthday || null,
      gender: user_metadata?.gender || null,
      xp: 0,
      gems: 0,
      level: 1,
      hearts: 5,
      streak: 0,
      last_active: null,
    });
  }

  // ---------------------------------------------------
  // ⭐ NEW — STREAK SYSTEM
  // ---------------------------------------------------
  async function updateStreak(userId) {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("users")
      .select("streak, last_active")
      .eq("id", userId)
      .maybeSingle();

    if (!data || error) return;

    const last = data.last_active;
    let newStreak = data.streak ?? 0;

    if (!last) {
      newStreak = 1; // FIRST LOGIN EVER
    } else {
      const lastD = new Date(last);
      const todayD = new Date(today);
      const diff = (todayD - lastD) / (1000 * 60 * 60 * 24);

      if (diff === 1) newStreak += 1; // consecutive day
      else if (diff > 1) newStreak = 1; // reset
    }

    await supabase
      .from("users")
      .update({
        streak: newStreak,
        last_active: today,
      })
      .eq("id", userId);
  }

  // ---------------------------------------------------
  // LOGIN HANDLER
  // ---------------------------------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return showToastMsg(error.message);
    }

    if (!data.user.email_confirmed_at) {
      setLoading(false);
      return showToastMsg("Please verify your email first.");
    }

    // 🔥 Ensure profile row exists
    await ensureUserProfile(data.user);

    await supabase.rpc("init_user_progress", {
      new_user_id: data.user.id,
    });

    // 🔥 Update streak
    await updateStreak(data.user.id);

    // Check if admin
    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    showToastMsg("Login successful!", "bg-green-600");

    setTimeout(() => {
      if (adminData) navigate("/admin");
      else navigate("/homepage");
    }, 800);
  }

  // ---------------------------------------------------
  // PASSWORD RESET
  // ---------------------------------------------------
  async function handleReset(e) {
    e.preventDefault();
    const email = e.target.resetEmail.value.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        process.env.NODE_ENV === "production"
          ? "https://signify-bxkli1xnr-cejay29s-projects.vercel.app/update-password"
          : "http://localhost:5173/update-password",
    });

    if (error) return showToastMsg(error.message);

    showToastMsg("Reset link sent!", "bg-green-600");
    setForgotOpen(false);
  }

  // ---------------------------------------------------
  // UI ONLY (unchanged)
  // ---------------------------------------------------
  return (
    <div className="bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/bg/upper-left.png"
          className="absolute top-[-100px] left-[-80px] w-72 opacity-80"
        />
        <img
          src="/bg/upper-right.png"
          className="absolute top-[-120px] right-[-80px] w-80 opacity-80"
        />
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-[-150px] left-[-80px] w-80 opacity-60"
        />
        <img
          src="/bg/lower-right.png"
          className="absolute bottom-[-160px] right-[-80px] w-80 opacity-40"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-xl text-white ${toast.color} z-50`}
        >
          {toast.msg}
        </div>
      )}

      {/* Close */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 text-[#FFC400] text-3xl z-50 hover:text-[#FF3F7F] transition"
      >
        ✕
      </button>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md px-6">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-2 border-[#FFC400] relative">
          {/* Glow */}
          <div className="absolute -top-12 -right-10 h-36 w-36 bg-[#FF3F7F]/20 rounded-full blur-3xl" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#FFC400]/50 blur-xl rounded-full opacity-70" />
              <div className="relative bg-white rounded-full p-2 shadow-md">
                <img src="/img/big-logo.gif" className="w-14 h-14" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-[#8C00FF] mt-3">
              Welcome Back!
            </h2>
            <p className="text-sm text-[#450693]/80 flex items-center gap-1 mt-1">
              It's time to start signing again!
              <Hand size={16} className="text-[#8C00FF]" />
              <MessageCircle size={16} className="text-[#8C00FF]" />
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C00FF]">
                <Mail size={18} />
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                className="
        w-full px-4 py-3 pl-12 
        rounded-2xl border border-[#d7c9ff]
        shadow-inner 
        focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40
        outline-none transition
      "
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C00FF]">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Password"
                className="
        w-full px-4 py-3 pl-12 pr-12
        rounded-2xl border border-[#d7c9ff]
        shadow-inner
        focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40
        outline-none transition
      "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "#8C00FF" }} // password toggle color
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Forgot Password */}
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#8C00FF] underline text-right"
            >
              Forgot Password?
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`py-3 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>

            <div className="text-center text-sm mt-2">
              <span className="text-[#450693]">New here?</span>{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-[#8C00FF] underline"
              >
                Create an account
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white/95 p-6 rounded-xl border-2 border-[#FFC400] shadow-xl">
            <h3 className="text-xl font-bold text-[#8C00FF] mb-2">
              Reset Password
            </h3>
            <p className="text-[#450693]/80 mb-4 text-sm">
              Enter your email to receive a reset link.
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input
                type="email"
                name="resetEmail"
                className="p-3 rounded-xl border bg-[#F9F5FF]"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F] text-white rounded-lg"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
