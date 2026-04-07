"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import type { AnalysisResults, PropertyInputs, PropertyType } from "@/types";

export function AIReportPanel({
  propertyType, inputs, results,
}: {
  propertyType: PropertyType;
  inputs: PropertyInputs;
  results: AnalysisResults;
}) {
  const [report,   setReport]   = useState<string>("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [generated,setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyType, inputs, results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReport(data.report);
      setGenerated(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!generated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2 text-sm">
          Generate a professional AI investment report based on your analysis.
        </p>
        <p className="text-gray-500 text-xs mb-6">Requires OpenAI API key in .env</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <Button onClick={generate} loading={loading} className="px-8">
          {loading ? "Generating Report…" : "✨ Generate AI Investment Report"}
        </Button>
      </div>
    );
  }

  // Render the markdown-like report with basic formatting
  const lines = report.split("\n");
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-2 border-b border-gray-300 pb-1">{line.slice(3)}</h2>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-gray-700">{line.slice(2,-2)}</p>;
        if (line.startsWith("- "))
          return <li key={i} className="text-gray-600 ml-4">{line.slice(2)}</li>;
        if (line.trim() === "")
          return <br key={i} />;
        return <p key={i} className="text-gray-600">{line}</p>;
      })}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <Button variant="ghost" onClick={generate} loading={loading} className="text-xs">
          ↺ Regenerate Report
        </Button>
      </div>
    </div>
  );
}
