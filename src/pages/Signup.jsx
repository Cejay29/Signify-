import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Eye, EyeOff, Check, X } from "lucide-react";

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

    console.log("Attempting signup with:", form);

    // ✅ Sign up user
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
    if (error) return showToastMsg(error.message);

    const user = data.user;

    // ✅ Insert into public.users
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      username: form.firstName, // OR remove this field if you want
      email: form.email,
      birthday: form.birthday,
      gender: form.gender,
    });

    if (insertError) return showToastMsg(insertError.message);

    showToastMsg("Signup successful!", "bg-green-600");
    setTimeout(() => navigate("/login"), 1500);
  }

  return (
    <div className="bg-gradient-to-br from-[#450693] via-[#8C00FF] to-[#450693] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Top Left */}
        <img
          src="/bg/upper-left.png"
          className="absolute top--20 left-0 
          w-32 sm:w-40 md:w-56 lg:w-72 xl:w-80"
        />

        {/* Top Right */}
        <img
          src="/bg/upper-right.png"
          className="absolute top-20 right-0
            w-48 sm:w-60 md:w-80 lg:w-[380px] xl:w-[420px]"
        />

        {/* Bottom Left */}
        <img
          src="/bg/shape-bottom-left.png"
          className="absolute bottom-0 left-0
          w-40 sm:w-56 md:w-72 lg:w-96 opacity-70"
        />

        {/* Bottom Right */}
        <img
          src="/bg/lower-right.png"
          className="absolute bottom-0 right-0
        w-48 sm:w-72 md:w-96 lg:w-[420px] xl:w-[480px] opacity-30"
        />

        {/* Center Mascot Shape */}
        <img
          src="/bg/shape-center.png"
          className="absolute top-[150px] left-[25%]
          w-60 sm:w-72 md:w-[360px] lg:w-[480px] xl:w-[520px]
          rotate-[-8deg] opacity-70"
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

      <div className="z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl px-4 py-6 sm:py-8 mx-auto">
        <div className="bg-white text-black p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl border-2 border-[#FFC400]">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[#8C00FF]">
            Sign Up
          </h1>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {/* First & Last Name */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                First & Last Name
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  name="firstName"
                  placeholder="First name"
                  required
                  onChange={update}
                  className="p-3 border rounded-xl w-1/2 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
                />
                <input
                  name="lastName"
                  placeholder="Last name"
                  required
                  onChange={update}
                  className="p-3 border rounded-xl w-1/2 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
                />
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                required
                onChange={update}
                className="p-3 border rounded-xl w-full mt-1 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                Gender
              </label>
              <select
                name="gender"
                required
                onChange={update}
                className="p-3 border rounded-xl w-full mt-1 bg-white focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                onChange={update}
                className="p-3 border rounded-xl w-full mt-1 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                Password
              </label>

              <div className="relative mt-1">
                <input
                  type={pwVisible ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  onChange={update}
                  className="p-3 border rounded-xl w-full pr-12 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition"
                />

                <button
                  type="button"
                  onClick={() => setPwVisible(!pwVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C00FF]"
                >
                  {pwVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* Password Rules */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
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
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-[#450693]">
                Confirm Password
              </label>

              <div className="relative mt-1">
                <input
                  type={pw2Visible ? "text" : "password"}
                  name="confirm"
                  placeholder="Confirm password"
                  required
                  onChange={update}
                  className={`p-3 border rounded-xl w-full pr-12 focus:border-[#8C00FF] focus:ring-2 focus:ring-[#8C00FF]/40 transition ${
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
                  {pw2Visible ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-600 mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-2 py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                canSubmit
                  ? "bg-gradient-to-r from-[#8C00FF] to-[#FF3F7F] hover:opacity-90"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Create Account
            </button>

            <Link
              to="/login"
              className="text-center text-[#8C00FF] text-sm hover:text-[#FF3F7F] hover:underline mt-1 transition"
            >
              Already have an account?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
