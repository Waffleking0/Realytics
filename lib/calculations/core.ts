/**
 * core.ts — Reusable financial calculation functions used across all property types.
 * All monetary values are in USD. Rates are decimals (0.07 = 7%).
 */

// ─── Mortgage ─────────────────────────────────────────────────────────────────

/**
 * Calculate the fixed monthly mortgage payment.
 * P = principal, r = annual interest rate (decimal), n = term in years
 */
export function monthlyMortgagePayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const r = annualRate / 12;
  const n = termYears * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Outstanding loan balance after `monthsPaid` payments.
 */
export function remainingLoanBalance(
  principal: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number
): number {
  if (annualRate === 0) return principal - (principal / (termYears * 12)) * monthsPaid;
  const r = annualRate / 12;
  const n = termYears * 12;
  return (
    principal *
    ((Math.pow(1 + r, n) - Math.pow(1 + r, monthsPaid)) /
      (Math.pow(1 + r, n) - 1))
  );
}

// ─── Income & Expenses ────────────────────────────────────────────────────────

/** Gross Rental Income (annual) */
export function grossRentalIncome(monthlyRent: number): number {
  return monthlyRent * 12;
}

/** Effective Gross Income after vacancy loss */
export function effectiveGrossIncome(gri: number, vacancyRatePct: number): number {
  return gri * (1 - vacancyRatePct / 100);
}

/** Net Operating Income = EGI - Operating Expenses */
export function netOperatingIncome(egi: number, annualOperatingExpenses: number): number {
  return egi - annualOperatingExpenses;
}

// ─── Key Metrics ──────────────────────────────────────────────────────────────

/** Cap Rate = NOI / Purchase Price */
export function capRate(noi: number, purchasePrice: number): number {
  return purchasePrice > 0 ? noi / purchasePrice : 0;
}

/**
 * Cash-on-Cash Return = Annual Cash Flow / Total Cash Invested
 * Cash invested = down payment + closing costs + renovation
 */
export function cashOnCashReturn(annualCashFlow: number, totalCashInvested: number): number {
  return totalCashInvested > 0 ? annualCashFlow / totalCashInvested : 0;
}

/** Gross Rent Multiplier = Purchase Price / Annual Gross Rent */
export function grossRentMultiplier(purchasePrice: number, annualGrossRent: number): number {
  return annualGrossRent > 0 ? purchasePrice / annualGrossRent : 0;
}

/** Debt Service Coverage Ratio = NOI / Annual Debt Service */
export function debtServiceCoverageRatio(noi: number, annualDebtService: number): number {
  return annualDebtService > 0 ? noi / annualDebtService : 999;
}

/**
 * Break-Even Occupancy = (Operating Expenses + Debt Service) / Gross Potential Rent
 * Returns as percentage (e.g. 75 means 75%)
 */
export function breakEvenOccupancy(
  annualOperatingExpenses: number,
  annualDebtService: number,
  grossPotentialRent: number
): number {
  return grossPotentialRent > 0
    ? ((annualOperatingExpenses + annualDebtService) / grossPotentialRent) * 100
    : 100;
}

// ─── IRR (Internal Rate of Return) ────────────────────────────────────────────

/**
 * Calculate IRR using Newton-Raphson iteration.
 * cashFlows[0] = initial investment (negative), cashFlows[1..n] = annual returns
 * Returns the annual rate as a decimal (e.g. 0.12 = 12%).
 */
export function calculateIRR(cashFlows: number[], guess = 0.1): number {
  const MAX_ITER  = 1000;
  const TOLERANCE = 1e-7;
  let rate = guess;

  for (let i = 0; i < MAX_ITER; i++) {
    // NPV at current rate
    const npv = cashFlows.reduce(
      (sum, cf, t) => sum + cf / Math.pow(1 + rate, t),
      0
    );
    // Derivative of NPV
    const dnpv = cashFlows.reduce(
      (sum, cf, t) => sum - (t * cf) / Math.pow(1 + rate, t + 1),
      0
    );

    if (Math.abs(dnpv) < TOLERANCE) break;

    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < TOLERANCE) return newRate;
    rate = newRate;
  }

  return isFinite(rate) ? rate : 0;
}

// ─── NPV ──────────────────────────────────────────────────────────────────────

/**
 * Net Present Value of a series of cash flows discounted at `discountRate`.
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce(
    (sum, cf, t) => sum + cf / Math.pow(1 + discountRate, t),
    0
  );
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtPercent(n: number, decimals = 2): string {
  return `${(n * 100).toFixed(decimals)}%`;
}
