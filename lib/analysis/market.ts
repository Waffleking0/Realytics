import type { MarketAnalysis, MarketFactor, PropertyType } from '@/types';
import { getMarketData } from '@/lib/mockData/market';

// Cap rate thresholds per property type
const capRateThresholds: Record<PropertyType, { excellent: number; good: number; fair: number }> = {
  residential: { excellent: 8, good: 6, fair: 4 },
  multifamily: { excellent: 9, good: 7, fair: 5 },
  commercial: { excellent: 8, good: 6, fair: 4 },
  land: { excellent: 6, good: 4, fair: 2 },
  development: { excellent: 20, good: 15, fair: 10 },
};

/**
 * Generate market & risk analysis for a property
 */
export function analyzeMarket(
  type: PropertyType,
  location: string,
  capRate: number,
  cashOnCash: number
): MarketAnalysis {
  // Try to extract ZIP from location string
  const zipMatch = location.match(/\b\d{5}\b/);
  const zipCode = zipMatch ? zipMatch[0] : 'default';
  const market = getMarketData(zipCode);

  const thresholds = capRateThresholds[type];
  const factors: MarketFactor[] = [];

  // --- Cap Rate Factor ---
  let capRateScore = 50;
  let capRateImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let capRateDesc = '';
  if (capRate >= thresholds.excellent) {
    capRateScore = 90;
    capRateImpact = 'positive';
    capRateDesc = `Cap rate of ${capRate.toFixed(1)}% significantly exceeds the ${thresholds.excellent}% benchmark for excellent ${type} investments.`;
  } else if (capRate >= thresholds.good) {
    capRateScore = 70;
    capRateImpact = 'positive';
    capRateDesc = `Cap rate of ${capRate.toFixed(1)}% meets the target range for quality ${type} investments.`;
  } else if (capRate >= thresholds.fair) {
    capRateScore = 45;
    capRateImpact = 'neutral';
    capRateDesc = `Cap rate of ${capRate.toFixed(1)}% is below average for the ${type} sector. Consider price renegotiation.`;
  } else if (capRate > 0) {
    capRateScore = 20;
    capRateImpact = 'negative';
    capRateDesc = `Cap rate of ${capRate.toFixed(1)}% is significantly below acceptable thresholds for ${type} properties. High risk.`;
  } else {
    capRateScore = 50;
    capRateImpact = 'neutral';
    capRateDesc = 'Cap rate not applicable for this investment type.';
  }
  factors.push({ name: 'Cap Rate', impact: capRateImpact, description: capRateDesc, score: capRateScore });

  // --- Cash-on-Cash Return Factor ---
  let cocScore = 50;
  let cocImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let cocDesc = '';
  if (cashOnCash >= 12) {
    cocScore = 95; cocImpact = 'positive';
    cocDesc = `Exceptional cash-on-cash return of ${cashOnCash.toFixed(1)}% delivers outstanding yield on invested capital.`;
  } else if (cashOnCash >= 8) {
    cocScore = 78; cocImpact = 'positive';
    cocDesc = `Strong cash-on-cash return of ${cashOnCash.toFixed(1)}% provides solid income on invested capital.`;
  } else if (cashOnCash >= 5) {
    cocScore = 58; cocImpact = 'neutral';
    cocDesc = `Moderate cash-on-cash return of ${cashOnCash.toFixed(1)}%. Acceptable but room for improvement.`;
  } else if (cashOnCash >= 0) {
    cocScore = 30; cocImpact = 'negative';
    cocDesc = `Low cash-on-cash return of ${cashOnCash.toFixed(1)}% suggests thin margins and limited upside.`;
  } else {
    cocScore = 10; cocImpact = 'negative';
    cocDesc = `Negative cash-on-cash return of ${cashOnCash.toFixed(1)}%. Investment is currently cash-flow negative.`;
  }
  factors.push({ name: 'Cash-on-Cash Return', impact: cocImpact, description: cocDesc, score: cocScore });

  // --- Market Growth Factor ---
  const growthScore = Math.min(100, Math.max(0, market.priceGrowthYoY * 7));
  const growthImpact: 'positive' | 'negative' | 'neutral' = market.priceGrowthYoY >= 5 ? 'positive' : market.priceGrowthYoY >= 2 ? 'neutral' : 'negative';
  factors.push({
    name: 'Market Price Growth',
    impact: growthImpact,
    description: `${market.city} market grew ${market.priceGrowthYoY}% YoY. ${market.priceGrowthYoY >= 7 ? 'Strong appreciation environment supports long-term value.' : market.priceGrowthYoY >= 4 ? 'Moderate growth supports stable value retention.' : 'Below-average growth may limit appreciation upside.'}`,
    score: Math.round(growthScore),
  });

  // --- Vacancy Rate Factor ---
  const vacancyScore = Math.max(0, 100 - market.vacancyRate * 8);
  const vacancyImpact: 'positive' | 'negative' | 'neutral' = market.vacancyRate <= 5 ? 'positive' : market.vacancyRate <= 8 ? 'neutral' : 'negative';
  factors.push({
    name: 'Market Vacancy Rate',
    impact: vacancyImpact,
    description: `Local vacancy rate of ${market.vacancyRate}%. ${market.vacancyRate <= 5 ? 'Tight rental market supports strong occupancy and rent growth.' : market.vacancyRate <= 8 ? 'Moderate vacancy presents typical leasing risk.' : 'Elevated vacancy may indicate oversupply or weak demand.'}`,
    score: Math.round(vacancyScore),
  });

  // --- Employment & Economy Factor ---
  const empScore = Math.min(100, (market.employmentRate - 90) * 10);
  const empImpact: 'positive' | 'negative' | 'neutral' = market.employmentRate >= 96 ? 'positive' : market.employmentRate >= 93 ? 'neutral' : 'negative';
  factors.push({
    name: 'Economic Strength',
    impact: empImpact,
    description: `Employment rate of ${market.employmentRate}% and median household income of $${market.medianHouseholdIncome.toLocaleString()}. ${market.economicStrength >= 80 ? 'Strong economic fundamentals support tenant demand.' : 'Economic indicators suggest moderate risk.'}`,
    score: Math.round(empScore),
  });

  // --- Population Growth Factor ---
  const popScore = Math.min(100, Math.max(0, market.populationGrowth * 15));
  const popImpact: 'positive' | 'negative' | 'neutral' = market.populationGrowth >= 3 ? 'positive' : market.populationGrowth >= 1 ? 'neutral' : 'negative';
  factors.push({
    name: 'Population Growth',
    impact: popImpact,
    description: `Population growing at ${market.populationGrowth}% annually. ${market.populationGrowth >= 3 ? 'High population influx creates strong sustained demand for all property types.' : market.populationGrowth >= 1 ? 'Steady population growth supports stable demand.' : 'Stagnant population growth limits demand expansion.'}`,
    score: Math.round(popScore),
  });

  // --- Calculate overall scores ---
  const factorScores = factors.map((f) => f.score);
  const avgFactorScore = factorScores.reduce((a, b) => a + b, 0) / factorScores.length;

  // Risk score: higher = more risky (inverse of market strength)
  const riskScore = Math.round(100 - avgFactorScore);

  let riskLevel: 'Low' | 'Medium' | 'High';
  if (riskScore <= 35) riskLevel = 'Low';
  else if (riskScore <= 60) riskLevel = 'Medium';
  else riskLevel = 'High';

  const marketStrengthScore = Math.round(avgFactorScore);
  let marketStrength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  if (marketStrengthScore >= 75) marketStrength = 'Very Strong';
  else if (marketStrengthScore >= 55) marketStrength = 'Strong';
  else if (marketStrengthScore >= 35) marketStrength = 'Moderate';
  else marketStrength = 'Weak';

  return {
    riskScore,
    riskLevel,
    marketStrengthScore,
    marketStrength,
    factors,
    vacancyRate: market.vacancyRate,
    averageAppreciation: market.priceGrowthYoY,
    medianIncome: market.medianHouseholdIncome,
    populationGrowth: market.populationGrowth,
    employmentRate: market.employmentRate,
  };
}
