import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerStore } from '@/lib/store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { WorkerDetailModal } from '@/components/admin/WorkerDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { emailService } from '@/lib/emailService';

export default function PendingWorkers() {


    const { t } = useTranslation();
    const [workers, setWorkers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedWorker, setSelectedWorker] = useState(null);

    useEffect(() => {
        const loadWorkers = async () => {
            const allWorkers = (await workerStore.getAll()) || [];
            setWorkers(allWorkers.filter(w => w.status === 'pending'));
        };
        loadWorkers();
    }, []);

    const [confirmData, setConfirmData] = useState({ isOpen: false, id: null });

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



    const filtered = workers.filter(w =>
        (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.surname || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_pending_registrations')}</h1>
                    <div className="w-72">
                        <Input
                            placeholder={t('admin_search_pending')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
                            {t('admin_no_pending')}
                        </div>
                    ) : (
                        filtered.map((worker) => (
                            <Card key={worker.id} className="hover:shadow-md transition-shadow group">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="space-y-1 cursor-pointer" onClick={() => setSelectedWorker(worker)}>
                                        <h3 className="font-bold text-lg text-scafoteam-navy group-hover:underline">{worker.name} {worker.surname}</h3>
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
                    onUpdate={(updated) => {
                        setWorkers(prev => prev.map(w => w.id === updated.id ? updated : w));
                        if (selectedWorker && selectedWorker.id === updated.id) setSelectedWorker(updated);
                    }}
                />


            </div>

        </AdminLayout>
    );
}
