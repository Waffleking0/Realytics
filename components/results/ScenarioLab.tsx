"use client";
import { useState, useMemo, useCallback } from "react";
import type { PropertyType, PropertyInputs, AnalysisResults } from "@/types";
import type { ResidentialInputs, MultifamilyInputs, CommercialInputs } from "@/types";
import { monthlyMortgagePayment } from "@/lib/calculations/core";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScenarioBase {
  purchasePrice: number;
  totalInvested: number;
  loanAmount: number;
  loanTermYears: number;
  baseAnnualExpenses: number;
  defaultRent: number;        // monthly
  defaultInterestRate: number; // %
  defaultVacancy: number;     // %
}

interface ScenarioState {
  monthlyRent: number;
  interestRate: number;       // %
  expenseMultiplier: number;  // 1.0 = baseline
  vacancyRate: number;        // %
}

interface ScenarioMetrics {
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;
  capRate: number;
  cocReturn: number;
  monthlyMortgage: number;
  debtService: number;
}

// ─── Derive scenario base from inputs+results ─────────────────────────────────

function deriveBase(
  propertyType: PropertyType,
  inputs: PropertyInputs,
  results: AnalysisResults
): ScenarioBase | null {
  const m = results.metrics;

  if (propertyType === "residential") {
    const i = inputs as ResidentialInputs;
    const annualRent = i.monthlyRent * 12;
    const egi = annualRent * (1 - ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate) / 100);
    const baseAnnualExpenses = Math.max(0, egi - m.noi);
    const loanAmount = i.purchasePrice * (1 - ((i as any).downPaymentPct !== undefined ? (i as any).downPaymentPct : (i as any).downPayment) / 100);
    return {
      purchasePrice: i.purchasePrice,
      totalInvested: m.totalInvestment,
      loanAmount,
      loanTermYears: i.loanTermYears,
      baseAnnualExpenses,
      defaultRent: i.monthlyRent,
      defaultInterestRate: i.interestRate,
      defaultVacancy: ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate),
    };
  }

  if (propertyType === "multifamily") {
    const i = inputs as MultifamilyInputs;
    const totalMonthlyRent = (i as any).avgRentPerUnit ?? (i as any).averageRentPerUnit * i.numberOfUnits;
    const annualRent = totalMonthlyRent * 12;
    const egi = annualRent * (1 - ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate) / 100);
    const baseAnnualExpenses = Math.max(0, egi - m.noi);
    const loanAmount = i.purchasePrice * (1 - ((i as any).downPaymentPct !== undefined ? (i as any).downPaymentPct : (i as any).downPayment) / 100);
    return {
      purchasePrice: i.purchasePrice,
      totalInvested: m.totalInvestment,
      loanAmount,
      loanTermYears: i.loanTermYears,
      baseAnnualExpenses,
      defaultRent: totalMonthlyRent,
      defaultInterestRate: i.interestRate,
      defaultVacancy: ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate),
    };
  }

  if (propertyType === "commercial") {
    const i = inputs as CommercialInputs;
    const monthlyRent = ((i as any).grossAnnualRent !== undefined ? (i as any).grossAnnualRent : (i as any).annualRent) / 12;
    const egi = ((i as any).grossAnnualRent !== undefined ? (i as any).grossAnnualRent : (i as any).annualRent) * (1 - ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate) / 100);
    const baseAnnualExpenses = Math.max(0, egi - m.noi);
    const loanAmount = i.purchasePrice * (1 - ((i as any).downPaymentPct !== undefined ? (i as any).downPaymentPct : (i as any).downPayment) / 100);
    return {
      purchasePrice: i.purchasePrice,
      totalInvested: m.totalInvestment,
      loanAmount,
      loanTermYears: i.loanTermYears,
      baseAnnualExpenses,
      defaultRent: monthlyRent,
      defaultInterestRate: i.interestRate,
      defaultVacancy: ((i as any).vacancyRatePct !== undefined ? (i as any).vacancyRatePct : (i as any).vacancyRate),
    };
  }

  return null; // land/development not supported
}

// ─── Recalculate metrics from scenario state ──────────────────────────────────

function calcScenario(base: ScenarioBase, s: ScenarioState): ScenarioMetrics {
  const annualRent = s.monthlyRent * 12;
  const egi = annualRent * (1 - s.vacancyRate / 100);
  const expenses = base.baseAnnualExpenses * s.expenseMultiplier;
  const noi = egi - expenses;

  const monthlyMortgage = base.loanAmount > 0
    ? monthlyMortgagePayment(base.loanAmount, s.interestRate / 100, base.loanTermYears)
    : 0;
  const debtService = monthlyMortgage * 12;

  const annualCashFlow = noi - debtService;
  const monthlyCashFlow = annualCashFlow / 12;
  const capRate = base.purchasePrice > 0 ? noi / base.purchasePrice : 0;
  const cocReturn = base.totalInvested > 0 ? annualCashFlow / base.totalInvested : 0;

  return { monthlyCashFlow, annualCashFlow, noi, capRate, cocReturn, monthlyMortgage, debtService };
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, format, onChange, baseValue,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
  baseValue?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const changed = baseValue !== undefined && Math.abs(value - baseValue) > step * 0.1;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-400">{label}</span>
        <div className="flex items-center gap-2">
          {changed && baseValue !== undefined && (
            <span className="text-[10px] text-zinc-600 line-through">{format(baseValue)}</span>
          )}
          <span className="text-sm font-bold text-gray-900">{format(value)}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-700">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Delta metric ─────────────────────────────────────────────────────────────

function DeltaMetric({ label, base, current, format, invert }: {
  label: string; base: number; current: number;
  format: (v: number) => string; invert?: boolean;
}) {
  const delta = current - base;
  const isPositive = invert ? delta < 0 : delta > 0;
  const isNeutral = Math.abs(delta) < 0.0001;

  const color = isNeutral ? "#a1a1aa" : isPositive ? "#34d399" : "#f87171";
  const arrow = isNeutral ? "" : isPositive ? "▲" : "▼";

  return (
    <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-lg font-black" style={{ color }}>{format(current)}</p>
      {!isNeutral && (
        <p className="text-[10px] font-bold mt-0.5" style={{ color }}>
          {arrow} {format(Math.abs(delta))} vs baseline
        </p>
      )}
      <p className="text-[10px] text-zinc-600 mt-1">{label}</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ScenarioLab({
  propertyType, inputs, results,
}: {
  propertyType: PropertyType; inputs: PropertyInputs; results: AnalysisResults;
}) {
  const base = useMemo(() => deriveBase(propertyType, inputs, results), [propertyType, inputs, results]);

  const [scenario, setScenario] = useState<ScenarioState>(() => ({
    monthlyRent: base?.defaultRent ?? 0,
    interestRate: base?.defaultInterestRate ?? 7,
    expenseMultiplier: 1.0,
    vacancyRate: base?.defaultVacancy ?? 5,
  }));

  const set = useCallback((key: keyof ScenarioState, val: number) => {
    setScenario(prev => ({ ...prev, [key]: val }));
  }, []);

  const resetScenario = useCallback(() => {
    if (!base) return;
    setScenario({
      monthlyRent: base.defaultRent,
      interestRate: base.defaultInterestRate,
      expenseMultiplier: 1.0,
      vacancyRate: base.defaultVacancy,
    });
  }, [base]);

  if (!base) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        Scenario modeling is available for income-producing properties (residential, multifamily, commercial).
      </div>
    );
  }

  const baseline = calcScenario(base, {
    monthlyRent: base.defaultRent,
    interestRate: base.defaultInterestRate,
    expenseMultiplier: 1.0,
    vacancyRate: base.defaultVacancy,
  });

  const current = calcScenario(base, scenario);

  const fmt$ = (v: number) =>
    `${v >= 0 ? "" : "-"}$${Math.abs(Math.round(v)).toLocaleString()}`;
  const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const fmtMo = (v: number) =>
    `${v >= 0 ? "+" : "-"}$${Math.abs(Math.round(v)).toLocaleString()}/mo`;

  const isModified =
    Math.abs(scenario.monthlyRent - base.defaultRent) > 1 ||
    Math.abs(scenario.interestRate - base.defaultInterestRate) > 0.01 ||
    Math.abs(scenario.expenseMultiplier - 1.0) > 0.01 ||
    Math.abs(scenario.vacancyRate - base.defaultVacancy) > 0.1;

  return (
    <div className="space-y-6">

      {/* ── Controls ──────────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Slider
          label="Monthly Rent"
          value={scenario.monthlyRent}
          min={Math.max(200, Math.round(base.defaultRent * 0.4))}
          max={Math.round(base.defaultRent * 2.0)}
          step={50}
          format={v => `$${v.toLocaleString()}/mo`}
          baseValue={base.defaultRent}
          onChange={v => set("monthlyRent", v)}
        />
        <Slider
          label="Interest Rate"
          value={scenario.interestRate}
          min={3.0}
          max={14.0}
          step={0.25}
          format={v => `${v.toFixed(2)}%`}
          baseValue={base.defaultInterestRate}
          onChange={v => set("interestRate", v)}
        />
        <Slider
          label="Expenses"
          value={scenario.expenseMultiplier}
          min={0.5}
          max={2.0}
          step={0.05}
          format={v => v === 1.0 ? "Baseline" : `${v >= 1 ? "+" : ""}${Math.round((v - 1) * 100)}%`}
          baseValue={1.0}
          onChange={v => set("expenseMultiplier", v)}
        />
        <Slider
          label="Vacancy Rate"
          value={scenario.vacancyRate}
          min={0}
          max={30}
          step={0.5}
          format={v => `${v}%`}
          baseValue={base.defaultVacancy}
          onChange={v => set("vacancyRate", v)}
        />
      </div>

      {/* ── Reset button ─────────────────────────────────────────────────────── */}
      {isModified && (
        <div className="flex justify-end">
          <button
            onClick={resetScenario}
            className="text-xs font-medium transition-colors duration-150"
            style={{ color: "#52525b" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}
          >
            ↺ Reset to baseline
          </button>
        </div>
      )}

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* ── Scenario output ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
          {isModified ? "Scenario Results" : "Baseline Results"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DeltaMetric
            label="Monthly Cash Flow"
            base={baseline.monthlyCashFlow}
            current={current.monthlyCashFlow}
            format={fmt$}
          />
          <DeltaMetric
            label="Cap Rate"
            base={baseline.capRate}
            current={current.capRate}
            format={fmtPct}
          />
          <DeltaMetric
            label="Cash-on-Cash Return"
            base={baseline.cocReturn}
            current={current.cocReturn}
            format={fmtPct}
          />
          <DeltaMetric
            label="NOI / Year"
            base={baseline.noi}
            current={current.noi}
            format={v => `$${Math.round(v).toLocaleString()}`}
          />
        </div>
      </div>

      {/* ── Cash flow waterfall ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Cash Flow Waterfall</p>
        {[
          { label: "Gross Monthly Rent", value: scenario.monthlyRent, color: "#34d399", sign: "+" },
          { label: "Vacancy Loss", value: -(scenario.monthlyRent * (scenario.vacancyRate / 100)), color: "#f87171", sign: "-" },
          { label: "Operating Expenses", value: -(base.baseAnnualExpenses * scenario.expenseMultiplier / 12), color: "#fbbf24", sign: "-" },
          { label: "Monthly Mortgage", value: -current.monthlyMortgage, color: "#a78bfa", sign: "-" },
        ].map(({ label, value, color, sign }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-sm font-bold" style={{ color }}>
              {sign}${Math.abs(Math.round(value)).toLocaleString()}/mo
            </span>
          </div>
        ))}
        <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-900">Net Cash Flow</span>
          <span className="text-sm font-black" style={{ color: current.monthlyCashFlow >= 0 ? "#34d399" : "#f87171" }}>
            {current.monthlyCashFlow >= 0 ? "+" : "-"}${Math.abs(Math.round(current.monthlyCashFlow)).toLocaleString()}/mo
          </span>
        </div>
      </div>

    </div>
  );
}
