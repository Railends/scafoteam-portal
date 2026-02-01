import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageSwitcher({ className, showRU = true }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'lv', label: 'Latviešu', flag: 'LV' },
        { code: 'en', label: 'English', flag: 'EN' },
        ...(showRU ? [{ code: 'ru', label: 'Русский', flag: 'RU' }] : [])
    ];

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 text-sm font-bold",
                    "bg-white border border-gray-100 text-scafoteam-navy shadow-sm",
                    "hover:bg-gray-50 hover:border-scafoteam-navy/20 hover:shadow-md",
                    "active:scale-95"
                )}
            >
                <div className="w-5 h-5 rounded-full bg-scafoteam-navy/5 flex items-center justify-center">
                    <Globe className="w-3 h-3 text-scafoteam-navy" />
                </div>
                <span className="tracking-wide uppercase text-[10px]">{currentLanguage.flag}</span>
                <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-1.5 z-[100]"
                    >
                        <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-1">
                            {i18n.language === 'lv' ? 'VALODA' : 'LANGUAGE'}
                        </div>
                        {languages.map((lng) => (
                            <button
                                key={lng.code}
                                onClick={() => handleLanguageChange(lng.code)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200",
                                    i18n.language === lng.code
                                        ? "bg-scafoteam-navy text-white shadow-md font-bold"
                                        : "text-gray-600 hover:bg-gray-100/80 hover:text-scafoteam-navy"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-5 h-5 flex items-center justify-center rounded-md text-[10px] font-black",
                                        i18n.language === lng.code ? "bg-white/20" : "bg-gray-100"
                                    )}>
                                        {lng.flag}
                                    </span>
                                    {lng.label}
                                </div>
                                {i18n.language === lng.code && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <Check className="w-3 h-3 text-scafoteam-gold" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
