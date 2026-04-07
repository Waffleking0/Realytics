/**
 * risk.ts — Scoring system that evaluates deal risk and market strength.
 * Returns a Risk Score (Low / Medium / High) and a recommendation (Buy / Hold / Pass).
 */
import type { CoreMetrics, PropertyType, AnalysisResults } from "@/types";

interface RiskFactors {
  dscr: number;           // Debt Service Coverage Ratio
  cashOnCash: number;     // Cash-on-cash return (decimal)
  capRate: number;        // Cap rate (decimal)
  vacancyRate: number;    // Vacancy rate %
  ltv: number;            // Loan-to-value %
  irr: number;            // IRR (decimal)
}

/**
 * Score each metric 0–100, weight them, return aggregate risk.
 */
export function scoreRisk(
  metrics: CoreMetrics,
  propertyType: PropertyType,
  vacancyRatePct: number,
  ltvPct: number
): { riskScore: "Low" | "Medium" | "High"; marketStrength: "Weak" | "Moderate" | "Strong"; recommendation: "Buy" | "Hold" | "Pass" } {

  let score = 0; // 0 = very risky, 100 = very safe

  // ── DSCR (25 pts) ─────────────────────────────────────────────
  // >1.25 = safe, 1.0–1.25 = moderate, <1.0 = risky
  if ((metrics.debtServiceCoverageRatio ?? 0) >= 1.25) score += 25;
  else if ((metrics.debtServiceCoverageRatio ?? 0) >= 1.0) score += 15;
  else if ((metrics.debtServiceCoverageRatio ?? 0) >= 0.85) score += 5;

  // ── Cash-on-Cash (20 pts) ─────────────────────────────────────
  // >8% = excellent, 5–8% = good, 2–5% = fair, <2% = poor
  const coc = metrics.cashOnCashReturn * 100;
  if (coc >= 8) score += 20;
  else if (coc >= 5) score += 14;
  else if (coc >= 2) score += 7;

  // ── Cap Rate (15 pts) ─────────────────────────────────────────
  const cr = metrics.capRate * 100;
  const goodCapRate = propertyType === "commercial" ? 6 : propertyType === "multifamily" ? 5 : 5.5;
  if (cr >= goodCapRate + 1.5) score += 15;
  else if (cr >= goodCapRate) score += 10;
  else if (cr >= goodCapRate - 1) score += 5;

  // ── Vacancy (15 pts) ──────────────────────────────────────────
  if (vacancyRatePct <= 3) score += 15;
  else if (vacancyRatePct <= 7) score += 10;
  else if (vacancyRatePct <= 10) score += 5;

  // ── LTV (15 pts) ──────────────────────────────────────────────
  if (ltvPct <= 65) score += 15;
  else if (ltvPct <= 75) score += 10;
  else if (ltvPct <= 80) score += 6;

  // ── IRR (10 pts) ──────────────────────────────────────────────
  const irrPct = metrics.irr * 100;
  if (irrPct >= 15) score += 10;
  else if (irrPct >= 10) score += 7;
  else if (irrPct >= 6) score += 3;

  // ── Risk classification ───────────────────────────────────────
  const riskScore: "Low" | "Medium" | "High" =
    score >= 70 ? "Low" : score >= 45 ? "Medium" : "High";

  // ── Market strength (mock — would use census / economic APIs) ─
  const marketStrength: "Weak" | "Moderate" | "Strong" =
    score >= 65 ? "Strong" : score >= 40 ? "Moderate" : "Weak";

  // ── Recommendation ────────────────────────────────────────────
  let recommendation: "Buy" | "Hold" | "Pass";
  if (score >= 65 && metrics.cashOnCashReturn >= 0.05) recommendation = "Buy";
  else if (score >= 40) recommendation = "Hold";
  else recommendation = "Pass";

  return { riskScore, marketStrength, recommendation };
}
