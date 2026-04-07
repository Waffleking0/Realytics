/**
 * commercial.ts — Calculations for commercial properties (retail, office, etc.)
 */
import type { CommercialInputs, CoreMetrics, ProjectionYear } from "@/types";
import {
  monthlyMortgagePayment, remainingLoanBalance,
  effectiveGrossIncome, netOperatingIncome,
  capRate, cashOnCashReturn, grossRentMultiplier,
  debtServiceCoverageRatio, breakEvenOccupancy, calculateIRR,
} from "./core";

const CLOSING_COST_PCT = 0.03;

export function analyzeCommercial(inputs: any): {
  metrics: CoreMetrics;
  projections: ProjectionYear[];
} {
  const {
    purchasePrice, downPaymentPct, interestRate, loanTermYears,
    grossAnnualRent, vacancyRatePct, operatingExpensesAnnual,
    capExReservePct, holdingPeriodYears, annualAppreciationPct,
  } = inputs;

  const downPayment       = purchasePrice * (downPaymentPct / 100);
  const loanAmount        = purchasePrice - downPayment;
  const closingCosts      = purchasePrice * CLOSING_COST_PCT;
  const totalInvestment   = downPayment + closingCosts;
  const monthlyPI         = monthlyMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
  const annualDebtService = monthlyPI * 12;

  const egi    = effectiveGrossIncome(grossAnnualRent, vacancyRatePct);
  const capEx  = grossAnnualRent * (capExReservePct / 100);
  const opEx   = operatingExpensesAnnual + capEx;
  const noi    = netOperatingIncome(egi, opEx);
  const annualCashFlow = noi - annualDebtService;

  const metrics: CoreMetrics = {
    noi, annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    capRate:                  capRate(noi, purchasePrice),
    cashOnCashReturn:         cashOnCashReturn(annualCashFlow, totalInvestment),
    irr: 0,
    totalInvestment,
    grossRentMultiplier:      grossRentMultiplier(purchasePrice, grossAnnualRent),
    debtServiceCoverageRatio: debtServiceCoverageRatio(noi, annualDebtService),
    breakEvenOccupancy:       breakEvenOccupancy(opEx, annualDebtService, grossAnnualRent),
  };

  const rentGrowth   = 0.025;
  const appreciation = annualAppreciationPct / 100;
  const projections: ProjectionYear[] = [];

  for (let year = 1; year <= holdingPeriodYears; year++) {
    const yearRent  = grossAnnualRent * Math.pow(1 + rentGrowth, year - 1);
    const yearEGI   = effectiveGrossIncome(yearRent, vacancyRatePct);
    const yearOpEx  = opEx * Math.pow(1 + 0.02, year - 1);
    const yearNOI   = yearEGI - yearOpEx;
    const yearCF    = yearNOI - annualDebtService;
    const propVal   = purchasePrice * Math.pow(1 + appreciation, year);
    const loanBal   = remainingLoanBalance(loanAmount, interestRate / 100, loanTermYears, year * 12);

    projections.push({
      year, grossIncome: yearRent,
      vacancy: yearRent * (vacancyRatePct / 100),
      operatingExpenses: yearOpEx, noi: yearNOI,
      debtService: annualDebtService, cashFlow: yearCF,
      propertyValue: propVal, equity: propVal - loanBal,
    });
  }

  const terminalSale = projections[projections.length - 1].propertyValue * 0.94;
  const irrFlows = [-totalInvestment, ...projections.map(p => p.cashFlow)];
  irrFlows[irrFlows.length - 1] += terminalSale - (projections[projections.length - 1].propertyValue - projections[projections.length - 1].equity);
  metrics.irr = calculateIRR(irrFlows);

  return { metrics, projections };
}
