import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Shield, X, Check, Loader2 } from 'lucide-react';

export default function AdminManagement() {
    const { t } = useTranslation();
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'admin', full_name: '' });


    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setIsLoading(true);
        try {
            const data = await adminStore.getAll();
            setAdmins(data);
        } catch (error) {
            console.error('Failed to load admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (admin = null) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({ username: admin.username, password: '', role: admin.role, full_name: admin.full_name || '' });
        } else {
            setEditingAdmin(null);
            setFormData({ username: '', password: '', role: 'admin', full_name: '' });
        }

        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingAdmin) {
                const updates = { ...formData };
                if (!updates.password) delete updates.password;
                const updated = await adminStore.update(editingAdmin.id, updates);

                // If we updated our own profile, sync with localStorage
                const currentUser = JSON.parse(localStorage.getItem('scafoteam_admin_user') || '{}');
                if (currentUser.id === editingAdmin.id && updated) {
                    localStorage.setItem('scafoteam_admin_user', JSON.stringify({
                        ...currentUser,
                        username: updated.username,
                        full_name: updated.full_name,
                        role: updated.role
                    }));
                    // Trigger a reload to refresh the entire layout and header
                    window.location.reload();
                }
            } else {
                await adminStore.add(formData);
            }

            await loadAdmins();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save admin:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('admin_confirm_delete'))) {
            try {
                await adminStore.delete(id);
                await loadAdmins();
            } catch (error) {
                console.error('Failed to delete admin:', error);
            }
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-scafoteam-navy">{t('admin_admin_management')}</h1>
                        <p className="text-gray-500">{t('admin_admins_desc')}</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> {t('admin_add_admin')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map((admin) => (
                        <Card key={admin.id} className="relative group">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-scafoteam-navy/10 rounded-xl flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-scafoteam-navy" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(admin)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(admin.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <CardTitle className="mt-4">{admin.full_name || admin.username}</CardTitle>
                                {admin.full_name && (
                                    <CardDescription className="text-xs font-medium text-gray-400 -mt-1">
                                        {admin.username}
                                    </CardDescription>
                                )}
                                <CardDescription className="capitalize mt-2">
                                    {admin.role === 'superadmin' ? t('admin_role_superadmin') : t('admin_role_admin')}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>


            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <Card className="w-full max-w-md my-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingAdmin ? t('admin_edit_admin') : t('admin_add_admin')}</CardTitle>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </CardHeader>
                        <form onSubmit={handleSave}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin_full_name') || 'Vārds Uzvārds'}</label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Jānis Bērziņš"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin_username')}</label>

                                    <Input
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin_password')}</label>
                                    <Input
                                        required={!editingAdmin}
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingAdmin ? "Leave blank to keep current" : "Password"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin_role')}</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-scafoteam-navy outline-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="admin">{t('admin_role_admin')}</option>
                                        <option value="superadmin">{t('admin_role_superadmin')}</option>
                                    </select>
                                </div>
                            </CardContent>
                            <div className="p-6 border-t flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                    {t('cancel')}
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {t('save')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </AdminLayout >
    );
}
