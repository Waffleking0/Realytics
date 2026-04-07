"use client";
import { useState } from "react";
import Link from "next/link";
import type {
  PropertyType,
  AnalysisResult,
  ResidentialInputs,
  LandInputs,
  CommercialInputs,
  MultifamilyInputs,
  DevelopmentInputs,
} from "@/types";
import PropertyTypeSelector from "@/components/PropertyTypeSelector";
import ResidentialForm from "@/components/forms/ResidentialForm";
import MultifamilyForm from "@/components/forms/MultifamilyForm";
import CommercialForm from "@/components/forms/CommercialForm";
import LandForm from "@/components/forms/LandForm";
import DevelopmentForm from "@/components/forms/DevelopmentForm";
import MetricCard from "@/components/dashboard/MetricCard";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import ComparableProperties from "@/components/dashboard/ComparableProperties";
import RiskScore from "@/components/dashboard/RiskScore";
import AIReport from "@/components/dashboard/AIReport";
import Card from "@/components/ui/Card";

type FormInputs =
  | ResidentialInputs
  | LandInputs
  | CommercialInputs
  | MultifamilyInputs
  | DevelopmentInputs;

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

const PT_ICONS: Record<PropertyType, string> = {
  residential: "🏠",
  multifamily: "🏢",
  commercial: "🏬",
  land: "🌳",
  development: "🏗️",
};

export default function Dashboard() {
  const [propertyType, setPropertyType] = useState<PropertyType>("residential");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(inputs: FormInputs) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: propertyType, inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setTimeout(
        () =>
          document
            .getElementById("results-anchor")
            ?.scrollIntoView({ behavior: "smooth" }),
        150
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const r = result?.financialResults;

  return (
    <div className="min-h-screen" style={{ background: "#07080a", color: "#fff" }}>
      {/* Header */}
      <header
        style={{
          background: "rgba(7,8,10,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
        }}
        className="sticky top-0 z-20 h-14 flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
            >
              <span className="text-gray-900 text-xs font-black">R</span>
            </div>
            <span className="text-gray-900 font-bold text-sm">Realytics</span>
          </Link>
          <div className="flex items-center gap-3">
            {result && (
              <button
                onClick={reset}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                style={{
                  background: "#1c2128",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ← New Analysis
              </button>
            )}
            <Link
              href="/saved"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
              style={{
                background: "#1c2128",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Saved Deals
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-5 py-8">
        {/* Property Type Selector */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "#0e0f11",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Step 1 — Select Property Type
          </p>
          <PropertyTypeSelector
            selected={propertyType}
            onChange={(t) => {
              setPropertyType(t);
              setResult(null);
            }}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left: form */}
          <div
            className="lg:sticky lg:top-[72px] rounded-2xl overflow-hidden"
            style={{
              background: "#0e0f11",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-2xl">{PT_ICONS[propertyType]}</span>
              <div>
                <p className="text-sm font-bold text-gray-900 capitalize">
                  {propertyType} Property
                </p>
                <p className="text-xs text-gray-500">
                  Step 2 — Enter deal details
                </p>
              </div>
            </div>
            <div className="p-5">
              {error && (
                <div
                  className="mb-4 rounded-xl px-4 py-3 text-sm text-red-400"
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  {error}
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-blue-300">Analyzing deal…</span>
                </div>
              )}
              {propertyType === "residential" && (
                <ResidentialForm onSubmit={handleSubmit} loading={loading} />
              )}
              {propertyType === "multifamily" && (
                <MultifamilyForm onSubmit={handleSubmit} loading={loading} />
              )}
              {propertyType === "commercial" && (
                <CommercialForm onSubmit={handleSubmit} loading={loading} />
              )}
              {propertyType === "land" && (
                <LandForm onSubmit={handleSubmit} loading={loading} />
              )}
              {propertyType === "development" && (
                <DevelopmentForm onSubmit={handleSubmit} loading={loading} />
              )}
            </div>
          </div>

          {/* Right: results */}
          <div id="results-anchor">
            {result && r ? (
              <div className="space-y-5">
                {/* Recommendation banner */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background:
                      result.aiReport.recommendation === "Buy"
                        ? "rgba(16,185,129,0.08)"
                        : result.aiReport.recommendation === "Hold"
                        ? "rgba(251,191,36,0.08)"
                        : "rgba(248,113,113,0.08)",
                    border:
                      result.aiReport.recommendation === "Buy"
                        ? "1px solid rgba(16,185,129,0.3)"
                        : result.aiReport.recommendation === "Hold"
                        ? "1px solid rgba(251,191,36,0.3)"
                        : "1px solid rgba(248,113,113,0.3)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        AI Recommendation
                      </p>
                      <p
                        className="text-3xl font-black"
                        style={{
                          color:
                            result.aiReport.recommendation === "Buy"
                              ? "#34d399"
                              : result.aiReport.recommendation === "Hold"
                              ? "#fbbf24"
                              : "#f87171",
                        }}
                      >
                        {result.aiReport.recommendation}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {result.aiReport.confidenceScore}%
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-500 mb-1">Market Risk</p>
                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            result.marketAnalysis.riskLevel === "Low"
                              ? "#34d399"
                              : result.marketAnalysis.riskLevel === "Medium"
                              ? "#fbbf24"
                              : "#f87171",
                        }}
                      >
                        {result.marketAnalysis.riskLevel} Risk
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.marketAnalysis.marketStrength} Market
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MetricCard
                    label="Monthly Cash Flow"
                    value={formatCurrency(r.monthlyCashFlow)}
                    sentiment={r.monthlyCashFlow >= 0 ? "positive" : "negative"}
                    trend={r.monthlyCashFlow >= 0 ? "up" : "down"}
                    description="After all expenses & mortgage"
                  />
                  <MetricCard
                    label="Cap Rate"
                    value={formatPct(r.capRate)}
                    sentiment={r.capRate >= 6 ? "positive" : r.capRate >= 4 ? "neutral" : "negative"}
                    description="NOI / Purchase price"
                  />
                  <MetricCard
                    label="Cash-on-Cash"
                    value={formatPct(r.cashOnCashReturn)}
                    sentiment={r.cashOnCashReturn >= 8 ? "positive" : r.cashOnCashReturn >= 5 ? "neutral" : "negative"}
                    trend={r.cashOnCashReturn >= 0 ? "up" : "down"}
                    description="Annual return on invested cash"
                  />
                  <MetricCard
                    label="NOI"
                    value={formatCurrency(r.noi)}
                    sentiment={r.noi >= 0 ? "positive" : "negative"}
                    description="Net Operating Income"
                  />
                  <MetricCard
                    label="10-Year IRR"
                    value={formatPct(r.irr)}
                    sentiment={r.irr >= 12 ? "positive" : r.irr >= 8 ? "neutral" : "negative"}
                    description="Internal rate of return"
                  />
                  <MetricCard
                    label="Total Investment"
                    value={formatCurrency(r.totalInvestment)}
                    sentiment="neutral"
                    description="Total cash deployed"
                  />
                </div>

                {/* Cash flow chart */}
                <Card title="10-Year Cash Flow Projection" glass>
                  <CashFlowChart projections={result.projections} />
                </Card>

                {/* Risk score */}
                <Card title="Market Risk Analysis" glass>
                  <RiskScore marketAnalysis={result.marketAnalysis} />
                </Card>

                {/* Comparable properties */}
                {result.comparables.length > 0 && (
                  <Card title="Comparable Properties" glass>
                    <ComparableProperties comparables={result.comparables} />
                  </Card>
                )}

                {/* AI Report */}
                <Card title="AI Investment Report" glass>
                  <AIReport report={result.aiReport} />
                </Card>
              </div>
            ) : (
              /* Empty state */
              <div
                className="flex flex-col items-center justify-center min-h-[480px] rounded-2xl text-center"
                style={{
                  background: "#0e0f11",
                  border: "1px dashed rgba(255,255,255,0.08)",
                }}
              >
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Ready to analyze
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Fill in the form on the left and click &quot;Analyze Deal&quot; to get your
                  full investment report.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-2 text-left max-w-xs w-full">
                  {[
                    ["💵", "Cash Flow Analysis"],
                    ["📐", "Cap Rate & NOI"],
                    ["📈", "10-Year IRR"],
                    ["⚖️", "Risk Scoring"],
                    ["🏘️", "Comparable Sales"],
                    ["🤖", "AI Report"],
                  ].map(([icon, label]) => (
                    <div
                      key={label as string}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
