import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, GraduationCap, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { trainingStore } from '@/lib/store';

export default function Training() {
    const { t } = useTranslation();
    const [trainings, setTrainings] = useState([]);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newTraining, setNewTraining] = useState({
        title: '',
        date: '',
        duration: '',
        instructor: ''
    });

    useEffect(() => {
        loadTrainings();
    }, []);

    const loadTrainings = async () => {
        const data = await trainingStore.getAll();
        setTrainings(data);
    };

    const handleCreate = async () => {
        if (!newTraining.title || !newTraining.date) return;
        setLoading(true);
        try {
            await trainingStore.add(newTraining);
            await loadTrainings();
            setIsAddOpen(false);
            setNewTraining({ title: '', date: '', duration: '', instructor: '' });
        } catch (e) {
            console.error(e);
            alert('Error creating training');
        } finally {
            setLoading(false);
        }
    };

    const filtered = trainings.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.instructor || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_training')}</h1>
                    <div className="flex gap-4">
                        <Input
                            placeholder={t('admin_search_pending')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-72 bg-white"
                        />
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-scafoteam-navy hover:bg-scafoteam-navy/90"
                        >
                            <Plus className="w-4 h-4 mr-2" /> {t('admin_add')}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
                            Nav atrasti ieraksti.
                        </div>
                    ) : (
                        filtered.map(training => (
                            <div key={training.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${training.status === 'completed'
                                            ? 'bg-green-100'
                                            : 'bg-scafoteam-navy/10'
                                            }`}>
                                            {training.status === 'completed' ? (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <GraduationCap className="w-6 h-6 text-scafoteam-navy" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-scafoteam-navy text-lg">{training.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${training.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {training.status === 'completed' ? t('admin_completed') : t('admin_upcoming')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(training.date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {training.duration || '-'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    {training.participants} dalībnieki
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">{t('admin_instructor')}:</span> {training.instructor || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline">{t('admin_view')}</Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Pievienot Apmācību"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nosaukums</label>
                        <Input
                            value={newTraining.title}
                            onChange={e => setNewTraining({ ...newTraining, title: e.target.value })}
                            placeholder="Piem. Darba drošība augstumā"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datums</label>
                        <Input
                            type="date"
                            value={newTraining.date}
                            onChange={e => setNewTraining({ ...newTraining, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ilgums</label>
                        <Input
                            value={newTraining.duration}
                            onChange={e => setNewTraining({ ...newTraining, duration: e.target.value })}
                            placeholder="Piem. 4 stundas"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instruktors</label>
                        <Input
                            value={newTraining.instructor}
                            onChange={e => setNewTraining({ ...newTraining, instructor: e.target.value })}
                            placeholder="Vārds Uzvārds"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>{t('cancel')}</Button>
                        <Button
                            className="bg-scafoteam-navy text-white"
                            onClick={handleCreate}
                            disabled={loading}
                        >
                            {loading ? 'Saglabā...' : t('save')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
