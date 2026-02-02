import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Users, Award, HardHat } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';


const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
};

const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
};

export default function Landing() {
    const { t } = useTranslation();
    const { isDark } = useTheme();

    return (
        <Layout className="max-w-none px-0 py-0">
            {/* Hero Section */}
            <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5 bg-[#faffff] dark:bg-[#0f172a]">
                {/* Abstract Cinematic Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Mesh Gradient Blobs */}
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, 50, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className={cn(
                            "absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px]",
                            isDark ? "bg-scafoteam-gold opacity-20" : "bg-scafoteam-gold/20 opacity-40"
                        )}
                    />

                    <motion.div
                        animate={{
                            x: [0, -80, 0],
                            y: [0, 100, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className={cn(
                            "absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[100px]",
                            isDark ? "bg-blue-500 opacity-20" : "bg-blue-200/40 opacity-50"
                        )}
                    />


                    {/* Subtle Grid Overlay */}
                    <div className={cn(
                        "absolute inset-0 opacity-[0.05] pointer-events-none",
                        isDark ? "invert" : ""
                    )}
                        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    />

                    <div className={cn(
                        "absolute inset-0 z-10 transition-colors duration-1000",
                        isDark
                            ? "bg-gradient-to-b from-[#0f172a]/60 via-[#0f172a]/90 to-[#0f172a]"
                            : "bg-gradient-to-b from-white/10 via-white/40 to-white/90"
                    )} />

                </div>



                <div className="max-w-[1400px] mx-auto px-6 relative z-20 text-center">

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scafoteam-gold/10 border border-scafoteam-gold/20 text-scafoteam-gold text-xs font-bold uppercase tracking-[0.2em] mb-8">
                            <Award className="w-3 h-3" />
                            Premium Scaffolding & Insulation
                        </div>
                        <h1 className={cn(
                            "text-5xl md:text-8xl font-black mb-8 tracking-tighter drop-shadow-sm",
                            isDark ? "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" : "text-scafoteam-navy"
                        )}>



                            {t('hero_title')} <br />
                            <span className={cn(
                                "text-transparent bg-clip-text bg-gradient-to-r from-scafoteam-gold to-scafoteam-gold",
                                isDark ? "via-yellow-200" : "via-yellow-500"
                            )}>
                                SCAFOTEAM
                            </span>

                        </h1>
                        <p className={cn(
                            "text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed",
                            isDark ? "text-gray-200" : "text-slate-800"
                        )}>



                            {t('hero_subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full max-w-sm sm:max-w-none mx-auto">
                            <Link to="/register" className="w-full sm:w-auto">
                                <Button size="xl" className="bg-scafoteam-gold hover:bg-yellow-400 text-scafoteam-navy font-black w-full sm:w-auto px-10 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all hover:scale-105 active:scale-95">
                                    {t('register_now')} <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </Link>
                        </div>

                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-[#0f172a] to-transparent z-10" />
            </section>



            {/* Features Section */}
            <section className="py-32 relative bg-white dark:bg-[#0f172a]">
                <div className="max-w-[1400px] mx-auto px-6">


                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="grid lg:grid-cols-3 gap-10"
                    >
                        {[
                            {
                                icon: Shield,
                                title: t('safety_first'),
                                desc: t('safety_desc'),
                                color: 'from-blue-500/20 to-indigo-500/20'
                            },
                            {
                                icon: HardHat,
                                title: t('expert_team'),
                                desc: t('expert_desc'),
                                color: 'from-scafoteam-gold/20 to-orange-500/20'
                            },
                            {
                                icon: CheckCircle,
                                title: t('reliable_projects'),
                                desc: t('reliable_desc'),
                                color: 'from-emerald-500/20 to-teal-500/20'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                className="group relative p-10 rounded-[2.5rem] bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 hover:border-scafoteam-gold/30 transition-all duration-500 hover:-translate-y-2 shadow-xl shadow-scafoteam-navy/[0.02] backdrop-blur-sm"

                            >

                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] blur-2xl -z-10`} />
                                <div className="w-16 h-16 bg-scafoteam-navy dark:bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-gray-100 dark:border-white/10 group-hover:border-scafoteam-gold/50 transition-colors">
                                    <feature.icon className="h-8 w-8 text-scafoteam-gold transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-2xl font-black text-scafoteam-navy dark:text-white mb-4 tracking-tight uppercase">{feature.title}</h3>
                                <p className="text-slate-800 dark:text-gray-300 text-lg leading-relaxed font-semibold">


                                    {feature.desc}
                                </p>
                            </motion.div>

                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats/Trust Section */}
            <section className="py-24 border-y border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] relative overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-scafoteam-gold/5 to-transparent animate-pulse" />
                <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                        {[
                            { label: 'Projekti', value: '50+' },
                            { label: 'Darbinieki', value: '200+' },
                            { label: 'Gadi tirgū', value: '15+' },
                            { label: 'Drošība', value: '100%' }
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <p className="text-4xl md:text-6xl font-black text-scafoteam-navy dark:text-white mb-3 tracking-tighter">{stat.value}</p>
                                <p className="text-scafoteam-gold text-xs font-bold uppercase tracking-[0.3em]">{stat.label}</p>
                            </motion.div>

                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 relative overflow-hidden bg-white dark:bg-[#0f172a]">

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-scafoteam-gold/5 rounded-full blur-[120px] -z-10" />
                <div className="max-w-[1400px] mx-auto px-6 text-center">

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className={cn(
                            "text-5xl md:text-7xl font-black mb-10 tracking-tighter uppercase",
                            isDark ? "text-white" : "text-scafoteam-navy"
                        )}>{t('ready_title')}</h2>
                        <p className={cn(
                            "mb-16 max-w-2xl mx-auto text-xl md:text-2xl font-medium leading-relaxed",
                            isDark ? "text-gray-200" : "text-slate-800"
                        )}>


                            {t('ready_desc')}
                        </p>

                        <Link to="/register">
                            <Button size="xl" className="bg-scafoteam-navy dark:bg-white hover:bg-scafoteam-navy/90 dark:hover:bg-gray-100 text-white dark:text-scafoteam-navy font-black px-16 py-10 text-2xl rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                                {t('fill_form')}
                                <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </Link>

                    </motion.div>
                </div>
            </section>
        </Layout>
    );
}

