import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const variants = {
        default: "bg-scafoteam-navy text-white hover:bg-scafoteam-navy/90 shadow-lg shadow-scafoteam-navy/20",
        outline: "border-2 border-scafoteam-navy text-scafoteam-navy hover:bg-scafoteam-navy/5",
        ghost: "text-scafoteam-navy hover:bg-scafoteam-navy/5",
        secondary: "bg-white text-scafoteam-navy border border-gray-200 hover:bg-gray-50 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20",
    };

    const sizes = {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-8 text-lg",
        xl: "h-20 px-12 text-xl",
        icon: "h-10 w-10",

    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            className={cn(
                "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scafoteam-navy focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
});
Button.displayName = "Button";

export { Button };
