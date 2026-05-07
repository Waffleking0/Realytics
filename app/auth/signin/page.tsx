"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, BarChart3, Brain, TrendingUp, Shield } from "lucide-react";

const perks = [
  { icon: BarChart3, text: "Full financial metrics — cap rate, IRR, cash flow" },
  { icon: TrendingUp, text: "Market risk analysis & 10-year projections" },
  { icon: Brain,     text: "AI-generated Buy / Hold / Pass reports" },
  { icon: Shield,    text: "Real sold comps & property tax data (Pro)" },
];

export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>

        {/* subtle grid overlay */}
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
            AI-Powered Real Estate Intelligence
          </p>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Analyze any deal<br />
            <span style={{ backgroundImage: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              in seconds.
            </span>
          </h2>
          <ul className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to access your deals and analysis.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Password
                </label>
              </div>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">New to Realytics AI?</span>
            </div>
          </div>

          <Link
            href="/auth/signup"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-center"
          >
            Create a free account
          </Link>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in you agree to our{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-gray-600">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
