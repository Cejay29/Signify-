import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg, color = "bg-red-500") => {
    setToast({ msg, color });
    setTimeout(() => setToast(""), 2000);
  };

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const fullName = e.target.fullName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // 1️⃣ SIGN UP ADMIN ACCOUNT IN AUTH
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      showToast(error.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      showToast("Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // 2️⃣ INSERT INTO admin_users TABLE
    const { error: adminError } = await supabase.from("admin_users").insert({
      id: userId,
      email: email,
      full_name: fullName,
      role: "admin",
    });

    if (adminError) {
      console.error(adminError);
      showToast("Error saving admin data.");
      setLoading(false);
      return;
    }

    showToast("Admin account created!", "bg-green-600");

    // 3️⃣ REDIRECT TO /admin
    setTimeout(() => navigate("/admin"), 1000);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      {toast && (
        <div className={`fixed top-6 px-6 py-3 rounded-xl text-white ${toast.color}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          Admin Signup
        </h2>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="border p-3 rounded-lg"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            className="border p-3 rounded-lg"
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            className="border p-3 rounded-lg"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-center text-gray-500 hover:text-gray-700 text-sm mt-2"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
