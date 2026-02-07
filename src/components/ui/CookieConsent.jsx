import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

export const CookieConsent = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('scafoteam_cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('scafoteam_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('scafoteam_cookie_consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
                >
                    <div className="bg-white/90 backdrop-blur-xl border border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 bg-blue-50/50 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

                        <div className="relative flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Cookie className="w-6 h-6 text-blue-600" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-scafoteam-navy text-lg">{t('cookie_title', 'Mēs izmantojam sīkdatnes')}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t('cookie_text', 'Mēs izmantojam sīkdatnes, lai nodrošinātu mājaslapas darbību un uzlabotu lietotāja pieredzi.')}
                                    <a href="/privacy-policy" className="ml-1 text-blue-600 hover:underline font-medium">
                                        {t('learn_more', 'Uzzināt vairāk')}
                                    </a>
                                </p>

                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleAccept} className="bg-scafoteam-navy hover:bg-scafoteam-navy/90 text-sm h-9 px-4">
                                        {t('accept', 'Pieņemt')}
                                    </Button>
                                    <Button onClick={handleDecline} variant="ghost" className="text-sm h-9 px-4">
                                        {t('decline', 'Noraidīt')}
                                    </Button>
                                </div>
                            </div>

                            <button onClick={() => setIsVisible(false)} className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
