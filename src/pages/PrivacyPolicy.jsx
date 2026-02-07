import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Lock, Eye, Trash2, Download, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
    const { t } = useTranslation();

    const sections = [
        {
            icon: Shield,
            title: t('gdpr_intro_title', 'Datu aizsardzība un GDPR'),
            content: t('gdpr_intro_text', 'Mēs, Scafoteam, ļoti nopietni uztveram jūsu privātumu. Jūsu dati tiek apstrādāti saskaņā ar Vispārīgo datu aizsardzības regulu (GDPR).')
        },
        {
            icon: Eye,
            title: t('gdpr_usage_title', 'Kādus datus mēs vācam?'),
            content: t('gdpr_usage_text', 'Mēs vācam tikai tos datus, kas nepieciešami jūsu nodarbinātībai: vārds, uzvārds, kontaktinformācija, sertifikāti un bankas rekvizīti.')
        },
        {
            icon: Lock,
            title: t('gdpr_security_title', 'Datu drošība'),
            content: t('gdpr_security_text', 'Jūsu dati tiek glabāti drošā, šifrētā datubāzē. Piekļuve tiem ir tikai pilnvarotiem administratoriem.')
        },
        {
            icon: Download,
            title: t('gdpr_portability_title', 'Tiesības uz datu pārnesamību'),
            content: t('gdpr_portability_text', 'Jums ir tiesības jebkurā laikā pieprasīt savu datu eksportu JSON vai PDF formātā.')
        },
        {
            icon: Trash2,
            title: t('gdpr_forgotten_title', 'Tiesības tikt aizmirstam'),
            content: t('gdpr_forgotten_text', 'Jūs varat pieprasīt savu datu pilnīgu dzēšanu no mūsu sistēmas, ja tie vairs nav nepieciešami likumā noteikto saistību izpildei.')
        }
    ];

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 py-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-scafoteam-navy tracking-tight">
                        {t('privacy_policy_title', 'Privātuma Politika')}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {t('privacy_policy_subtitle', 'Caurspīdīga informācija par to, kā mēs apstrādājam jūsu datus.')}
                    </p>
                </div>

                <div className="grid gap-6">
                    {sections.map((section, idx) => (
                        <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                            <CardContent className="p-8 flex gap-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <section.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-scafoteam-navy">{section.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-scafoteam-navy text-white border-0 shadow-2xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <CardContent className="p-10 relative z-10 text-center space-y-6">
                        <FileText className="w-12 h-12 mx-auto text-blue-300" />
                        <h2 className="text-2xl font-bold">{t('gdpr_contact_title', 'Jautājumi par datu apstrādi?')}</h2>
                        <p className="text-blue-100/80 max-w-xl mx-auto">
                            {t('gdpr_contact_text', 'Ja jums ir kādi jautājumi par jūsu personīgo datu apstrādi vai vēlaties izmantot savas GDPR tiesības, lūdzu, rakstiet uz: privacy@scafoteam.fi')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
