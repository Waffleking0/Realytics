import type { DealScoreResult, ScoreBreakdown } from "@/lib/analysis/dealScore";
import type { DealCategory } from "@/lib/analysis/dealScore";

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<DealCategory, {
  ring: string; badge: string; bg: string; border: string; label: string;
}> = {
  "Strong Buy": {
    ring: "#10b981", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    bg: "bg-emerald-500/5", border: "border-emerald-500/20",
    label: "This deal is firing on all cylinders.",
  },
  "Good Deal": {
    ring: "#3b82f6", badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    bg: "bg-blue-500/5", border: "border-blue-500/20",
    label: "Solid fundamentals with manageable risks.",
  },
  "Risky": {
    ring: "#f59e0b", badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    bg: "bg-amber-500/5", border: "border-amber-500/20",
    label: "Stress-test your assumptions carefully.",
  },
  "Pass": {
    ring: "#ef4444", badge: "bg-red-500/15 text-red-400 border-red-500/25",
    bg: "bg-red-500/5", border: "border-red-500/20",
    label: "Numbers don't justify the risk at this price.",
  },
};

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, category }: { score: number; category: DealCategory }) {
  const r   = 64;
  const circ = 2 * Math.PI * r;
  const cfg  = CAT_CONFIG[category];

  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg className="-rotate-90 w-full h-full" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={cfg.ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 leading-none">{score}</span>
        <span className="text-xs text-gray-500 mt-1">/ 100</span>
      </div>
    </div>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────

const DIM_META: Record<keyof ScoreBreakdown, { label: string; icon: string }> = {
  roi:          { label: "ROI / Cash-on-Cash",  icon: "💰" },
  cashFlow:     { label: "Monthly Cash Flow",   icon: "💵" },
  capRate:      { label: "Cap Rate",            icon: "📐" },
  marketGrowth: { label: "Market Growth",       icon: "📈" },
  vacancy:      { label: "Vacancy Rate",        icon: "🏠" },
  risk:         { label: "Risk / DSCR",         icon: "⚖️" },
  upside:       { label: "Upside / IRR",        icon: "🚀" },
};

function DimBar({ dimKey, points, max }: { dimKey: keyof ScoreBreakdown; points: number; max: number }) {
  const pct  = (points / max) * 100;
  const meta = DIM_META[dimKey];
  const color = pct >= 80 ? "bg-emerald-500"
    : pct >= 60 ? "bg-blue-500"
    : pct >= 40 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
      <span className="text-sm w-5 text-center">{meta.icon}</span>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">{meta.label}</span>
          <span className="text-xs font-semibold text-gray-500">{points}/{max}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Aggregate sub-scores ─────────────────────────────────────────────────────

interface SubScore {
  label: string;
  score: number; // 0–100
  explanation: string;
  icon: string;
}

function computeSubScores(bd: ScoreBreakdown): SubScore[] {
  const profitability = Math.round(((bd.roi.points + bd.cashFlow.points) / 40) * 100);
  const market        = Math.round(((bd.capRate.points + bd.marketGrowth.points) / 30) * 100);
  const riskMgmt      = Math.round(((bd.vacancy.points + bd.risk.points) / 25) * 100);
  const upside        = Math.round((bd.upside.points / 5) * 100);

  const expl = (score: number, hi: string, mid: string, lo: string) =>
    score >= 70 ? hi : score >= 40 ? mid : lo;

  return [
    {
      label: "Profitability",
      score: profitability,
      icon: "💰",
      explanation: expl(
        profitability,
        "Strong cash flow and ROI — this deal puts money in your pocket immediately.",
        "Moderate returns. Positive but lean cash flow; adequate ROI.",
        "Weak profitability. Cash flow and/or ROI are below investor benchmarks."
      ),
    },
    {
      label: "Market",
      score: market,
      icon: "📈",
      explanation: expl(
        market,
        "Strong cap rate and healthy market growth — excellent asset-level yield.",
        "Acceptable cap rate. Market is growing but asset may be priced at a slight premium.",
        "Low cap rate and/or sluggish market growth — limited income and appreciation upside."
      ),
    },
    {
      label: "Risk",
      score: riskMgmt,
      icon: "⚖️",
      explanation: expl(
        riskMgmt,
        "Low vacancy and strong DSCR — stable income with comfortable debt coverage.",
        "Moderate risk. Vacancy is manageable; debt service is covered but not with wide margin.",
        "Elevated risk. High vacancy or thin debt coverage leaves little room for error."
      ),
    },
    {
      label: "Upside",
      score: upside,
      icon: "🚀",
      explanation: expl(
        upside,
        "High IRR signals significant total return potential — strong equity growth ahead.",
        "Moderate upside. Respectable IRR; returns are reasonable but not exceptional.",
        "Limited upside. IRR suggests minimal equity growth or appreciation premium."
      ),
    },
  ];
}

function SubScoreCard({ sub }: { sub: SubScore }) {
  const color = sub.score >= 70 ? "#34d399" : sub.score >= 40 ? "#60a5fa" : sub.score >= 20 ? "#fbbf24" : "#f87171";
  const bgColor = sub.score >= 70 ? "rgba(52,211,153,0.06)" : sub.score >= 40 ? "rgba(96,165,250,0.06)" : sub.score >= 20 ? "rgba(251,191,36,0.06)" : "rgba(248,113,113,0.06)";
  const borderColor = sub.score >= 70 ? "rgba(52,211,153,0.15)" : sub.score >= 40 ? "rgba(96,165,250,0.15)" : sub.score >= 20 ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)";

  return (
    <div className="rounded-xl p-4" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{sub.icon}</span>
          <span className="text-xs font-bold text-zinc-300">{sub.label}</span>
        </div>
        <span className="text-lg font-black" style={{ color }}>{sub.score}</span>
      </div>
      <div className="h-1.5 rounded-full mb-2.5" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sub.score}%`, background: color }} />
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{sub.explanation}</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DealScore({ result }: { result: DealScoreResult }) {
  const { score, category, breakdown, reasoning, strengths, weaknesses, recommendation } = result;
  const cfg = CAT_CONFIG[category];
  const subScores = computeSubScores(breakdown);

  return (
    <div className="space-y-5">

      {/* Top row: ring + category + reasoning */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <ScoreRing score={score} category={category} />
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
            {category}
          </span>
          <p className="text-[10px] text-gray-600 text-center max-w-[120px]">{cfg.label}</p>
        </div>
        <div className="flex-1 space-y-4">
          <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-4`}>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Analyst Reasoning</p>
            <p className="text-sm text-gray-600 leading-relaxed">{reasoning}</p>
          </div>
        </div>
      </div>

      {/* 4 aggregate sub-scores */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Score Breakdown by Category</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {subScores.map(sub => <SubScoreCard key={sub.label} sub={sub} />)}
        </div>
      </div>

      {/* 7-dimension bars */}
      <div className="bg-gray-100/50 border border-gray-300/50 rounded-xl p-4 space-y-3.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dimension Detail (7 signals)</p>
        {(Object.keys(breakdown) as (keyof ScoreBreakdown)[]).map(key => (
          <DimBar
            key={key}
            dimKey={key}
            points={breakdown[key].points}
            max={breakdown[key].max}
          />
        ))}
      </div>

      {/* Strengths + Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">
                Strengths
              </p>
              <ul className="space-y-2">
                {strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">
                Risks & Weaknesses
              </p>
              <ul className="space-y-2">
                {weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600">
                    <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gray-100 border border-gray-300 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Recommendation
        </p>
        <p className="text-sm text-gray-900 font-medium">{recommendation}</p>
      </div>

    </div>
  );
}
