"use client";
import { useState, useEffect, useCallback } from "react";
import type { PropertyType, PropertyInputs, AnalysisResults } from "@/types";

export interface SavedDeal {
  id: string;
  savedAt: string;
  label: string;
  propertyType: PropertyType;
  inputs: PropertyInputs;
  results: AnalysisResults;
}

const STORAGE_KEY = "realytics_saved_v1";
const MAX_SAVED   = 25;

export function useSavedDeals() {
  const [deals,       setDeals]       = useState<SavedDeal[]>([]);
  const [isHydrated,  setIsHydrated]  = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDeals(JSON.parse(raw));
    } catch {}
    setIsHydrated(true);
  }, []);

  const saveDeal = useCallback((
    propertyType: PropertyType,
    inputs: PropertyInputs,
    results: AnalysisResults,
  ): string => {
    const address = (inputs as any).address as string | undefined;
    const label   = address?.trim() ||
      `${propertyType.charAt(0).toUpperCase()}${propertyType.slice(1)} Deal`;

    const deal: SavedDeal = {
      id:           `deal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      savedAt:      new Date().toISOString(),
      label,
      propertyType,
      inputs,
      results,
    };

    setDeals(prev => {
      const filtered = prev.filter(
        d => !(d.label === label && d.propertyType === propertyType),
      );
      const next = [deal, ...filtered].slice(0, MAX_SAVED);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    return deal.id;
  }, []);

  const removeDeal = useCallback((id: string) => {
    setDeals(prev => {
      const next = prev.filter(d => d.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setDeals([]);
  }, []);

  return { deals, saveDeal, removeDeal, clearAll, isHydrated };
}
