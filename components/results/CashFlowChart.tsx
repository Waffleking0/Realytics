"use client";
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { ProjectionYear } from "@/types";
import { fmt$ } from "@/lib/utils";

export function CashFlowChart({ projections }: { projections: ProjectionYear[] }) {
  const data = projections.map(p => ({
    year: `Yr ${p.year}`,
    "Cash Flow": Math.round(p.cashFlow),
    "NOI":       Math.round(p.noi),
    "Property Value": Math.round(p.propertyValue / 1000), // in $K
    "Equity":    Math.round(p.equity / 1000),
  }));

  return (
    <div className="space-y-6">
      {/* Cash Flow & NOI */}
      <div>
        <p className="text-sm text-gray-400 mb-3">Annual Cash Flow & NOI ($)</p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#F9FAFB" }}
              formatter={(v: number) => fmt$(v)}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
            <Bar dataKey="Cash Flow" fill="#3B82F6" radius={[4,4,0,0]} />
            <Bar dataKey="NOI"       fill="#10B981" radius={[4,4,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Property Value & Equity */}
      <div>
        <p className="text-sm text-gray-400 mb-3">Property Value & Equity ($K)</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} tickFormatter={v => `$${v}K`} />
            <Tooltip
              contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#F9FAFB" }}
              formatter={(v: number) => `$${v}K`}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
            <Line dataKey="Property Value" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line dataKey="Equity"         stroke="#8B5CF6" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
