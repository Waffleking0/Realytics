'use client';

import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { MarketAnalysis } from '@/types';

interface RiskScoreProps {
  marketAnalysis: MarketAnalysis;
}

const riskConfig = {
  Low: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    badgeBg: 'bg-green-500/20',
    dot: 'bg-green-400',
    barColor: 'from-green-600 to-green-400',
    glow: 'shadow-green-500/20',
  },
  Medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20',
    dot: 'bg-yellow-400',
    barColor: 'from-yellow-600 to-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
  High: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badgeBg: 'bg-red-500/20',
    dot: 'bg-red-400',
    barColor: 'from-red-600 to-red-400',
    glow: 'shadow-red-500/20',
  },
};

const strengthConfig = {
  'Weak': { color: 'text-red-400', barWidth: '25%' },
  'Moderate': { color: 'text-yellow-400', barWidth: '50%' },
  'Strong': { color: 'text-blue-400', barWidth: '75%' },
  'Very Strong': { color: 'text-green-400', barWidth: '100%' },
};

export default function RiskScore({ marketAnalysis }: RiskScoreProps) {
  const riskCfg = riskConfig[marketAnalysis.riskLevel];
  const strengthCfg = strengthConfig[marketAnalysis.marketStrength];

  const positiveFactors = marketAnalysis.factors.filter((f) => f.impact === 'positive');
  const negativeFactors = marketAnalysis.factors.filter((f) => f.impact === 'negative');
  const neutralFactors = marketAnalysis.factors.filter((f) => f.impact === 'neutral');

  return (
    <div className="space-y-5">
      {/* Main Risk Badge */}
      <div className={clsx('p-5 rounded-xl border', riskCfg.bg, riskCfg.border)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Risk Level</p>
            <div className="flex items-center gap-3">
              <div className={clsx('w-3 h-3 rounded-full animate-pulse', riskCfg.dot)} />
              <span className={clsx('text-3xl font-extrabold', riskCfg.text)}>
                {marketAnalysis.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Risk Score</p>
            <div className={clsx('text-4xl font-extrabold tabular-nums', riskCfg.text)}>
              {marketAnalysis.riskScore}
              <span className="text-lg text-gray-500 font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* Risk Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={clsx('h-full bg-gradient-to-r rounded-full transition-all duration-1000', riskCfg.barColor)}
              style={{ width: `${marketAnalysis.riskScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Market Strength */}
      <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-300">Market Strength</p>
          <span className={clsx('text-sm font-bold', strengthCfg.color)}>
            {marketAnalysis.marketStrength}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
            style={{ width: `${marketAnalysis.marketStrengthScore}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-gray-500">Vacancy Rate</div>
            <div className="font-medium text-white">{marketAnalysis.vacancyRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Appreciation</div>
            <div className="font-medium text-white">{marketAnalysis.averageAppreciation.toFixed(1)}%/yr</div>
          </div>
          <div>
            <div className="text-gray-500">Employment</div>
            <div className="font-medium text-white">{marketAnalysis.employmentRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Population Growth</div>
            <div className="font-medium text-white">{marketAnalysis.populationGrowth.toFixed(1)}%/yr</div>
          </div>
          <div>
            <div className="text-gray-500">Median Income</div>
            <div className="font-medium text-white">${(marketAnalysis.medianIncome / 1000).toFixed(0)}K</div>
          </div>
          <div>
            <div className="text-gray-500">Strength Score</div>
            <div className="font-medium text-white">{marketAnalysis.marketStrengthScore}/100</div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-300">Risk Factors Analysis</p>

        {/* Positive Factors */}
        {positiveFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-green-400 uppercase tracking-wide font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Positive Signals ({positiveFactors.length})
            </p>
            {positiveFactors.map((factor) => (
              <div
                key={factor.name}
                className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-lg"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-green-400">{factor.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{factor.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{factor.description}</p>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Neutral Factors */}
        {neutralFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-blue-400 uppercase tracking-wide font-medium flex items-center gap-1">
              <Info className="w-3 h-3" /> Neutral Factors ({neutralFactors.length})
            </p>
            {neutralFactors.map((factor) => (
              <div
                key={factor.name}
                className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <Minus className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-400">{factor.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{factor.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{factor.description}</p>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Negative Factors */}
        {negativeFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-red-400 uppercase tracking-wide font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risk Signals ({negativeFactors.length})
            </p>
            {negativeFactors.map((factor) => (
              <div
                key={factor.name}
                className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-lg"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-red-400">{factor.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{factor.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{factor.description}</p>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
