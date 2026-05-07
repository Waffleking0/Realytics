export type UserTier = 'FREE' | 'ANALYST' | 'PRO';

export interface TierFeatures {
  recommendation: boolean;
  financialMetrics: boolean;
  dealScore: boolean;
  marketAnalysis: boolean;
  projections: boolean;
  mockComparables: boolean;
  realComparables: boolean;
  aiReport: boolean;
  scenarioLab: boolean;
}

export interface TierConfig {
  name: string;
  price: number;
  monthlyAnalyses: number; // -1 = unlimited
  savedDeals: number;      // -1 = unlimited
  features: TierFeatures;
}

export const TIERS: Record<UserTier, TierConfig> = {
  FREE: {
    name: 'Free',
    price: 0,
    monthlyAnalyses: 5,
    savedDeals: 0,
    features: {
      recommendation: true,
      financialMetrics: false,
      dealScore: false,
      marketAnalysis: false,
      projections: false,
      mockComparables: false,
      realComparables: false,
      aiReport: false,
      scenarioLab: false,
    },
  },
  ANALYST: {
    name: 'Analyst',
    price: 29,
    monthlyAnalyses: 50,
    savedDeals: 15,
    features: {
      recommendation: true,
      financialMetrics: true,
      dealScore: true,
      marketAnalysis: true,
      projections: true,
      mockComparables: true,
      realComparables: false,
      aiReport: false,
      scenarioLab: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 79,
    monthlyAnalyses: -1,
    savedDeals: -1,
    features: {
      recommendation: true,
      financialMetrics: true,
      dealScore: true,
      marketAnalysis: true,
      projections: true,
      mockComparables: true,
      realComparables: true,
      aiReport: true,
      scenarioLab: true,
    },
  },
};

export const TIER_ORDER: UserTier[] = ['FREE', 'ANALYST', 'PRO'];

export function canUseFeature(tier: UserTier, feature: keyof TierFeatures): boolean {
  return TIERS[tier].features[feature];
}

/** Returns the lowest tier that unlocks a feature */
export function requiredTierFor(feature: keyof TierFeatures): UserTier {
  return TIER_ORDER.find((t) => TIERS[t].features[feature]) ?? 'PRO';
}
