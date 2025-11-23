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
      showToastMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data.user.email_confirmed_at) {
      showToastMsg("Please verify your email first.");
      setLoading(false);
      return;
    }

    const userId = data.user.id;
    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", userId)
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
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) return showToastMsg(error.message);
    showToastMsg("Reset link sent!", "bg-green-600");
    setForgotOpen(false);
  }

  return (
    <div className="bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      {/* Background shapes */}
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* TOP LEFT — BIGGER */}
        <img
          src="/bg/shape-top-left.png"
          className="absolute top-[-40px] left-[-30px] 
    w-56 sm:w-72 md:w-96 opacity-90 rotate-[18deg]"
        />

        {/* TOP RIGHT — BIGGER */}
        <img
          src="/bg/shape-top-right.png"
          className="absolute top-[-30px] right-[-20px] 
    w-56 sm:w-72 md:w-96 opacity-90 rotate-[-12deg]"
        />

        {/* BOTTOM LEFT — BIGGER */}
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-[-40px] left-[-20px] 
    w-60 sm:w-80 md:w-[420px] opacity-70 rotate-[15deg]"
        />

        {/* BOTTOM RIGHT — BIGGER */}
        <img
          src="/bg/shape-bottom-kanan.png"
          className="absolute bottom-[-20px] right-[-20px] 
    w-52 sm:w-72 md:w-96 opacity-50 rotate-[-10deg]"
        />

        {/* CENTER-LEFT BIG SHAPE */}
        <img
          src="/bg/shape-center.png"
          className="absolute top-[22%] left-[10%] 
    w-56 sm:w-72 md:w-96 opacity-45 rotate-[25deg]"
        />

        {/* CENTER-RIGHT BIG SHAPE */}
        <img
          src="/bg/shape-center.png"
          className="absolute top-[50%] right-[8%] 
    w-64 sm:w-80 md:w-[420px] opacity-40 rotate-[-15deg]"
        />

        {/* DIRECT CENTER FILL — LARGE SOFT SHAPE */}
        <img
          src="/bg/shape-center.png"
          className="absolute top-[40%] left-[42%] 
    w-48 sm:w-64 md:w-80 opacity-30 rotate-[30deg]"
        />

        {/* EXTRA SMALL FLOATING SHAPES — BIGGER & SCATTERED */}
        <img
          src="/bg/shape-small.png"
          className="absolute top-[30%] left-[45%] 
    w-24 sm:w-32 opacity-35 rotate-[22deg]"
        />

        <img
          src="/bg/shape-small.png"
          className="absolute top-[60%] left-[52%] 
    w-20 sm:w-28 opacity-30 rotate-[-20deg]"
        />

        <img
          src="/bg/shape-small.png"
          className="absolute top-[38%] right-[32%] 
    w-20 sm:w-28 opacity-35 rotate-[12deg]"
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
          <div className="pointer-events-none absolute -top-12 -right-10 h-36 w-36 bg-[#FF3F7F]/20 rounded-full blur-3xl" />

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

          {/* Form */}
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

            {/* Forgot Password */}
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
              className={`py-3 rounded-xl text-white font-semibold shadow-lg transition flex items-center justify-center gap-2 ${
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
                className="p-3 rounded-xl border bg-[#F9F5FF] focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
                required
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
