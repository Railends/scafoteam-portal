import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { projectStore, clientStore } from '@/lib/store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2, Plus, Briefcase, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Projects() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [newProject, setNewProject] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setProjects(await projectStore.getAll() || []);
        setClients(await clientStore.getAll() || []);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newProject.trim()) return;
        await projectStore.add(newProject, selectedClientId || null);
        loadData();
        setNewProject('');
        setSelectedClientId('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('admin_delete_confirm') || 'Are you sure?')) {
            await projectStore.delete(id);
            loadData();
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_projects')}</h1>
                    <p className="text-gray-500 mt-1">{t('admin_project_desc')}</p>
                </div>

                <Card className="max-w-2xl border-scafoteam-navy/10 shadow-sm">
                    <CardHeader className="bg-scafoteam-navy/5">
                        <CardTitle className="text-lg text-scafoteam-navy">{t('admin_add_new_project')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_project_name')}</label>
                                <Input
                                    value={newProject}
                                    onChange={e => setNewProject(e.target.value)}
                                    placeholder={t('admin_project_name_placeholder')}
                                    className="bg-gray-50/50 border-gray-100"
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_client')}</label>
                                <select
                                    className="w-full h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-scafoteam-navy/20 transition-all font-medium text-scafoteam-navy"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">{t('admin_select_client')}</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    className={cn(
                                        "h-10 px-6 font-bold shadow-lg transition-all active:scale-95",
                                        showSuccess
                                            ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                            : "bg-scafoteam-navy hover:bg-scafoteam-navy/90 shadow-scafoteam-navy/10"
                                    )}
                                >
                                    {showSuccess ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            {t('admin_saved')}
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t('admin_add')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => {
                        const client = clients.find(c => c.id === project.clientId);
                        return (
                            <Card key={project.id} className="hover:shadow-xl transition-all duration-300 border-gray-100 group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-scafoteam-accent/10 text-scafoteam-accent rounded-xl group-hover:scale-110 transition-transform">

                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            onClick={() => handleDelete(project.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <h3 className="font-bold text-lg text-scafoteam-navy mb-2 truncate" title={project.name}>{project.name}</h3>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {client ? client.name : t('admin_no_client')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {projects.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            </div>
                            <p className="text-gray-400 font-medium">{t('admin_no_projects')}</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
