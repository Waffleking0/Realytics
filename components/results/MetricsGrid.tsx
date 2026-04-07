import type { CoreMetrics, PropertyType } from "@/types";
import { fmt$ } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "great" | "good" | "neutral" | "warn" | "bad";

interface TileData {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tier: Tier;
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────

function tiers(v: number, great: number, good: number, warn: number): Tier {
  if (v >= great) return "great";
  if (v >= good)  return "good";
  if (v >= warn)  return "neutral";
  if (v > 0)      return "warn";
  return "bad";
}

// ─── Tile component ───────────────────────────────────────────────────────────

const BG: Record<Tier, string> = {
  great:   "bg-emerald-500/8  border-emerald-500/20  hover:border-emerald-500/35",
  good:    "bg-blue-500/8     border-blue-500/20      hover:border-blue-500/35",
  neutral: "bg-gray-100/50    border-gray-300/60      hover:border-gray-400",
  warn:    "bg-amber-500/8    border-amber-500/20     hover:border-amber-500/35",
  bad:     "bg-red-500/8      border-red-500/20       hover:border-red-500/35",
};

const VAL: Record<Tier, string> = {
  great:   "text-emerald-400",
  good:    "text-blue-400",
  neutral: "text-gray-900",
  warn:    "text-amber-400",
  bad:     "text-red-400",
};

function MetricTile({ label, value, sub, icon, tier }: TileData) {
  return (
    <div className={`relative rounded-xl border p-4 flex flex-col gap-2.5 transition-colors ${BG[tier]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 leading-snug">{label}</span>
        <span className="text-lg leading-none shrink-0">{icon}</span>
      </div>
      <p className={`text-2xl font-black leading-none tracking-tight ${VAL[tier]}`}>
        {value}
      </p>
      <p className="text-xs text-gray-600 leading-tight">{sub}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MetricsGrid({
  metrics,
  propertyType,
}: {
  metrics: CoreMetrics;
  propertyType: PropertyType;
}) {
  const {
    monthlyCashFlow, annualCashFlow, capRate, cashOnCashReturn,
    irr, noi, totalInvestment, debtServiceCoverageRatio,
    grossRentMultiplier, breakEvenOccupancy,
  } = metrics;

  const hasDebt   = (debtServiceCoverageRatio ?? 0) > 0;
  const hasIncome = propertyType !== "land";
  const cfSign    = monthlyCashFlow >= 0 ? "+" : "";

  const tiles: TileData[] = [
    {
      label: "Monthly Cash Flow",
      value: `${cfSign}${fmt$(monthlyCashFlow)}`,
      sub:   "After all expenses & debt service",
      icon:  "💵",
      tier:  monthlyCashFlow >= 500 ? "great" : monthlyCashFlow >= 0 ? "good" : monthlyCashFlow >= -300 ? "warn" : "bad",
    },
    {
      label: "Cash-on-Cash Return",
      value: `${(cashOnCashReturn * 100).toFixed(2)}%`,
      sub:   "Annual return on equity invested",
      icon:  "💰",
      tier:  tiers(cashOnCashReturn * 100, 10, 6, 2),
    },
    ...(hasIncome ? [{
      label: "Cap Rate",
      value: `${(capRate * 100).toFixed(2)}%`,
      sub:   "Asset yield regardless of financing",
      icon:  "📐",
      tier:  tiers(capRate * 100, 7, 5, 2),
    } as TileData] : []),
    {
      label: "10-Year IRR",
      value: `${(irr * 100).toFixed(1)}%`,
      sub:   "Projected annualized return at exit",
      icon:  "📈",
      tier:  tiers(irr * 100, 15, 10, 5),
    },
    ...(hasIncome ? [{
      label: "Net Operating Income",
      value: fmt$(noi),
      sub:   "Annual income before debt service",
      icon:  "🏦",
      tier:  tiers(noi, 30000, 15000, 0),
    } as TileData] : []),
    ...(hasDebt ? [{
      label: "Debt Service Coverage",
      value: `${(debtServiceCoverageRatio ?? 0).toFixed(2)}×`,
      sub:   "NOI ÷ annual debt payments",
      icon:  "⚖️",
      tier:  (debtServiceCoverageRatio ?? 0) >= 1.25 ? "great" as Tier
           : (debtServiceCoverageRatio ?? 0) >= 1.0  ? "good"  as Tier
           : (debtServiceCoverageRatio ?? 0) >= 0.9  ? "warn"  as Tier : "bad" as Tier,
    }] : []),
    {
      label: "Annual Cash Flow",
      value: `${annualCashFlow >= 0 ? "+" : ""}${fmt$(annualCashFlow)}`,
      sub:   "Total net income over 12 months",
      icon:  "📅",
      tier:  tiers(annualCashFlow, 6000, 0, -5000),
    },
    {
      label: "Total Invested",
      value: fmt$(totalInvestment),
      sub:   "Down payment + closing costs",
      icon:  "💼",
      tier:  "neutral",
    },
    ...(grossRentMultiplier > 0 && hasIncome ? [{
      label: "Gross Rent Multiplier",
      value: `${grossRentMultiplier.toFixed(1)}×`,
      sub:   "Purchase price ÷ gross annual rent",
      icon:  "🔢",
      tier:  grossRentMultiplier <= 10 ? "great" as Tier
           : grossRentMultiplier <= 14 ? "good"  as Tier
           : grossRentMultiplier <= 18 ? "warn"  as Tier : "bad" as Tier,
    }] : []),
    ...(breakEvenOccupancy > 0 && hasIncome ? [{
      label: "Break-Even Occupancy",
      value: `${(breakEvenOccupancy * 100).toFixed(1)}%`,
      sub:   "Minimum occupancy to cover all costs",
      icon:  "📊",
      tier:  breakEvenOccupancy <= 0.70 ? "great" as Tier
           : breakEvenOccupancy <= 0.80 ? "good"  as Tier
           : breakEvenOccupancy <= 0.90 ? "warn"  as Tier : "bad" as Tier,
    }] : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {tiles.map(t => <MetricTile key={t.label} {...t} />)}
    </div>
  );
}
