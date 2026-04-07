/**
 * residential.ts — Financial calculations for residential rental properties.
 */
import type { ResidentialInputs, CoreMetrics, ProjectionYear } from "@/types";
import {
  monthlyMortgagePayment, remainingLoanBalance,
  effectiveGrossIncome, netOperatingIncome,
  capRate, cashOnCashReturn, grossRentMultiplier,
  debtServiceCoverageRatio, breakEvenOccupancy,
  calculateIRR,
} from "./core";

// Closing costs are typically 2–3% of purchase price
const CLOSING_COST_PCT = 0.025;

export function analyzeResidential(inputs: any): {
  metrics: CoreMetrics;
  projections: ProjectionYear[];
} {
  const {
    purchasePrice, downPaymentPct, interestRate, loanTermYears,
    monthlyRent, vacancyRatePct, renovationCost,
    propertyTaxAnnual, insuranceAnnual, maintenancePct, managementFeePct,
    holdingPeriodYears, annualAppreciationPct,
  } = inputs;

  // ── Financing ──────────────────────────────────────────────────────────────
  const downPayment    = purchasePrice * (downPaymentPct / 100);
  const loanAmount     = purchasePrice - downPayment;
  const closingCosts   = purchasePrice * CLOSING_COST_PCT;
  const totalInvestment = downPayment + closingCosts + renovationCost;
  const monthlyPI      = monthlyMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
  const annualDebtService = monthlyPI * 12;

  // ── Year 1 Income ──────────────────────────────────────────────────────────
  const gri = monthlyRent * 12;
  const egi = effectiveGrossIncome(gri, vacancyRatePct);

  // ── Year 1 Expenses ────────────────────────────────────────────────────────
  const maintenanceAnnual  = purchasePrice * (maintenancePct / 100);
  const managementAnnual   = gri * (managementFeePct / 100);
  const operatingExpenses  = propertyTaxAnnual + insuranceAnnual + maintenanceAnnual + managementAnnual;

  // ── Core Metrics ───────────────────────────────────────────────────────────
  const noi            = netOperatingIncome(egi, operatingExpenses);
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  const metrics: CoreMetrics = {
    noi,
    annualCashFlow,
    monthlyCashFlow,
    capRate:                  capRate(noi, purchasePrice),
    cashOnCashReturn:         cashOnCashReturn(annualCashFlow, totalInvestment),
    irr:                      0, // calculated after projections
    totalInvestment,
    grossRentMultiplier:      grossRentMultiplier(purchasePrice, gri),
    debtServiceCoverageRatio: debtServiceCoverageRatio(noi, annualDebtService),
    breakEvenOccupancy:       breakEvenOccupancy(operatingExpenses, annualDebtService, gri),
  };

  // ── 10-Year Projections ────────────────────────────────────────────────────
  const appreciation = annualAppreciationPct / 100;
  const rentGrowth   = 0.03; // 3% annual rent growth assumption
  const expenseGrowth = 0.02; // 2% annual expense inflation

  const projections: ProjectionYear[] = [];

  for (let year = 1; year <= holdingPeriodYears; year++) {
    const yearRent     = monthlyRent * 12 * Math.pow(1 + rentGrowth, year - 1);
    const yearEGI      = effectiveGrossIncome(yearRent, vacancyRatePct);
    const yearExpenses = operatingExpenses * Math.pow(1 + expenseGrowth, year - 1);
    const yearNOI      = yearEGI - yearExpenses;
    const yearCashFlow = yearNOI - annualDebtService;
    const propertyValue = purchasePrice * Math.pow(1 + appreciation, year);
    const loanBalance  = remainingLoanBalance(loanAmount, interestRate / 100, loanTermYears, year * 12);
    const equity       = propertyValue - loanBalance;

    projections.push({
      year,
      grossIncome:      yearRent,
      vacancy:          yearRent * (vacancyRatePct / 100),
      operatingExpenses: yearExpenses,
      noi:              yearNOI,
      debtService:      annualDebtService,
      cashFlow:         yearCashFlow,
      propertyValue,
      equity,
    });
  }

  // ── IRR: initial outflow + annual cash flows + terminal sale ──────────────
  const salePrice     = projections[projections.length - 1].propertyValue;
  const saleCosts     = salePrice * 0.06; // 6% selling costs
  const finalEquity   = projections[projections.length - 1].equity;
  const terminalValue = salePrice - saleCosts - (salePrice - finalEquity);

  const irrCashFlows = [
    -totalInvestment,
    ...projections.map(p => p.cashFlow),
  ];
  irrCashFlows[irrCashFlows.length - 1] += terminalValue;

  metrics.irr = calculateIRR(irrCashFlows);

  return { metrics, projections };
}
