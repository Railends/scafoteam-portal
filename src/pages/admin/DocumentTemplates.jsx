import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, Trash2, Upload, Plus, Copy, Check } from 'lucide-react';
import { templateStore } from '@/lib/store';

export default function DocumentTemplates() {
    const { t } = useTranslation();
    const [templates, setTemplates] = useState([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    useEffect(() => {
        setTemplates(templateStore.getAll());
    }, []);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleAddTemplate = () => {
        if (!newTemplateName || !selectedFile) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const added = templateStore.add(newTemplateName, reader.result);
            setTemplates(prev => [...prev, added]);
            setNewTemplateName('');
            setSelectedFile(null);
            // Clear file input
            const input = document.getElementById('template-upload');
            if (input) input.value = '';
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleDeleteTemplate = (id) => {
        if (window.confirm(t('admin_delete_confirm'))) {
            templateStore.delete(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
        }
    };

    const placeholders = [
        '{name}', '{surname}', '{personalId}', '{finnishId}', '{taxNumber}',
        '{email}', '{phone}', '{address}', '{bankAccount}', '{bicCode}',
        '{experienceType}', '{experienceDuration}', '{jacketSize}', '{pantsSize}',
        '{waistSize}', '{bootsSize}', '{emergencyContact}', '{project}',
        '{hourlyRate}', '{contractStart}', '{contractEnd}', '{rentAddress}',
        '{rentPrice}', '{date}', '{signingDate}'
    ];

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-scafoteam-navy">{t('admin_document_templates')}</h1>
                    <p className="text-muted-foreground">{t('admin_templates_desc')}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Template List */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-scafoteam-navy" />
                                    {t('admin_document_templates')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {templates.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed">
                                            Nav pievienotu paraugu.
                                        </p>
                                    ) : (
                                        templates.map((template) => (
                                            <div key={template.id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-scafoteam-navy">{template.name}</p>
                                                        <p className="text-xs text-muted-foreground">Pievienots: {new Date(template.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-scafoteam-navy" />
                                    {t('admin_add_template')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-scafoteam-navy">{t('admin_template_name')}</label>
                                    <Input
                                        placeholder="Piemēram: Darba līgums"
                                        value={newTemplateName}
                                        onChange={e => setNewTemplateName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-scafoteam-navy">{t('admin_upload_template')}</label>
                                    <div className="relative">
                                        <Input
                                            id="template-upload"
                                            type="file"
                                            accept=".docx"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Tikai .docx faili</p>
                                </div>
                                <Button
                                    className="w-full bg-scafoteam-navy hover:bg-scafoteam-navy/90"
                                    onClick={handleAddTemplate}
                                    disabled={!newTemplateName || !selectedFile}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t('admin_add')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Placeholder Guide */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Copy className="w-5 h-5 text-scafoteam-navy" />
                                    {t('admin_placeholders_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Ievietojiet šos mainīgos savā Word dokumentā. Sistēma tos automātiski aizstās ar darbinieka datiem.
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {placeholders.map((p) => (
                                        <div
                                            key={p}
                                            onClick={() => copyToClipboard(p)}
                                            className="flex items-center justify-between p-2 text-xs font-mono bg-gray-50 rounded border cursor-pointer hover:bg-scafoteam-navy/5 transition-colors group"
                                            title={t('admin_copy_placeholder')}
                                        >
                                            <span className="text-scafoteam-navy font-bold">{p}</span>
                                            {copiedKey === p ? (
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
