"use client";
import type { SavedDeal } from "@/lib/hooks/useSavedDeals";
import type { DealCategory } from "@/lib/analysis/dealScore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  residential: "🏠",
  multifamily: "🏢",
  commercial:  "🏬",
  land:        "🌳",
  development: "🏗️",
};

const CAT_STYLE: Record<string, string> = {
  "Strong Buy": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "Good Deal":  "bg-blue-500/15    text-blue-400    border-blue-500/25",
  "Risky":      "bg-amber-500/15   text-amber-400   border-amber-500/25",
  "Pass":       "bg-red-500/15     text-red-400     border-red-500/25",
};

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  deal, onLoad, onDelete,
}: {
  deal: SavedDeal;
  onLoad:   (d: SavedDeal) => void;
  onDelete: (id: string)   => void;
}) {
  const score    = deal.results.dealScore?.score;
  const category = deal.results.dealScore?.category as DealCategory | undefined;
  const catStyle = category ? (CAT_STYLE[category] ?? CAT_STYLE["Pass"]) : "";
  const icon     = TYPE_ICON[deal.propertyType] ?? "🏠";
  const metrics  = deal.results.metrics;

  return (
    <div className="group rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-gray-300 transition-colors">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{deal.label}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">
            {deal.propertyType} · {relativeDate(deal.savedAt)}
          </p>
        </div>
        {score !== undefined && (
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-gray-900 leading-none">{score}</p>
            <p className="text-[10px] text-gray-600">/100</p>
          </div>
        )}
      </div>

      {/* Category badge */}
      {category && (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-3 ${catStyle}`}>
          {category}
        </span>
      )}

      {/* Quick metrics */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="bg-gray-100/60 rounded-lg p-2 text-center">
          <p className="text-xs font-bold text-gray-900">
            {metrics.monthlyCashFlow >= 0 ? "+" : ""}
            ${Math.abs(Math.round(metrics.monthlyCashFlow)).toLocaleString()}
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">Cash/mo</p>
        </div>
        <div className="bg-gray-100/60 rounded-lg p-2 text-center">
          <p className="text-xs font-bold text-gray-900">
            {(metrics.cashOnCashReturn * 100).toFixed(1)}%
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">CoC</p>
        </div>
        <div className="bg-gray-100/60 rounded-lg p-2 text-center">
          <p className="text-xs font-bold text-gray-900">
            {(metrics.capRate * 100).toFixed(1)}%
          </p>
          <p className="text-[9px] text-gray-600 mt-0.5">Cap Rate</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onLoad(deal)}
          className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/20 transition-colors"
        >
          Load
        </button>
        <button
          onClick={() => onDelete(deal.id)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function SavedDealsDrawer({
  deals,
  isOpen,
  onClose,
  onLoad,
  onDelete,
  onClear,
}: {
  deals:    SavedDeal[];
  isOpen:   boolean;
  onClose:  () => void;
  onLoad:   (d: SavedDeal) => void;
  onDelete: (id: string)   => void;
  onClear:  () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-gray-200 z-50
          flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Saved Deals</h2>
            <p className="text-xs text-gray-500 mt-0.5">{deals.length} of 25 slots used</p>
          </div>
          <div className="flex items-center gap-3">
            {deals.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Deal list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <span className="text-4xl mb-4">📁</span>
              <p className="text-sm font-medium text-gray-500 mb-1">No saved deals yet</p>
              <p className="text-xs text-gray-600 max-w-[200px]">
                After running an analysis, click "Save Deal" to store it here.
              </p>
            </div>
          ) : (
            deals.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                onLoad={(d) => { onLoad(d); onClose(); }}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
