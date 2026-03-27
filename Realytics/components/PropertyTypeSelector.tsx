'use client';

import React from 'react';
import clsx from 'clsx';
import { Home, Trees, Building2, Layers, HardHat } from 'lucide-react';
import type { PropertyType } from '@/types';

interface PropertyTypeSelectorProps {
  selected: PropertyType;
  onChange: (type: PropertyType) => void;
}

const propertyTypes: {
  id: PropertyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'residential',
    label: 'Residential',
    icon: Home,
    description: 'Single-family homes, condos',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  {
    id: 'land',
    label: 'Land',
    icon: Trees,
    description: 'Vacant lots, acreage',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: Building2,
    description: 'Office, retail, industrial',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
  },
  {
    id: 'multifamily',
    label: 'Multifamily',
    icon: Layers,
    description: 'Apartments, duplexes',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
  },
  {
    id: 'development',
    label: 'Development',
    icon: HardHat,
    description: 'Ground-up construction',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
  },
];

export default function PropertyTypeSelector({ selected, onChange }: PropertyTypeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Property Type</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {propertyTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={clsx(
                'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left',
                isSelected
                  ? `${type.bgColor} ${type.borderColor} shadow-lg`
                  : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <div
                className={clsx(
                  'p-2.5 rounded-xl transition-colors',
                  isSelected ? type.bgColor : 'bg-gray-100'
                )}
              >
                <Icon
                  className={clsx(
                    'w-6 h-6 transition-colors',
                    isSelected ? type.color : 'text-gray-500'
                  )}
                />
              </div>
              <div className="text-center">
                <div
                  className={clsx(
                    'text-sm font-semibold transition-colors',
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  )}
                >
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                  {type.description}
                </div>
              </div>
              {isSelected && (
                <div
                  className={clsx(
                    'absolute top-2 right-2 w-2 h-2 rounded-full',
                    type.color.replace('text-', 'bg-')
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
