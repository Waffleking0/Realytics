import type {
  ResidentialInputs,
  LandInputs,
  CommercialInputs,
  MultifamilyInputs,
  DevelopmentInputs,
  FinancialResults,
  ProjectionYear,
} from '@/types';

/**
 * Calculate monthly mortgage payment using the standard PMT formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMortgage(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment * 100) / 100;
}

/**
 * Calculate Net Operating Income
 * NOI = (Gross Rent * (1 - Vacancy Rate)) - Operating Expenses
 */
export function calculateNOI(
  grossRent: number,
  vacancyRate: number,
  operatingExpenses: number
): number {
  const effectiveGrossIncome = grossRent * (1 - vacancyRate / 100);
  return effectiveGrossIncome - operatingExpenses;
}

/**
 * Calculate Capitalization Rate
 * Cap Rate = NOI / Purchase Price * 100
 */
export function calculateCapRate(noi: number, purchasePrice: number): number {
  if (purchasePrice === 0) return 0;
  return (noi / purchasePrice) * 100;
}

/**
 * Calculate Cash-on-Cash Return
 * CoC = Annual Pre-Tax Cash Flow / Total Cash Invested * 100
 */
export function calculateCashOnCash(
  annualCashFlow: number,
  totalCashInvested: number
): number {
  if (totalCashInvested === 0) return 0;
  return (annualCashFlow / totalCashInvested) * 100;
}

/**
 * Calculate Internal Rate of Return using Newton-Raphson iterative method
 * IRR is the discount rate that makes NPV = 0
 * cashFlows[0] is the initial investment (negative), rest are annual returns
 */
export function calculateIRR(cashFlows: number[]): number {
  if (cashFlows.length < 2) return 0;

  // Initial guess
  let rate = 0.1;
  const maxIterations = 1000;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      if (t > 0) {
        dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(dnpv) < tolerance) break;

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      rate = newRate;
      break;
    }

    rate = newRate;

    // Clamp to prevent divergence
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }

  return Math.round(rate * 10000) / 100; // Return as percentage
}

/**
 * Generate 10-year cash flow projections
 */
export function generateCashFlowProjections(
  annualCashFlow: number,
  years: number = 10,
  growthRate: number = 0.03,
  purchasePrice: number = 0,
  appreciationRate: number = 0.04,
  downPayment: number = 0
): ProjectionYear[] {
  const projections: ProjectionYear[] = [];
  let cumulative = 0;
  let currentCashFlow = annualCashFlow;
  let propertyValue = purchasePrice;

  for (let year = 1; year <= years; year++) {
    cumulative += currentCashFlow;
    propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const loanBalance = purchasePrice > 0 ? (purchasePrice - downPayment) * Math.pow(1 - 0.02, year) : 0;
    const equity = propertyValue - loanBalance + cumulative;

    projections.push({
      year,
      cashFlow: Math.round(currentCashFlow),
      cumulativeCashFlow: Math.round(cumulative),
      propertyValue: Math.round(propertyValue),
      equity: Math.round(Math.max(equity, downPayment)),
    });

    currentCashFlow *= 1 + growthRate;
  }

  return projections;
}

/**
 * Calculate residential deal financials
 */
export function calculateResidential(inputs: ResidentialInputs): FinancialResults {
  const loanAmount = inputs.purchasePrice - inputs.downPayment;
  const monthlyMortgage = calculateMortgage(loanAmount, inputs.interestRate, inputs.loanTermYears);
  const annualGrossRent = inputs.monthlyRent * 12;

  // Estimate vacancy at 5% for residential
  const vacancyRate = 5;
  const annualNOI = calculateNOI(annualGrossRent, vacancyRate, inputs.monthlyExpenses * 12);
  const capRate = calculateCapRate(annualNOI, inputs.purchasePrice);

  const monthlyCashFlow = inputs.monthlyRent * (1 - vacancyRate / 100) - inputs.monthlyExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const totalInvestment = inputs.downPayment + inputs.renovationCosts;
  const cashOnCashReturn = calculateCashOnCash(annualCashFlow, totalInvestment);

  // Build 10-year cash flows for IRR
  const irrCashFlows = [-totalInvestment];
  for (let i = 1; i <= 10; i++) {
    const cf = annualCashFlow * Math.pow(1.03, i - 1);
    // Add terminal value in year 10 (assume 20% equity appreciation)
    if (i === 10) {
      irrCashFlows.push(cf + inputs.purchasePrice * 0.35);
    } else {
      irrCashFlows.push(cf);
    }
  }
  const irr = calculateIRR(irrCashFlows);

  const grm = annualGrossRent > 0 ? inputs.purchasePrice / annualGrossRent : 0;
  const breakEvenMonths = monthlyCashFlow > 0 ? Math.ceil(totalInvestment / monthlyCashFlow) : 999;

  return {
    noi: Math.round(annualNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    irr: Math.round(irr * 100) / 100,
    monthlyMortgage: Math.round(monthlyMortgage),
    grossRent: Math.round(annualGrossRent),
    totalInvestment: Math.round(totalInvestment),
    grm: Math.round(grm * 10) / 10,
    breakEvenMonths: breakEvenMonths > 500 ? undefined : breakEvenMonths,
  };
}

/**
 * Calculate multifamily deal financials
 */
export function calculateMultifamily(inputs: MultifamilyInputs): FinancialResults {
  const loanAmount = inputs.purchasePrice - inputs.downPayment;
  const monthlyMortgage = calculateMortgage(loanAmount, inputs.interestRate, inputs.loanTermYears);
  const grossMonthlyRent = inputs.numberOfUnits * inputs.averageRentPerUnit;
  const annualGrossRent = grossMonthlyRent * 12;

  const annualNOI = calculateNOI(annualGrossRent, inputs.vacancyRate, inputs.monthlyOperatingExpenses * 12);
  const capRate = calculateCapRate(annualNOI, inputs.purchasePrice);

  const effectiveMonthlyRent = grossMonthlyRent * (1 - inputs.vacancyRate / 100);
  const monthlyCashFlow = effectiveMonthlyRent - inputs.monthlyOperatingExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const totalInvestment = inputs.downPayment;
  const cashOnCashReturn = calculateCashOnCash(annualCashFlow, totalInvestment);

  const irrCashFlows = [-totalInvestment];
  for (let i = 1; i <= 10; i++) {
    const cf = annualCashFlow * Math.pow(1.025, i - 1);
    if (i === 10) {
      irrCashFlows.push(cf + inputs.purchasePrice * 0.40);
    } else {
      irrCashFlows.push(cf);
    }
  }
  const irr = calculateIRR(irrCashFlows);

  const pricePerUnit = inputs.numberOfUnits > 0 ? inputs.purchasePrice / inputs.numberOfUnits : 0;
  const grm = annualGrossRent > 0 ? inputs.purchasePrice / annualGrossRent : 0;

  return {
    noi: Math.round(annualNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    irr: Math.round(irr * 100) / 100,
    monthlyMortgage: Math.round(monthlyMortgage),
    grossRent: Math.round(annualGrossRent),
    totalInvestment: Math.round(totalInvestment),
    pricePerUnit: Math.round(pricePerUnit),
    grm: Math.round(grm * 10) / 10,
  };
}

/**
 * Calculate commercial deal financials
 */
export function calculateCommercial(inputs: CommercialInputs): FinancialResults {
  const loanAmount = inputs.purchasePrice - inputs.downPayment;
  const monthlyMortgage = calculateMortgage(loanAmount, inputs.interestRate, inputs.loanTermYears);
  const annualGrossRent = inputs.grossMonthlyRent * 12;

  const annualNOI = calculateNOI(annualGrossRent, inputs.vacancyRate, inputs.monthlyOperatingExpenses * 12);
  const capRate = calculateCapRate(annualNOI, inputs.purchasePrice);

  const effectiveMonthlyRent = inputs.grossMonthlyRent * (1 - inputs.vacancyRate / 100);
  const monthlyCashFlow = effectiveMonthlyRent - inputs.monthlyOperatingExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const totalInvestment = inputs.downPayment;
  const cashOnCashReturn = calculateCashOnCash(annualCashFlow, totalInvestment);

  const irrCashFlows = [-totalInvestment];
  for (let i = 1; i <= 10; i++) {
    const cf = annualCashFlow * Math.pow(1.02, i - 1);
    if (i === 10) {
      irrCashFlows.push(cf + inputs.purchasePrice * 0.45);
    } else {
      irrCashFlows.push(cf);
    }
  }
  const irr = calculateIRR(irrCashFlows);

  const pricePerSqft = inputs.propertySize > 0 ? inputs.purchasePrice / inputs.propertySize : 0;
  const grm = annualGrossRent > 0 ? inputs.purchasePrice / annualGrossRent : 0;

  return {
    noi: Math.round(annualNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    irr: Math.round(irr * 100) / 100,
    monthlyMortgage: Math.round(monthlyMortgage),
    grossRent: Math.round(annualGrossRent),
    totalInvestment: Math.round(totalInvestment),
    grm: Math.round(grm * 10) / 10,
  };
}

/**
 * Calculate land deal financials (appreciation-based)
 */
export function calculateLand(inputs: LandInputs): FinancialResults {
  const holdYears = inputs.holdingPeriodYears || 5;
  const annualAppreciation = inputs.expectedAppreciationRate / 100;
  const futureValue = inputs.purchasePrice * Math.pow(1 + annualAppreciation, holdYears);
  const totalHoldingCosts = inputs.annualHoldingCosts * holdYears;
  const netProfit = futureValue - inputs.purchasePrice - totalHoldingCosts;
  const roi = (netProfit / inputs.purchasePrice) * 100;
  const annualizedROI = (Math.pow(1 + roi / 100, 1 / holdYears) - 1) * 100;

  // Negative cash flow while holding (only costs)
  const monthlyCashFlow = -(inputs.annualHoldingCosts / 12);
  const annualCashFlow = -inputs.annualHoldingCosts;

  const irrCashFlows = [-inputs.purchasePrice];
  for (let i = 1; i <= holdYears; i++) {
    if (i === holdYears) {
      irrCashFlows.push(futureValue - totalHoldingCosts);
    } else {
      irrCashFlows.push(-inputs.annualHoldingCosts);
    }
  }
  const irr = calculateIRR(irrCashFlows);

  return {
    noi: Math.round(-inputs.annualHoldingCosts),
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow),
    capRate: 0,
    cashOnCashReturn: Math.round(annualizedROI * 100) / 100,
    irr: Math.round(irr * 100) / 100,
    monthlyMortgage: 0,
    grossRent: 0,
    totalInvestment: inputs.purchasePrice,
    netProfit: Math.round(netProfit),
    roi: Math.round(roi * 100) / 100,
  };
}

/**
 * Calculate development deal financials
 */
export function calculateDevelopment(inputs: DevelopmentInputs): FinancialResults {
  const contingency = inputs.constructionCost * (inputs.contingencyPercent / 100);
  const totalDevelopmentCost = inputs.landCost + inputs.constructionCost + contingency;
  const financingCostMonthly = totalDevelopmentCost * (inputs.financingRate / 100 / 12);
  const totalFinancingCost = financingCostMonthly * inputs.timelineMonths;
  const totalProjectCost = totalDevelopmentCost + totalFinancingCost;

  let annualCashFlow = 0;
  let monthlyCashFlow = 0;
  let netProfit = 0;
  let roi = 0;
  let capRate = 0;
  let grossRent = 0;

  if (inputs.exitStrategy === 'sale') {
    netProfit = inputs.estimatedValue - totalProjectCost;
    roi = (netProfit / totalProjectCost) * 100;
    const holdMonths = inputs.timelineMonths;
    const annualizedReturn = (Math.pow(1 + roi / 100, 12 / holdMonths) - 1) * 100;
    annualCashFlow = netProfit;
    monthlyCashFlow = netProfit / holdMonths;
    capRate = annualizedReturn;
  } else {
    grossRent = (inputs.estimatedMonthlyRent || 0) * 12;
    const noi = grossRent * 0.85; // 15% vacancy/expenses assumption
    capRate = calculateCapRate(noi, inputs.estimatedValue);
    monthlyCashFlow = (inputs.estimatedMonthlyRent || 0) * 0.85 - financingCostMonthly;
    annualCashFlow = monthlyCashFlow * 12;
    netProfit = inputs.estimatedValue - totalProjectCost;
    roi = (netProfit / totalProjectCost) * 100;
  }

  const irrCashFlows = [-totalProjectCost];
  if (inputs.exitStrategy === 'sale') {
    const monthsPerYear = 12;
    const years = Math.ceil(inputs.timelineMonths / monthsPerYear);
    for (let i = 1; i <= Math.max(years, 3); i++) {
      if (i === Math.ceil(inputs.timelineMonths / monthsPerYear)) {
        irrCashFlows.push(inputs.estimatedValue);
      } else {
        irrCashFlows.push(0);
      }
    }
  } else {
    for (let i = 1; i <= 10; i++) {
      const cf = annualCashFlow * Math.pow(1.03, i - 1);
      if (i === 10) {
        irrCashFlows.push(cf + inputs.estimatedValue * 0.5);
      } else {
        irrCashFlows.push(cf);
      }
    }
  }
  const irr = calculateIRR(irrCashFlows);

  return {
    noi: Math.round(grossRent * 0.85),
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(roi * 100) / 100,
    irr: Math.round(irr * 100) / 100,
    monthlyMortgage: Math.round(financingCostMonthly),
    grossRent: Math.round(grossRent),
    totalInvestment: Math.round(totalProjectCost),
    netProfit: Math.round(netProfit),
    roi: Math.round(roi * 100) / 100,
  };
}
