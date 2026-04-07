/**
 * /report?d=<base64> — Print-to-PDF investment report.
 * Opens in new tab, auto-triggers browser print dialog.
 * User saves as PDF from the print dialog.
 */
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { AnalysisResults, PropertyType, ComparableProperty } from "@/types";

interface ReportPayload {
  label: string;
  propertyType: PropertyType;
  results: AnalysisResults;
  comps?: ComparableProperty[];
}

function decode(d: string): ReportPayload | null {
  try {
    return JSON.parse(atob(d));
  } catch {
    return null;
  }
}

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number, d = 2) { return `${(n * 100).toFixed(d)}%`; }
function sign(n: number) { return n >= 0 ? "+" : ""; }

function ReportContent() {
  const params = useSearchParams();
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const d = params.get("d");
    if (!d) { setError(true); return; }
    const p = decode(d);
    if (!p) { setError(true); return; }
    setPayload(p);
  }, [params]);

  useEffect(() => {
    if (payload) {
      // Slight delay to let the DOM render before print dialog
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [payload]);

  if (error) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Invalid report link.</div>;
  }
  if (!payload) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#888" }}>Loading report…</div>;
  }

  const { label, propertyType, results, comps } = payload;
  const m = results.metrics;
  const ds = results.dealScore;

  const catColor = !ds ? "#333"
    : ds.category === "Strong Buy" ? "#10b981"
    : ds.category === "Good Deal"  ? "#3b82f6"
    : ds.category === "Risky"      ? "#f59e0b"
    : "#ef4444";

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      {/* Print styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        .page { max-width: 860px; margin: 0 auto; padding: 48px 40px; }
        .header { border-bottom: 3px solid #1e293b; padding-bottom: 24px; margin-bottom: 32px; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .logo-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg,#3b82f6,#6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 16px; }
        .logo-text { font-size: 18px; font-weight: 800; color: #0f172a; }
        .report-title { font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 16px; }
        .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 13px; color: #64748b; }
        .section { margin-bottom: 36px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .score-block { display: flex; align-items: center; gap: 32px; padding: 24px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .score-number { font-size: 64px; font-weight: 900; line-height: 1; }
        .score-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .category { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-top: 8px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .metric-card { padding: 16px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .metric-value { font-size: 22px; font-weight: 800; color: #0f172a; }
        .metric-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        .reasoning { padding: 16px; border-radius: 10px; background: #f0f9ff; border: 1px solid #bae6fd; font-size: 13px; line-height: 1.65; color: #334155; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .strength-box { padding: 14px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; }
        .weakness-box { padding: 14px; border-radius: 10px; background: #fff7ed; border: 1px solid #fed7aa; }
        .sw-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .sw-item { display: flex; gap: 8px; font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 6px; }
        .comps-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .comps-table th { background: #f1f5f9; font-weight: 700; text-align: left; padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .comps-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .breakdown-item { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .breakdown-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .breakdown-fill { height: 100%; border-radius: 999px; }
        .rec-box { padding: 18px 22px; border-radius: 12px; background: #0f172a; color: #fff; }
        .rec-verdict { font-size: 22px; font-weight: 900; }
        .rec-text { font-size: 13px; color: #94a3b8; margin-top: 6px; line-height: 1.5; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1e293b; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; z-index: 999; }
        .footer { border-top: 1px solid #e2e8f0; margin-top: 48px; padding-top: 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
      `}</style>

      {/* Print button (hidden when printing) */}
      <button className="print-btn no-print" onClick={() => window.print()}>
        🖨 Print / Save PDF
      </button>

      <div className="page">

        {/* Header */}
        <div className="header">
          <div className="logo">
            <div className="logo-mark">R</div>
            <span className="logo-text">Realytics</span>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>AI-Powered Real Estate Investment Analysis</p>
          <h1 className="report-title">{label}</h1>
          <div className="meta">
            <span>Type: {propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</span>
            <span>Generated: {today}</span>
            <span>Risk: {results.riskScore}</span>
            <span>Recommendation: {results.recommendation}</span>
          </div>
        </div>

        {/* Score */}
        {ds && (
          <div className="section">
            <div className="score-block">
              <div>
                <div className="score-number" style={{ color: catColor }}>{ds.score}</div>
                <div className="score-sub">Realytics Score™ out of 100</div>
                <div className="category" style={{ background: `${catColor}18`, color: catColor }}>{ds.category}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="reasoning">{ds.reasoning}</div>
              </div>
            </div>

            {/* Score breakdown bars */}
            <div className="section-title">Score Breakdown</div>
            {(Object.entries(ds.breakdown) as any[]).map(([key, dim]: [string, any]) => {
              const pct = (dim.points / dim.max) * 100;
              const barColor = pct >= 75 ? "#10b981" : pct >= 50 ? "#3b82f6" : pct >= 30 ? "#f59e0b" : "#ef4444";
              const labels: Record<string, string> = {
                roi: "ROI / Cash-on-Cash", cashFlow: "Monthly Cash Flow", capRate: "Cap Rate",
                marketGrowth: "Market Growth", vacancy: "Vacancy Rate", risk: "Risk / DSCR", upside: "Upside / IRR",
              };
              return (
                <div key={key} className="breakdown-item">
                  <span style={{ fontSize: 12, color: "#475569", width: 160 }}>{labels[key] ?? key}</span>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", width: 50, textAlign: "right" }}>
                    {dim.points}/{dim.max}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Financial metrics */}
        <div className="section">
          <div className="section-title">Financial Metrics</div>
          <div className="metrics-grid">
            {[
              { label: "Monthly Cash Flow", value: fmt$(m.monthlyCashFlow) },
              { label: "Annual Cash Flow", value: fmt$(m.annualCashFlow) },
              { label: "Cash-on-Cash Return", value: fmtPct(m.cashOnCashReturn) },
              { label: "Cap Rate", value: fmtPct(m.capRate) },
              { label: "10-Year IRR", value: fmtPct(m.irr) },
              { label: "Net Operating Income", value: fmt$(m.noi) },
              { label: "Total Invested", value: fmt$(m.totalInvestment) },
              { label: "DSCR", value: m.debtServiceCoverageRatio > 0 ? `${m.debtServiceCoverageRatio.toFixed(2)}×` : "N/A" },
              { label: "Break-Even Occupancy", value: `${m.breakEvenOccupancy.toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="metric-card">
                <div className="metric-value">{value}</div>
                <div className="metric-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        {ds && (ds.strengths.length > 0 || ds.weaknesses.length > 0) && (
          <div className="section">
            <div className="section-title">Investment Signals</div>
            <div className="two-col">
              <div className="strength-box">
                <div className="sw-title" style={{ color: "#16a34a" }}>Strengths</div>
                {ds.strengths.map((s: string, i: number) => (
                  <div key={i} className="sw-item">
                    <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="weakness-box">
                <div className="sw-title" style={{ color: "#ea580c" }}>Risks & Weaknesses</div>
                {ds.weaknesses.map((w: string, i: number) => (
                  <div key={i} className="sw-item">
                    <span style={{ color: "#ea580c", flexShrink: 0 }}>✗</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comparable sales */}
        {comps && comps.length > 0 && (
          <div className="section page-break">
            <div className="section-title">Smart Comps™ — Comparable Properties</div>
            <table className="comps-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Price</th>
                  <th>$/SqFt</th>
                  <th>SqFt</th>
                  <th>Cap Rate</th>
                  <th>Rent/mo</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                {comps.slice(0, 8).map(c => (
                  <tr key={c.id}>
                    <td>{c.address}</td>
                    <td>{fmt$(c.price)}</td>
                    <td>{c.pricePerSqft ? `$${c.pricePerSqft.toFixed(0)}` : "—"}</td>
                    <td>{c.size ? c.size.toLocaleString() : "—"}</td>
                    <td>{c.capRate ? `${(c.capRate * 100).toFixed(1)}%` : "—"}</td>
                    <td>{c.monthlyRent ? fmt$(c.monthlyRent) : "—"}</td>
                    <td>{c.similarity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recommendation */}
        {ds && (
          <div className="section">
            <div className="section-title">Analyst Recommendation</div>
            <div className="rec-box">
              <div className="rec-verdict" style={{ color: catColor }}>
                {results.recommendation} — {ds.category}
              </div>
              <div className="rec-text">{ds.recommendation}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span>Generated by Realytics · realytics.app</span>
          <span>For informational purposes only. Not financial advice.</span>
          <span>{today}</span>
        </div>

      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "sans-serif", color: "#888" }}>Loading report…</div>}>
      <ReportContent />
    </Suspense>
  );
}
