import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deal Analysis — Realytics",
  description: "View a shared real estate investment analysis from Realytics.",
};

// ─── Decode share payload ─────────────────────────────────────────────────────

interface SharePayload {
  v: number;
  lbl: string;
  pt:  string;
  sc:  number;
  cat: string;
  risk: string;
  rec: string;
  mcf: number;
  coc: number;
  cr:  number;
  irr: number;
  dscr: number;
  noi: number;
  ti:  number;
  str:  string[];
  wk:   string[];
  reason: string;
  recText: string;
}

function decode(encoded: string): SharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

// ─── Category styles ──────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  "Strong Buy": "text-emerald-400",
  "Good Deal":  "text-blue-400",
  "Risky":      "text-amber-400",
  "Pass":       "text-red-400",
};

const CAT_RING: Record<string, string> = {
  "Strong Buy": "#10b981",
  "Good Deal":  "#3b82f6",
  "Risky":      "#f59e0b",
  "Pass":       "#ef4444",
};

const RISK_STYLE: Record<string, string> = {
  Low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Medium: "bg-amber-500/15  text-amber-400  border-amber-500/25",
  High:   "bg-red-500/15    text-red-400    border-red-500/25",
};

// ─── Score ring (inline SVG) ──────────────────────────────────────────────────

function Ring({ score, category }: { score: number; category: string }) {
  const r    = 56;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = CAT_RING[category] ?? "#3b82f6";

  return (
    <div className="relative w-36 h-36">
      <svg className="-rotate-90 w-full h-full" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="68" cy="68" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-900">{score}</span>
        <span className="text-xs text-gray-500">/100</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharePage({
  searchParams,
}: {
  searchParams: { d?: string };
}) {
  const encoded = searchParams.d;

  if (!encoded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <span className="text-5xl">🔗</span>
          <h1 className="text-xl font-bold text-gray-900">Invalid share link</h1>
          <p className="text-gray-500 text-sm">This link is missing or malformed.</p>
          <Link href="/" className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
            ← Go to Realytics
          </Link>
        </div>
      </div>
    );
  }

  const data = decode(encoded);

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <span className="text-5xl">❌</span>
          <h1 className="text-xl font-bold text-gray-900">Could not decode deal</h1>
          <p className="text-gray-500 text-sm">The share link may be corrupted or from an older version.</p>
          <Link href="/" className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
            ← Analyze your own deal
          </Link>
        </div>
      </div>
    );
  }

  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const catColor = CAT_COLOR[data.cat] ?? "text-gray-500";
  const riskStyle = RISK_STYLE[data.risk] ?? RISK_STYLE["Medium"];
  const ptLabel  = data.pt.charAt(0).toUpperCase() + data.pt.slice(1);

  const keyMetrics = [
    { label: "Monthly Cash Flow", value: `${data.mcf >= 0 ? "+" : ""}${fmt$(data.mcf)}` },
    { label: "Cash-on-Cash",      value: `${data.coc}%` },
    { label: "Cap Rate",          value: `${data.cr}%` },
    { label: "10-Year IRR",       value: `${data.irr}%` },
    { label: "NOI",               value: fmt$(data.noi) },
    ...(data.dscr > 0 ? [{ label: "DSCR", value: `${data.dscr}×` }] : []),
    { label: "Total Invested",    value: fmt$(data.ti) },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-gray-900 text-xs font-black">R</span>
            </div>
            <span className="text-gray-900 font-bold">Realytics</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Analyze your own deal →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Shared Analysis
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{data.lbl}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-500 capitalize">{ptLabel}</span>
            <span className="text-gray-700">·</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${riskStyle}`}>
              {data.risk} Risk
            </span>
          </div>
        </div>

        {/* Score + verdict */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {data.sc > 0 && <Ring score={data.sc} category={data.cat} />}
          <div className="space-y-3 text-center sm:text-left">
            {data.cat && (
              <p className={`text-3xl font-black ${catColor}`}>{data.cat}</p>
            )}
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">{data.reason}</p>
            {data.recText && (
              <div className="bg-gray-100 rounded-xl px-4 py-3 inline-block">
                <p className="text-xs text-gray-500 mb-1">Recommendation</p>
                <p className="text-sm text-gray-900 font-medium">{data.recText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">Key Financial Metrics</h2>
          </div>
          <div className="grid sm:grid-cols-2">
            {keyMetrics.map(({ label, value }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i < keyMetrics.length - 1 ? "border-b border-gray-200" : ""
                } ${i % 2 === 0 && i < keyMetrics.length - 1 ? "sm:border-r sm:border-gray-200" : ""}`}
              >
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths + Weaknesses */}
        {(data.str?.length > 0 || data.wk?.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.str?.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">Strengths</p>
                <ul className="space-y-2">
                  {data.str.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600">
                      <span className="text-emerald-400 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.wk?.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Risks & Weaknesses</p>
                <ul className="space-y-2">
                  {data.wk.map((w: string, i: number) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600">
                      <span className="text-red-400 shrink-0">✗</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Analyze your own real estate deals in minutes.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5"
          >
            Try Realytics — it's free
          </Link>
        </div>
      </main>
    </div>
  );
}
