"use client";
import type { MarketInsights, NearbyDevelopment } from "@/lib/mockData/marketInsights";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtK(n: number) {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}
function sign(n: number) { return n >= 0 ? `+${n}` : `${n}`; }
function pct(n: number) { return `${sign(n)}%`; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${color}20`, color }}>{sub}</span>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

function MiniBar({ value, max, color, label, sub }: {
  value: number; max: number; color: string; label: string; sub: string;
}) {
  const pctW = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold" style={{ color }}>{sub}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctW}%`, background: color }} />
      </div>
    </div>
  );
}

function RentChart({ history }: { history: number[] }) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date().getMonth();

  return (
    <div>
      <div className="flex items-end gap-0.5 h-20">
        {history.map((v, i) => {
          const h = ((v - min) / range) * 80 + 20;
          const isCurrent = i === history.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t-sm transition-all duration-500 cursor-pointer"
                style={{
                  height: `${h}%`,
                  background: isCurrent ? "#fbbf24" : "rgba(251,191,36,0.3)",
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-gray-900 whitespace-nowrap pointer-events-none">
                {fmt$(v)}/mo
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
        <span>{months[(now + 1) % 12]}</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function PriceChart({ history }: { history: number[] }) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * 200;
    const y = 60 - ((v - min) / range) * 50;
    return `${x},${y}`;
  }).join(" ");

  const start = history[0];
  const end = history[history.length - 1];
  const change = ((end - start) / start) * 100;
  const isUp = change >= 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-zinc-500">12-Month Price Index</span>
        <span className="font-bold" style={{ color: isUp ? "#34d399" : "#f87171" }}>
          {pct(Math.round(change * 10) / 10)}
        </span>
      </div>
      <svg viewBox="0 0 200 65" className="w-full" style={{ height: 64 }}>
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? "#34d399" : "#f87171"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Fill under the line */}
        <polyline
          points={`0,65 ${points} 200,65`}
          fill={isUp ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)"}
          stroke="none"
        />
      </svg>
    </div>
  );
}

function DevCard({ dev }: { dev: NearbyDevelopment }) {
  const typeIcon: Record<NearbyDevelopment["type"], string> = {
    "residential": "🏠", "commercial": "🏢", "mixed-use": "🏙️", "infrastructure": "🚧",
  };
  const statusColor = dev.status === "recently completed" ? "#34d399"
    : dev.status === "under construction" ? "#fbbf24" : "#60a5fa";
  const impactColor = dev.impact === "positive" ? "#34d399"
    : dev.impact === "neutral" ? "#a1a1aa" : "#fbbf24";

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{typeIcon[dev.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 truncate">{dev.name}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${statusColor}20`, color: statusColor }}>
              {dev.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 mb-2">
            {dev.units && <span>{dev.units.toLocaleString()} units</span>}
            {dev.sqFt && <span>{(dev.sqFt / 1000).toFixed(0)}K sqft</span>}
            <span>{dev.distanceMiles} mi away</span>
            {dev.estimatedCompletion && <span>Est. {dev.estimatedCompletion}</span>}
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-xs font-bold shrink-0" style={{ color: impactColor }}>
              {dev.impact === "positive" ? "▲" : dev.impact === "neutral" ? "→" : "▼"} Impact:
            </span>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{dev.impactNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemandGauge({ score, label }: { score: number; label: string }) {
  const r = 42;
  const circ = Math.PI * r; // half circle
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#34d399" : score >= 55 ? "#60a5fa" : score >= 35 ? "#fbbf24" : "#f87171";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 100, height: 56 }}>
        <svg viewBox="0 0 100 56" width="100" height="56">
          {/* Track */}
          <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
          {/* Fill */}
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-lg font-black text-gray-900">{score}</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
      <span className="text-[10px] text-zinc-600">Demand Score</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MarketPulse({ data }: { data: MarketInsights }) {
  const conditionColor = data.marketCondition.includes("🔥") ? "#fbbf24"
    : data.marketCondition === "Warm" ? "#34d399"
    : data.marketCondition === "Balanced" ? "#60a5fa"
    : data.marketCondition === "Cool" ? "#a78bfa" : "#94a3b8";

  const sentimentColor = data.investorSentiment === "Bullish" ? "#34d399"
    : data.investorSentiment === "Neutral" ? "#60a5fa"
    : data.investorSentiment === "Cautious" ? "#fbbf24" : "#f87171";

  return (
    <div className="space-y-6">

      {/* ── Header summary row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-base font-bold text-gray-900">
            {data.city}, {data.state} · ZIP {data.zip}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{data.keyInsight}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${conditionColor}18`, border: `1px solid ${conditionColor}35`, color: conditionColor }}>
            {data.marketCondition}
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${sentimentColor}18`, border: `1px solid ${sentimentColor}35`, color: sentimentColor }}>
            {data.investorSentiment}
          </span>
        </div>
      </div>

      {/* ── Top stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="🏠" label="Median Rent" value={fmt$(data.medianRent)} sub={pct(data.rentGrowthYoY) + " YoY"} color={data.rentGrowthYoY >= 3 ? "#34d399" : "#fbbf24"} />
        <StatCard icon="📈" label="Median Home Value" value={fmtK(data.medianHomeValue)} sub={pct(data.priceGrowthYoY) + " YoY"} color={data.priceGrowthYoY >= 2 ? "#60a5fa" : "#f87171"} />
        <StatCard icon="⏱" label="Days on Market" value={`${data.daysOnMarket}d`} sub={data.daysOnMarket <= 14 ? "Fast" : data.daysOnMarket <= 35 ? "Normal" : "Slow"} color={data.daysOnMarket <= 14 ? "#34d399" : data.daysOnMarket <= 35 ? "#fbbf24" : "#f87171"} />
        <StatCard icon="🏷" label="Avg Cap Rate" value={`${data.capRateAvg.toFixed(1)}%`} sub={data.capRateAvg >= 6.5 ? "Above Avg" : "Below Avg"} color={data.capRateAvg >= 6.5 ? "#34d399" : "#a78bfa"} />
      </div>

      {/* ── Rent chart + Price chart ─────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rent Trend</p>
            <span className="text-xs font-bold" style={{ color: data.rentGrowthYoY >= 3 ? "#34d399" : "#fbbf24" }}>
              {pct(data.rentGrowthYoY)} YoY · {pct(data.rentGrowth3Mo)} (3-mo)
            </span>
          </div>
          <RentChart history={data.rentHistory} />
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Price Appreciation</p>
          </div>
          <PriceChart history={data.priceHistory} />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            <span>12 months ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* ── Demand + Supply ──────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
        <DemandGauge score={data.demandScore} label={data.demandLabel} />
        <div className="space-y-3">
          <MiniBar label="Absorption Rate" sub={`${data.absorptionRate.toFixed(0)}% of listings/mo`} value={data.absorptionRate} max={100} color="#fbbf24" />
          <MiniBar label="Inventory" sub={`${data.inventoryMonths} months supply`} value={Math.max(0, 8 - data.inventoryMonths)} max={8} color={data.inventoryMonths < 2 ? "#34d399" : "#60a5fa"} />
          <MiniBar label="Walk Score" sub={`${data.walkScore}/100`} value={data.walkScore} max={100} color="#a78bfa" />
        </div>
      </div>

      {/* ── Demographics ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Demographics & Growth</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Population Growth", value: pct(data.populationGrowthYoY) + "/yr", color: data.populationGrowthYoY >= 1 ? "#34d399" : data.populationGrowthYoY >= 0 ? "#60a5fa" : "#f87171" },
            { label: "Job Growth", value: pct(data.jobGrowthYoY) + "/yr", color: data.jobGrowthYoY >= 2 ? "#34d399" : data.jobGrowthYoY >= 0 ? "#60a5fa" : "#f87171" },
            { label: "Median HH Income", value: fmtK(data.medianHouseholdIncome), color: "#a1a1aa" },
            { label: "School Rating", value: `${data.schoolRating.toFixed(1)}/10`, color: data.schoolRating >= 7 ? "#34d399" : data.schoolRating >= 5 ? "#fbbf24" : "#f87171" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-4 py-3 text-center"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-base font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nearby developments ──────────────────────────────────────────────── */}
      {data.nearbyDevelopments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
            Nearby Developments ({data.nearbyDevelopments.length})
          </p>
          <div className="space-y-2">
            {data.nearbyDevelopments.map((dev, i) => (
              <DevCard key={i} dev={dev} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
