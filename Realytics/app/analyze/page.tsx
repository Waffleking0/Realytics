'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  Building2,
  ArrowLeft,
  RefreshCw,
  Download,
  ChevronDown,
  AlertCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  MapPin,
  Brain,
  DollarSign,
} from 'lucide-react';

import type {
  PropertyType,
  AnalysisResult,
  ResidentialInputs,
  LandInputs,
  CommercialInputs,
  MultifamilyInputs,
  DevelopmentInputs,
} from '@/types';

import PropertyTypeSelector from '@/components/PropertyTypeSelector';
import ResidentialForm from '@/components/forms/ResidentialForm';
import LandForm from '@/components/forms/LandForm';
import CommercialForm from '@/components/forms/CommercialForm';
import MultifamilyForm from '@/components/forms/MultifamilyForm';
import DevelopmentForm from '@/components/forms/DevelopmentForm';

import Card from '@/components/ui/Card';
import MetricCard from '@/components/dashboard/MetricCard';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import ComparableProperties from '@/components/dashboard/ComparableProperties';
import RiskScore from '@/components/dashboard/RiskScore';
import AIReport from '@/components/dashboard/AIReport';

type FormInputs = ResidentialInputs | LandInputs | CommercialInputs | MultifamilyInputs | DevelopmentInputs;

function formatCurrency(value: number): string {
  if (value === undefined || value === null) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function getSentiment(value: number, goodThreshold: number, badThreshold: number): 'positive' | 'neutral' | 'negative' {
  if (value >= goodThreshold) return 'positive';
  if (value >= badThreshold) return 'neutral';
  return 'negative';
}

export default function AnalyzePage() {
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handlePropertyTypeChange = (type: PropertyType) => {
    setPropertyType(type);
    setResult(null);
    setError(null);
  };

  const handleSubmit = useCallback(async (inputs: FormInputs) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: propertyType, inputs }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setResult(data as AnalysisResult);

      // Smooth scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [propertyType]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMetrics = (result: AnalysisResult) => {
    const r = result.financialResults;
    const type = result.type;

    const metrics = [];

    if (type !== 'land') {
      metrics.push({
        label: 'Cap Rate',
        value: `${r.capRate.toFixed(2)}%`,
        sentiment: getSentiment(r.capRate, 7, 5),
        description: 'Annual NOI / Purchase Price',
        trend: r.capRate >= 7 ? 'up' as const : r.capRate >= 5 ? 'flat' as const : 'down' as const,
      });
    }

    metrics.push({
      label: 'Cash-on-Cash Return',
      value: `${r.cashOnCashReturn.toFixed(2)}%`,
      sentiment: getSentiment(r.cashOnCashReturn, 8, 4),
      description: 'Annual Cash Flow / Total Investment',
      trend: r.cashOnCashReturn >= 8 ? 'up' as const : r.cashOnCashReturn >= 4 ? 'flat' as const : 'down' as const,
    });

    metrics.push({
      label: 'IRR (10-Year)',
      value: `${r.irr.toFixed(2)}%`,
      sentiment: getSentiment(r.irr, 15, 8),
      description: 'Internal Rate of Return',
      trend: r.irr >= 15 ? 'up' as const : r.irr >= 8 ? 'flat' as const : 'down' as const,
    });

    if (type !== 'land') {
      metrics.push({
        label: 'Monthly Cash Flow',
        value: formatCurrency(r.monthlyCashFlow),
        sentiment: getSentiment(r.monthlyCashFlow, 200, 0),
        description: 'Net monthly income after all expenses',
        trend: r.monthlyCashFlow >= 200 ? 'up' as const : r.monthlyCashFlow >= 0 ? 'flat' as const : 'down' as const,
      });

      metrics.push({
        label: 'Annual Cash Flow',
        value: formatCurrency(r.annualCashFlow),
        sentiment: getSentiment(r.annualCashFlow, 2400, 0),
        description: 'Net annual income after all expenses',
        trend: r.annualCashFlow > 0 ? 'up' as const : 'down' as const,
      });

      metrics.push({
        label: 'Annual NOI',
        value: formatCurrency(r.noi),
        sentiment: getSentiment(r.noi, 10000, 0),
        description: 'Net Operating Income',
        trend: r.noi > 0 ? 'up' as const : 'down' as const,
      });
    }

    metrics.push({
      label: 'Total Investment',
      value: formatCurrency(r.totalInvestment),
      sentiment: 'neutral' as const,
      description: 'Total cash deployed',
    });

    if (type !== 'land') {
      metrics.push({
        label: 'Monthly Mortgage',
        value: formatCurrency(r.monthlyMortgage),
        sentiment: 'neutral' as const,
        description: 'P&I payment',
      });

      if (r.grossRent > 0) {
        metrics.push({
          label: 'Gross Annual Rent',
          value: formatCurrency(r.grossRent),
          sentiment: 'neutral' as const,
          description: 'Before vacancy & expenses',
        });
      }
    }

    if (r.netProfit !== undefined) {
      metrics.push({
        label: 'Net Profit',
        value: formatCurrency(r.netProfit),
        sentiment: getSentiment(r.netProfit, 1, 0),
        description: type === 'development' ? 'Development profit' : 'Projected profit',
        trend: r.netProfit > 0 ? 'up' as const : 'down' as const,
      });
    }

    if (r.grm !== undefined && r.grm > 0) {
      metrics.push({
        label: 'Gross Rent Multiplier',
        value: `${r.grm.toFixed(1)}x`,
        sentiment: getSentiment(15 - r.grm, 5, 2),
        description: 'Price / Annual Gross Rent',
      });
    }

    if (r.pricePerUnit !== undefined && r.pricePerUnit > 0) {
      metrics.push({
        label: 'Price Per Unit',
        value: formatCurrency(r.pricePerUnit),
        sentiment: 'neutral' as const,
        description: 'Purchase price per residential unit',
      });
    }

    return metrics;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 backdrop-blur-sm sticky top-0 z-50 bg-gray-100/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Back</span>
            </Link>
            <div className="w-px h-5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Realytics</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Analysis
              </button>
            )}
            <span className="text-xs text-gray-400 hidden sm:block">Deal Analyzer</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Real Estate Deal Analyzer
          </h1>
          <p className="text-gray-600">
            Enter your property details below to receive a complete financial analysis, market risk assessment, and AI investment recommendation.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-6 mb-8">
          {/* Property Type Selector */}
          <Card glass>
            <PropertyTypeSelector
              selected={propertyType}
              onChange={handlePropertyTypeChange}
            />
          </Card>

          {/* Form */}
          <Card
            title={`${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Property Details`}
            subtitle="Fill in all fields for the most accurate analysis"
            glass
          >
            {propertyType === 'residential' && (
              <ResidentialForm
                onSubmit={(inputs) => handleSubmit(inputs)}
                loading={loading}
              />
            )}
            {propertyType === 'land' && (
              <LandForm
                onSubmit={(inputs) => handleSubmit(inputs)}
                loading={loading}
              />
            )}
            {propertyType === 'commercial' && (
              <CommercialForm
                onSubmit={(inputs) => handleSubmit(inputs)}
                loading={loading}
              />
            )}
            {propertyType === 'multifamily' && (
              <MultifamilyForm
                onSubmit={(inputs) => handleSubmit(inputs)}
                loading={loading}
              />
            )}
            {propertyType === 'development' && (
              <DevelopmentForm
                onSubmit={(inputs) => handleSubmit(inputs)}
                loading={loading}
              />
            )}
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-medium">Analyzing your deal...</p>
              <p className="text-gray-600 text-sm mt-1">Running financial calculations, market analysis, and generating AI report</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-8">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Analysis Failed</p>
              <p className="text-sm text-gray-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {result && !loading && (
          <div ref={resultsRef} className="space-y-6 animate-fade-in">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Analysis Results
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Generated {new Date(result.timestamp).toLocaleString()} · {result.type.charAt(0).toUpperCase() + result.type.slice(1)} Property
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-bold border',
                    result.aiReport.recommendation === 'Buy'
                      ? 'bg-green-500/15 border-green-500/40 text-green-400'
                      : result.aiReport.recommendation === 'Hold'
                      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                      : 'bg-red-500/15 border-red-500/40 text-red-400'
                  )}
                >
                  {result.aiReport.recommendation}
                </div>
              </div>
            </div>

            {/* Key Financial Metrics Grid */}
            <Card
              title="Financial Metrics"
              subtitle="Core investment performance indicators"
              accent="blue"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {getMetrics(result).map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    sentiment={metric.sentiment}
                    trend={metric.trend}
                    description={metric.description}
                  />
                ))}
              </div>
            </Card>

            {/* Cash Flow Chart */}
            <Card
              title="10-Year Cash Flow Projections"
              subtitle="Annual and cumulative cash flow over the holding period"
              accent="blue"
            >
              <CashFlowChart projections={result.projections} />
            </Card>

            {/* 2-column section: Comparables + Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparable Properties */}
              <Card
                title="Comparable Properties"
                subtitle={`${result.comparables.length} comps found in the area`}
                accent="purple"
              >
                <ComparableProperties
                  comparables={result.comparables}
                  subjectPrice={
                    result.type === 'residential' ? (result.inputs as ResidentialInputs).purchasePrice :
                    result.type === 'multifamily' ? (result.inputs as MultifamilyInputs).purchasePrice :
                    result.type === 'commercial' ? (result.inputs as CommercialInputs).purchasePrice :
                    result.type === 'development' ? (result.inputs as DevelopmentInputs).landCost + (result.inputs as DevelopmentInputs).constructionCost :
                    (result.inputs as LandInputs).purchasePrice
                  }
                  subjectCapRate={result.financialResults.capRate}
                />
              </Card>

              {/* Risk Score */}
              <Card
                title="Market Risk Analysis"
                subtitle={`${result.marketAnalysis.riskLevel} Risk · ${result.marketAnalysis.marketStrength} Market`}
                accent={
                  result.marketAnalysis.riskLevel === 'Low' ? 'green' :
                  result.marketAnalysis.riskLevel === 'Medium' ? 'yellow' : 'red'
                }
              >
                <RiskScore marketAnalysis={result.marketAnalysis} />
              </Card>
            </div>

            {/* AI Report */}
            <Card
              title="AI Investment Analysis"
              subtitle="Comprehensive investment thesis and recommendation"
              accent={
                result.aiReport.recommendation === 'Buy' ? 'green' :
                result.aiReport.recommendation === 'Hold' ? 'yellow' : 'red'
              }
            >
              <AIReport report={result.aiReport} />
            </Card>

            {/* Bottom CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Want to analyze another deal?</p>
                <p className="text-xs text-gray-500">Start fresh with new property details.</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
