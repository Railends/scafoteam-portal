import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, GraduationCap, Calendar, Users, CheckCircle } from 'lucide-react';

export default function Training() {
    const { t } = useTranslation();
    const [trainings, setTrainings] = useState([
        { id: 1, title: 'Safety Training - Scaffolding', date: '2024-02-15', duration: '4 hours', participants: 12, status: 'upcoming', instructor: 'Matti Virtanen' },
        { id: 2, title: 'Hotworks Certificate Renewal', date: '2024-02-20', duration: '2 hours', participants: 8, status: 'upcoming', instructor: 'Liisa Korhonen' },
        { id: 3, title: 'First Aid Training', date: '2024-01-28', duration: '6 hours', participants: 15, status: 'completed', instructor: 'Pekka Nieminen' },
    ]);
    const [search, setSearch] = useState('');

    const filtered = trainings.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.instructor.toLowerCase().includes(search.toLowerCase())
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
                        <Button className="bg-scafoteam-navy hover:bg-scafoteam-navy/90">
                            <Plus className="w-4 h-4 mr-2" /> {t('admin_add')}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filtered.map(training => (
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
                                                {training.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                {training.duration}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                {training.participants}
                                            </div>
                                            <div>
                                                <span className="text-gray-500">{t('admin_instructor')}:</span> {training.instructor}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">{t('admin_view')}</Button>
                                    {training.status === 'upcoming' && (
                                        <Button size="sm" className="bg-scafoteam-gold hover:bg-yellow-500 text-scafoteam-navy">
                                            {t('admin_actions')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
