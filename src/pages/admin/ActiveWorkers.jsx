import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { workerStore, projectStore } from '@/lib/store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Eye, Trash2, UserCheck, AlertCircle, Clock, Filter, X, CheckSquare, Square, ChevronDown, UserPlus, Info, AlertTriangle } from 'lucide-react';
import { AddWorkerModal } from '@/components/admin/AddWorkerModal';
import { WorkerDetailModal } from '@/components/admin/WorkerDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

// Helper component for multi-select dropdown with checkboxes
const MultiSelectCheckbox = ({ label, options, selected, onChange, icon: Icon, placeholder }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <div
                className="h-10 px-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between cursor-pointer hover:border-scafoteam-navy/20 transition-all shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-sm font-medium truncate max-w-[150px]">
                    {selected.length === 0 ? placeholder : `${selected.length} ${t('admin_selected')}`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                                onClick={() => {
                                    const next = selected.includes(opt.value)
                                        ? selected.filter(s => s !== opt.value)
                                        : [...selected, opt.value];
                                    onChange(next);
                                }}
                            >
                                {selected.includes(opt.value) ? (
                                    <CheckSquare className="w-4 h-4 text-scafoteam-navy" />
                                ) : (
                                    <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                                )}
                                <span className={cn("text-xs transition-colors", selected.includes(opt.value) ? "font-bold text-scafoteam-navy" : "text-gray-600")}>
                                    {opt.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default function ActiveWorkers() {
    const { t } = useTranslation();
    const [workers, setWorkers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const allWorkers = (await workerStore.getAll()) || [];
        setWorkers(allWorkers.filter(w => w.status === 'active'));
        const allProjects = (await projectStore.getAll()) || [];
        setProjects(allProjects);
    };

    const getMissingFields = (worker) => {
        const missing = [];
        if (!worker.phone) missing.push(t('phone'));
        if (!worker.email || worker.email.includes('@placeholder.local')) missing.push(t('email'));
        if (!worker.nationality) missing.push(t('nationality'));
        if (!worker.personalId && !worker.adminData?.personalId) missing.push(t('personal_id'));
        if (!worker.adminData?.address && !worker.address) missing.push(t('address'));
        if (!worker.adminData?.bankAccount && !worker.bankAccount) missing.push(t('bank_account'));

        if (!worker.adminData?.project) missing.push(t('admin_project'));
        if (!worker.adminData?.hourlyRate) missing.push(t('admin_hourly_rate'));

        return missing;
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = end - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleUpdateField = async (id, field, value) => {
        const worker = workers.find(w => w.id === id);
        if (!worker) return;

        const updatedAdminData = { ...(worker.adminData || {}), [field]: value };
        const updatedWorker = await workerStore.update(id, { adminData: updatedAdminData });

        setWorkers(prev => prev.map(w => w.id === id ? updatedWorker : w));
    };

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    const handleDeleteClick = (id) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleDeleteConfirm = async () => {
        const id = confirmDelete.id;
        if (!id) return;
        await workerStore.delete(id);
        loadData();
    };


    const processedWorkers = useMemo(() => {
        return workers.map(w => ({
            ...w,
            daysRemaining: getDaysRemaining(w.adminData?.contractEnd)
        })).sort((a, b) => {
            const urgencyA = a.daysRemaining === null ? 9999 : (a.daysRemaining <= 0 ? -1 : (a.daysRemaining <= 7 ? a.daysRemaining : 999));
            const urgencyB = b.daysRemaining === null ? 9999 : (b.daysRemaining <= 0 ? -1 : (b.daysRemaining <= 7 ? b.daysRemaining : 999));

            if (urgencyA !== urgencyB) return urgencyA - urgencyB;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [workers]);

    const filteredWorkers = processedWorkers.filter(w => {
        const searchLower = search.toLowerCase();
        const matchesSearch = !search || [
            w.name, w.surname, w.nationality, w.email, w.phone,
            w.personalId, w.finnishId, w.adminData?.project,
            w.adminData?.rentAddress, w.adminData?.hourlyRate
        ].some(field => String(field || '').toLowerCase().includes(searchLower));

        const matchesProject = selectedProjectIds.length === 0 || selectedProjectIds.includes(w.adminData?.project);
        const matchesWorker = selectedWorkerIds.length === 0 || selectedWorkerIds.includes(w.id);

        let matchesStatus = true;
        if (statusFilter === 'expiring') matchesStatus = w.daysRemaining > 0 && w.daysRemaining <= 7;
        if (statusFilter === 'expired') matchesStatus = w.daysRemaining !== null && w.daysRemaining <= 0;

        return matchesSearch && matchesProject && matchesWorker && matchesStatus;
    });

    const projectOptions = (projects || []).map(p => ({ value: p?.name || '', label: p?.name || '---' }));
    const workerOptions = (workers || []).map(w => ({ value: w?.id || '', label: `${w?.name || '---'} ${w?.surname || '---'}` }));

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-scafoteam-navy tracking-tight uppercase">{t('active_workers')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">{workers.length} {t('active_workers_count')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-scafoteam-navy/20 flex items-center gap-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            {t('add_worker')}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t('admin_filter_all')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 bg-white"
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white"
                        onClick={() => {
                            setSearch('');
                            setSelectedProjectIds([]);
                            setSelectedWorkerIds([]);
                            setStatusFilter('');
                        }}
                    >
                        <X className="w-4 h-4 mr-2" />
                        {t('clear')}
                    </Button>
                </div>

                {/* Updated Advanced Filters with Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <MultiSelectCheckbox
                        label={t('admin_project')}
                        options={projectOptions}
                        selected={selectedProjectIds}
                        onChange={setSelectedProjectIds}
                        icon={Filter}
                        placeholder={t('admin_all_projects') || "All Projects"}
                    />
                    <MultiSelectCheckbox
                        label={t('admin_name_surname')}
                        options={workerOptions}
                        selected={selectedWorkerIds}
                        onChange={setSelectedWorkerIds}
                        icon={UserCheck}
                        placeholder={t('admin_all_workers') || "All Workers"}
                    />
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {t('admin_contract_status')}
                        </label>
                        <select
                            className="w-full h-10 px-3 bg-white border border-gray-100 rounded-lg text-sm font-medium focus:ring-1 focus:ring-scafoteam-navy outline-none"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('admin_filter_all')}</option>
                            <option value="expiring">7 {t('admin_days_left')} {t('admin_or_less')}</option>
                            <option value="expired">{t('admin_expired')}</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl shadow-scafoteam-navy/5 overflow-hidden group/table">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('admin_project')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('admin_contract_days')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50/50 z-10 w-64">{t('admin_name_surname')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">{t('nationality')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('admin_hourly_rate')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('finnish_id')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('phone')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">{t('admin_drivers_licence')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-64">{t('admin_rent_address')}</th>
                                    <th className="p-4 pr-8 text-[10px] font-black text-gray-400 uppercase tracking-widest w-64 min-w-[200px]">{t('admin_rent_price')}</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center sticky right-0 bg-gray-50/50 z-10 w-32">{t('admin_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredWorkers.map((worker) => {
                                    const isExpiring = worker.daysRemaining !== null && worker.daysRemaining > 0 && worker.daysRemaining <= 7;
                                    const isExpired = worker.daysRemaining !== null && worker.daysRemaining <= 0;

                                    return (
                                        <tr key={worker.id}
                                            onClick={() => setSelectedWorker(worker)}
                                            className={cn(
                                                "hover:bg-gray-50/80 transition-all duration-200 cursor-pointer",
                                                isExpiring && "bg-yellow-50/30",
                                                isExpired && "bg-red-50/30"
                                            )}
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-scafoteam-navy text-xs">{worker.adminData?.project || '---'}</div>
                                            </td>
                                            <td className="p-4">
                                                {worker.daysRemaining !== null ? (
                                                    <div className={cn(
                                                        "text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap",
                                                        isExpired ? "text-red-500" : isExpiring ? "text-yellow-600" : "text-emerald-600"
                                                    )}>
                                                        {isExpired ? t('admin_expired') : `${worker.daysRemaining} ${t('admin_days_left')}`}
                                                    </div>
                                                ) : <span className="text-gray-300">---</span>}
                                            </td>
                                            <td className="p-4 sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-scafoteam-navy/10 border border-gray-100 shrink-0">
                                                        {worker.adminData?.profileImage ? (
                                                            <img src={worker.adminData.profileImage} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-scafoteam-navy">
                                                                {worker.name?.charAt(0)}{worker.surname?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-scafoteam-navy truncate">{worker.name} {worker.surname}</span>
                                                    {(() => {
                                                        const missing = getMissingFields(worker);
                                                        if (missing.length > 0) {
                                                            return (
                                                                <div className="relative group/tooltip">
                                                                    <AlertTriangle className="w-4 h-4 text-orange-400 cursor-help" />
                                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none">
                                                                        <div className="font-bold mb-1 uppercase tracking-wider text-orange-300">{t('missing_info')}:</div>
                                                                        <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                                                                            {missing.map((m, i) => <li key={i}>{m}</li>)}
                                                                        </ul>
                                                                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{worker.nationality}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all",
                                                    worker.adminData?.hasPerDiem ? "bg-gray-100 border border-gray-200 shadow-sm" : ""
                                                )}>
                                                    <span className="text-sm font-black text-scafoteam-navy">
                                                        € {worker.adminData?.hourlyRate || '0.00'}
                                                    </span>
                                                    {worker.adminData?.hasPerDiem && (
                                                        <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center justify-center leading-none">
                                                            P.D.
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-mono text-gray-600">{worker.finnishId || '---'}</span>
                                            </td>
                                            <td className="p-4 text-xs">
                                                {worker.phone}
                                            </td>
                                            <td className="p-4">
                                                {worker.drivingLicence ? (
                                                    <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase w-fit">
                                                        {worker.drivingLicence}
                                                    </div>
                                                ) : <span className="text-gray-300">---</span>}
                                            </td>
                                            <td className="p-4 text-xs truncate max-w-[150px]">
                                                {worker.adminData?.rentAddress || '---'}
                                            </td>
                                            <td className="p-4 pr-8 text-xs font-bold text-emerald-600 w-64 min-w-[200px]">
                                                {worker.adminData?.rentPrice ? `€ ${worker.adminData.rentPrice}` : '---'}
                                            </td>
                                            <td className="p-4 sticky right-0 bg-inherit z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 border-gray-200 text-scafoteam-navy hover:bg-scafoteam-navy hover:text-white transition-all shadow-sm"
                                                        onClick={() => setSelectedWorker(worker)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                        {t('admin_view')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(worker.id);
                                                        }}

                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedWorker && (
                    <WorkerDetailModal
                        worker={selectedWorker}
                        isOpen={!!selectedWorker}
                        onClose={() => setSelectedWorker(null)}
                        onUpdate={(updated) => {
                            loadData();
                            if (updated && updated.id === selectedWorker?.id) {
                                setSelectedWorker(updated);
                            }
                        }}
                    />
                )}

                <AddWorkerModal
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                    onWorkerAdded={loadData}
                />

                <ConfirmDialog
                    isOpen={confirmDelete.isOpen}
                    onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                    onConfirm={handleDeleteConfirm}
                    title={t('admin_confirm_delete_photo') || t('delete')}
                    message={t('admin_confirm_delete')}
                    confirmText={t('delete')}
                    cancelText={t('cancel')}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}
