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
        <div className="bg-[#0c0731] min-h-screen flex items-center justify-center relative font-[Inter] overflow-hidden">

            {/* ✅ Toast */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-xl text-white ${toast.color} z-50 text-sm`}>
                    {toast.msg}
                </div>
            )}

            {/* ✅ Close Button */}
            <button onClick={() => navigate("/")} className="fixed top-4 left-4 text-white text-3xl z-50">
                ✕
            </button>

            {/* ✅ Signup Card */}
            <div className="z-10 w-full max-w-xs sm:max-w-sm md:max-w-md px-4">
                <div className="bg-white/95 text-black p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl">

                    <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[#0c0731]">
                        Sign Up
                    </h1>

                    <form onSubmit={handleSignup} className="flex flex-col gap-4">

                        {/* ✅ First + Last Name */}
                        <div>
                            <label className="text-sm font-medium">First & Last Name</label>
                            <div className="flex gap-2 mt-1">
                                <input name="firstName" placeholder="First name" required onChange={update} className="p-3 border rounded-xl w-1/2" />
                                <input name="lastName" placeholder="Last name" required onChange={update} className="p-3 border rounded-xl w-1/2" />
                            </div>
                        </div>

                        {/* ✅ Birthday */}
                        <div>
                            <label className="text-sm font-medium">Birthday</label>
                            <input type="date" name="birthday" required onChange={update} className="p-3 border rounded-xl w-full mt-1" />
                        </div>

                        {/* ✅ Gender */}
                        <div>
                            <label className="text-sm font-medium">Gender</label>
                            <select name="gender" required onChange={update} className="p-3 border rounded-xl w-full mt-1 bg-white">
                                <option value="">Select gender</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* ✅ Email */}
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <input type="email" name="email" placeholder="Email" required onChange={update} className="p-3 border rounded-xl w-full mt-1" />
                        </div>

                        {/* ✅ Password */}
                        <div>
                            <label className="text-sm font-medium">Password</label>

                            <div className="relative mt-1">
                                <input type={pwVisible ? "text" : "password"} name="password" placeholder="Password" required onChange={update} className="p-3 border rounded-xl w-full pr-12" />

                                <button type="button" onClick={() => setPwVisible(!pwVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
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
                                        {rules[key] ? <Check className="text-green-600" size={16} /> : <X className="text-gray-400" size={16} />}
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ✅ Confirm Password */}
                        <div>
                            <label className="text-sm font-medium">Confirm Password</label>

                            <div className="relative mt-1">
                                <input
                                    type={pw2Visible ? "text" : "password"}
                                    name="confirm"
                                    placeholder="Confirm password"
                                    required
                                    onChange={update}
                                    className={`p-3 border rounded-xl w-full pr-12 ${form.confirm ? (form.confirm === form.password ? "border-green-600" : "border-red-600") : ""}`}
                                />

                                <button
                                    type="button"
                                    onClick={() => setPw2Visible(!pw2Visible)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {pw2Visible ? <EyeOff /> : <Eye />}
                                </button>
                            </div>

                            {form.confirm && form.confirm !== form.password && (
                                <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                            )}
                        </div>

                        {/* ✅ Submit */}
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`mt-2 py-3 rounded-xl font-semibold text-white shadow-lg transition ${canSubmit ? "bg-[#0c0731] hover:bg-[#160c52]" : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Create Account
                        </button>

                        <Link to="/login" className="text-center text-blue-500 text-sm hover:underline mt-1">
                            Already have an account?
                        </Link>
                    </form>

                </div>
            </div>
        </div>
    );
}
