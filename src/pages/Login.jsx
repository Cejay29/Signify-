import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const showToastMsg = (msg, color = "bg-red-500") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 2000);
  };

  async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    console.log("🔍 Login Attempt:", { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToastMsg(error.message);
      return;
    }

    if (!data.user.email_confirmed_at) {
      showToastMsg("Please verify your email first.");
      return;
    }

    const userId = data.user.id;

    // Check admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle(); // 👉 does NOT throw error if no row

    if (adminError) {
      console.error("Admin check error:", adminError);
    }

    // If admin exists → redirect to /admin
    if (adminData) {
      console.log("🟦 Admin detected → Redirecting to /admin");
      showToastMsg("Login successful!", "bg-green-600");
      setTimeout(() => navigate("/admin"), 800);
      return;
    }

    // If not admin → normal user
    console.log("🟩 Normal user → Redirecting to /homepage");
    showToastMsg("Login successful!", "bg-green-600");
    setTimeout(() => navigate("/homepage"), 800);
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
    <div className="bg-[#0E0A3A] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      {/* ✅ RESPONSIVE BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Top Left */}
        <img
          src="/bg/shape-top-left.png"
          className="absolute top-0 left-0 
          w-32 sm:w-40 md:w-56 lg:w-72 xl:w-80"
        />

        {/* Top Right */}
        <img
          src="/bg/shape-top-right.png"
          className="absolute top-0 right-0
          w-32 sm:w-40 md:w-56 lg:w-72 xl:w-80"
        />

        {/* Bottom Left */}
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-0 left-0
          w-40 sm:w-56 md:w-72 lg:w-96 opacity-70"
        />

        {/* Bottom Right */}
        <img
          src="/bg/shape-bottom-kanan.png"
          className="absolute bottom-0 right-0
          w-28 sm:w-40 md:w-56 lg:w-72 opacity-30"
        />

        {/* Center Mascot Shape */}
        <img
          src="/bg/shape-center.png"
          className="absolute top-[150px] left-[25%]
          w-60 sm:w-72 md:w-[360px] lg:w-[480px] xl:w-[520px]
          rotate-[-8deg] opacity-70"
        />
      </div>

      {/* ✅ Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white shadow-xl ${toast.color} z-50`}
        >
          {toast.msg}
        </div>
      )}

      {/* ✅ Close Button */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 text-black text-3xl z-50"
      >
        ✕
      </button>

      {/* ✅ Center Card */}
      <div className="z-10 w-full max-w-sm sm:max-w-md px-6">
        <div className="bg-white/90 p-6 sm:p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#0c0731] mb-6">
            Log In
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-3 sm:p-4 rounded-xl border text-black outline-none"
              required
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full p-3 sm:p-4 pr-12 rounded-xl border text-black outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Forgot Password */}
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm text-gray-300 hover:text-white"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              className="bg-[#0c0731] hover:bg-[#160c52] text-white py-3 rounded-xl shadow-lg font-semibold transition"
            >
              Log In
            </button>

            <hr className="border-gray-300" />

            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="w-full bg-gray-200 text-[#0c0731] py-3 rounded-xl shadow hover:bg-gray-300"
            >
              Create an Account
            </button>
          </form>
        </div>
      </div>

      {/* ✅ Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl text-black">
            <h3 className="text-xl sm:text-2xl font-semibold mb-3">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email and we’ll send a reset link.
            </p>

            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input
                type="email"
                name="resetEmail"
                placeholder="Your email"
                className="p-3 border rounded-lg"
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
                  className="px-4 py-2 bg-[#0c0731] text-white rounded-lg"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
