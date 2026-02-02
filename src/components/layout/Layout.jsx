import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Lock, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../common/BrandLogo';
import { useTheme } from '@/contexts/ThemeContext';

export function Layout({ children, className }) {
    const { t } = useTranslation();
    const { isDark, toggleTheme } = useTheme();

    return (

        <div className={cn("min-h-screen flex flex-col font-sans transition-colors duration-500", isDark ? "bg-[#0f172a] text-white" : "bg-white text-scafoteam-navy")}>
            <div className={cn(
                "bg-gradient-to-r from-scafoteam-gold via-orange-500 to-scafoteam-gold bg-[length:200%_auto] animate-gradient py-2 px-4 text-center border-b border-black/5",
                !isDark && "brightness-110 shadow-sm"
            )}>
                <p className="text-[11px] md:text-xs font-black text-scafoteam-navy uppercase tracking-[0.2em]">
                    🔔 {t('announcement_text')}
                </p>
            </div>

            <header className={cn(
                "sticky top-0 z-50 w-full border-b backdrop-blur transition-all duration-300",
                isDark
                    ? "bg-[#0f172a]/80 border-white/5 supports-[backdrop-filter]:bg-[#0f172a]/60"
                    : "bg-white/80 border-gray-100 supports-[backdrop-filter]:bg-white/60"
            )}>
                <div className="container flex h-16 sm:h-20 items-center justify-between px-2 sm:px-4 md:px-8 max-w-7xl mx-auto relative">
                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <LanguageSwitcher />

                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95",
                                isDark ? "bg-white/5 text-scafoteam-gold" : "bg-scafoteam-navy/5 text-scafoteam-navy"
                            )}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 h-4" />}
                        </button>

                        <Link to="/worker/login" className={cn(
                            "hidden sm:flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-full transition-all shadow-lg hover:scale-105 active:scale-95",
                            isDark
                                ? "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40"
                                : "bg-white border border-gray-200 text-scafoteam-navy hover:bg-gray-50 shadow-sm"
                        )}>
                            <span className="hidden md:inline">{t('worker_portal')}</span>
                            <span className="md:hidden">PORTAL</span>
                        </Link>

                    </div>

                    <Link to="/" className="absolute left-1/2 -translate-x-1/2 group h-8 sm:h-12 flex items-center">
                        <BrandLogo className="h-full" variant={isDark ? 'white' : 'default'} />
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <nav className="flex items-center gap-2 sm:gap-3 text-right">
                            <Link to="/register" className={cn(
                                "px-4 sm:px-8 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-full transition-all shadow-xl hover:scale-105 active:scale-95",
                                isDark
                                    ? "bg-white text-scafoteam-navy hover:bg-gray-100 shadow-white/5"
                                    : "bg-scafoteam-navy text-white hover:bg-scafoteam-navy/90 shadow-scafoteam-navy/20"
                            )}>
                                {t('register')}
                            </Link>
                        </nav>

                    </div>
                </div>
            </header>

            <main className={cn("flex-1 container max-w-5xl mx-auto py-8 px-4 md:px-8", className)}>
                {children}
            </main>
            <footer className={cn(
                "border-t py-12 transition-colors duration-300",
                isDark ? "bg-black/20 border-white/5" : "bg-gray-50/50 border-gray-100"
            )}>
                <div className="container flex flex-col md:flex-row items-center justify-between gap-8 px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <BrandLogo className="h-8 grayscale opacity-50" variant={isDark ? 'white' : 'default'} />
                        <p className={cn("text-sm font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                            &copy; {new Date().getFullYear()} Scafoteam Finland. {t('footer_rights')}
                        </p>
                    </div>
                    <Link to="/admin" className={cn(
                        "flex items-center gap-2 text-xs font-bold transition-all",
                        isDark ? "text-gray-700 hover:text-scafoteam-gold" : "text-gray-300 hover:text-scafoteam-navy"
                    )}>
                        <Lock className="w-3.5 h-3.5" />
                        {t('admin_login')}
                    </Link>
                </div>
            </footer>
        </div>
    );
}


