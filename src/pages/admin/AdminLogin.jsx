import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, User } from 'lucide-react';
import { adminStore } from '@/lib/store';
import { BrandLogo } from '@/components/common/BrandLogo';
import { MathCaptcha } from '@/components/common/MathCaptcha';

export default function AdminLogin() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const admin = await adminStore.login(username, password);

        if (admin) {
            if (admin.isLegacy) {
                if (window.confirm("Tavs konts ir 'Legacy' režīmā. Lai redzētu darbinieku pieteikumus, Tev ir jāpārej uz jauno drošības sistēmu. Vai veikt migrāciju tagad?\n\n(Tava parole paliks tā pati, tikai tiks izveidots drošs Supabase Auth profils)")) {
                    const result = await adminStore.migrateAccount(username, password, admin.full_name);
                    if (result.success) {
                        alert(`Migrācija veiksmīga! Lūdzu, ielogojies vēlreiz ar ${result.email}`);
                        return;
                    } else {
                        let msg = result.error;
                        if (msg.includes('rate limit')) {
                            msg = 'Pārsniegts e-pasta sūtīšanas limits. Lūdzu, uzgaidi 5-10 minūtes vai atslēdz "Email Confirm" savā Supabase Dashboard.';
                        }
                        alert("Migrācija neizdevās: " + msg);
                    }
                } else {
                    alert("UZMANĪBU: 'Legacy' režīmā Tu nevarēsi redzēt vai apstiprināt darbinieku datus drošības iestatījumu dēļ.");
                }
            }

            localStorage.setItem('scafoteam_admin_auth', 'true');
            localStorage.setItem('scafoteam_admin_user', JSON.stringify({
                id: admin.id,
                username: admin.username,
                role: admin.role,
                full_name: admin.full_name
            }));

            navigate('/admin/dashboard');
        } else {
            setError(t('admin_invalid_credentials'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto">
            <div className="py-8 md:py-0 w-full flex flex-col items-center">
                <div className="mb-8">
                    <LanguageSwitcher showRU={false} />
                </div>
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="flex items-center justify-center mb-8 h-20">
                            <BrandLogo className="h-full" />
                        </div>




                        <CardTitle className="text-2xl">{t('admin_portal')}</CardTitle>
                        <CardDescription>{t('admin_login_desc')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5 flex-1 w-full">
                                <label className="text-[10px] font-black text-scafoteam-navy/40 uppercase tracking-[0.2em] px-1">Lietotājvārds</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-scafoteam-navy/20">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="ievadiet lietotājvārdu..."
                                        className="h-14 pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-scafoteam-accent/20 rounded-2xl transition-all duration-300 font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin_password')}</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('admin_password')}
                                />
                            </div>
                            <MathCaptcha onValidate={setIsCaptchaValid} />
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={!isCaptchaValid}>Login</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
