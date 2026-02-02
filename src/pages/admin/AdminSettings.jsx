import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminStore } from '@/lib/store';
import { Shield, Key, User, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
    const { t } = useTranslation();
    const adminUser = JSON.parse(localStorage.getItem('scafoteam_admin_user') || '{}');

    const [formData, setFormData] = useState({
        full_name: adminUser.full_name || '',
        username: adminUser.username || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        // Basic validation
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Jaunās paroles nesakrīt' });
            return;
        }

        setIsSaving(true);
        try {
            const updates = {
                full_name: formData.full_name,
                username: formData.username
            };

            if (formData.newPassword) {
                updates.password = formData.newPassword;
            }

            const updated = await adminStore.update(adminUser.id, updates);

            if (updated) {
                // Update local storage
                localStorage.setItem('scafoteam_admin_user', JSON.stringify({
                    ...adminUser,
                    full_name: updated.full_name,
                    username: updated.username
                }));

                setStatus({ type: 'success', message: t('admin_saved') || 'Iestatījumi saglabāti!' });

                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));

                // Refresh to sync layout
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setStatus({ type: 'error', message: 'Kļūda saglabājot iestatījumus.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-scafoteam-navy">Profila Iestatījumi</h1>
                    <p className="text-gray-500 mt-2">Pārvaldiet savu personīgo informāciju un drošības iestatījumus.</p>
                </div>

                {status.message && (
                    <div className={cn(
                        "p-4 rounded-xl flex items-center gap-3 border shadow-sm",
                        status.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
                    )}>
                        {status.type === 'success' ? <Check className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                        <p className="text-sm font-bold">{status.message}</p>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-scafoteam-navy/5 rounded-lg text-scafoteam-navy">
                                    <User className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-lg">Personīgā informācija</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pilns vārds</label>
                                <Input
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Jānis Bērziņš"
                                    className="h-12 bg-gray-50/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Lietotājvārds</label>
                                <Input
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="admin123"
                                    className="h-12 bg-gray-50/20"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-scafoteam-navy/5 rounded-lg text-scafoteam-navy">
                                    <Key className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-lg">Mainīt paroli</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 italic">Atstājiet tukšu, ja nevēlaties mainīt paroli</p>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Jaunā parole</label>
                                        <Input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="h-12 bg-gray-50/20 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Apstiprināt jauno paroli</label>
                                        <Input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="h-12 bg-gray-50/20 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button
                            disabled={isSaving}
                            className="px-12 h-14 bg-scafoteam-navy hover:bg-scafoteam-navy/90 text-white font-bold rounded-2xl shadow-xl shadow-scafoteam-navy/20 transition-all hover:scale-[1.02] active:scale-95 text-base"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                            Saglabāt iestatījumus
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
