'use client';

import React from 'react';
import clsx from 'clsx';
import { MapPin, Calendar, Bed, Bath } from 'lucide-react';
import type { ComparableProperty } from '@/types';

interface ComparablePropertiesProps {
  comparables: ComparableProperty[];
  subjectPrice?: number;
  subjectSize?: number;
  subjectCapRate?: number;
}

export default function ComparableProperties({
  comparables,
  subjectPrice,
  subjectSize,
  subjectCapRate,
}: ComparablePropertiesProps) {
  if (!comparables || comparables.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No comparable properties found for this market.
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const avgCapRate =
    comparables.filter((c) => c.capRate > 0).reduce((sum, c) => sum + c.capRate, 0) /
    (comparables.filter((c) => c.capRate > 0).length || 1);
  const avgPricePerSqft =
    comparables.reduce((sum, c) => sum + c.pricePerSqft, 0) / comparables.length;

  return (
    <div className="space-y-4">
      {/* Subject Property Row (if data provided) */}
      {subjectPrice && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Your Property</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-sm font-bold text-white">{formatPrice(subjectPrice)}</div>
            </div>
            {subjectSize && (
              <div>
                <div className="text-xs text-gray-500">Price/sqft</div>
                <div className="text-sm font-bold text-white">
                  ${Math.round(subjectPrice / subjectSize).toLocaleString()}
                </div>
              </div>
            )}
            {subjectCapRate !== undefined && subjectCapRate > 0 && (
              <div>
                <div className="text-xs text-gray-500">Cap Rate</div>
                <div className="text-sm font-bold text-blue-400">{subjectCapRate.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparable Cards */}
      <div className="space-y-3">
        {comparables.map((comp, idx) => {
          const capRateComparison =
            subjectCapRate && comp.capRate > 0
              ? comp.capRate - subjectCapRate
              : null;

          return (
            <div
              key={comp.id}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{comp.address}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div>
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="text-sm font-bold text-white">{formatPrice(comp.price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Size</div>
                      <div className="text-sm font-medium text-gray-200">
                        {comp.size.toLocaleString()} sqft
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">$/sqft</div>
                      <div className="text-sm font-medium text-gray-200">
                        ${comp.pricePerSqft.toLocaleString()}
                        {avgPricePerSqft > 0 && (
                          <span className={clsx('text-xs ml-1', comp.pricePerSqft <= avgPricePerSqft ? 'text-green-400' : 'text-red-400')}>
                            {comp.pricePerSqft <= avgPricePerSqft ? '▼' : '▲'}
                          </span>
                        )}
                      </div>
                    </div>
                    {comp.capRate > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Cap Rate</div>
                        <div className="flex items-center gap-1">
                          <span className={clsx('text-sm font-bold', comp.capRate >= 7 ? 'text-green-400' : comp.capRate >= 5 ? 'text-yellow-400' : 'text-red-400')}>
                            {comp.capRate.toFixed(1)}%
                          </span>
                          {capRateComparison !== null && (
                            <span className={clsx('text-xs', capRateComparison > 0 ? 'text-green-400' : 'text-red-400')}>
                              ({capRateComparison > 0 ? '+' : ''}{capRateComparison.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extra details row */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {comp.bedrooms && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Bed className="w-3 h-3" />
                        {comp.bedrooms} bd
                      </div>
                    )}
                    {comp.bathrooms && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Bath className="w-3 h-3" />
                        {comp.bathrooms} ba
                      </div>
                    )}
                    {comp.yearBuilt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Built {comp.yearBuilt}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {comp.distance} mi away
                    </div>
                    {comp.daysOnMarket !== undefined && (
                      <div className="text-xs text-gray-500">
                        {comp.daysOnMarket} days on market
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Price</div>
          <div className="text-sm font-bold text-white">
            {formatPrice(comparables.reduce((s, c) => s + c.price, 0) / comparables.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Avg $/sqft</div>
          <div className="text-sm font-bold text-white">
            ${Math.round(avgPricePerSqft).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Cap Rate</div>
          <div className="text-sm font-bold text-white">
            {avgCapRate > 0 ? `${avgCapRate.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
