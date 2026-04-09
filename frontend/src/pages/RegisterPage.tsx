import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Supabase auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (signUpError) throw signUpError;

      // Step 2: Insert profile into public users table (trigger will also handle this, but we do it explicitly too)
      if (data.user) {
        const role = email === "y.reweny@gmail.com" ? "admin" : "student";
        await supabase.from("users").upsert({
          id: data.user.id,
          email,
          name,
          role,
        }, { onConflict: "id" });
      }

      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center bg-white p-12 rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-200/50">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Account Created!</h2>
          <p className="text-zinc-500 mb-8">
            Check your email to confirm your account, then sign in.
          </p>
          <Link to="/login" className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 px-10 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-900/30">
                <Star size={28} />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Create Account
              </h1>
              <p className="text-zinc-400 mt-1 text-sm">Join RateMyCourse today</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {error && (
              <div className="flex items-start gap-3 mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  className="w-full pl-11 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
