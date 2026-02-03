import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerStore } from '@/lib/store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, Search, Eye, AlertTriangle, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { WorkerDetailModal } from '@/components/admin/WorkerDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { emailService } from '@/lib/emailService';
import { UserPlus } from 'lucide-react';
import { AddWorkerModal } from '@/components/admin/AddWorkerModal';

export default function PendingWorkers() {


    const { t } = useTranslation();
    const [workers, setWorkers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const loadWorkers = async () => {
            const allWorkers = (await workerStore.getAll()) || [];
            setWorkers(allWorkers.filter(w => w.status === 'pending'));
        };
        loadWorkers();
    }, []);

    const getMissingFields = (worker) => {
        const missing = [];
        if (!worker.phone) missing.push(t('phone'));
        if (!worker.email || worker.email.includes('@placeholder.local')) missing.push(t('email'));
        if (!worker.nationality) missing.push(t('nationality'));
        if (!worker.personalId && !worker.adminData?.personalId) missing.push(t('personal_id'));
        if (!worker.address && !worker.adminData?.address) missing.push(t('address'));
        if (!worker.bankAccount && !worker.adminData?.bankAccount) missing.push(t('bank_account'));
        // Note: Project and Hourly Rate are usually assigned after approval, so we don't flag them here.
        return missing;
    };

    const [confirmData, setConfirmData] = useState({ isOpen: false, id: null });
    const [rejectConfirm, setRejectConfirm] = useState({ isOpen: false, id: null });

    const handleApproveClick = async (id) => {
        const password = workerStore.generatePassword();
        const worker = workers.find(w => w.id === id);

        // Update worker status and password
        await workerStore.update(id, {
            status: 'active',
            adminData: { password }
        });

        // "Send" email
        try {
            await emailService.sendPassword(worker.email, `${worker.name} ${worker.surname}`, password);
            alert(t('admin_password_sent', { email: worker.email }));
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Kļūda nosūtot e-pastu. Parole tomēr ir saglabāta.');
        }

        setWorkers(prev => prev.filter(w => w.id !== id));
        if (selectedWorker?.id === id) setSelectedWorker(null);
    };

    const handleRejectClick = (id) => {
        setRejectConfirm({ isOpen: true, id });
    };


    const handleRejectConfirm = async () => {
        const id = rejectConfirm.id;
        if (!id) return;

        await workerStore.delete(id);
        setWorkers(prev => prev.filter(w => w.id !== id));
        if (selectedWorker?.id === id) setSelectedWorker(null);
        setRejectConfirm({ isOpen: false, id: null });
        setSelectedIds(prev => prev.filter(hid => hid !== id));
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length && filtered.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(w => w.id));
        }
    };

    const handleBulkApprove = async () => {
        if (!confirm(`Vai tiešām vēlaties apstiprināt ${selectedIds.length} darbiniekus?`)) return;

        for (const id of selectedIds) {
            const worker = workers.find(w => w.id === id);
            if (!worker) continue;

            const password = workerStore.generatePassword();
            await workerStore.update(id, {
                status: 'active',
                adminData: { password }
            });

            try {
                await emailService.sendPassword(worker.email, `${worker.name} ${worker.surname}`, password);
            } catch (e) {
                console.error(`Failed to send email to ${worker.email}`, e);
            }
        }

        alert(`${selectedIds.length} darbinieki apstiprināti!`);
        setWorkers(prev => prev.filter(w => !selectedIds.includes(w.id)));
        setSelectedIds([]);
        setSelectedWorker(null);
    };

    const handleBulkReject = async () => {
        if (!confirm(`Vai tiešām vēlaties NORAIDĪT un DZĒST ${selectedIds.length} darbiniekus?`)) return;

        for (const id of selectedIds) {
            await workerStore.delete(id);
        }

        setWorkers(prev => prev.filter(w => !selectedIds.includes(w.id)));
        setSelectedIds([]);
        setSelectedWorker(null);
    };


    const filtered = workers.filter(w =>
        (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.surname || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_pending_registrations')}</h1>
                    <div className="flex items-center gap-4">
                        <div className="w-72">
                            <Input
                                placeholder={t('admin_search_pending')}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black px-6 h-12 rounded-xl"
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            {t('add_worker')}
                        </Button>
                    </div>
                </div>



                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-scafoteam-navy text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 border border-white/10">
                        <span className="font-bold text-sm">{selectedIds.length} {t('admin_selected')}</span>
                        <div className="h-6 w-px bg-white/20" />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBulkApprove}
                                className="bg-emerald-500 hover:bg-emerald-600 h-9 text-xs px-4"
                            >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                {t('admin_approve')} ({selectedIds.length})
                            </Button>
                            <Button
                                onClick={handleBulkReject}
                                className="bg-red-500 hover:bg-red-600 h-9 text-xs px-4"
                            >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Noraidīt ({selectedIds.length})
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedIds([])}
                            className="h-9 px-2 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <div className="grid gap-4">
                    {filtered.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <div
                                className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-500 hover:text-scafoteam-navy transition-colors font-medium"
                                onClick={toggleSelectAll}
                            >
                                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                                    <CheckSquare className="w-5 h-5 text-scafoteam-navy" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                                {selectedIds.length === filtered.length ? "Noņemt atlasi" : "Izvēlēties visus"}
                            </div>
                        </div>
                    )}
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
                            {t('admin_no_pending')}
                        </div>
                    ) : (
                        filtered.map((worker) => (
                            <Card key={worker.id} className="hover:shadow-md transition-shadow group">
                                <CardContent className="flex items-center justify-between p-6 pl-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div onClick={(e) => { e.stopPropagation(); toggleSelect(worker.id); }} className="cursor-pointer text-gray-300 hover:text-scafoteam-navy transition-colors">
                                            {selectedIds.includes(worker.id) ? (
                                                <CheckSquare className="w-6 h-6 text-scafoteam-navy" />
                                            ) : (
                                                <Square className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="space-y-1 cursor-pointer flex-1" onClick={() => setSelectedWorker(worker)}>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-scafoteam-navy group-hover:underline">{worker.name} {worker.surname}</h3>
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
                                            <div className="text-sm text-muted-foreground flex gap-4">
                                                <span>{worker.nationality}</span>
                                                <span>•</span>
                                                <span>{worker.email}</span>
                                                <span>•</span>
                                                <span>{worker.phone}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {t('admin_applied')}: {new Date(worker.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedWorker(worker)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            {t('admin_view')}
                                        </Button>
                                        <Button
                                            onClick={() => handleApproveClick(worker.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {t('admin_approve')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRejectClick(worker.id)}
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Noraidīt
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <WorkerDetailModal
                    worker={selectedWorker}
                    isOpen={!!selectedWorker}
                    onClose={() => setSelectedWorker(null)}
                    onUpdate={async () => {
                        const allWorkers = (await workerStore.getAll()) || [];
                        setWorkers(allWorkers.filter(w => w.status === 'pending'));
                    }}
                />

                <AddWorkerModal
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                    onWorkerAdded={async () => {
                        const allWorkers = (await workerStore.getAll()) || [];
                        setWorkers(allWorkers.filter(w => w.status === 'pending'));
                    }}
                />

                <ConfirmDialog
                    isOpen={rejectConfirm.isOpen}
                    onClose={() => setRejectConfirm({ ...rejectConfirm, isOpen: false })}
                    onConfirm={handleRejectConfirm}
                    title="Noraidīt darbinieku"
                    message="Vai tiešām vēlaties noraidīt šo darbinieku? Informācija tiks dzēsta."
                    confirmText="Noraidīt"
                    cancelText={t('cancel')}
                    variant="danger"
                />


            </div>

        </AdminLayout >
    );
}
