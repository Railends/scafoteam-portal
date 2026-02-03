import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Package, FileText, Download } from 'lucide-react';

export default function ProductCatalogs() {
    const { t } = useTranslation();
    const [catalogs, setCatalogs] = useState([
        { id: 1, name: 'Scaffolding Equipment 2024', category: 'Scaffolding', items: 45, updated: '2024-01-15', fileSize: '2.4 MB' },
        { id: 2, name: 'Safety Gear Catalog', category: 'Safety', items: 32, updated: '2024-01-10', fileSize: '1.8 MB' },
        { id: 3, name: 'Insulation Materials', category: 'Insulation', items: 28, updated: '2023-12-20', fileSize: '3.1 MB' },
    ]);
    const [search, setSearch] = useState('');

    const filtered = catalogs.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_catalogs')}</h1>
                    <div className="flex gap-4">
                        <Input
                            placeholder={t('admin_search_active')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-72 bg-white"
                        />
                        <Button className="bg-scafoteam-navy hover:bg-scafoteam-navy/90">
                            <Plus className="w-4 h-4 mr-2" /> {t('admin_add')}
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(catalog => (
                        <div key={catalog.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-scafoteam-navy to-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-scafoteam-navy mb-1 truncate">{catalog.name}</h3>
                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {catalog.category}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                    <span>{t('admin_actions')}:</span>
                                    <span className="font-medium">{catalog.items}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('admin_rent_price')}:</span>
                                    <span className="font-medium">{catalog.fileSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('admin_applied')}:</span>
                                    <span className="font-medium">{catalog.updated}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                    <FileText className="w-4 h-4 mr-2" /> {t('admin_view')}
                                </Button>
                                <Button size="sm" className="bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white">

                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
