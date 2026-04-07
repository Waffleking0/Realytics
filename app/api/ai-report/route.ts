/**
 * POST /api/ai-report
 * Generate an AI investment report for a completed analysis.
 */
import { NextResponse } from "next/server";
import { generateAIReport } from "@/lib/ai/report";
import type { PropertyType, AnalysisResults, PropertyInputs } from "@/types";

export async function POST(req: Request) {
  try {
    const { propertyType, inputs, results }: {
      propertyType: PropertyType;
      inputs: PropertyInputs;
      results: AnalysisResults;
    } = await req.json();

    const report = await generateAIReport(propertyType, inputs, results);
    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
