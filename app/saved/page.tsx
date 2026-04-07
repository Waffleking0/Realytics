"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useSavedDeals, type SavedDeal } from "@/lib/hooks/useSavedDeals";
import type { DealCategory } from "@/lib/analysis/dealScore";
import { fmt$ } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────

const PT_META: Record<string, { icon: string; label: string }> = {
  residential: { icon:"🏠", label:"Residential" },
  multifamily: { icon:"🏢", label:"Multifamily" },
  commercial:  { icon:"🏬", label:"Commercial"  },
  land:        { icon:"🌳", label:"Land"         },
  development: { icon:"🏗️", label:"Development"  },
};

const CAT_META: Record<string, { color: string; bg: string; border: string }> = {
  "Strong Buy": { color:"#818cf8", bg:"rgba(129,140,248,0.1)",  border:"rgba(129,140,248,0.25)" },
  "Good Deal":  { color:"#60a5fa", bg:"rgba(96,165,250,0.1)",   border:"rgba(96,165,250,0.25)"  },
  "Risky":      { color:"#fbbf24", bg:"rgba(251,191,36,0.1)",   border:"rgba(251,191,36,0.25)"  },
  "Pass":       { color:"#f87171", bg:"rgba(248,113,113,0.1)",  border:"rgba(248,113,113,0.25)" },
};

const RISK_META: Record<string, { color: string }> = {
  Low:    { color:"#34d399" },
  Medium: { color:"#fbbf24" },
  High:   { color:"#f87171" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month:"short", day:"numeric", year:"numeric",
  });
}

function ScoreRing({ score, category }: { score: number; category: string }) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = CAT_META[category]?.color ?? "#818cf8";
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="-rotate-90 w-full h-full" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${fill} ${circ}`}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-gray-900">{score}</span>
      </div>
    </div>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  deal, onDelete,
}: {
  deal: SavedDeal;
  onDelete: (id: string) => void;
}) {
  const pt     = PT_META[deal.propertyType] ?? PT_META.residential;
  const ds     = deal.results.dealScore;
  const m      = deal.results.metrics;
  const cat    = ds?.category as DealCategory | undefined;
  const catCfg = cat ? (CAT_META[cat] ?? CAT_META["Pass"]) : null;
  const riskColor = RISK_META[deal.results.riskScore as any]?.color ?? "#a1a1aa";

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ background:"#0e0f11", border:"1px solid rgba(255,255,255,0.07)" }}>
      {catCfg && (
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background:`radial-gradient(ellipse at top left, ${catCfg.bg} 0%, transparent 55%)` }} />
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            {pt.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{deal.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-600">{pt.label}</span>
              <span className="text-zinc-800">·</span>
              <span className="text-xs text-zinc-600">{formatDate(deal.savedAt)}</span>
            </div>
          </div>
          {ds && <ScoreRing score={ds.score} category={ds.category} />}
        </div>

        {/* Category + risk row */}
        <div className="flex items-center gap-2 mb-4">
          {cat && catCfg && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background:catCfg.bg, border:`1px solid ${catCfg.border}`, color:catCfg.color }}>
              {cat}
            </span>
          )}
          <span className="text-[11px] font-semibold" style={{ color:riskColor }}>
            {deal.results.riskScore} Risk
          </span>
          <span className="ml-auto text-[11px] font-semibold" style={{
            color: deal.results.recommendation === "Buy" ? "#34d399"
              : deal.results.recommendation === "Hold" ? "#60a5fa" : "#f87171"
          }}>
            {deal.results.recommendation}
          </span>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:"Cash/mo", value:`${m.monthlyCashFlow >= 0 ? "+" : ""}${fmt$(m.monthlyCashFlow)}` },
            { label:"CoC",     value:`${(m.cashOnCashReturn * 100).toFixed(1)}%` },
            { label:"Cap Rate",value:`${(m.capRate * 100).toFixed(1)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2 text-center"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[9px] text-zinc-600 mb-0.5">{label}</p>
              <p className="text-xs font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href="/dashboard"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("loadDeal", deal.id);
              }
            }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all duration-200"
            style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.25)", color:"#818cf8" }}>
            View Analysis
          </Link>
          <button onClick={() => onDelete(deal.id)}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort / filter bar ────────────────────────────────────────────────────────

type SortKey = "date" | "score" | "cashflow";
type FilterKey = "all" | "residential" | "multifamily" | "commercial" | "land" | "development";

function ToolBar({
  search, setSearch,
  sort, setSort,
  filter, setFilter,
  count,
}: {
  search: string; setSearch:(v:string)=>void;
  sort: SortKey;  setSort:(v:SortKey)=>void;
  filter: FilterKey; setFilter:(v:FilterKey)=>void;
  count: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by address or type…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder-zinc-700 outline-none focus:border-indigo-500/50 transition-colors"
          style={{ background:"#0e0f11", border:"1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* Sort */}
      <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
        className="px-4 py-2.5 rounded-xl text-sm text-zinc-300 outline-none cursor-pointer"
        style={{ background:"#0e0f11", border:"1px solid rgba(255,255,255,0.08)" }}>
        <option value="date">Sort: Newest</option>
        <option value="score">Sort: Highest Score</option>
        <option value="cashflow">Sort: Best Cash Flow</option>
      </select>

      {/* Filter */}
      <select value={filter} onChange={e => setFilter(e.target.value as FilterKey)}
        className="px-4 py-2.5 rounded-xl text-sm text-zinc-300 outline-none cursor-pointer"
        style={{ background:"#0e0f11", border:"1px solid rgba(255,255,255,0.08)" }}>
        <option value="all">All Types ({count})</option>
        <option value="residential">🏠 Residential</option>
        <option value="multifamily">🏢 Multifamily</option>
        <option value="commercial">🏬 Commercial</option>
        <option value="land">🌳 Land</option>
        <option value="development">🏗️ Development</option>
      </select>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ deals }: { deals: SavedDeal[] }) {
  if (deals.length === 0) return null;

  const withScore   = deals.filter(d => d.results.dealScore);
  const avgScore    = withScore.length
    ? Math.round(withScore.reduce((s, d) => s + (d.results.dealScore?.score ?? 0), 0) / withScore.length)
    : 0;
  const bestCF      = Math.max(...deals.map(d => d.results.metrics.monthlyCashFlow));
  const strongBuys  = deals.filter(d => d.results.dealScore?.category === "Strong Buy").length;

  const stats = [
    { label:"Saved Deals",     value:`${deals.length}`,         color:"#818cf8" },
    { label:"Average Score",   value:`${avgScore}/100`,          color:"#60a5fa" },
    { label:"Best Cash Flow",  value:`+${fmt$(bestCF)}/mo`,      color:"#34d399" },
    { label:"Strong Buys",     value:`${strongBuys}`,            color:"#fbbf24" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="rounded-xl p-4 text-center"
          style={{ background:"#0e0f11", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xl font-black mb-0.5" style={{ color }}>{value}</p>
          <p className="text-xs text-zinc-600">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedDealsPage() {
  const { deals, removeDeal, clearAll, isHydrated } = useSavedDeals();
  const [search, setSearch]   = useState("");
  const [sort,   setSort]     = useState<SortKey>("date");
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const processed = useMemo(() => {
    let list = [...deals];

    // Filter by type
    if (filter !== "all") list = list.filter(d => d.propertyType === filter);

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.label.toLowerCase().includes(q) ||
        d.propertyType.includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "score") {
        return (b.results.dealScore?.score ?? 0) - (a.results.dealScore?.score ?? 0);
      }
      if (sort === "cashflow") {
        return b.results.metrics.monthlyCashFlow - a.results.metrics.monthlyCashFlow;
      }
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

    return list;
  }, [deals, search, sort, filter]);

  return (
    <div className="min-h-screen" style={{ background:"#07080a" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-14 flex items-center"
        style={{ background:"rgba(7,8,10,0.9)", borderBottom:"1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(24px)" }}>
        <div className="max-w-6xl w-full mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                <span className="text-gray-900 text-xs font-black">R</span>
              </div>
              <span className="text-gray-900 font-bold text-sm hidden sm:block">Realytics</span>
            </Link>
            <div className="w-px h-5 bg-white/10 hidden sm:block" />
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">Saved Deals</span>
          </div>
          <Link href="/dashboard"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-900 transition-all duration-200"
            style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow:"0 4px 16px rgba(99,102,241,0.25)" }}>
            + New Analysis
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Saved Deals</h1>
            <p className="text-sm text-zinc-500">
              {isHydrated
                ? `${deals.length} deal${deals.length !== 1 ? "s" : ""} saved across all property types`
                : "Loading…"}
            </p>
          </div>
          {deals.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Are you sure?</span>
                <button onClick={() => { clearAll(); setConfirmClear(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 transition-colors"
                  style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
                  Yes, clear all
                </button>
                <button onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 transition-colors"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                Clear all
              </button>
            )
          )}
        </div>

        {/* Stats bar */}
        <StatsBar deals={deals} />

        {/* Toolbar */}
        {deals.length > 0 && (
          <ToolBar
            search={search} setSearch={setSearch}
            sort={sort} setSort={setSort}
            filter={filter} setFilter={setFilter}
            count={deals.length}
          />
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        {!isHydrated ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>

        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
              style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)" }}>
              📁
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No saved deals yet</h3>
            <p className="text-sm text-zinc-500 max-w-[280px] leading-relaxed mb-8">
              Run an analysis and click "Save Deal" to build your deal library here.
            </p>
            <Link href="/dashboard"
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-900 transition-all duration-200 hover:-translate-y-0.5"
              style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow:"0 8px 24px rgba(99,102,241,0.25)" }}>
              Analyze your first deal →
            </Link>
          </div>

        ) : processed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm">No deals match your filters.</p>
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Clear filters
            </button>
          </div>

        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {processed.map(deal => (
              <DealCard key={deal.id} deal={deal} onDelete={removeDeal} />
            ))}
          </div>
        )}

        {/* CTA if has deals */}
        {deals.length > 0 && (
          <div className="mt-12 text-center py-8 rounded-2xl"
            style={{ background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.1)" }}>
            <p className="text-sm text-zinc-500 mb-4">Ready to analyze another deal?</p>
            <Link href="/dashboard"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all duration-200 hover:-translate-y-0.5"
              style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow:"0 6px 20px rgba(99,102,241,0.25)" }}>
              + New Analysis
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
