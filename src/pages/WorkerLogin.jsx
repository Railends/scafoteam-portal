import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { workerStore } from '@/lib/store';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function WorkerLogin() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        const worker = await workerStore.login(identifier.trim(), password.trim());
        if (worker) {
            sessionStorage.setItem('workerData', JSON.stringify(worker));
            navigate('/worker/dashboard');
        } else {
            setError(t('login_failed_security_update') || 'Invalid credentials or account transition required. Please contact admin.');
        }
    };


    return (
        <Layout className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md border-0 shadow-2xl shadow-scafoteam-navy/10 overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl">
                <CardHeader className="bg-scafoteam-navy text-white text-center py-14 px-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <CardTitle className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">{t('worker_login')}</CardTitle>
                        <CardDescription className="text-blue-100/80 mt-4 font-bold tracking-widest text-[11px] uppercase">{t('welcome_back')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8 bg-white">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">{t('email')}</label>
                                <div className="relative">

                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        className="pl-11 h-14 bg-gray-50 border-gray-100 rounded-xl font-bold focus:bg-white transition-all"
                                        placeholder="email@example.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">{t('password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        className="pl-11 h-14 bg-gray-50 border-gray-100 rounded-xl font-bold focus:bg-white transition-all"
                                        placeholder="••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-scafoteam-navy hover:bg-scafoteam-navy/90 text-white font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-scafoteam-navy/20">
                            {t('login')}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Layout>
    );
}
