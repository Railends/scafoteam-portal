import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminStore, useSettingsStore } from '@/lib/store';
import { Shield, Key, User, Check, AlertCircle, Bell, Save, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
    const { t } = useTranslation();
    const { announcement, fetchSettings, updateAnnouncement } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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

    // Site Announcement State
    const [announcementText, setAnnouncementText] = useState('');
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    const [announcementSaved, setAnnouncementSaved] = useState(false);

    useEffect(() => {
        if (announcement) setAnnouncementText(announcement);
    }, [announcement]);

    const handleSaveAnnouncement = async () => {
        setIsSavingAnnouncement(true);
        const result = await updateAnnouncement(announcementText);
        setIsSavingAnnouncement(false);
        if (result.success) {
            setAnnouncementSaved(true);
            setTimeout(() => setAnnouncementSaved(false), 3000);
        }
    };

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
                    <h1 className="text-3xl font-bold text-scafoteam-navy uppercase tracking-tight">{t('admin_settings')}</h1>
                    <p className="text-gray-500 mt-2">Pārvaldiet portāla iestatījumus un savu drošības informāciju.</p>
                </div>

                {/* Site Settings Section */}
                <Card className="border-scafoteam-navy/5 shadow-xl shadow-scafoteam-navy/5 overflow-hidden border-none backdrop-blur-sm bg-white/80">
                    <CardHeader className="bg-scafoteam-navy/5 border-b border-scafoteam-navy/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-scafoteam-accent/10 rounded-lg">
                                <Bell className="w-5 h-5 text-scafoteam-accent" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight text-scafoteam-navy">
                                    Paziņojumu josla
                                </CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-500">
                                    Atjauniniet skrejošo tekstu, kas redzams lapas augšpusē.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Teksts
                            </label>
                            <div className="relative">
                                <Input
                                    value={announcementText}
                                    onChange={(e) => setAnnouncementText(e.target.value)}
                                    placeholder="Ievadiet paziņojumu..."
                                    className="h-14 pl-4 pr-12 text-lg font-bold border-scafoteam-navy/10 focus:ring-scafoteam-accent rounded-xl"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-scafoteam-accent/30">
                                    <Bell className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <Button
                                onClick={handleSaveAnnouncement}
                                disabled={isSavingAnnouncement || announcementText === announcement}
                                className="bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black px-8 py-6 rounded-xl shadow-lg shadow-scafoteam-navy/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSavingAnnouncement ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : announcementSaved ? (
                                    <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                {announcementSaved ? 'Saglabāts!' : 'Saglabāt paziņojumu'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-px bg-gray-200 my-8" />

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
