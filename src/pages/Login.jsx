import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  // ✅ AUTO-CREATE USER PROFILE AFTER LOGIN (SAFE FOR RLS)
  // ---------------------------------------------------
  async function ensureUserProfile(user) {
    if (!user) return;

    const { id, email, user_metadata } = user;

    // Check if profile exists
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      console.log("User profile already exists");
      return;
    }

    // Insert new profile
    const { error: insertError } = await supabase.from("users").insert({
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
      last_active: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Failed to auto-create profile:", insertError);
    } else {
      console.log("Profile created!");
    }
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

    // Require email verification
    if (!data.user.email_confirmed_at) {
      setLoading(false);
      return showToastMsg("Please verify your email first.");
    }

    // 🔥 Auto-create missing row in "users"
    await ensureUserProfile(data.user);

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
  // UI + DESIGN (unchanged)
  // ---------------------------------------------------
  return (
    <div className="bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/bg/upper-left.png"
          className="absolute top-[-100px] left-[-80px] w-72 sm:w-80 md:w-[420px] opacity-80"
        />
        <img
          src="/bg/upper-right.png"
          className="absolute top-[-120px] right-[-80px] w-80 sm:w-[420px] md:w-[480px] opacity-80"
        />
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-[-150px] left-[-80px] w-80 sm:w-[450px] md:w-[520px] opacity-60"
        />
        <img
          src="/bg/lower-right.png"
          className="absolute bottom-[-160px] right-[-80px] w-80 sm:w-[450px] md:w-[520px] opacity-40"
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

      {/* Close Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 text-[#FFC400] text-3xl z-50 hover:text-[#FF3F7F] transition"
      >
        ✕
      </button>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md px-6">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-2 border-[#FFC400] relative">
          {/* Mascot Glow */}
          <div className="absolute -top-12 -right-10 h-36 w-36 bg-[#FF3F7F]/20 rounded-full blur-3xl" />

          {/* Mascot */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#FFC400]/50 blur-xl rounded-full opacity-70"></div>
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
              <Mail
                className="absolute top-1/2 -translate-y-1/2 left-3 text-[#8C00FF]"
                size={18}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full p-3 pl-10 rounded-xl border bg-[#F9F5FF] focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                className="absolute top-1/2 -translate-y-1/2 left-3 text-[#8C00FF]"
                size={18}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                className="w-full p-3 pl-10 pr-12 rounded-xl border bg-[#F9F5FF] focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C00FF]"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Forgot password */}
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#8C00FF] hover:text-[#FF3F7F] text-right underline"
            >
              Forgot Password?
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`py-3 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F] hover:opacity-90"
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

            <div className="text-center mt-2 text-sm">
              <span className="text-[#450693]">New here?</span>{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-[#8C00FF] hover:text-[#FF3F7F] underline"
              >
                Create an account
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl w-full max-w-sm border-2 border-[#FFC400] shadow-xl">
            <h3 className="text-xl font-bold text-[#8C00FF] mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-[#450693]/80 mb-4">
              Enter your email to receive a reset link.
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input
                type="email"
                name="resetEmail"
                placeholder="Your email"
                required
                className="p-3 rounded-xl border bg-[#F9F5FF] focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-[#450693] rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F] text-white rounded-lg shadow-md"
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
