/**
 * POST /api/deal-score
 * Accepts DealScoreInputs, returns a DealScoreResult (0–100 score + breakdown).
 */
import { NextResponse } from "next/server";
import { scoreDeal }    from "@/lib/analysis/dealScore";
import type { DealScoreInputs } from "@/lib/analysis/dealScore";

export async function POST(req: Request) {
  try {
    const inputs: DealScoreInputs = await req.json();

    // Basic validation
    if (
      typeof inputs.roi             !== "number" ||
      typeof inputs.monthlyCashFlow !== "number" ||
      typeof inputs.capRate         !== "number" ||
      typeof inputs.marketGrowthRate!== "number" ||
      typeof inputs.vacancyRate     !== "number" ||
      typeof inputs.dscr            !== "number" ||
      typeof inputs.irr             !== "number" ||
      !["Low","Medium","High"].includes(inputs.riskScore)
    ) {
      return NextResponse.json({ error: "Invalid or missing inputs" }, { status: 400 });
    }

    const result = scoreDeal(inputs);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Deal score error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
