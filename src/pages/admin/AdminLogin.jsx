import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock } from 'lucide-react';
import { adminStore } from '@/lib/store';
import { BrandLogo } from '@/components/common/BrandLogo';

export default function AdminLogin() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const admin = await adminStore.login(username, password);

        if (admin) {
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin_username')}</label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('admin_username')}
                                />
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
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Login</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
