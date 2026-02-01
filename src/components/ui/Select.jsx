import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ className, error, options, placeholder, ...props }, ref) => {
    return (
        <div className="relative">
            <div className="relative">
                <select
                    className={cn(
                        "flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scafoteam-navy focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {placeholder && <option value="" disabled selected hidden>{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
            {error && (
                <span className="text-xs text-red-500 mt-1 absolute -bottom-5 left-0">{error}</span>
            )}
        </div>
    );
});
Select.displayName = "Select";

export { Select };
