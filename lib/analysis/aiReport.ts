import type { AIReport, FinancialResults, MarketAnalysis, PropertyType } from '@/types';

interface ReportInputs {
  purchasePrice?: number;
  location?: string;
  address?: string;
  numberOfUnits?: number;
  acreage?: number;
  landCost?: number;
  constructionCost?: number;
  exitStrategy?: string;
  timelineMonths?: number;
  [key: string]: unknown;
}

/**
 * Generate professional AI investment report (rule-based, no external API)
 */
export function generateAIReport(
  type: PropertyType,
  inputs: ReportInputs,
  results: FinancialResults,
  market: MarketAnalysis
): AIReport {
  const location = (inputs.location || inputs.address || 'the subject market') as string;

  // Determine recommendation
  let recommendation: 'Buy' | 'Hold' | 'Pass';
  const thresholds: Record<PropertyType, { buy: number; hold: number }> = {
    residential: { buy: 7, hold: 5 },
    multifamily: { buy: 8, hold: 6 },
    commercial: { buy: 7, hold: 5 },
    land: { buy: 15, hold: 8 }, // land uses cashOnCash/IRR
    development: { buy: 18, hold: 12 },
  };

  const t = thresholds[type];
  const primaryMetric = type === 'land' ? results.irr : type === 'development' ? results.cashOnCashReturn : results.capRate;

  if (primaryMetric >= t.buy && results.cashOnCashReturn >= 0) {
    recommendation = 'Buy';
  } else if (primaryMetric >= t.hold) {
    recommendation = 'Hold';
  } else {
    recommendation = 'Pass';
  }

  // Override if market risk is very high
  if (market.riskLevel === 'High' && recommendation === 'Buy') {
    recommendation = 'Hold';
  }
  // Override if cash flow is strongly negative
  if (results.annualCashFlow < -10000 && type !== 'land') {
    recommendation = 'Pass';
  }

  // --- Executive Summary ---
  const execSummaryMap: Record<PropertyType, string> = {
    residential: `This ${inputs.purchasePrice ? '$' + Number(inputs.purchasePrice).toLocaleString() : ''} residential property in ${location} presents a ${recommendation === 'Buy' ? 'compelling' : recommendation === 'Hold' ? 'mixed' : 'challenging'} investment opportunity. With a cap rate of ${results.capRate.toFixed(1)}% and monthly cash flow of ${results.monthlyCashFlow >= 0 ? '+' : ''}$${results.monthlyCashFlow.toLocaleString()}, the deal ${results.monthlyCashFlow >= 0 ? 'generates positive cash flow' : 'runs at a monthly deficit'} from day one. The ${market.marketStrength} market conditions in ${location} ${market.marketStrength === 'Very Strong' || market.marketStrength === 'Strong' ? 'provide a favorable backdrop for appreciation' : 'suggest moderate caution'}.`,
    multifamily: `This ${inputs.numberOfUnits}-unit multifamily asset located in ${location} is being analyzed at a ${results.capRate.toFixed(1)}% cap rate with an estimated IRR of ${results.irr.toFixed(1)}%. The property generates ${results.monthlyCashFlow >= 0 ? 'positive' : 'negative'} monthly cash flow of ${results.monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(results.monthlyCashFlow).toLocaleString()}, representing a cash-on-cash return of ${results.cashOnCashReturn.toFixed(1)}%. ${market.marketStrength === 'Very Strong' ? 'Market fundamentals strongly support multifamily demand in this submarket.' : 'Market conditions warrant a careful due diligence process.'}`,
    commercial: `The commercial property under review in ${location} is priced at ${inputs.purchasePrice ? '$' + Number(inputs.purchasePrice).toLocaleString() : 'the stated amount'} and yields a ${results.capRate.toFixed(1)}% cap rate. Commercial assets in this submarket are experiencing ${market.averageAppreciation > 5 ? 'strong' : 'moderate'} rent growth of ${market.averageAppreciation.toFixed(1)}% annually, which ${market.averageAppreciation > 5 ? 'enhances the long-term value proposition' : 'provides moderate rent escalation potential'}. The ${market.riskLevel.toLowerCase()} risk profile and ${market.marketStrength.toLowerCase()} market strength suggest ${recommendation === 'Buy' ? 'this is an attractive acquisition candidate.' : recommendation === 'Hold' ? 'investors should weigh the risk-reward carefully.' : 'the current pricing does not adequately compensate for risk.'}`,
    land: `This ${inputs.acreage ? inputs.acreage + '-acre' : ''} land parcel in ${location} is evaluated primarily on appreciation potential and strategic positioning. With an expected IRR of ${results.irr.toFixed(1)}% and projected net profit of ${results.netProfit ? '$' + results.netProfit.toLocaleString() : 'the stated amount'}, the land investment ${results.irr >= 15 ? 'delivers competitive returns relative to improved property alternatives' : results.irr >= 8 ? 'offers moderate returns consistent with land investment norms' : 'presents return challenges that may not justify the illiquidity premium'}. Land investments carry unique risks including entitlement uncertainty, infrastructure costs, and extended holding periods.`,
    development: `This ${inputs.exitStrategy === 'sale' ? 'ground-up development for-sale' : 'build-to-rent development'} project in ${location} entails a total investment of $${results.totalInvestment.toLocaleString()} over approximately ${inputs.timelineMonths} months. The projected return of ${results.cashOnCashReturn.toFixed(1)}% ${results.cashOnCashReturn >= 20 ? 'is exceptional for a development project, offering strong risk-adjusted returns' : results.cashOnCashReturn >= 12 ? 'is solid for a development venture, though construction and market risks must be managed' : 'is below typical development benchmarks and should prompt a review of cost or revenue assumptions'}. With market strength rated as ${market.marketStrength.toLowerCase()}, the supply-demand dynamics ${market.marketStrengthScore >= 70 ? 'support absorption of new inventory at projected pricing.' : 'may present challenges for achieving pro-forma revenues.'}`,
  };

  const executiveSummary = execSummaryMap[type];

  // --- Key Metrics ---
  const keyMetrics: AIReport['keyMetrics'] = [];

  if (type !== 'land') {
    keyMetrics.push({
      label: 'Cap Rate',
      value: `${results.capRate.toFixed(2)}%`,
      sentiment: results.capRate >= thresholds[type].buy ? 'positive' : results.capRate >= thresholds[type].hold ? 'neutral' : 'negative',
    });
  }

  keyMetrics.push({
    label: 'Cash-on-Cash Return',
    value: `${results.cashOnCashReturn.toFixed(2)}%`,
    sentiment: results.cashOnCashReturn >= 8 ? 'positive' : results.cashOnCashReturn >= 4 ? 'neutral' : 'negative',
  });

  keyMetrics.push({
    label: 'IRR (10-Year)',
    value: `${results.irr.toFixed(2)}%`,
    sentiment: results.irr >= 15 ? 'positive' : results.irr >= 8 ? 'neutral' : 'negative',
  });

  if (type !== 'land') {
    keyMetrics.push({
      label: 'Monthly Cash Flow',
      value: `${results.monthlyCashFlow >= 0 ? '+' : ''}$${results.monthlyCashFlow.toLocaleString()}`,
      sentiment: results.monthlyCashFlow >= 200 ? 'positive' : results.monthlyCashFlow >= 0 ? 'neutral' : 'negative',
    });
  }

  if (type === 'land' || type === 'development') {
    keyMetrics.push({
      label: 'Net Profit',
      value: `$${(results.netProfit || 0).toLocaleString()}`,
      sentiment: (results.netProfit || 0) > 0 ? 'positive' : 'negative',
    });
  }

  // --- Strengths ---
  const strengths: string[] = [];

  if (results.capRate >= thresholds[type].buy && type !== 'land') {
    strengths.push(`Strong cap rate of ${results.capRate.toFixed(1)}% exceeds the benchmark for quality ${type} investments, indicating excellent income potential relative to purchase price.`);
  } else if (results.capRate >= thresholds[type].hold && type !== 'land') {
    strengths.push(`Adequate cap rate of ${results.capRate.toFixed(1)}% is within the acceptable range for ${type} acquisitions in this market.`);
  }

  if (results.cashOnCashReturn >= 8) {
    strengths.push(`Exceptional cash-on-cash return of ${results.cashOnCashReturn.toFixed(1)}% demonstrates efficient use of equity capital, generating strong income relative to cash invested.`);
  } else if (results.cashOnCashReturn >= 5) {
    strengths.push(`Solid cash-on-cash return of ${results.cashOnCashReturn.toFixed(1)}% provides a reasonable yield on equity, outperforming many passive investment alternatives.`);
  }

  if (results.irr >= 15) {
    strengths.push(`Strong projected IRR of ${results.irr.toFixed(1)}% over a 10-year hold suggests attractive risk-adjusted total returns including appreciation and cash flow.`);
  }

  if (market.marketStrength === 'Very Strong' || market.marketStrength === 'Strong') {
    strengths.push(`${market.marketStrength} market fundamentals in ${location}, with ${market.populationGrowth.toFixed(1)}% population growth and ${market.employmentRate.toFixed(1)}% employment rate, create durable demand drivers.`);
  }

  if (market.averageAppreciation >= 6) {
    strengths.push(`Above-average market appreciation of ${market.averageAppreciation.toFixed(1)}% per year enhances total return potential through property value growth over the holding period.`);
  }

  if (market.vacancyRate <= 5) {
    strengths.push(`Tight local vacancy rate of ${market.vacancyRate.toFixed(1)}% supports strong occupancy, reducing leasing risk and enabling rent escalation.`);
  }

  if (type === 'development' && (results.netProfit || 0) > results.totalInvestment * 0.2) {
    strengths.push(`Development spread of ${results.cashOnCashReturn.toFixed(1)}% provides attractive profit margin relative to total project cost, reflecting favorable construction economics.`);
  }

  // Ensure at least 2 strengths
  if (strengths.length < 2) {
    if (results.totalInvestment > 0) {
      strengths.push(`The deal offers meaningful equity at stake with a total investment of $${results.totalInvestment.toLocaleString()}, providing tangible asset backing to the investment thesis.`);
    }
    strengths.push(`Real estate assets in ${location} provide a tangible inflation hedge, with historical real appreciation rates supporting long-term wealth preservation.`);
  }

  // --- Risks ---
  const risks: string[] = [];

  if (results.capRate < thresholds[type].hold && type !== 'land') {
    risks.push(`Below-threshold cap rate of ${results.capRate.toFixed(1)}% implies overpayment relative to income, leaving little margin for error if rents decline or vacancies increase.`);
  }

  if (results.monthlyCashFlow < 0 && type !== 'land') {
    risks.push(`Negative monthly cash flow of $${Math.abs(results.monthlyCashFlow).toLocaleString()} requires the investor to fund ongoing deficits from other sources, creating liquidity pressure over time.`);
  }

  if (market.riskLevel === 'High') {
    risks.push(`High composite risk score (${market.riskScore}/100) reflects challenging market conditions including elevated vacancy, weak economic indicators, or below-average demand fundamentals.`);
  }

  if (market.vacancyRate >= 8) {
    risks.push(`Elevated market vacancy of ${market.vacancyRate.toFixed(1)}% signals potential oversupply or softening demand, which could compress NOI and asset values.`);
  }

  if (type === 'development') {
    risks.push(`Development projects carry inherent construction risk including cost overruns, delays, and permitting challenges that can erode projected returns by 10-20% or more.`);
  }

  if (type === 'land') {
    risks.push(`Land investments are highly illiquid with no income generation during the holding period, requiring the investor to absorb carrying costs until disposition or development.`);
    risks.push(`Entitlement risk and zoning changes can significantly impact land value, particularly in rapidly evolving regulatory environments.`);
  }

  if (results.irr < 10 && type !== 'land') {
    risks.push(`Projected IRR of ${results.irr.toFixed(1)}% is below the typical 10% hurdle rate for real estate equity, suggesting the risk premium may not adequately compensate investors.`);
  }

  if (risks.length < 2) {
    risks.push(`Interest rate risk remains a key macro factor — a 100bps increase in rates would increase borrowing costs and could compress cap rate spreads, affecting exit valuations.`);
    risks.push(`Deferred maintenance or unexpected capital expenditure requirements could reduce effective NOI and cash-on-cash returns below projections.`);
  }

  // --- Market Insights ---
  const marketInsights = `The ${location} submarket is currently exhibiting ${market.marketStrength.toLowerCase()} market conditions with a composite strength score of ${market.marketStrengthScore}/100. Price appreciation of ${market.averageAppreciation.toFixed(1)}% year-over-year places this market ${market.averageAppreciation >= 7 ? 'among the top-performing metros nationally' : market.averageAppreciation >= 4 ? 'in line with national averages' : 'below national appreciation benchmarks'}. The local economy, supported by a ${market.employmentRate.toFixed(1)}% employment rate and median household income of $${market.medianIncome.toLocaleString()}, ${market.employmentRate >= 96 ? 'provides a robust foundation for sustained rental demand' : 'offers moderate but adequate economic underpinning for real estate investment'}. Population growth of ${market.populationGrowth.toFixed(1)}% annually ${market.populationGrowth >= 3 ? 'is driving significant housing and commercial demand across all asset classes' : 'supports steady demand without significant supply pressure'}. Vacancy rates of ${market.vacancyRate.toFixed(1)}% suggest the market is ${market.vacancyRate <= 5 ? 'supply-constrained, with landlords holding pricing power' : market.vacancyRate <= 8 ? 'balanced between supply and demand' : 'experiencing elevated supply or softening demand that warrants monitoring'}.`;

  // --- Reasoning ---
  const reasoningMap: Record<'Buy' | 'Hold' | 'Pass', string> = {
    Buy: `Based on the analysis, this investment merits a Buy recommendation. The combination of a ${results.capRate > 0 ? results.capRate.toFixed(1) + '% cap rate' : results.irr.toFixed(1) + '% IRR'}, ${results.cashOnCashReturn.toFixed(1)}% cash-on-cash return, and ${market.marketStrength.toLowerCase()} market conditions creates a favorable risk/return profile. The ${market.riskLevel.toLowerCase()} risk level and positive fundamentals suggest that deploying capital into this opportunity is well-supported by the data. Investors should proceed with standard due diligence, financing confirmations, and a physical inspection before closing.`,
    Hold: `This investment presents a Hold scenario — not compelling enough for immediate acquisition, but not without merit. The ${results.capRate > 0 ? results.capRate.toFixed(1) + '% cap rate' : results.irr.toFixed(1) + '% IRR'} is ${primaryMetric >= t.hold ? 'within acceptable range but below the threshold for a strong conviction buy' : 'marginally below target, suggesting pricing is slightly rich relative to fundamentals'}. Investors already holding similar assets in this market may retain their positions, while prospective buyers should seek better entry pricing or wait for market conditions to improve. A 5-10% price reduction or rent increase could convert this to a Buy.`,
    Pass: `The analysis does not support acquisition at current terms. ${results.capRate < thresholds[type].hold && type !== 'land' ? `The ${results.capRate.toFixed(1)}% cap rate is materially below the minimum acceptable threshold of ${thresholds[type].hold}% for ${type} properties.` : `The financial metrics do not meet minimum return thresholds.`} ${results.monthlyCashFlow < 0 && type !== 'land' ? `Negative monthly cash flow of -$${Math.abs(results.monthlyCashFlow).toLocaleString()} creates ongoing capital drain.` : ''} Investors should either negotiate a significant price reduction, identify value-add opportunities to improve NOI, or redirect capital to higher-yielding alternatives in stronger submarkets.`,
  };

  const confidenceScore = Math.round(
    (market.marketStrengthScore * 0.4 + Math.min(100, Math.max(0, results.capRate * 8)) * 0.3 + Math.min(100, Math.max(0, results.irr * 4)) * 0.3)
  );

  return {
    executiveSummary,
    keyMetrics,
    strengths: strengths.slice(0, 5),
    risks: risks.slice(0, 4),
    marketInsights,
    recommendation,
    reasoning: reasoningMap[recommendation],
    confidenceScore: Math.min(95, Math.max(45, confidenceScore)),
  };
}
