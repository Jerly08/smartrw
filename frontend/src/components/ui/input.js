'use client';

import React, { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export const Input = forwardRef(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClasses = `
      px-3 py-2 rounded-md border
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input'; 