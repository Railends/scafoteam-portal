import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { clientStore, projectStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Plus, Building2, Mail, Phone, Edit2, Trash2, Briefcase, Check, Search } from 'lucide-react';

export default function ClientAccounts() {
    const { t } = useTranslation();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setClients(await clientStore.getAll() || []);
        setProjects(await projectStore.getAll() || []);
    };

    const handleOpenModal = (client = null) => {
        // ... (unchanged logic mostly but ensuring correct sync)
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name,
                contact: client.contact,
                email: client.email,
                phone: client.phone
            });
        } else {
            setEditingClient(null);
            setFormData({ name: '', contact: '', email: '', phone: '' });
        }
        setIsModalOpen(true);
    };

    const [isSaved, setIsSaved] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingClient) {
            await clientStore.update(editingClient.id, formData);
        } else {
            await clientStore.add(formData);
        }
        setIsSaved(true);
        loadData();
        setTimeout(() => {
            setIsModalOpen(false);
            setIsSaved(false);
        }, 1200);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('admin_confirm_delete') || 'Are you sure?')) {
            await clientStore.delete(id);
            loadData();
        }
    };

    const toggleProjectAssociation = async (projectId, clientId) => {
        const project = projects.find(p => p.id === projectId);
        const newClientId = project.clientId === clientId ? null : clientId;
        await projectStore.update(projectId, { clientId: newClientId });
        loadData();
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contact.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_client_accounts')}</h1>
                    <p className="text-gray-500 mt-1">{t('admin_client_desc') || 'Manage client profiles and project ownership'}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t('admin_search_pending')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={() => handleOpenModal()} className="bg-scafoteam-navy hover:bg-scafoteam-navy/90">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('admin_add') || 'Add New'}
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => {
                    const clientProjects = projects.filter(p => p.clientId === client.id);
                    return (
                        <div key={client.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-scafoteam-navy/5 rounded-xl text-scafoteam-navy">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(client)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-scafoteam-navy transition-colors"
                                        title={t('edit')}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                        title={t('delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-scafoteam-navy mb-4 truncate">{client.name}</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Edit2 className="w-4 h-4 text-gray-400" /> {/* Using Edit icon as a person-ish icon here since I don't want to import more lucide icons or I'll just use the Building contact label */}
                                    <span className="font-medium">{client.contact}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{client.phone}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 bg-gray-50/30 -mx-6 px-6 -mb-6 rounded-b-2xl">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_projects')}</span>
                                    <span className="px-2 py-0.5 bg-scafoteam-navy/10 rounded-full text-[10px] font-bold text-scafoteam-navy">
                                        {clientProjects.length}
                                    </span>
                                </div>
                                <div className="space-y-2 pb-4 max-h-32 overflow-y-auto">
                                    {clientProjects.map(project => (
                                        <div key={project.id} className="flex items-center gap-2 text-xs text-scafoteam-navy font-semibold bg-white p-2 rounded-lg border border-scafoteam-navy/5 shadow-sm">
                                            <Briefcase className="w-3 h-3 text-scafoteam-gold" />
                                            {project.name}
                                        </div>
                                    ))}
                                    {clientProjects.length === 0 && (
                                        <p className="text-[10px] text-gray-400 italic py-1">{t('admin_no_projects') || 'No linked projects'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? t('admin_edit_client') : t('admin_add_client')}
                className="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-scafoteam-navy">{t('admin_company_name') || 'Company Name'}</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="SIA Example"
                                className="bg-gray-50/50 border-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-scafoteam-navy">{t('admin_contact_person') || 'Contact Person'}</label>
                            <Input
                                required
                                value={formData.contact}
                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                placeholder="Jānis Bērziņš"
                                className="bg-gray-50/50 border-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-scafoteam-navy">{t('email')}</label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="janis@siaexample.lv"
                                className="bg-gray-50/50 border-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-scafoteam-navy">{t('phone')}</label>
                            <Input
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+371 ..."
                                className="bg-gray-50/50 border-gray-100"
                            />
                        </div>
                    </div>

                    {editingClient && (
                        <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('admin_assign_projects') || 'Assign Projects'}</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => toggleProjectAssociation(project.id, editingClient.id)}
                                        className={cn(
                                            "flex justify-between items-center p-3 rounded-xl border text-left text-sm transition-all duration-200",
                                            project.clientId === editingClient.id
                                                ? "border-scafoteam-navy bg-scafoteam-navy/5 text-scafoteam-navy font-bold shadow-sm"
                                                : "border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Briefcase className={cn("w-4 h-4", project.clientId === editingClient.id ? "text-scafoteam-gold" : "text-gray-300")} />
                                            <span className="truncate">{project.name}</span>
                                        </div>
                                        {project.clientId === editingClient.id && (
                                            <Check className="w-4 h-4 text-scafoteam-navy" />
                                        )}
                                    </button>
                                ))}
                                {projects.length === 0 && (
                                    <p className="text-sm text-gray-400 italic py-4 text-center">{t('admin_no_projects')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className={cn(
                                "px-10 font-bold transition-all active:scale-95",
                                isSaved
                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                    : "bg-scafoteam-navy hover:bg-scafoteam-navy/90"
                            )}
                        >
                            {isSaved ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {t('admin_saved')}
                                </>
                            ) : (
                                t('save')
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
