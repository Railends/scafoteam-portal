import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { projectStore, clientStore } from '@/lib/store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2, Plus, Briefcase, Building2, Check, MapPin, Search, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { geocodeAddress } from '@/lib/geo';

export default function Projects() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [newProject, setNewProject] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [geoLoading, setGeoLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Debounced geocoding for new project
    useEffect(() => {
        if (siteAddress.trim().length <= 5) {
            setSearchError(false);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setGeoLoading(true);
                setSearchError(false);
                const coords = await geocodeAddress(siteAddress);
                if (coords && coords.lat !== undefined && coords.lng !== undefined) {
                    const newLat = coords.lat.toString();
                    const newLng = coords.lng.toString();

                    // Only update if coordinates changed to avoid re-renders/loops
                    if (newLat !== lat || newLng !== lng) {
                        setLat(newLat);
                        setLng(newLng);
                    }

                    // Auto-correct address only if significantly different and not already matching
                    if (coords.address && coords.address !== siteAddress && (siteAddress || '').length < coords.address.length) {
                        setSiteAddress(coords.address);
                    }
                } else {
                    setSearchError(true);
                }
            } catch (err) {
                console.error('Projects geocoding error:', err);
                setSearchError(true);
            } finally {
                setGeoLoading(false);
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [siteAddress]);

    // Debounced geocoding for edit project
    useEffect(() => {
        if (!editingProject?.site_address || editingProject.site_address.trim().length <= 5) {
            setSearchError(false);
            return;
        }
        const timer = setTimeout(async () => {
            setGeoLoading(true);
            setSearchError(false);
            const coords = await geocodeAddress(editingProject.site_address);
            if (coords) {
                const newLat = coords.lat.toString();
                const newLng = coords.lng.toString();

                setEditingProject(prev => {
                    const updates = {};
                    if (newLat !== prev.lat) updates.lat = newLat;
                    if (newLng !== prev.lng) updates.lng = newLng;

                    // Only snap address if it's currently shorter/incomplete
                    if (coords.address && coords.address !== prev.site_address && prev.site_address.length < coords.address.length) {
                        updates.site_address = coords.address;
                    }

                    if (Object.keys(updates).length === 0) return prev;
                    return { ...prev, ...updates };
                });
            } else {
                setSearchError(true);
            }
            setGeoLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, [editingProject?.site_address]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setProjects(await projectStore.getAll() || []);
        setClients(await clientStore.getAll() || []);
    };

    const handleAdd = async (e) => {
        if (e) e.preventDefault();
        if (!newProject.trim()) return;
        setLoading(true);
        try {
            await projectStore.add(newProject, selectedClientId || null, {
                site_address: siteAddress,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null
            });
            await loadData();
            resetForm();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert('Error adding project: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingProject.name.trim()) return;
        setLoading(true);
        try {
            await projectStore.update(editingProject.id, {
                name: editingProject.name,
                client_id: editingProject.client_id || null,
                site_address: editingProject.site_address,
                lat: editingProject.lat ? parseFloat(editingProject.lat) : null,
                lng: editingProject.lng ? parseFloat(editingProject.lng) : null
            });
            await loadData();
            setIsEditModalOpen(false);
            setEditingProject(null);
        } catch (error) {
            console.error(error);
            alert('Error updating project: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewProject('');
        setSelectedClientId('');
        setSiteAddress('');
        setLat('');
        setLng('');
        setSearchError(false); // Reset search error on form reset
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_projects')}</h1>
                        <p className="text-gray-500 mt-1">{t('admin_project_desc')}</p>
                    </div>
                </div>

                <Card className="border-scafoteam-navy/10 shadow-sm">
                    <CardHeader className="bg-scafoteam-navy/5">
                        <CardTitle className="text-lg text-scafoteam-navy">{t('admin_add_new_project')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_project_name')}</label>
                                    <Input
                                        value={newProject}
                                        onChange={e => setNewProject(e.target.value)}
                                        placeholder={t('admin_project_name_placeholder')}
                                        className="bg-gray-50/50 border-gray-100"
                                    />
                                </div>
                                <div className="space-y-2">
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
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-scafoteam-navy/60">Objekta Adrese (Iela, Pilsēta...)</label>
                                        {geoLoading && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Meklē...</span>}
                                        {lat && !geoLoading && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Fiksēta</span>}
                                        {searchError && !geoLoading && <span className="text-[10px] text-red-500 font-bold tracking-tight">Adrese nav atrasta!</span>}
                                    </div>
                                    <Input
                                        value={siteAddress}
                                        onChange={e => setSiteAddress(e.target.value)}
                                        placeholder="Ielas nosaukums, Pilsēta"
                                        className="bg-gray-50/50 border-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "h-10 px-8 font-bold shadow-lg transition-all active:scale-95",
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
                        const client = clients.find(c => c.id === project.client_id || c.id === project.clientId);
                        return (
                            <Card key={project.id} className="hover:shadow-xl transition-all duration-300 border-gray-100 group relative">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-scafoteam-accent/10 text-scafoteam-accent rounded-xl group-hover:scale-110 transition-transform">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                onClick={() => {
                                                    setEditingProject({
                                                        ...project,
                                                        client_id: project.client_id || project.clientId || ''
                                                    });
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <Plus className="w-4 h-4 rotate-45" />
                                                {/* Using Plus rotated as a generic edit or I'll import Edit/Pencil */}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg text-scafoteam-navy mb-2 truncate" title={project.name}>{project.name}</h3>

                                    {project.site_address && (
                                        <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {project.site_address}
                                        </p>
                                    )}

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
                            <p className="text-gray-400 font-medium">{t('admin_no_projects')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal (reusing Modal pattern) */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Rediģēt Projektu"
                className="max-w-md"
            >
                {editingProject && (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Projekta Nosaukums</label>
                            <Input
                                value={editingProject.name}
                                onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Klients</label>
                            <select
                                className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm"
                                value={editingProject.client_id}
                                onChange={e => setEditingProject({ ...editingProject, client_id: e.target.value })}
                            >
                                <option value="">Izvēlies klientu</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objekta Adrese</label>
                                {geoLoading && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Atpazīst...</span>}
                            </div>
                            <Input
                                value={editingProject.site_address || ''}
                                onChange={e => setEditingProject({ ...editingProject, site_address: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Atcelt</Button>
                            <Button className="bg-scafoteam-navy text-white" onClick={handleSaveEdit} disabled={loading}>
                                {loading ? 'Saglabā...' : 'Saglabāt'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
