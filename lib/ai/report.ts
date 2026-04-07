/**
 * lib/ai/report.ts — Generate a professional AI investment report via OpenAI.
 */
import OpenAI from "openai";
import type { AnalysisResults, PropertyInputs, PropertyType } from "@/types";
import { fmtCurrency, fmtPercent } from "@/lib/calculations/core";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "placeholder" });

export async function generateAIReport(
  propertyType: PropertyType,
  inputs: PropertyInputs,
  results: AnalysisResults
): Promise<string> {
  const { metrics, riskScore, recommendation } = results;

  const metricsText = `
- Purchase Price: ${fmtCurrency("purchasePrice" in inputs ? inputs.purchasePrice : 0)}
- Total Cash Investment: ${fmtCurrency(metrics.totalInvestment)}
- Net Operating Income (NOI): ${fmtCurrency(metrics.noi)}
- Annual Cash Flow: ${fmtCurrency(metrics.annualCashFlow)}
- Monthly Cash Flow: ${fmtCurrency(metrics.monthlyCashFlow)}
- Cap Rate: ${fmtPercent(metrics.capRate)}
- Cash-on-Cash Return: ${fmtPercent(metrics.cashOnCashReturn)}
- IRR (${("holdingPeriodYears" in inputs ? inputs.holdingPeriodYears : 5)}-Year): ${fmtPercent(metrics.irr)}
- DSCR: ${(metrics.debtServiceCoverageRatio ?? 0).toFixed(2)}
- Risk Score: ${riskScore}
- Recommendation: ${recommendation}
  `.trim();

  const prompt = `
You are a senior real estate investment analyst with 20 years of experience.
Analyze the following ${propertyType} real estate deal and write a professional investment report.

PROPERTY TYPE: ${propertyType.toUpperCase()}
LOCATION: ${"zipCode" in inputs ? inputs.zipCode : "N/A"} ${"address" in inputs ? inputs.address : ""}

KEY FINANCIAL METRICS:
${metricsText}

Write a professional investment report with the following sections:
1. **Executive Summary** (2-3 sentences summarizing the deal)
2. **Key Financial Metrics Analysis** (interpret the numbers — what do they mean for this deal)
3. **Strengths** (3-4 bullet points)
4. **Risks & Concerns** (3-4 bullet points)
5. **Market Insights** (brief commentary on this type of investment in the current market)
6. **Final Recommendation: ${recommendation}** (2-3 sentences explaining the recommendation)

Tone: Professional, data-driven, concise. Write as if presenting to a sophisticated investor.
Do NOT use generic filler. Reference the specific numbers provided.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.6,
    });
    return response.choices[0].message.content ?? "Report generation failed.";
  } catch (err) {
    // Fallback report if OpenAI is unavailable
    return generateFallbackReport(propertyType, metrics, String(riskScore ?? ""), String(recommendation ?? ""));
  }
}

function generateFallbackReport(
  propertyType: string,
  metrics: AnalysisResults["metrics"],
  riskScore: string,
  recommendation: string
): string {
  return `
## Executive Summary
This ${propertyType} investment generates ${fmtCurrency(metrics.annualCashFlow)} in annual cash flow with a ${fmtPercent(metrics.capRate)} cap rate and ${fmtPercent(metrics.irr)} projected IRR over the holding period.

## Key Financial Metrics Analysis
The property shows a cash-on-cash return of ${fmtPercent(metrics.cashOnCashReturn)}, which is ${metrics.cashOnCashReturn >= 0.07 ? "above" : "below"} the typical 7% threshold for strong residential investments. The DSCR of ${(metrics.debtServiceCoverageRatio ?? 0).toFixed(2)} indicates the property ${(metrics.debtServiceCoverageRatio ?? 0) >= 1.25 ? "comfortably covers" : "may struggle to cover"} its debt obligations.

## Strengths
- ${metrics.capRate >= 0.06 ? "Strong cap rate above market average" : "Stable income-producing asset"}
- ${metrics.annualCashFlow > 0 ? "Positive cash flow from day one" : "Appreciation-driven upside potential"}
- Long-term wealth building through equity accumulation
- Hedge against inflation through rental income growth

## Risks & Concerns
- ${(metrics.debtServiceCoverageRatio ?? 0) < 1.25 ? "Thin debt service coverage leaves little margin for vacancy" : "Interest rate risk if refinancing becomes necessary"}
- Maintenance and capital expenditure surprises could compress returns
- Local market conditions may affect rental rates and occupancy
- ${riskScore === "High" ? "Elevated risk profile requires careful management" : "Standard market and economic cycle exposure"}

## Market Insights
${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} real estate continues to be a core asset class for investors seeking income and appreciation. Current market conditions favor properties with strong fundamentals and conservative underwriting.

## Final Recommendation: ${recommendation}
${recommendation === "Buy" ? "The deal presents a compelling risk-adjusted return profile. The fundamentals support moving forward with this investment." : recommendation === "Hold" ? "The deal has merit but warrants further due diligence before committing. Consider negotiating better terms." : "The current metrics do not justify the investment at this price. Pass or renegotiate the purchase price."}
  `.trim();
}
