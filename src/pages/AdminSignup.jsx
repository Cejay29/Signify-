import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, KeyRound } from "lucide-react";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg, color = "bg-red-500") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 2500);
  };

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const full_name = e.target.fullName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const admin_code = e.target.adminCode.value.trim();

    const response = await fetch("/api/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password, admin_code }),
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.error || "Signup failed");
      setLoading(false);
      return;
    }

    showToast("Admin account created!", "bg-green-600");

    setTimeout(() => {
      navigate("/admin");
    }, 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white shadow-xl ${toast.color}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Card */}
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-full shadow-md">
            <UserPlus className="text-white w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#0c0731] mt-3">
            Admin Signup
          </h2>
          <p className="text-gray-500 text-sm">Create a new admin account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Juan Dela Cruz"
              className="border mt-1 w-full p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@domain.com"
              className="border mt-1 w-full p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                className="border w-full p-3 rounded-xl pr-12 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Admin Secret Code */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Admin Secret Code
            </label>
            <div className="relative mt-1">
              <input
                type="password"
                name="adminCode"
                placeholder="Enter Admin Secret Code"
                className="border w-full p-3 rounded-xl pr-12 focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600 w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Only authorized staff should have this code.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:shadow-xl mt-2"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full text-center text-gray-600 hover:text-gray-900 text-sm mt-2"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
