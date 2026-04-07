/**
 * mockData/comps.ts — Expanded comparable properties database.
 * In production, replace with Zillow / Redfin / MLS API integration.
 */
import type { ComparableProperty, PropertyType } from "@/types";

/** Randomize ±pct to make each session feel like live market data */
function jitter(v: number, pct = 0.08): number {
  return Math.round(v * (1 + (Math.random() * 2 - 1) * pct));
}

// ─── Residential (SFR / condo) ────────────────────────────────────────────────

const RESIDENTIAL: ComparableProperty[] = [
  { id:"r1", address:"142 Maple Street",          price:385000, pricePerSqFt:210, sqFt:1833, beds:3, baths:2,   yearBuilt:2008, monthlyRent:2200, capRate:0.062, distance:0.4, similarity:96 },
  { id:"r2", address:"87 Oak Avenue",             price:410000, pricePerSqFt:210, sqFt:1953, beds:3, baths:2,   yearBuilt:2011, monthlyRent:2350, capRate:0.059, distance:0.7, similarity:93 },
  { id:"r3", address:"215 Elm Drive",             price:340000, pricePerSqFt:215, sqFt:1582, beds:3, baths:1,   yearBuilt:2001, monthlyRent:1950, capRate:0.065, distance:1.1, similarity:88 },
  { id:"r4", address:"8 Birch Court",             price:475000, pricePerSqFt:226, sqFt:2102, beds:4, baths:2,   yearBuilt:2015, monthlyRent:2600, capRate:0.054, distance:1.4, similarity:85 },
  { id:"r5", address:"320 Cedar Lane",            price:295000, pricePerSqFt:208, sqFt:1418, beds:2, baths:2,   yearBuilt:1999, monthlyRent:1750, capRate:0.068, distance:1.8, similarity:81 },
  { id:"r6", address:"55 Pine Street",            price:520000, pricePerSqFt:221, sqFt:2352, beds:4, baths:3,   yearBuilt:2017, monthlyRent:2800, capRate:0.051, distance:2.1, similarity:77 },
  { id:"r7", address:"19 Walnut Way",             price:365000, pricePerSqFt:215, sqFt:1699, beds:3, baths:2,   yearBuilt:2006, monthlyRent:2100, capRate:0.061, distance:2.4, similarity:74 },
  { id:"r8", address:"103 Sycamore Boulevard",    price:445000, pricePerSqFt:217, sqFt:2048, beds:4, baths:2,   yearBuilt:2012, monthlyRent:2450, capRate:0.057, distance:2.8, similarity:70 },
];

// ─── Multifamily ──────────────────────────────────────────────────────────────

const MULTIFAMILY: ComparableProperty[] = [
  { id:"m1", address:"200 Apartment Way",         price:2100000, pricePerSqFt:155, sqFt:13548, monthlyRent:1450, capRate:0.058, distance:0.6, similarity:95 },
  { id:"m2", address:"45 West Street",            price:1400000, pricePerSqFt:148, sqFt: 9457, monthlyRent:1375, capRate:0.061, distance:0.9, similarity:91 },
  { id:"m3", address:"312 Harbor View Drive",     price:3500000, pricePerSqFt:163, sqFt:21472, monthlyRent:1520, capRate:0.055, distance:1.2, similarity:87 },
  { id:"m4", address:"78 Riverside Drive",        price: 920000, pricePerSqFt:143, sqFt: 6430, monthlyRent:1300, capRate:0.064, distance:1.6, similarity:83 },
  { id:"m5", address:"156 Garden Court Apts",     price:2800000, pricePerSqFt:160, sqFt:17500, monthlyRent:1480, capRate:0.056, distance:2.0, similarity:78 },
  { id:"m6", address:"89 Market Street Units",    price: 680000, pricePerSqFt:138, sqFt: 4928, monthlyRent:1250, capRate:0.067, distance:2.3, similarity:72 },
];

// ─── Commercial ───────────────────────────────────────────────────────────────

const COMMERCIAL: ComparableProperty[] = [
  { id:"c1", address:"100 Commerce Drive",        price:1250000, pricePerSqFt:178, sqFt: 7022, capRate:0.072, distance:0.3, similarity:94 },
  { id:"c2", address:"55 Business Park Boulevard",price: 980000, pricePerSqFt:169, sqFt: 5800, capRate:0.069, distance:0.8, similarity:89 },
  { id:"c3", address:"220 Industrial Way",        price:2100000, pricePerSqFt:168, sqFt:12500, capRate:0.075, distance:1.1, similarity:85 },
  { id:"c4", address:"15 Retail Plaza Drive",     price: 620000, pricePerSqFt:194, sqFt: 3200, capRate:0.064, distance:1.5, similarity:81 },
  { id:"c5", address:"430 Office Complex Pkwy",   price:1750000, pricePerSqFt:182, sqFt: 9600, capRate:0.070, distance:1.9, similarity:76 },
  { id:"c6", address:"8 Tech Campus Lane",        price:2800000, pricePerSqFt:187, sqFt:15000, capRate:0.068, distance:2.4, similarity:71 },
];

// ─── Land ─────────────────────────────────────────────────────────────────────

const LAND: ComparableProperty[] = [
  { id:"l1", address:"Vacant Lot — River Road",        price:180000,  pricePerSqFt:4.13, sqFt: 43560, distance:0.5, similarity:93 },
  { id:"l2", address:"Corner Lot — Main & First",      price:145000,  pricePerSqFt:4.43, sqFt: 32670, distance:0.8, similarity:89 },
  { id:"l3", address:"Wooded Parcel — Forest Avenue",  price:320000,  pricePerSqFt:2.94, sqFt:108900, distance:1.3, similarity:82 },
  { id:"l4", address:"Commercial Lot — Business Drive",price:380000,  pricePerSqFt:7.27, sqFt: 52272, distance:1.8, similarity:76 },
  { id:"l5", address:"Agricultural — County Road 14",  price:210000,  pricePerSqFt:0.96, sqFt:217800, distance:2.6, similarity:68 },
];

// ─── Development ──────────────────────────────────────────────────────────────

const DEVELOPMENT: ComparableProperty[] = [
  { id:"d1", address:"500 New Build Lane",         price: 685000, pricePerSqFt:245, sqFt:2800, beds:4, baths:3, yearBuilt:2024, distance:0.5, similarity:92 },
  { id:"d2", address:"25 Construction Avenue",     price: 875000, pricePerSqFt:250, sqFt:3500, beds:5, baths:4, yearBuilt:2024, distance:1.0, similarity:87 },
  { id:"d3", address:"100 Development Way",        price:1100000, pricePerSqFt:262, sqFt:4200, beds:5, baths:4, yearBuilt:2024, distance:1.5, similarity:82 },
  { id:"d4", address:"77 Builder Drive",           price: 750000, pricePerSqFt:242, sqFt:3100, beds:4, baths:3, yearBuilt:2025, distance:2.0, similarity:75 },
];

// ─── Map & export ─────────────────────────────────────────────────────────────

const COMP_MAP: Record<PropertyType, ComparableProperty[]> = {
  residential: RESIDENTIAL,
  multifamily: MULTIFAMILY,
  commercial:  COMMERCIAL,
  land:        LAND,
  development: DEVELOPMENT,
};

export function getComps(
  propertyType: PropertyType,
  _purchasePrice: number,
): ComparableProperty[] {
  const pool = COMP_MAP[propertyType] ?? RESIDENTIAL;
  return pool.map(c => ({
    ...c,
    price:         jitter(c.price),
    pricePerSqFt:  c.pricePerSqFt !== undefined ? parseFloat(jitter(c.pricePerSqFt * 100, 0.05).toString()) / 100 : undefined,
  }));
}
