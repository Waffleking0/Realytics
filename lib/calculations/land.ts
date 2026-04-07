/**
 * land.ts — Calculations for raw land and development land investments.
 */
import type { LandInputs, CoreMetrics, ProjectionYear } from "@/types";
import { calculateIRR } from "./core";

export function analyzeLand(inputs: any): {
  metrics: CoreMetrics;
  projections: ProjectionYear[];
} {
  const {
    purchasePrice, propertyTaxAnnual, holdingCostsAnnual,
    expectedAppreciationPct, holdingPeriodYears,
  } = inputs;

  const closingCosts    = purchasePrice * 0.02;
  const totalInvestment = purchasePrice + closingCosts;
  const appreciation    = expectedAppreciationPct / 100;
  const annualHolding   = propertyTaxAnnual + holdingCostsAnnual;

  // Land has no income stream — cash flow is negative (holding costs only)
  const annualCashFlow = -annualHolding;

  const projections: ProjectionYear[] = [];
  for (let year = 1; year <= holdingPeriodYears; year++) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciation, year);
    projections.push({
      year, grossIncome: 0, vacancy: 0,
      operatingExpenses: annualHolding,
      noi: -annualHolding, debtService: 0,
      cashFlow: -annualHolding,
      propertyValue, equity: propertyValue,
    });
  }

  const salePrice = projections[projections.length - 1].propertyValue;
  const irrFlows  = [-totalInvestment, ...projections.map(p => p.cashFlow)];
  irrFlows[irrFlows.length - 1] += salePrice * 0.96; // 4% selling costs
  const irr = calculateIRR(irrFlows);

  const metrics: CoreMetrics = {
    noi: annualCashFlow,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    capRate: 0,
    cashOnCashReturn: annualCashFlow / totalInvestment,
    irr,
    totalInvestment,
    grossRentMultiplier: 0,
    debtServiceCoverageRatio: 0,
    breakEvenOccupancy: 0,
  };

  return { metrics, projections };
}
