'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { MultifamilyInputs } from '@/types';
import { BarChart3 } from 'lucide-react';

interface MultifamilyFormProps {
  onSubmit: (inputs: MultifamilyInputs) => void;
  loading?: boolean;
}

const defaultValues: MultifamilyInputs = {
  location: '',
  zipCode: '',
  numberOfUnits: 0,
  averageRentPerUnit: 0,
  vacancyRate: 7,
  monthlyOperatingExpenses: 0,
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 7.25,
  loanTermYears: 30,
  propertySize: 0,
};

export default function MultifamilyForm({ onSubmit, loading }: MultifamilyFormProps) {
  const [form, setForm] = useState<MultifamilyInputs>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof MultifamilyInputs, string>>>({});

  const update = (key: keyof MultifamilyInputs, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MultifamilyInputs, string>> = {};
    if (!form.location) newErrors.location = 'Location is required';
    if (form.numberOfUnits <= 0) newErrors.numberOfUnits = 'Number of units is required';
    if (form.averageRentPerUnit <= 0) newErrors.averageRentPerUnit = 'Average rent is required';
    if (form.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price is required';
    if (form.downPayment <= 0) newErrors.downPayment = 'Down payment is required';
    if (form.downPayment >= form.purchasePrice) newErrors.downPayment = 'Down payment cannot exceed purchase price';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const grossMonthlyRent = form.numberOfUnits * form.averageRentPerUnit;
  const pricePerUnit = form.numberOfUnits > 0 ? Math.round(form.purchasePrice / form.numberOfUnits) : 0;
  const annualGrossRent = grossMonthlyRent * 12;
  const annualNOI =
    annualGrossRent * (1 - form.vacancyRate / 100) - form.monthlyOperatingExpenses * 12;
  const estimatedCapRate =
    form.purchasePrice > 0 ? ((annualNOI / form.purchasePrice) * 100).toFixed(1) : '-';
  const grm =
    annualGrossRent > 0 && form.purchasePrice > 0
      ? (form.purchasePrice / annualGrossRent).toFixed(1)
      : '-';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Property Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location / Address"
            placeholder="1200 Riverside Dr, Austin, TX"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            error={errors.location}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="78704"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
            maxLength={5}
          />
        </div>
      </div>

      {/* Unit Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Unit Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Number of Units"
            type="number"
            placeholder="12"
            min="2"
            value={form.numberOfUnits || ''}
            onChange={(e) => update('numberOfUnits', parseInt(e.target.value) || 0)}
            error={errors.numberOfUnits}
            required
          />
          <Input
            label="Average Rent Per Unit"
            type="number"
            prefix="$"
            placeholder="1,400"
            value={form.averageRentPerUnit || ''}
            onChange={(e) => update('averageRentPerUnit', parseFloat(e.target.value) || 0)}
            error={errors.averageRentPerUnit}
            hint={grossMonthlyRent > 0 ? `Gross Monthly: $${grossMonthlyRent.toLocaleString()}` : undefined}
            required
          />
          <Input
            label="Vacancy Rate"
            type="number"
            suffix="%"
            placeholder="7"
            min="0"
            max="100"
            step="0.5"
            value={form.vacancyRate || ''}
            onChange={(e) => update('vacancyRate', parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Property Size"
            type="number"
            suffix="sqft"
            placeholder="8,400"
            value={form.propertySize || ''}
            onChange={(e) => update('propertySize', parseFloat(e.target.value) || 0)}
            hint={form.propertySize > 0 && form.numberOfUnits > 0 ? `${Math.round(form.propertySize / form.numberOfUnits)} sqft/unit` : undefined}
          />
        </div>
      </div>

      {/* Financials */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Purchase & Financing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Price"
            type="number"
            prefix="$"
            placeholder="1,200,000"
            value={form.purchasePrice || ''}
            onChange={(e) => update('purchasePrice', parseFloat(e.target.value) || 0)}
            error={errors.purchasePrice}
            hint={pricePerUnit > 0 ? `$${pricePerUnit.toLocaleString()} / unit` : undefined}
            required
          />
          <Input
            label="Down Payment"
            type="number"
            prefix="$"
            placeholder="300,000"
            value={form.downPayment || ''}
            onChange={(e) => update('downPayment', parseFloat(e.target.value) || 0)}
            error={errors.downPayment}
            hint={form.purchasePrice > 0 && form.downPayment > 0 ? `${((form.downPayment / form.purchasePrice) * 100).toFixed(1)}%` : undefined}
            required
          />
          <Input
            label="Interest Rate"
            type="number"
            suffix="%"
            placeholder="7.25"
            step="0.1"
            value={form.interestRate || ''}
            onChange={(e) => update('interestRate', parseFloat(e.target.value) || 0)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Loan Term</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-xl text-gray-900 text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              value={form.loanTermYears}
              onChange={(e) => update('loanTermYears', parseInt(e.target.value))}
            >
              <option value={20}>20 Years</option>
              <option value={25}>25 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
          Operating Expenses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Monthly Operating Expenses"
            type="number"
            prefix="$"
            placeholder="3,200"
            value={form.monthlyOperatingExpenses || ''}
            onChange={(e) => update('monthlyOperatingExpenses', parseFloat(e.target.value) || 0)}
            hint="Taxes, insurance, maintenance, management fees"
          />
        </div>
      </div>

      {/* Preview */}
      {form.numberOfUnits > 0 && form.averageRentPerUnit > 0 && form.purchasePrice > 0 && (
        <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
          <p className="text-xs text-gray-500 mb-2 font-medium">Multifamily Preview</p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-gray-500">Gross Monthly</div>
              <div className="text-sm font-bold text-gray-900">${grossMonthlyRent.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Est. Cap Rate</div>
              <div className={`text-sm font-bold ${parseFloat(estimatedCapRate) >= 7 ? 'text-green-400' : 'text-yellow-400'}`}>
                {estimatedCapRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Price/Unit</div>
              <div className="text-sm font-bold text-gray-900">${pricePerUnit.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">GRM</div>
              <div className="text-sm font-bold text-gray-900">{grm}x</div>
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
