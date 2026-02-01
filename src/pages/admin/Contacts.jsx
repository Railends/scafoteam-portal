import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, User, Mail, Phone, Building } from 'lucide-react';

export default function Contacts() {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState([
        { id: 1, name: 'Matti Virtanen', role: 'Site Manager', company: 'ABC Construction', email: 'matti@abc.com', phone: '+358 40 111 2222' },
        { id: 2, name: 'Liisa Korhonen', role: 'HR Manager', company: 'Nordic Builders', email: 'liisa@nordic.fi', phone: '+358 50 333 4444' },
        { id: 3, name: 'Pekka Nieminen', role: 'Project Lead', company: 'ABC Construction', email: 'pekka@abc.com', phone: '+358 40 555 6666' },
    ]);
    const [search, setSearch] = useState('');

    const filtered = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_contacts')}</h1>
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

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">{t('name')}</th>
                                <th className="p-4">{t('admin_role')}</th>
                                <th className="p-4">{t('admin_company')}</th>
                                <th className="p-4">{t('email')}</th>
                                <th className="p-4">{t('admin_phone')}</th>
                                <th className="p-4">{t('admin_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map(contact => (
                                <tr key={contact.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-scafoteam-navy/10 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-scafoteam-navy" />
                                            </div>
                                            <span className="font-medium text-scafoteam-navy">{contact.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{contact.role}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            {contact.company}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {contact.email}
                                        </a>
                                    </td>
                                    <td className="p-4">
                                        <a href={`tel:${contact.phone}`} className="text-gray-600 hover:text-scafoteam-navy flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {contact.phone}
                                        </a>
                                    </td>
                                    <td className="p-4">
                                        <Button size="sm" variant="outline">{t('admin_view')}</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
