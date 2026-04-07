/**
 * multifamily.ts — Calculations for apartment buildings and multi-unit properties.
 */
import type { MultifamilyInputs, CoreMetrics, ProjectionYear } from "@/types";
import {
  monthlyMortgagePayment, remainingLoanBalance,
  effectiveGrossIncome, netOperatingIncome,
  capRate, cashOnCashReturn, grossRentMultiplier,
  debtServiceCoverageRatio, breakEvenOccupancy, calculateIRR,
} from "./core";

const CLOSING_COST_PCT = 0.02;

export function analyzeMultifamily(inputs: any): {
  metrics: CoreMetrics;
  projections: ProjectionYear[];
} {
  const {
    purchasePrice, downPaymentPct, interestRate, loanTermYears,
    numberOfUnits, avgRentPerUnit, vacancyRatePct,
    operatingExpensesPct, propertyManagementPct,
    holdingPeriodYears, annualAppreciationPct,
  } = inputs;

  const downPayment      = purchasePrice * (downPaymentPct / 100);
  const loanAmount       = purchasePrice - downPayment;
  const closingCosts     = purchasePrice * CLOSING_COST_PCT;
  const totalInvestment  = downPayment + closingCosts;
  const monthlyPI        = monthlyMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
  const annualDebtService = monthlyPI * 12;

  const monthlyGrossRent = numberOfUnits * avgRentPerUnit;
  const gri              = monthlyGrossRent * 12;
  const egi              = effectiveGrossIncome(gri, vacancyRatePct);
  const opEx             = egi * (operatingExpensesPct / 100) + gri * (propertyManagementPct / 100);
  const noi              = netOperatingIncome(egi, opEx);
  const annualCashFlow   = noi - annualDebtService;

  const metrics: CoreMetrics = {
    noi,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    capRate:                  capRate(noi, purchasePrice),
    cashOnCashReturn:         cashOnCashReturn(annualCashFlow, totalInvestment),
    irr:                      0,
    totalInvestment,
    grossRentMultiplier:      grossRentMultiplier(purchasePrice, gri),
    debtServiceCoverageRatio: debtServiceCoverageRatio(noi, annualDebtService),
    breakEvenOccupancy:       breakEvenOccupancy(opEx, annualDebtService, gri),
  };

  const rentGrowth    = 0.03;
  const expenseGrowth = 0.02;
  const appreciation  = annualAppreciationPct / 100;
  const projections: ProjectionYear[] = [];

  for (let year = 1; year <= holdingPeriodYears; year++) {
    const yearRent     = monthlyGrossRent * 12 * Math.pow(1 + rentGrowth, year - 1);
    const yearEGI      = effectiveGrossIncome(yearRent, vacancyRatePct);
    const yearOpEx     = yearEGI * (operatingExpensesPct / 100) * Math.pow(1 + expenseGrowth, year - 1);
    const yearNOI      = yearEGI - yearOpEx;
    const yearCashFlow = yearNOI - annualDebtService;
    const propertyValue = purchasePrice * Math.pow(1 + appreciation, year);
    const loanBalance  = remainingLoanBalance(loanAmount, interestRate / 100, loanTermYears, year * 12);

    projections.push({
      year,
      grossIncome: yearRent,
      vacancy: yearRent * (vacancyRatePct / 100),
      operatingExpenses: yearOpEx,
      noi: yearNOI,
      debtService: annualDebtService,
      cashFlow: yearCashFlow,
      propertyValue,
      equity: propertyValue - loanBalance,
    });
  }

  const terminalSale = projections[projections.length - 1].propertyValue * 0.94;
  const irrFlows = [-totalInvestment, ...projections.map(p => p.cashFlow)];
  irrFlows[irrFlows.length - 1] += terminalSale - (projections[projections.length - 1].propertyValue - projections[projections.length - 1].equity);
  metrics.irr = calculateIRR(irrFlows);

  return { metrics, projections };
}
