import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export default function Landing() {
    const { t } = useTranslation();
    return (
        <Layout className="max-w-none px-0 py-0">
            {/* Hero Section */}
            <section className="relative bg-scafoteam-navy text-white py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        {t('hero_title')} <span className="text-scafoteam-gold">Scafoteam Finland</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        {t('hero_subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register">
                            <Button size="lg" className="bg-scafoteam-gold hover:bg-yellow-500 text-scafoteam-navy font-bold w-full sm:w-auto">
                                {t('register_now')} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 text-scafoteam-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-scafoteam-navy mb-2">{t('safety_first')}</h3>
                            <p className="text-gray-600">
                                {t('safety_desc')}
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 text-scafoteam-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-scafoteam-navy mb-2">{t('expert_team')}</h3>
                            <p className="text-gray-600">
                                {t('expert_desc')}
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 text-scafoteam-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-scafoteam-navy mb-2">{t('reliable_projects')}</h3>
                            <p className="text-gray-600">
                                {t('reliable_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gray-50 border-t">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-scafoteam-navy mb-4">{t('ready_title')}</h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        {t('ready_desc')}
                    </p>
                    <Link to="/register">
                        <Button size="lg" className="bg-scafoteam-navy hover:bg-blue-900 text-white font-bold">
                            {t('fill_form')}
                        </Button>
                    </Link>
                </div>
            </section>
        </Layout>
    );
}
