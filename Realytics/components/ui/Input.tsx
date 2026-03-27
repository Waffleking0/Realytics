'use client';

import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  containerClassName?: string;
}

export default function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  containerClassName,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm font-medium select-none pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={clsx(
            'w-full bg-white border rounded-xl text-gray-900 placeholder-gray-400 text-sm py-2.5 transition-all duration-200',
            prefix ? 'pl-7 pr-3' : 'px-3',
            suffix ? 'pr-10' : '',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/15',
            'focus:outline-none focus:ring-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm font-medium select-none pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
