'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = props.type === 'password';

    const inputClasses = cn(
      'px-3 py-2 rounded-md border',
      error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500',
      'focus:outline-none focus:ring-2 focus:ring-opacity-50',
      fullWidth ? 'w-full' : '',
      isPasswordField ? 'pr-10' : '', // Add padding right for password field
      className
    );

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={inputClasses}
            {...props}
            type={isPasswordField ? (showPassword ? 'text' : 'password') : props.type}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? 
                <EyeOff className="h-4 w-4" /> : 
                <Eye className="h-4 w-4" />
              }
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input'; 