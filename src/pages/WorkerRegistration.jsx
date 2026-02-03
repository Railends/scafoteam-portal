import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { workerStore } from '@/lib/store';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
    { id: 'personal', title: 'personal_info' },
    { id: 'contact', title: 'contact_details' },
    { id: 'qualifications', title: 'qualifications' },
    { id: 'bank_experience', title: 'bank_details' },
    { id: 'sizes', title: 'clothing_sizes' },
    { id: 'agreements', title: 'agreements' }
];

export default function WorkerRegistration() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const { register, handleSubmit, control, watch, trigger, formState: { errors } } = useForm({
        mode: 'onChange',
        defaultValues: {
            nationality: '',
            hasFinnishId: 'no',
            hasGreenCard: 'no',
            hasVas: 'no',
            hasHotworks: 'no',
            hasLicense: 'no',
            experienceType: '',
            referred: 'no',
            gdpr: false
        }
    });

    const hasFinnishId = watch('hasFinnishId');
    const hasHotworks = watch('hasHotworks');
    const experienceType = watch('experienceType');
    const referred = watch('referred');

    const nextStep = async () => {
        let fieldsToValidate = [];
        if (currentStep === 0) fieldsToValidate = ['name', 'surname', 'nationality', 'personalId'];
        if (currentStep === 1) fieldsToValidate = ['email', 'phone', 'address'];
        if (currentStep === 3) fieldsToValidate = ['bankAccount', 'bicCode', 'experienceType'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid || true) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const onSubmit = async (data) => {
        try {
            await workerStore.add(data);
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error('Registration failed:', e);
            alert("Kļūda saglabājot datus: " + (e.message || e));
        }
    };


    if (submitted) {
        return (
            <Layout>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('success_title')}</h1>
                    <p className="text-muted-foreground text-lg max-w-md">{t('success_message')}</p>
                    <Button onClick={() => navigate('/')} variant="outline">{t('back')}</Button>
                </motion.div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-scafoteam-navy tracking-tight">{t('welcome')}</h1>
                    <div className="flex justify-center gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className={`h-2 rounded-full transition-all duration-300 ${idx <= currentStep ? 'w-8 bg-scafoteam-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'w-2 bg-gray-200'}`} />

                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="border-0 shadow-2xl shadow-scafoteam-navy/10 overflow-hidden rounded-2xl bg-white/50 backdrop-blur-xl">
                        <CardHeader className="bg-gradient-to-r from-scafoteam-navy to-slate-800 text-white border-b-0 pt-8 pb-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="relative z-10">
                                <CardTitle className="text-2xl tracking-tight">{t(STEPS[currentStep].title)}</CardTitle>
                                <CardDescription className="text-blue-100/80 mt-1">Step {currentStep + 1} of {STEPS.length}</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-10 min-h-[400px] bg-white">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {currentStep === 0 && (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Input {...register('name', { required: true, pattern: /^[A-Za-z\s\-\.\,\d\u00C0-\u00FF\u0100-\u017F]+$/ })} placeholder={t('name')} label={t('name')} error={errors.name && (errors.name.type === 'pattern' ? t('latin_only') : t('required'))} />
                                                <Input {...register('surname', { required: true, pattern: /^[A-Za-z\s\-\.\,\d\u00C0-\u00FF\u0100-\u017F]+$/ })} placeholder={t('surname')} label={t('surname')} error={errors.surname && (errors.surname.type === 'pattern' ? t('latin_only') : t('required'))} />
                                            </div>
                                            <Controller
                                                name="nationality"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <Select {...field}
                                                        placeholder={t('nationality')}
                                                        options={[
                                                            { value: 'Latvia', label: t('countries.latvia') },
                                                            { value: 'Estonia', label: t('countries.estonia') },
                                                            { value: 'Lithuania', label: t('countries.lithuania') },
                                                            { value: 'Poland', label: t('countries.poland') },
                                                            { value: 'Ukraine', label: t('countries.ukraine') },
                                                            { value: 'Finland', label: t('countries.finland') },
                                                            { value: 'Germany', label: t('countries.germany') },
                                                            { value: 'Sweden', label: t('countries.sweden') },
                                                            { value: 'Norway', label: t('countries.norway') },
                                                            { value: 'Denmark', label: t('countries.denmark') },
                                                            { value: 'Romania', label: t('countries.romania') },
                                                            { value: 'Bulgaria', label: t('countries.bulgaria') },
                                                            { value: 'Hungary', label: t('countries.hungary') },
                                                            { value: 'Czech', label: t('countries.czech') },
                                                            { value: 'Slovakia', label: t('countries.slovakia') },
                                                            { value: 'France', label: t('countries.france') },
                                                            { value: 'Spain', label: t('countries.spain') },
                                                            { value: 'Italy', label: t('countries.italy') },
                                                            { value: 'Uzbekistan', label: t('countries.uzbekistan') },
                                                            { value: 'Tajikistan', label: t('countries.tajikistan') },
                                                            { value: 'Kazakhstan', label: t('countries.kazakhstan') },
                                                            { value: 'Other', label: t('countries.other') },

                                                        ]}
                                                    />
                                                )}
                                            />
                                            <Input {...register('personalId', { required: true, pattern: /^[A-Za-z\s\-\.\,\d]+$/ })} placeholder={t('personal_id')} error={errors.personalId && (errors.personalId.type === 'pattern' ? t('latin_only') : t('required'))} />

                                            <div className="pt-4 border-t">
                                                <label className="text-sm font-medium mb-3 block">{t('has_finnish_id')}</label>
                                                <div className="flex gap-4 mb-4">
                                                    <label className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all duration-200 ${hasFinnishId === 'yes' ? 'border-scafoteam-accent bg-blue-50/50 ring-1 ring-scafoteam-accent' : 'hover:bg-gray-50'}`}>
                                                        <input type="radio" value="yes" className="accent-scafoteam-accent" {...register('hasFinnishId')} /> {t('yes')}

                                                    </label>
                                                    <label className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all duration-200 ${hasFinnishId === 'no' ? 'border-gray-300 bg-gray-50' : 'hover:bg-gray-50'}`}>
                                                        <input type="radio" value="no" className="accent-scafoteam-navy" {...register('hasFinnishId')} /> {t('no')}
                                                    </label>
                                                </div>
                                                {hasFinnishId === 'yes' && (
                                                    <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                                        <Input {...register('finnishId')} placeholder={t('finnish_id')} />
                                                        <Input {...register('taxNumber')} placeholder={t('tax_number')} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 1 && (
                                        <div className="space-y-4">
                                            <Input type="email" {...register('email', { required: true })} placeholder={t('email')} error={errors.email && t('required')} />
                                            <div className="flex gap-2">
                                                <Select className="w-28" options={[
                                                    { value: '+371', label: '🇱🇻 +371' },
                                                    { value: '+358', label: '🇫🇮 +358' },
                                                    { value: '+372', label: '🇪🇪 +372' },
                                                    { value: '+370', label: '🇱🇹 +370' },
                                                    { value: '+48', label: '🇵🇱 +48' },
                                                    { value: '+380', label: '🇺🇦 +380' },
                                                    { value: '+49', label: '🇩🇪 +49' },
                                                    { value: '+46', label: '🇸🇪 +46' },
                                                    { value: '+47', label: '🇳🇴 +47' },
                                                    { value: '+45', label: '🇩🇰 +45' },
                                                    { value: '+40', label: '🇷🇴 +40' },
                                                    { value: '+359', label: '🇧🇬 +359' },
                                                    { value: '+36', label: '🇭🇺 +36' },
                                                    { value: '+420', label: '🇨🇿 +420' },
                                                    { value: '+421', label: '🇸🇰 +421' },
                                                    { value: '+33', label: '🇫🇷 +33' },
                                                    { value: '+34', label: '🇪🇸 +34' },
                                                    { value: '+39', label: '🇮🇹 +39' },
                                                    { value: '+998', label: '🇺🇿 +998' },
                                                    { value: '+992', label: '🇹🇯 +992' },
                                                    { value: '+7', label: '🇰🇿 +7' },
                                                ]} {...register('phonePrefix')} />

                                                <Input type="tel" className="flex-1" {...register('phone', { required: true })} placeholder={t('phone')} error={errors.phone && t('required')} />
                                            </div>
                                            <Input {...register('address', { required: true, pattern: /^[A-Za-z\s\-\.\,\d\u00C0-\u00FF\u0100-\u017F]+$/ })} placeholder={t('address')} error={errors.address && (errors.address.type === 'pattern' ? t('latin_only') : t('required'))} />

                                            <div className="pt-4 border-t">
                                                <h4 className="font-medium mb-3">{t('emergency_contact')}</h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <Input {...register('emergencyName', { pattern: /^[A-Za-z\s\-\.\,\d\u00C0-\u00FF\u0100-\u017F]+$/ })} placeholder={t('name')} error={errors.emergencyName && t('latin_only')} />
                                                    <Input {...register('emergencyPhone')} placeholder={t('phone')} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            {[
                                                { key: 'hasGreenCard', label: 'green_card', fields: ['greenCardShow', 'greenCardExpiry'] },
                                                { key: 'hasVas', label: 'vca_card', fields: ['vcaNumber', 'vcaExpiry'] },
                                                { key: 'hasLicense', label: 'driving_licence' }
                                            ].map((item) => (
                                                <div key={item.key} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="font-medium">{t(item.label)}</label>
                                                        <div className="flex gap-2 text-sm">
                                                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer has-[:checked]:bg-scafoteam-navy has-[:checked]:text-white transition-colors">
                                                                <input type="radio" value="yes" className="hidden" {...register(item.key)} /> {t('yes')}
                                                            </label>
                                                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer has-[:checked]:bg-scafoteam-navy has-[:checked]:text-white transition-colors">
                                                                <input type="radio" value="no" className="hidden" {...register(item.key)} /> {t('no')}
                                                            </label>
                                                        </div>
                                                    </div>
                                                    {watch(item.key) === 'yes' && item.fields && (
                                                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl animate-in fade-in">
                                                            <Input {...register(item.fields[0])} placeholder={t('card_number')} />
                                                            <Input type="date" {...register(item.fields[1])} placeholder={t('expiry_date')} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="font-medium">{t('hotworks_as1')}</label>
                                                    <div className="flex gap-2 text-sm">
                                                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer has-[:checked]:bg-scafoteam-navy has-[:checked]:text-white transition-colors">
                                                            <input type="radio" value="yes" className="hidden" {...register('hasHotworks')} /> {t('yes')}
                                                        </label>
                                                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer has-[:checked]:bg-scafoteam-navy has-[:checked]:text-white transition-colors">
                                                            <input type="radio" value="no" className="hidden" {...register('hasHotworks')} /> {t('no')}
                                                        </label>
                                                    </div>
                                                </div>
                                                {hasHotworks === 'yes' && (
                                                    <div className="p-4 bg-gray-50 rounded-xl space-y-3 animate-in fade-in">
                                                        <Select {...register('hotworksType')} options={[{ value: 'hotworks', label: 'Hotworks' }, { value: 'as1', label: 'AS1' }]} />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Input {...register('hotworksNumber')} placeholder={t('card_number')} />
                                                            <Input type="date" {...register('hotworksExpiry')} placeholder={t('expiry_date')} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-lg text-scafoteam-navy border-b pb-2">{t('bank_details')}</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <Input {...register('bankAccount', { required: true, pattern: /^[A-Za-z0-9]+$/ })} placeholder="IBAN" label="IBAN" error={errors.bankAccount && (errors.bankAccount.type === 'pattern' ? t('latin_only') : t('required'))} />
                                                    <Input {...register('bicCode', { required: true, pattern: /^[A-Za-z0-9]+$/ })} placeholder="BIC" label="BIC CODE" error={errors.bicCode && (errors.bicCode.type === 'pattern' ? t('latin_only') : t('required'))} />

                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-bold text-lg text-scafoteam-navy border-b pb-2">{t('experience_type')}</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <Select {...register('experienceType')} options={[
                                                        { value: 'sheet_metal', label: t('sheet_metal') },
                                                        { value: 'scaffolder', label: t('scaffolder') }
                                                    ]} placeholder={t('select_option')} label={t('experience_type')} />

                                                    {experienceType && (
                                                        <Select {...register('experienceDuration')} options={[
                                                            { value: '0-1', label: t('durations.less_1') },
                                                            { value: '1-3', label: t('durations.1_3') },
                                                            { value: '3-5', label: t('durations.3_5') },
                                                            { value: '5+', label: t('durations.5_plus') }
                                                        ]} placeholder={t('select_option')} label={t('experience_duration')} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-6">
                                            <h3 className="font-bold text-lg text-scafoteam-navy border-b pb-2">{t('clothing_sizes')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{t('jacket_size')}</label>
                                                    <Select {...register('jacketSize')} options={['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(s => ({ value: s, label: s }))} placeholder={t('select_option')} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{t('pants_size')}</label>
                                                    <Select {...register('pantsSize')} options={['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(s => ({ value: s, label: s }))} placeholder={t('select_option')} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{t('boots_size')}</label>
                                                    <Select {...register('bootsSize')} options={Array.from({ length: 10 }, (_, i) => i + 39).map(s => ({ value: s, label: s }))} placeholder={t('select_option')} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 5 && (
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-3">
                                                <label className="font-medium block">{t('referred')}</label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2"><input type="radio" value="yes" {...register('referred')} /> {t('yes')}</label>
                                                    <label className="flex items-center gap-2"><input type="radio" value="no" {...register('referred')} /> {t('no')}</label>
                                                </div>
                                                {referred === 'yes' && (
                                                    <Input {...register('referredBy')} placeholder={t('referrer_name')} />
                                                )}
                                            </div>

                                            <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                                <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-scafoteam-navy focus:ring-scafoteam-navy" {...register('gdpr', { required: true })} />
                                                <div className="text-sm">
                                                    <span className="block font-medium text-gray-900 mb-1">{t('gdpr_agree')}</span>
                                                    <p className="text-muted-foreground mb-2">{t('gdpr_text')}</p>
                                                    <a href="#" className="text-scafoteam-navy hover:underline font-medium inline-flex items-center">
                                                        {t('gdpr_link')} <ChevronRight className="w-3 h-3 ml-1" />
                                                    </a>
                                                </div>
                                            </div>
                                            {errors.gdpr && <p className="text-red-500 text-sm font-medium animate-pulse">{t('agree_continue')}</p>}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-4 bg-gray-50/50 p-6 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="w-full sm:w-24"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> {t('back')}
                            </Button>

                            {currentStep < STEPS.length - 1 ? (
                                <Button type="button" onClick={nextStep} className="w-full sm:w-32 bg-scafoteam-navy hover:bg-scafoteam-navy/90">
                                    {t('next')} <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-lg">
                                    {t('submit')}
                                </Button>
                            )}
                        </CardFooter>

                    </Card>
                </form>
            </div>
        </Layout>
    );
}
