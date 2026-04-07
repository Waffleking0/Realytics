/**
 * marketInsights.ts — Deterministic, ZIP-based hyper-local market data.
 * Same ZIP always produces the same data (seeded), but each ZIP is unique.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyDevelopment {
  name: string;
  type: "residential" | "commercial" | "mixed-use" | "infrastructure";
  status: "planned" | "under construction" | "recently completed";
  units?: number;
  sqFt?: number;
  estimatedCompletion?: string;
  distanceMiles: number;
  impact: "positive" | "neutral" | "slight negative";
  impactNote: string;
}

export interface MarketInsights {
  zip: string;
  city: string;
  state: string;
  // Rent data
  medianRent: number;
  rentGrowthYoY: number;         // %
  rentGrowth3Mo: number;         // % last 3 months annualized
  rentHistory: number[];         // 12 months, absolute median $
  // Price data
  medianHomeValue: number;
  priceGrowthYoY: number;        // %
  priceHistory: number[];        // 12 months, indexed (100 = 12 months ago)
  // Demand / supply
  demandScore: number;           // 0–100
  demandLabel: "Very High" | "High" | "Moderate" | "Low" | "Very Low";
  daysOnMarket: number;
  inventoryMonths: number;       // months of supply
  absorptionRate: number;        // % of listings sold per month
  // Demographics
  populationGrowthYoY: number;   // %
  jobGrowthYoY: number;          // %
  medianHouseholdIncome: number;
  // Quality indicators
  walkScore: number;             // 0–100
  schoolRating: number;          // 1–10
  crimeIndex: number;            // 0–100, lower = safer
  // Market condition
  marketCondition: "Hot 🔥" | "Warm" | "Balanced" | "Cool" | "Cold ❄️";
  capRateAvg: number;            // % area avg cap rate
  // Nearby developments
  nearbyDevelopments: NearbyDevelopment[];
  // Summary
  investorSentiment: "Bullish" | "Neutral" | "Cautious" | "Bearish";
  keyInsight: string;
}

// ─── Seeded pseudo-random ─────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function seededFloat(seed: string, salt: string, min: number, max: number): number {
  const h = hashStr(seed + salt);
  return min + (h % 10000) / 10000 * (max - min);
}

function seededInt(seed: string, salt: string, min: number, max: number): number {
  return Math.round(seededFloat(seed, salt, min, max));
}

function seededPick<T>(seed: string, salt: string, arr: T[]): T {
  const idx = seededInt(seed, salt, 0, arr.length - 1);
  return arr[Math.min(idx, arr.length - 1)];
}

// ─── City database (ZIP prefix → metro) ──────────────────────────────────────

const ZIP_METROS: Record<string, { city: string; state: string }> = {
  "0": { city: "Boston",       state: "MA" },
  "1": { city: "New York",     state: "NY" },
  "2": { city: "Washington",   state: "DC" },
  "3": { city: "Miami",        state: "FL" },
  "4": { city: "Atlanta",      state: "GA" },
  "5": { city: "Chicago",      state: "IL" },
  "6": { city: "Dallas",       state: "TX" },
  "7": { city: "Houston",      state: "TX" },
  "8": { city: "Denver",       state: "CO" },
  "9": { city: "Los Angeles",  state: "CA" },
};

// ─── Development templates ────────────────────────────────────────────────────

const DEV_TEMPLATES = [
  { name: "Mixed-Use Transit Village",  type: "mixed-use"      as const, units: 280,   sqFt: 42000, impact: "positive"        as const, note: "Adds foot traffic and retail; expected to lift rents 3-5% in 0.5-mi radius." },
  { name: "Luxury Apartment Complex",   type: "residential"    as const, units: 180,   sqFt: undefined, impact: "positive"   as const, note: "High-end supply reduces C-class competitor pressure; anchors upward rent trend." },
  { name: "Amazon Fulfillment Center",  type: "commercial"     as const, sqFt: 850000, units: undefined, impact: "positive"  as const, note: "2,000+ jobs expected; historically boosts local rents within 18 months of opening." },
  { name: "Highway Interchange Expansion", type: "infrastructure" as const, impact: "positive" as const, note: "Improved access reduces commute time; typically +2-4% property value premium." },
  { name: "Market-Rate Townhome Cluster", type: "residential"  as const, units: 64,   sqFt: undefined, impact: "neutral"     as const, note: "Adds comparable inventory; monitor pricing pressure on similar units." },
  { name: "Retail Strip Center",         type: "commercial"    as const, sqFt: 28000,  impact: "positive"   as const, note: "Adds walkability score; pharmacy, grocery anchor confirmed." },
  { name: "Affordable Housing Complex",  type: "residential"   as const, units: 120,  impact: "slight negative" as const, note: "May create modest downward pressure on market rents near the 30% AMI bracket." },
  { name: "Tech Office Campus",          type: "commercial"    as const, sqFt: 220000, impact: "positive"  as const, note: "Estimated 800 high-income workers; strong spillover demand for nearby rentals." },
  { name: "Urban Park Redevelopment",    type: "infrastructure" as const, impact: "positive" as const, note: "Greenspace amenity proven to add 5-8% premium to properties within 0.25 miles." },
  { name: "Charter School Campus",       type: "infrastructure" as const, impact: "positive" as const, note: "School quality is top-3 driver of residential demand; boosts family-rental appeal." },
];

const STATUSES: NearbyDevelopment["status"][] = [
  "recently completed", "under construction", "planned"
];

const COMPLETIONS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"];

// ─── Main export ──────────────────────────────────────────────────────────────

export function getMarketInsights(zip: string): MarketInsights {
  const seed = zip || "00000";
  const prefix = seed[0] || "5";
  const metro = ZIP_METROS[prefix] ?? { city: "Phoenix", state: "AZ" };

  // ── Rent data ──────────────────────────────────────────────────────────────
  const medianRent       = seededInt(seed, "rent",       1050, 3400);
  const rentGrowthYoY    = seededFloat(seed, "rentgrow",  1.0, 9.2);
  const rentGrowth3Mo    = rentGrowthYoY * seededFloat(seed, "r3m", 0.6, 1.4);

  const rentHistory: number[] = [];
  let rentBase = medianRent * (1 - rentGrowthYoY / 100);
  const monthlyRentGrowth = Math.pow(1 + rentGrowthYoY / 100, 1 / 12) - 1;
  for (let i = 0; i < 12; i++) {
    rentBase *= (1 + monthlyRentGrowth + seededFloat(seed, `rh${i}`, -0.005, 0.005));
    rentHistory.push(Math.round(rentBase));
  }

  // ── Price data ──────────────────────────────────────────────────────────────
  const medianHomeValue  = seededInt(seed, "hval",  210000, 1200000);
  const priceGrowthYoY   = seededFloat(seed, "pgrow", -1.5, 12.0);

  const priceHistory: number[] = [];
  let priceIdx = 100;
  const monthlyPriceGrowth = Math.pow(1 + priceGrowthYoY / 100, 1 / 12) - 1;
  for (let i = 0; i < 12; i++) {
    priceIdx *= (1 + monthlyPriceGrowth + seededFloat(seed, `ph${i}`, -0.008, 0.008));
    priceHistory.push(Math.round(priceIdx * 10) / 10);
  }

  // ── Supply / demand ─────────────────────────────────────────────────────────
  const demandScore      = seededInt(seed, "demand",  20, 98);
  const daysOnMarket     = seededInt(seed, "dom",      4, 72);
  const inventoryMonths  = seededFloat(seed, "inv",   0.8, 6.5);
  const absorptionRate   = seededFloat(seed, "abs",  15.0, 85.0);

  const demandLabel: MarketInsights["demandLabel"] =
    demandScore >= 80 ? "Very High" :
    demandScore >= 65 ? "High" :
    demandScore >= 45 ? "Moderate" :
    demandScore >= 30 ? "Low" : "Very Low";

  // ── Demographics ────────────────────────────────────────────────────────────
  const populationGrowthYoY   = seededFloat(seed, "pop",   -0.5, 4.2);
  const jobGrowthYoY          = seededFloat(seed, "jobs",  -0.8, 5.5);
  const medianHouseholdIncome = seededInt(seed, "income",  38000, 148000);

  // ── Quality ─────────────────────────────────────────────────────────────────
  const walkScore    = seededInt(seed, "walk",   18, 98);
  const schoolRating = seededFloat(seed, "school", 3.2, 9.8);
  const crimeIndex   = seededInt(seed, "crime",   8, 78);

  // ── Market condition ────────────────────────────────────────────────────────
  const heatScore = (demandScore * 0.35) + (rentGrowthYoY * 3) + (priceGrowthYoY * 2)
    - (daysOnMarket * 0.4) - (inventoryMonths * 4);

  const marketCondition: MarketInsights["marketCondition"] =
    heatScore >= 60  ? "Hot 🔥" :
    heatScore >= 30  ? "Warm" :
    heatScore >= 0   ? "Balanced" :
    heatScore >= -20 ? "Cool" : "Cold ❄️";

  const capRateAvg = seededFloat(seed, "cap", 4.2, 8.8);

  // ── Nearby developments ─────────────────────────────────────────────────────
  const devCount = seededInt(seed, "devcount", 2, 4);
  const nearbyDevelopments: NearbyDevelopment[] = [];

  for (let i = 0; i < devCount; i++) {
    const tpl = seededPick(seed, `dev${i}`, DEV_TEMPLATES);
    const status = seededPick(seed, `devs${i}`, STATUSES);
    nearbyDevelopments.push({
      name: tpl.name,
      type: tpl.type,
      status,
      units: tpl.units,
      sqFt: tpl.sqFt,
      estimatedCompletion: status !== "recently completed"
        ? seededPick(seed, `devc${i}`, COMPLETIONS)
        : undefined,
      distanceMiles: Math.round(seededFloat(seed, `devd${i}`, 0.2, 2.8) * 10) / 10,
      impact: tpl.impact,
      impactNote: tpl.note,
    });
  }

  // ── Investor sentiment ──────────────────────────────────────────────────────
  const sentimentScore = (demandScore * 0.3) + (rentGrowthYoY * 4) + (priceGrowthYoY * 2)
    + (jobGrowthYoY * 5) + (populationGrowthYoY * 3);

  const investorSentiment: MarketInsights["investorSentiment"] =
    sentimentScore >= 55 ? "Bullish" :
    sentimentScore >= 30 ? "Neutral" :
    sentimentScore >= 10 ? "Cautious" : "Bearish";

  const keyInsights = [
    `Rents have grown ${rentGrowthYoY.toFixed(1)}% YoY with ${daysOnMarket} average days on market — demand outpacing supply.`,
    `${inventoryMonths.toFixed(1)} months of housing supply signals a ${inventoryMonths < 2 ? "severe seller's" : inventoryMonths < 4 ? "moderate seller's" : "balanced"} market.`,
    `Job growth of ${jobGrowthYoY.toFixed(1)}% is a leading indicator for sustained rental demand in this ZIP.`,
    `${absorptionRate.toFixed(0)}% absorption rate — properties are moving ${absorptionRate > 60 ? "very quickly" : absorptionRate > 40 ? "at a healthy pace" : "slowly"} in this market.`,
  ];

  return {
    zip: seed,
    city: metro.city,
    state: metro.state,
    medianRent: Math.round(medianRent),
    rentGrowthYoY: Math.round(rentGrowthYoY * 10) / 10,
    rentGrowth3Mo: Math.round(rentGrowth3Mo * 10) / 10,
    rentHistory,
    medianHomeValue,
    priceGrowthYoY: Math.round(priceGrowthYoY * 10) / 10,
    priceHistory,
    demandScore,
    demandLabel,
    daysOnMarket,
    inventoryMonths: Math.round(inventoryMonths * 10) / 10,
    absorptionRate: Math.round(absorptionRate * 10) / 10,
    populationGrowthYoY: Math.round(populationGrowthYoY * 10) / 10,
    jobGrowthYoY: Math.round(jobGrowthYoY * 10) / 10,
    medianHouseholdIncome,
    walkScore,
    schoolRating: Math.round(schoolRating * 10) / 10,
    crimeIndex,
    marketCondition,
    capRateAvg: Math.round(capRateAvg * 100) / 100,
    nearbyDevelopments,
    investorSentiment,
    keyInsight: seededPick(seed, "insight", keyInsights),
  };
}
