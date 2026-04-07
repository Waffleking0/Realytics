'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { ProjectionYear } from '@/types';

interface CashFlowChartProps {
  projections: ProjectionYear[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-3 shadow-xl min-w-44">
      <p className="text-xs text-gray-500 mb-2 font-medium">Year {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4 mb-1">
          <span className="text-xs text-gray-500">{entry.name}</span>
          <span
            className="text-xs font-semibold"
            style={{ color: entry.color }}
          >
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CashFlowChart({ projections }: CashFlowChartProps) {
  if (!projections || projections.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No projection data available
      </div>
    );
  }

  const hasNegative = projections.some((p) => p.cashFlow < 0);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-80" />
          <span className="text-gray-500">Annual Cash Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-purple-400 rounded" />
          <span className="text-gray-500">Cumulative Cash Flow</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={projections}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `Y${v}`}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
          {hasNegative && (
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
          )}
          <Bar
            dataKey="cashFlow"
            name="Annual Cash Flow"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            opacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="cumulativeCashFlow"
            name="Cumulative Cash Flow"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#cumulativeGradient)"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Year 1 Cash Flow</div>
          <div
            className={`text-sm font-bold ${
              projections[0].cashFlow >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(projections[0].cashFlow)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Year 5 Cash Flow</div>
          <div
            className={`text-sm font-bold ${
              (projections[4]?.cashFlow ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(projections[4]?.cashFlow ?? 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">10-Year Cumulative</div>
          <div
            className={`text-sm font-bold ${
              (projections[9]?.cumulativeCashFlow ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(projections[9]?.cumulativeCashFlow ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
