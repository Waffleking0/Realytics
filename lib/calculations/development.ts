/**
 * development.ts — Calculations for ground-up development projects.
 */
import type { DevelopmentInputs, CoreMetrics, ProjectionYear } from "@/types";
import { monthlyMortgagePayment, capRate, calculateIRR } from "./core";

export function analyzeDevelopment(inputs: any): {
  metrics: CoreMetrics;
  projections: ProjectionYear[];
} {
  const {
    landCost, constructionCostPerSqFt, totalSqFt,
    softCostsPct, financingRate, constructionTimelineMonths,
    exitStrategy, estimatedSalePrice, estimatedMonthlyRent,
    stabilizedCapRate,
  } = inputs;

  const hardCosts    = constructionCostPerSqFt * totalSqFt;
  const softCosts    = hardCosts * (softCostsPct / 100);
  const totalCost    = landCost + hardCosts + softCosts;

  // Construction loan interest (interest-only during build)
  const constructionInterest =
    totalCost * (financingRate / 100) * (constructionTimelineMonths / 12);
  const totalInvestment = totalCost + constructionInterest;

  let profitOnSale   = 0;
  let stabilizedNOI  = 0;
  let exitValue      = 0;

  if (exitStrategy === "sell") {
    profitOnSale = estimatedSalePrice - totalInvestment;
    exitValue    = estimatedSalePrice;
  } else {
    // Value based on stabilized cap rate
    stabilizedNOI = estimatedMonthlyRent * 12 * 0.65; // 35% expense ratio
    exitValue     = stabilizedCapRate > 0 ? stabilizedNOI / (stabilizedCapRate / 100) : 0;
    profitOnSale  = exitValue - totalInvestment;
  }

  const roi          = totalInvestment > 0 ? profitOnSale / totalInvestment : 0;
  const developmentYield = totalCost > 0 ? (stabilizedNOI || estimatedSalePrice * 0.05) / totalCost : 0;

  // IRR: invest over construction period, receive exit at end
  const constructionYears = constructionTimelineMonths / 12;
  const irrFlows = new Array(Math.ceil(constructionYears) + 1).fill(0) as number[];
  irrFlows[0] = -totalInvestment;
  irrFlows[irrFlows.length - 1] = exitValue;
  const irr = calculateIRR(irrFlows);

  const metrics: CoreMetrics = {
    noi: stabilizedNOI,
    annualCashFlow: profitOnSale,
    monthlyCashFlow: profitOnSale / 12,
    capRate: developmentYield,
    cashOnCashReturn: roi,
    irr,
    totalInvestment,
    grossRentMultiplier: 0,
    debtServiceCoverageRatio: 0,
    breakEvenOccupancy: 0,
  };

  // Simple 5-year projection (build then hold/sell)
  const projections: ProjectionYear[] = Array.from({ length: 5 }, (_, i) => ({
    year: i + 1,
    grossIncome: i === 0 ? 0 : (estimatedMonthlyRent * 12 || 0),
    vacancy: 0,
    operatingExpenses: i === 0 ? totalInvestment : stabilizedNOI * 0.35,
    noi: i === 0 ? -totalInvestment : stabilizedNOI,
    debtService: 0,
    cashFlow: i === 0 ? -totalInvestment : (exitStrategy === "sell" && i === 1 ? profitOnSale : stabilizedNOI),
    propertyValue: exitValue,
    equity: exitValue - (totalInvestment * 0.7),
  }));

  return { metrics, projections };
}
