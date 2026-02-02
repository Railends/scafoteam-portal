import React from 'react';
import { cn } from '@/lib/utils';

export function BrandLogo({ className, variant = 'default' }) {
    // variant 'default' uses navy blue, 'white' uses white
    const colorClass = variant === 'white' ? 'fill-white' : 'fill-scafoteam-navy';
    const subtitleColorClass = variant === 'white' ? 'fill-white/80' : 'fill-scafoteam-navy/70';

    return (
        <svg
            viewBox="0 0 320 80"
            className={cn("w-auto h-full", className)}
            style={{ imageRendering: 'auto' }}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* SCAFOTEAM Text */}
            <text
                x="160"
                y="45"
                textAnchor="middle"
                className={cn("font-black tracking-tighter", colorClass)}
                style={{
                    fontSize: '48px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 900
                }}
            >
                SCAFOTEAM
            </text>

            {/* FINLAND Text */}
            <text
                x="160"
                y="72"
                textAnchor="middle"
                className={cn("font-bold", subtitleColorClass)}
                style={{
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    letterSpacing: '0.6em',
                    fontWeight: 700
                }}
            >
                FINLAND
            </text>
        </svg>
    );
}
