import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, error, type, ...props }, ref) => {
    return (
        <div className="relative">
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scafoteam-navy focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                    error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 mt-1 absolute -bottom-5 left-0">{error}</span>
            )}
        </div>
    );
});
Input.displayName = "Input";

export { Input };
