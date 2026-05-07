"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, BarChart3, Brain, TrendingUp, Shield, Eye, EyeOff } from "lucide-react";

const perks = [
  { icon: BarChart3,   text: "Full financial metrics — cap rate, IRR, cash flow" },
  { icon: TrendingUp,  text: "Market risk analysis & 10-year projections" },
  { icon: Brain,       text: "AI-generated Buy / Hold / Pass reports" },
  { icon: Shield,      text: "Real sold comps & property tax data (Pro)" },
];

const included = [
  "5 free analyses per month",
  "Buy / Hold / Pass recommendation",
  "No credit card required",
];

export default function SignUpPage() {
  const router = useRouter();
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Sign up failed. Please try again.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>

        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Realytics AI</span>
        </Link>

        {/* Hero copy */}
        <div className="relative">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
            Start free — no credit card needed
          </p>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Your free account<br />
            <span style={{ backgroundImage: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              includes:
            </span>
          </h2>
          <ul className="space-y-3 mb-8">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8" />

          <p className="text-slate-400 text-sm mb-4">Unlock more with paid plans:</p>
          <ul className="space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-l-2 border-indigo-500/40 pl-4">
          <p className="text-slate-400 text-sm italic leading-relaxed">
            "The financial modeling tool every real estate investor needs — without the spreadsheet."
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-bold text-lg">Realytics AI</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm">Free forever. Upgrade when you need more.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Full name
              </label>
              <input
                type="text" autoComplete="name"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="Alex Johnson"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={8}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"} required autoComplete="new-password" minLength={8}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 bg-gray-50 border outline-none focus:ring-2 transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400/10"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
                  }`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">Already have an account?</span>
            </div>
          </div>

          <Link
            href="/auth/signin"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-center"
          >
            Sign in instead
          </Link>

          <p className="text-center text-xs text-gray-400 mt-6">
            By creating an account you agree to our{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-gray-600">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
