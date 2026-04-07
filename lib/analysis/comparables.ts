import type { ComparableProperty, PropertyType } from '@/types';
import { mockComparables } from '@/lib/mockData/comparables';

/**
 * Find 3-5 comparable properties based on type, price range, and size
 */
export function findComparables(
  type: PropertyType,
  purchasePrice: number,
  size?: number
): ComparableProperty[] {
  // Filter by type
  const typeFiltered = mockComparables.filter((p) => p.type === type);

  // Score each property by similarity
  const scored = typeFiltered.map((property) => {
    let score = 0;

    // Price similarity (within 40% range scores higher)
    const priceDiff = Math.abs(property.price - purchasePrice) / purchasePrice;
    if (priceDiff <= 0.1) score += 40;
    else if (priceDiff <= 0.2) score += 30;
    else if (priceDiff <= 0.4) score += 20;
    else score += 5;

    // Size similarity if provided
    if (size && size > 0) {
      const sizeDiff = Math.abs((property.size ?? 0) - size) / size;
      if (sizeDiff <= 0.1) score += 30;
      else if (sizeDiff <= 0.2) score += 20;
      else if (sizeDiff <= 0.4) score += 10;
      else score += 2;
    }

    // Proximity (lower distance is better)
    if (property.distance <= 0.5) score += 20;
    else if (property.distance <= 1.0) score += 15;
    else if (property.distance <= 2.0) score += 10;
    else if (property.distance <= 5.0) score += 5;
    else score += 1;

    // Recent sales (lower days on market scores slightly higher)
    if (property.daysOnMarket !== undefined) {
      if (property.daysOnMarket <= 30) score += 10;
      else if (property.daysOnMarket <= 60) score += 6;
      else score += 2;
    }

    return { property, score };
  });

  // Sort by score descending, take top 5
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5).map((s) => s.property);

  // If we have fewer than 3 comparables of the same type, augment with similar types
  if (top.length < 3) {
    const related: Record<PropertyType, PropertyType[]> = {
      residential: ['multifamily'],
      multifamily: ['residential', 'commercial'],
      commercial: ['multifamily', 'development'],
      land: ['development'],
      development: ['commercial', 'land'],
    };

    const fallbackTypes = related[type] || [];
    const fallbacks = mockComparables
      .filter((p) => p.type && fallbackTypes.includes(p.type as PropertyType))
      .slice(0, 5 - top.length);

    top.push(...fallbacks);
  }

  return top.slice(0, 5);
}
