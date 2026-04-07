"use client";
import { useState } from "react";
import type { AnalysisResults, PropertyType } from "@/types";
import { fmt$ } from "@/lib/utils";

// ─── Encode / decode ──────────────────────────────────────────────────────────

export function encodeSharePayload(
  label: string,
  propertyType: PropertyType,
  results: AnalysisResults,
): string {
  const ds = results.dealScore;
  const m  = results.metrics;
  const payload = {
    v:       1,
    lbl:     label,
    pt:      propertyType,
    sc:      ds?.score ?? 0,
    cat:     ds?.category ?? "",
    risk:    results.riskScore,
    rec:     results.recommendation,
    mcf:     Math.round(m.monthlyCashFlow),
    coc:     parseFloat((m.cashOnCashReturn * 100).toFixed(2)),
    cr:      parseFloat((m.capRate * 100).toFixed(2)),
    irr:     parseFloat((m.irr * 100).toFixed(1)),
    dscr:    parseFloat(m.debtServiceCoverageRatio.toFixed(2)),
    noi:     Math.round(m.noi),
    ti:      Math.round(m.totalInvestment),
    str:     ds?.strengths  ?? [],
    wk:      ds?.weaknesses ?? [],
    reason:  ds?.reasoning  ?? "",
    recText: ds?.recommendation ?? "",
  };
  try {
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch {
    return "";
  }
}

// ─── Text summary ─────────────────────────────────────────────────────────────

function buildTextSummary(label: string, propertyType: string, results: AnalysisResults): string {
  const m  = results.metrics;
  const ds = results.dealScore;
  const lines = [
    `═══════════════════════════════════`,
    `  REALYTICS DEAL ANALYSIS`,
    `═══════════════════════════════════`,
    `  Property : ${label}`,
    `  Type     : ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}`,
    ``,
    ds ? `  Deal Score  : ${ds.score}/100 — ${ds.category}` : "",
    `  Risk Level  : ${results.riskScore}`,
    `  Verdict     : ${results.recommendation}`,
    ``,
    `  ─── Key Metrics ────────────────`,
    `  Monthly Cash Flow : ${m.monthlyCashFlow >= 0 ? "+" : ""}${fmt$(m.monthlyCashFlow)}`,
    `  Cash-on-Cash      : ${(m.cashOnCashReturn * 100).toFixed(2)}%`,
    `  Cap Rate          : ${(m.capRate * 100).toFixed(2)}%`,
    `  10-Year IRR       : ${(m.irr * 100).toFixed(1)}%`,
    `  NOI               : ${fmt$(m.noi)}`,
    m.debtServiceCoverageRatio > 0 ? `  DSCR              : ${m.debtServiceCoverageRatio.toFixed(2)}×` : "",
    `  Total Invested    : ${fmt$(m.totalInvestment)}`,
    ``,
    ds && ds.reasoning ? `  ─── AI Reasoning ───────────────` : "",
    ds && ds.reasoning ? `  ${ds.reasoning}` : "",
    ``,
    `  Analyzed with Realytics — realytics.app`,
    `═══════════════════════════════════`,
  ].filter(Boolean).join("\n");
  return lines;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareModal({
  isOpen,
  onClose,
  label,
  propertyType,
  results,
}: {
  isOpen:       boolean;
  onClose:      () => void;
  label:        string;
  propertyType: PropertyType;
  results:      AnalysisResults;
}) {
  const [copiedLink, setCopiedLink]   = useState(false);
  const [copiedText, setCopiedText]   = useState(false);

  if (!isOpen) return null;

  const encoded    = encodeSharePayload(label, propertyType, results);
  const shareUrl   = typeof window !== "undefined"
    ? `${window.location.origin}/share?d=${encoded}`
    : `/share?d=${encoded}`;
  const textSummary = buildTextSummary(label, propertyType, results);

  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); }
    catch { /* fallback */ }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyText() {
    try { await navigator.clipboard.writeText(textSummary); }
    catch {}
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

  const ds = results.dealScore;
  const m  = results.metrics;

  const catColor = !ds ? "text-gray-500"
    : ds.category === "Strong Buy" ? "text-emerald-400"
    : ds.category === "Good Deal"  ? "text-blue-400"
    : ds.category === "Risky"      ? "text-amber-400"
    : "text-red-400";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-white border border-gray-300 rounded-2xl shadow-2xl pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900">Share Deal Analysis</h2>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Preview */}
          <div className="px-6 py-5 space-y-4">
            {/* Score + category */}
            {ds && (
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-4xl font-black text-gray-900 leading-none">{ds.score}</p>
                  <p className="text-xs text-gray-600 mt-0.5">/100</p>
                </div>
                <div>
                  <p className={`text-lg font-black ${catColor}`}>{ds.category}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {propertyType} · {results.riskScore} risk
                  </p>
                </div>
              </div>
            )}

            {/* Quick metrics grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Monthly Cash Flow", value: `${m.monthlyCashFlow >= 0 ? "+" : ""}${fmt$(m.monthlyCashFlow)}` },
                { label: "Cash-on-Cash",       value: `${(m.cashOnCashReturn * 100).toFixed(2)}%` },
                { label: "Cap Rate",           value: `${(m.capRate * 100).toFixed(2)}%` },
                { label: "10-Year IRR",        value: `${(m.irr * 100).toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Share URL preview */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Shareable link</p>
              <p className="text-xs text-gray-500 truncate font-mono">{shareUrl}</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={copyLink}
                className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                  copiedLink
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/20"
                }`}
              >
                {copiedLink ? "✓ Copied!" : "🔗 Copy Link"}
              </button>
              <button
                onClick={copyText}
                className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                  copiedText
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300"
                }`}
              >
                {copiedText ? "✓ Copied!" : "📋 Copy Summary"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
