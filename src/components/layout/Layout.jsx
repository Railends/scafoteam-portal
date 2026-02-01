import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImage from '@/assets/logo.png';

export function Layout({ children, className }) {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link to="/worker/login" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-scafoteam-navy text-white text-xs font-bold rounded-xl hover:bg-scafoteam-navy/90 transition-all shadow-lg shadow-scafoteam-navy/20">
                            {t('worker_portal')}
                        </Link>
                    </div>

                    <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group">
                        <img src={logoImage} alt="Scafoteam Logo" className="h-10 w-auto transition-transform group-hover:scale-105" />
                        <span className="font-bold text-lg hidden lg:inline-block text-scafoteam-navy tracking-tight group-hover:opacity-80 transition-opacity">Scafoteam Finland</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <nav className="hidden md:flex items-center gap-1">
                            <Link to="/register" className="px-4 py-2 text-xs font-bold text-scafoteam-navy hover:text-white hover:bg-scafoteam-navy rounded-xl transition-all">
                                {t('register')}
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>
            <main className={cn("flex-1 container max-w-5xl mx-auto py-8 px-4 md:px-8", className)}>
                {children}
            </main>
            <footer className="border-t py-6 bg-white/50 backdrop-blur-sm">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 max-w-7xl mx-auto">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} Scafoteam Finland. {t('footer_rights')}
                    </p>
                    <Link to="/admin" className="flex items-center gap-2 text-xs text-gray-300 hover:text-scafoteam-gold transition-colors opacity-50 hover:opacity-100">
                        <Lock className="w-3 h-3" />
                        {t('admin_login')}
                    </Link>
                </div>
            </footer>
        </div>
    );
}
