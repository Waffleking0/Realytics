/**
 * dealScore.ts — Deal Scoring Algorithm for Realytics
 *
 * Takes 7 core investment signals, scores each on a weighted scale,
 * and returns a 0–100 score with a plain-English explanation.
 *
 * Weight breakdown (totals 100 pts):
 *   ROI / Cash-on-Cash   20 pts  — direct return on dollars invested
 *   Cash Flow            20 pts  — monthly income after all expenses
 *   Cap Rate             15 pts  — asset-level yield independent of financing
 *   Market Growth Rate   15 pts  — macro tailwind (appreciation + rent growth)
 *   Vacancy Rate         15 pts  — demand signal and income stability
 *   Risk Factors         10 pts  — DSCR, LTV, and risk profile
 *   Upside Potential      5 pts  — IRR spread, below-market rent, value-add
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DealScoreInputs {
  /** Cash-on-cash return as a decimal. e.g. 0.08 = 8% */
  roi: number;
  /** Monthly net cash flow in dollars */
  monthlyCashFlow: number;
  /** Cap rate as a decimal. e.g. 0.065 = 6.5% */
  capRate: number;
  /** Expected annual market growth / appreciation rate as a decimal */
  marketGrowthRate: number;
  /** Vacancy rate as a percentage. e.g. 5 = 5% */
  vacancyRate: number;
  /** Pre-computed risk classification */
  riskScore: "Low" | "Medium" | "High";
  /** Debt Service Coverage Ratio — NOI / annual debt service */
  dscr: number;
  /** IRR as a decimal. e.g. 0.14 = 14% */
  irr: number;
  /** Optional: override upside potential classification */
  upsidePotential?: "Low" | "Medium" | "High";
}

export interface ScoreBreakdown {
  roi:          { points: number; max: number; label: string };
  cashFlow:     { points: number; max: number; label: string };
  capRate:      { points: number; max: number; label: string };
  marketGrowth: { points: number; max: number; label: string };
  vacancy:      { points: number; max: number; label: string };
  risk:         { points: number; max: number; label: string };
  upside:       { points: number; max: number; label: string };
}

export type DealCategory = "Strong Buy" | "Good Deal" | "Risky" | "Pass";

export interface DealScoreResult {
  /** Final score 0–100 */
  score: number;
  /** Deal category based on score */
  category: DealCategory;
  /** Points earned per dimension */
  breakdown: ScoreBreakdown;
  /** Plain-English narrative of what drives the score */
  reasoning: string;
  /** Top positive signals */
  strengths: string[];
  /** Top negative signals */
  weaknesses: string[];
  /** One-line investor recommendation */
  recommendation: string;
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreROI(roi: number): { points: number; label: string } {
  const pct = roi * 100;
  if (pct >= 12) return { points: 20, label: "Exceptional (≥12%)" };
  if (pct >= 8)  return { points: 16, label: "Strong (8–12%)" };
  if (pct >= 5)  return { points: 11, label: "Adequate (5–8%)" };
  if (pct >= 2)  return { points: 5,  label: "Weak (2–5%)" };
  return               { points: 0,  label: "Poor (<2% or negative)" };
}

function scoreCashFlow(monthly: number): { points: number; label: string } {
  if (monthly >= 1500) return { points: 20, label: `Strong positive ($${monthly.toFixed(0)}/mo)` };
  if (monthly >= 500)  return { points: 15, label: `Positive ($${monthly.toFixed(0)}/mo)` };
  if (monthly >= 0)    return { points: 7,  label: `Break-even ($${monthly.toFixed(0)}/mo)` };
  if (monthly >= -300) return { points: 2,  label: `Slightly negative ($${monthly.toFixed(0)}/mo)` };
  return                      { points: 0,  label: `Negative cash flow ($${monthly.toFixed(0)}/mo)` };
}

function scoreCapRate(capRate: number): { points: number; label: string } {
  const pct = capRate * 100;
  if (pct >= 8)  return { points: 15, label: `High yield (${pct.toFixed(2)}%)` };
  if (pct >= 6)  return { points: 11, label: `Market rate (${pct.toFixed(2)}%)` };
  if (pct >= 4)  return { points: 7,  label: `Below market (${pct.toFixed(2)}%)` };
  if (pct >= 2)  return { points: 3,  label: `Low yield (${pct.toFixed(2)}%)` };
  return                { points: 0,  label: `Negligible cap rate (${pct.toFixed(2)}%)` };
}

function scoreMarketGrowth(rate: number): { points: number; label: string } {
  const pct = rate * 100;
  if (pct >= 5)   return { points: 15, label: `Hot market (${pct.toFixed(1)}% growth)` };
  if (pct >= 3)   return { points: 12, label: `Healthy growth (${pct.toFixed(1)}%)` };
  if (pct >= 1)   return { points: 7,  label: `Moderate growth (${pct.toFixed(1)}%)` };
  if (pct >= 0)   return { points: 3,  label: `Flat market (${pct.toFixed(1)}%)` };
  return                 { points: 0,  label: `Declining market (${pct.toFixed(1)}%)` };
}

function scoreVacancy(rate: number): { points: number; label: string } {
  if (rate <= 3)  return { points: 15, label: `Very low vacancy (${rate}%)` };
  if (rate <= 5)  return { points: 12, label: `Low vacancy (${rate}%)` };
  if (rate <= 8)  return { points: 8,  label: `Average vacancy (${rate}%)` };
  if (rate <= 12) return { points: 3,  label: `Elevated vacancy (${rate}%)` };
  return                 { points: 0,  label: `High vacancy (${rate}%)` };
}

function scoreRisk(
  riskScore: "Low" | "Medium" | "High",
  dscr: number
): { points: number; label: string } {
  // Risk profile (7 pts) + DSCR bonus (3 pts)
  const riskPts = riskScore === "Low" ? 7 : riskScore === "Medium" ? 4 : 0;
  const dscrPts = dscr >= 1.25 ? 3 : dscr >= 1.0 ? 1 : 0;
  const total   = riskPts + dscrPts;
  const dscrLabel = dscr > 0 ? `, DSCR ${dscr.toFixed(2)}` : "";
  return { points: total, label: `${riskScore} risk${dscrLabel}` };
}

function scoreUpside(
  irr: number,
  capRate: number,
  override?: "Low" | "Medium" | "High"
): { points: number; label: string } {
  // Derive upside from IRR vs cap rate spread unless overridden
  let potential: "Low" | "Medium" | "High";

  if (override) {
    potential = override;
  } else {
    const irrPct    = irr * 100;
    const spreadPct = (irr - capRate) * 100; // leverage + appreciation premium
    if (irrPct >= 15 || spreadPct >= 6) potential = "High";
    else if (irrPct >= 10 || spreadPct >= 3) potential = "Medium";
    else potential = "Low";
  }

  const map: Record<string, { points: number; label: string }> = {
    High:   { points: 5, label: `High upside (IRR ${(irr * 100).toFixed(1)}%)` },
    Medium: { points: 3, label: `Moderate upside (IRR ${(irr * 100).toFixed(1)}%)` },
    Low:    { points: 1, label: `Limited upside (IRR ${(irr * 100).toFixed(1)}%)` },
  };
  return map[potential];
}

// ─── Category thresholds ──────────────────────────────────────────────────────

function toCategory(score: number): DealCategory {
  if (score >= 74) return "Strong Buy";
  if (score >= 54) return "Good Deal";
  if (score >= 35) return "Risky";
  return "Pass";
}

// ─── Plain-English reasoning ──────────────────────────────────────────────────

function buildReasoning(
  inputs: DealScoreInputs,
  score: number,
  category: DealCategory,
  bd: ScoreBreakdown
): { reasoning: string; strengths: string[]; weaknesses: string[]; recommendation: string } {

  const strengths:  string[] = [];
  const weaknesses: string[] = [];

  // Identify top strengths
  if (bd.roi.points >= 16)         strengths.push(`Outstanding ROI of ${(inputs.roi * 100).toFixed(1)}% — well above the 8% benchmark`);
  else if (bd.roi.points >= 11)    strengths.push(`Solid cash-on-cash return of ${(inputs.roi * 100).toFixed(1)}%`);

  if (bd.cashFlow.points >= 15)    strengths.push(`Strong monthly cash flow of $${inputs.monthlyCashFlow.toFixed(0)} generates reliable income`);
  else if (bd.cashFlow.points >= 7 && inputs.monthlyCashFlow >= 0)
                                   strengths.push(`Property breaks even or produces modest positive cash flow`);

  if (bd.capRate.points >= 11)     strengths.push(`Cap rate of ${(inputs.capRate * 100).toFixed(2)}% is at or above market — asset is well-priced`);
  if (bd.marketGrowth.points >= 12)strengths.push(`${(inputs.marketGrowthRate * 100).toFixed(1)}% market growth rate signals strong appreciation tailwind`);
  if (bd.vacancy.points >= 12)     strengths.push(`Low vacancy of ${inputs.vacancyRate}% reflects strong rental demand in this area`);
  if (bd.risk.points >= 8)         strengths.push(`Low-risk profile with DSCR of ${inputs.dscr.toFixed(2)} — comfortable coverage of debt obligations`);
  if (bd.upside.points >= 5)       strengths.push(`High upside potential with ${(inputs.irr * 100).toFixed(1)}% projected IRR`);

  // Identify weaknesses
  if (bd.roi.points <= 5)          weaknesses.push(`Cash-on-cash return of ${(inputs.roi * 100).toFixed(1)}% is below the minimum 5% threshold most investors require`);
  if (inputs.monthlyCashFlow < 0)  weaknesses.push(`Negative cash flow of $${inputs.monthlyCashFlow.toFixed(0)}/mo means you'll need to fund the gap out of pocket every month`);
  else if (bd.cashFlow.points <= 2)weaknesses.push(`Near break-even cash flow leaves no buffer for unexpected expenses`);
  if (bd.capRate.points <= 3)      weaknesses.push(`Cap rate of ${(inputs.capRate * 100).toFixed(2)}% is below market average — you may be overpaying for the income`);
  if (bd.marketGrowth.points <= 3) weaknesses.push(`Slow or flat market growth limits appreciation upside`);
  if (bd.vacancy.points <= 3)      weaknesses.push(`High vacancy rate of ${inputs.vacancyRate}% indicates weak rental demand or an overpriced market`);
  if (inputs.riskScore === "High") weaknesses.push(`High-risk profile — thin margins leave little room for error if expenses spike or rents dip`);
  if (inputs.dscr < 1.0 && inputs.dscr > 0)
                                   weaknesses.push(`DSCR of ${inputs.dscr.toFixed(2)} is below 1.0 — income does not cover debt service without supplemental cash`);

  // Build narrative
  const roiPct    = (inputs.roi * 100).toFixed(1);
  const cfSign    = inputs.monthlyCashFlow >= 0 ? "positive" : "negative";
  const irrPct    = (inputs.irr * 100).toFixed(1);

  const reasoning = [
    `This deal scores ${score}/100, placing it in the "${category}" category.`,
    ``,
    `The property delivers a ${roiPct}% cash-on-cash return with ${cfSign} monthly cash flow of $${Math.abs(inputs.monthlyCashFlow).toFixed(0)}.`,
    `At a ${(inputs.capRate * 100).toFixed(2)}% cap rate, the asset is priced ${inputs.capRate >= 0.06 ? "competitively" : "at a premium"} relative to its income.`,
    `The market is ${inputs.marketGrowthRate >= 0.03 ? "growing at a healthy" : "growing at a modest"} ${(inputs.marketGrowthRate * 100).toFixed(1)}% annually,`,
    `and the ${inputs.vacancyRate}% vacancy rate reflects ${inputs.vacancyRate <= 5 ? "strong" : inputs.vacancyRate <= 8 ? "average" : "weak"} rental demand.`,
    `With a ${inputs.riskScore.toLowerCase()} risk profile and ${irrPct}% projected IRR over the holding period,`,
    `${category === "Strong Buy" ? "this deal presents a compelling risk-adjusted return." :
       category === "Good Deal"  ? "the deal is solid but has areas to watch." :
       category === "Risky"      ? "investors should proceed cautiously and stress-test assumptions." :
                                   "the deal does not meet minimum investment criteria at this price."}`,
  ].join(" ").replace(/  +/g, " ");

  const recommendations: Record<DealCategory, string> = {
    "Strong Buy": `Move forward — this deal scores in the top tier. Negotiate final terms and proceed to due diligence.`,
    "Good Deal":  `Solid investment with acceptable returns. Verify assumptions and ensure you have cash reserves for vacancies.`,
    "Risky":      `Requires careful underwriting. Consider renegotiating the purchase price or improving terms before committing.`,
    "Pass":       `The numbers don't justify the investment at this price. Pass or submit a significantly lower offer.`,
  };

  return {
    reasoning,
    strengths:      strengths.slice(0, 4),
    weaknesses:     weaknesses.slice(0, 4),
    recommendation: recommendations[category],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function scoreDeal(inputs: DealScoreInputs): DealScoreResult {
  // Score each dimension
  const roiScore    = scoreROI(inputs.roi);
  const cfScore     = scoreCashFlow(inputs.monthlyCashFlow);
  const crScore     = scoreCapRate(inputs.capRate);
  const mgScore     = scoreMarketGrowth(inputs.marketGrowthRate);
  const vacScore    = scoreVacancy(inputs.vacancyRate);
  const riskScore   = scoreRisk(inputs.riskScore, inputs.dscr);
  const upsideScore = scoreUpside(inputs.irr, inputs.capRate, inputs.upsidePotential);

  const total = roiScore.points + cfScore.points + crScore.points +
    mgScore.points + vacScore.points + riskScore.points + upsideScore.points;

  // Clamp to 0–100
  const score = Math.max(0, Math.min(100, Math.round(total)));
  const category = toCategory(score);

  const breakdown: ScoreBreakdown = {
    roi:          { points: roiScore.points,    max: 20, label: roiScore.label },
    cashFlow:     { points: cfScore.points,     max: 20, label: cfScore.label },
    capRate:      { points: crScore.points,     max: 15, label: crScore.label },
    marketGrowth: { points: mgScore.points,     max: 15, label: mgScore.label },
    vacancy:      { points: vacScore.points,    max: 15, label: vacScore.label },
    risk:         { points: riskScore.points,   max: 10, label: riskScore.label },
    upside:       { points: upsideScore.points, max: 5,  label: upsideScore.label },
  };

  const { reasoning, strengths, weaknesses, recommendation } =
    buildReasoning(inputs, score, category, breakdown);

  return { score, category, breakdown, reasoning, strengths, weaknesses, recommendation };
}
