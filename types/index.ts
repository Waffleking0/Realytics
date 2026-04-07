export type PropertyType = 'residential' | 'land' | 'commercial' | 'multifamily' | 'development';

export interface ResidentialInputs {
  address: string;
  zipCode: string;
  purchasePrice: number;
  downPayment: number;
  downPaymentPct?: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  renovationCosts: number;
  monthlyExpenses: number;
  propertyCondition: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface LandInputs {
  location: string;
  zipCode: string;
  zoningType: 'residential' | 'commercial' | 'agricultural' | 'industrial' | 'mixed-use';
  acreage: number;
  utilities: {
    water: boolean;
    electricity: boolean;
    sewer: boolean;
    gas: boolean;
  };
  purchasePrice: number;
  expectedAppreciationRate: number;
  holdingPeriodYears: number;
  annualHoldingCosts: number;
}

export interface CommercialInputs {
  location: string;
  zipCode: string;
  purchasePrice: number;
  downPayment: number;
  downPaymentPct?: number;
  interestRate: number;
  loanTermYears: number;
  numberOfTenants: number;
  averageLeaseTermYears: number;
  vacancyRate: number;
  monthlyOperatingExpenses: number;
  grossMonthlyRent: number;
  propertySize: number;
}

export interface MultifamilyInputs {
  location: string;
  zipCode: string;
  numberOfUnits: number;
  averageRentPerUnit: number;
  vacancyRate: number;
  monthlyOperatingExpenses: number;
  purchasePrice: number;
  downPayment: number;
  downPaymentPct?: number;
  interestRate: number;
  loanTermYears: number;
  propertySize: number;
}

export interface DevelopmentInputs {
  location: string;
  zipCode: string;
  landCost: number;
  constructionCost: number;
  timelineMonths: number;
  estimatedValue: number;
  financingRate: number;
  exitStrategy: 'sale' | 'rent';
  estimatedMonthlyRent?: number;
  contingencyPercent: number;
}

export interface FinancialResults {
  noi: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  monthlyMortgage?: number;
  grossRent?: number;
  totalInvestment: number;
  netProfit?: number;
  roi?: number;
  breakEvenMonths?: number;
  pricePerUnit?: number;
  grm?: number;
  debtServiceCoverageRatio?: number;
  [key: string]: any;
}

export interface ComparableProperty {
  id: string;
  address: string;
  price: number;
  size?: number;
  pricePerSqft?: number;
  capRate?: number;
  type?: PropertyType;
  distance: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
  monthlyRent?: number;
  sqFt?: number;
  similarity?: number;
  pricePerSqFt?: number;
  beds?: number;
  baths?: number;
}

export interface MarketAnalysis {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  marketStrengthScore: number;
  marketStrength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  factors: MarketFactor[];
  vacancyRate: number;
  averageAppreciation: number;
  medianIncome: number;
  populationGrowth: number;
  employmentRate: number;
}

export interface MarketFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  score: number;
}

export interface AIReport {
  executiveSummary: string;
  keyMetrics: { label: string; value: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
  strengths: string[];
  risks: string[];
  marketInsights: string;
  recommendation: 'Buy' | 'Hold' | 'Pass';
  reasoning: string;
  confidenceScore: number;
}

export interface ProjectionYear {
  year: number;
  cashFlow: number;
  cumulativeCashFlow?: number;
  propertyValue: number;
  equity: number;
  [key: string]: any;
}

export interface AnalysisResult {
  inputs: ResidentialInputs | LandInputs | CommercialInputs | MultifamilyInputs | DevelopmentInputs;
  type: PropertyType;
  financialResults: FinancialResults;
  comparables: ComparableProperty[];
  marketAnalysis: MarketAnalysis;
  aiReport: AIReport;
  projections: ProjectionYear[];
  timestamp: string;
  dealScore?: any;
  recommendation?: 'Buy' | 'Hold' | 'Pass';
  riskScore?: number;
  [key: string]: any;
}

// Alias for backwards compatibility
export type AnalysisResults = AnalysisResult;
export type PropertyInputs = ResidentialInputs | LandInputs | CommercialInputs | MultifamilyInputs | DevelopmentInputs;
export type CoreMetrics = FinancialResults;
