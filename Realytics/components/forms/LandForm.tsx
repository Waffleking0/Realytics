'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { LandInputs } from '@/types';
import { BarChart3 } from 'lucide-react';

interface LandFormProps {
  onSubmit: (inputs: LandInputs) => void;
  loading?: boolean;
}

const defaultValues: LandInputs = {
  location: '',
  zipCode: '',
  zoningType: 'residential',
  acreage: 0,
  utilities: {
    water: false,
    electricity: false,
    sewer: false,
    gas: false,
  },
  purchasePrice: 0,
  expectedAppreciationRate: 5,
  holdingPeriodYears: 5,
  annualHoldingCosts: 0,
};

export default function LandForm({ onSubmit, loading }: LandFormProps) {
  const [form, setForm] = useState<LandInputs>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const update = (key: keyof LandInputs, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleUtility = (key: keyof LandInputs['utilities']) => {
    setForm((prev) => ({
      ...prev,
      utilities: { ...prev.utilities, [key]: !prev.utilities[key] },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!form.location) newErrors.location = 'Location is required';
    if (form.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price must be greater than 0';
    if (form.acreage <= 0) newErrors.acreage = 'Acreage must be greater than 0';
    if (form.expectedAppreciationRate < 0) newErrors.expectedAppreciationRate = 'Rate cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const utilitiesCount = Object.values(form.utilities).filter(Boolean).length;
  const pricePerAcre = form.acreage > 0 ? form.purchasePrice / form.acreage : 0;
  const futureValue =
    form.purchasePrice *
    Math.pow(1 + form.expectedAppreciationRate / 100, form.holdingPeriodYears);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Property Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location / Address"
            placeholder="Rural Route 5, Dripping Springs, TX"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            error={errors.location}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="78620"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      {/* Land Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Land Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Zoning Type <span className="text-red-400">*</span></label>
            <select
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl text-white text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.zoningType}
              onChange={(e) => update('zoningType', e.target.value)}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="agricultural">Agricultural</option>
              <option value="industrial">Industrial</option>
              <option value="mixed-use">Mixed-Use</option>
            </select>
          </div>
          <Input
            label="Acreage"
            type="number"
            suffix="acres"
            placeholder="5.0"
            step="0.1"
            min="0.01"
            value={form.acreage || ''}
            onChange={(e) => update('acreage', parseFloat(e.target.value) || 0)}
            error={errors.acreage}
            hint={pricePerAcre > 0 ? `$${pricePerAcre.toLocaleString(undefined, { maximumFractionDigits: 0 })} / acre` : undefined}
            required
          />
        </div>

        {/* Utilities */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Available Utilities ({utilitiesCount}/4)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(form.utilities) as (keyof LandInputs['utilities'])[]).map((util) => (
              <button
                key={util}
                type="button"
                onClick={() => toggleUtility(util)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  form.utilities[util]
                    ? 'bg-green-500/15 border-green-500/40 text-green-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${form.utilities[util] ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="capitalize">{util}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">
          Financial Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Price"
            type="number"
            prefix="$"
            placeholder="480,000"
            value={form.purchasePrice || ''}
            onChange={(e) => update('purchasePrice', parseFloat(e.target.value) || 0)}
            error={errors.purchasePrice}
            required
          />
          <Input
            label="Expected Annual Appreciation"
            type="number"
            suffix="%"
            placeholder="5"
            step="0.5"
            value={form.expectedAppreciationRate || ''}
            onChange={(e) => update('expectedAppreciationRate', parseFloat(e.target.value) || 0)}
            error={errors.expectedAppreciationRate}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Holding Period</label>
            <select
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl text-white text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.holdingPeriodYears}
              onChange={(e) => update('holdingPeriodYears', parseInt(e.target.value))}
            >
              {[2, 3, 5, 7, 10].map((y) => (
                <option key={y} value={y}>{y} Years</option>
              ))}
            </select>
          </div>
          <Input
            label="Annual Holding Costs"
            type="number"
            prefix="$"
            placeholder="5,000"
            value={form.annualHoldingCosts || ''}
            onChange={(e) => update('annualHoldingCosts', parseFloat(e.target.value) || 0)}
            hint="Taxes, insurance, maintenance"
          />
        </div>
      </div>

      {/* Quick Preview */}
      {form.purchasePrice > 0 && form.expectedAppreciationRate > 0 && (
        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-xs text-gray-400 mb-2 font-medium">Appreciation Preview</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Current Value</div>
              <div className="text-sm font-bold text-white">${form.purchasePrice.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Projected ({form.holdingPeriodYears}yr)</div>
              <div className="text-sm font-bold text-green-400">${Math.round(futureValue).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Gain</div>
              <div className="text-sm font-bold text-green-400">
                +${Math.round(futureValue - form.purchasePrice).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={<BarChart3 className="w-5 h-5" />}
      >
        {loading ? 'Analyzing Deal...' : 'Analyze Deal'}
      </Button>
    </form>
  );
}
