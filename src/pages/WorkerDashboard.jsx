import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, FileText, Download, LogOut, ShieldCheck, Mail, Phone, MapPin, Building2, Calendar, Briefcase, CheckSquare, Square, PenTool, Check, Loader2, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';
import { workerStore, templateStore } from '@/lib/store';
import { docGenerator } from '@/lib/docGenerator';
import { SignatureModal } from '@/components/ui/SignatureModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Settings } from 'lucide-react';


export default function WorkerDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [worker, setWorker] = useState(null);
    const [selectedContracts, setSelectedContracts] = useState([]);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [showToast, setShowToast] = useState(false);



    useEffect(() => {
        const stored = sessionStorage.getItem('workerData');
        if (!stored) {
            navigate('/worker/login');
            return;
        }
        const data = JSON.parse(stored);

        const loadWorker = async () => {
            // Sync with store to get latest status/documents
            const allWorkers = (await workerStore.getAll()) || [];
            const currentWorker = allWorkers.find(w => w.id === data.id);
            if (currentWorker) {
                setWorker(currentWorker);
                sessionStorage.setItem('workerData', JSON.stringify(currentWorker));
            } else {
                setWorker(data);
            }
        };
        loadWorker();
    }, [navigate]);

    if (!worker) return null;

    const handleLogout = () => {
        sessionStorage.removeItem('workerData');
        navigate('/worker/login');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert('Paroles nesakrīt!');
            return;
        }

        setIsSavingSettings(true);
        try {
            await workerStore.update(worker.id, {
                adminData: { password: passwords.new }
            });

            // Update local state and sessionStorage
            const updatedWorker = {
                ...worker,
                adminData: { ...worker.adminData, password: 'obf:' + btoa(passwords.new) }
            };
            setWorker(updatedWorker);
            sessionStorage.setItem('workerData', JSON.stringify(updatedWorker));

            setPasswords({ new: '', confirm: '' });
            setIsSettingsOpen(false);

            // Show success toast
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Kļūda mainot paroli');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const toggleContractSelection = (id) => {

        setSelectedContracts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSaveSignature = async (signatureDataUrl) => {
        setIsSigning(true);
        try {
            const templates = (await templateStore.getAll()) || [];

            let signedCount = 0;
            for (const contractId of selectedContracts) {
                const contract = (worker.contracts || []).find(c => c.id === contractId);
                if (!contract || contract.status === 'signed') continue;

                const template = templates.find(t => t.id === contract.templateId);
                if (!template) continue;

                // Regenerate the document with the signature
                const result = await docGenerator.generateDOCX(template.content, worker, template.name, signatureDataUrl);

                // Update store
                await workerStore.signContract(worker.id, contractId, signatureDataUrl, result.content);
                signedCount++;
            }

            // Sync UI
            const allWorkers = (await workerStore.getAll()) || [];
            const currentId = worker?.id;
            const updatedWorker = allWorkers.find(w => w.id === currentId);

            if (updatedWorker) {
                setWorker(updatedWorker);
                try {
                    sessionStorage.setItem('workerData', JSON.stringify(updatedWorker));
                } catch (e) {
                    console.error("Error writing to sessionStorage:", e);
                }
            }

            setSelectedContracts([]);
            setIsSignatureModalOpen(false);

            // Show custom toast instead of alert
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

        } catch (error) {
            console.error('WorkerDashboard: Signing failed:', error);
            alert('Kļūda parakstīšanā: ' + (error.message || 'Nezināma kļūda'));
        } finally {
            setIsSigning(false);
        }
    };

    const handleDownloadDocument = (doc) => {
        const link = document.createElement('a');
        link.href = doc.content;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const updatedWorker = await workerStore.addDocument(worker.id, {
                    name: file.name,
                    content: reader.result,
                    folderId: null
                });

                if (updatedWorker) {
                    setWorker(updatedWorker);
                    sessionStorage.setItem('workerData', JSON.stringify(updatedWorker));
                }

                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Augšupielāde neizdevās');
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };


    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white transition-all duration-300 group">
            <div className="p-2.5 bg-scafoteam-navy/5 rounded-xl text-scafoteam-navy group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-scafoteam-navy">{value || '---'}</p>
            </div>
        </div>
    );

    return (
        <Layout className="max-w-6xl pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-4">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-scafoteam-gold/20 flex items-center justify-center border-2 border-scafoteam-gold/20 shadow-xl shadow-scafoteam-gold/5 overflow-hidden">
                        {worker.adminData?.profileImage ? (
                            <img src={worker.adminData.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-scafoteam-gold" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-scafoteam-navy tracking-tight leading-tight">{worker.name} {worker.surname}</h1>
                            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg shadow-emerald-500/20 whitespace-nowrap">{t('active')}</span>
                        </div>
                        <p className="text-gray-400 font-bold text-sm mt-2 tracking-wide">{worker.adminData?.project || t('admin_no_project')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white border-gray-200 text-scafoteam-navy hover:bg-scafoteam-navy/5 rounded-xl px-4 font-bold h-12 transition-all shadow-sm"
                        title={t('change_password')}
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 bg-white rounded-xl px-6 font-bold h-12 transition-all shadow-sm">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('logout')}
                    </Button>
                </div>


            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        <InfoRow icon={Mail} label={t('email')} value={worker.email} />
                        <InfoRow icon={Phone} label={t('phone')} value={worker.phone} />
                        <InfoRow icon={ShieldCheck} label={t('personal_id')} value={worker.personalId} />
                        <InfoRow icon={Calendar} label={t('admin_contract_end')} value={worker.adminData?.contractEnd} />
                        <InfoRow icon={MapPin} label={t('address')} value={worker.address} />
                        <InfoRow icon={Building2} label={t('admin_rent_address')} value={worker.adminData?.rentAddress} />
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-scafoteam-navy/5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                            <h3 className="text-xs font-black text-scafoteam-navy uppercase tracking-widest flex items-center gap-3">
                                <PenTool className="w-4 h-4 text-scafoteam-gold" />
                                {t('admin_contracts')}
                            </h3>
                            {selectedContracts.length > 0 && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="bg-scafoteam-navy hover:bg-scafoteam-navy/90 text-white font-bold h-8 px-4"
                                    disabled={isSigning}
                                >
                                    {isSigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    {t('admin_sign')} ({selectedContracts.length})
                                </Button>
                            )}
                        </div>

                        {(!worker.contracts || worker.contracts.length === 0) ? (
                            <div className="text-center py-10 text-gray-400 text-sm font-bold uppercase tracking-widest">
                                {t('admin_no_documents')}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {worker.contracts?.map((contract) => (
                                    <div
                                        key={contract.id}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all group flex items-center justify-between cursor-pointer",
                                            contract.status === 'signed'
                                                ? "bg-emerald-50/50 border-emerald-100 opacity-80"
                                                : selectedContracts.includes(contract.id)
                                                    ? "bg-scafoteam-navy/5 border-scafoteam-navy ring-1 ring-scafoteam-navy shadow-md"
                                                    : "bg-gray-50 border-transparent hover:border-scafoteam-navy/10 hover:bg-white"
                                        )}
                                        onClick={() => contract.status === 'pending' && toggleContractSelection(contract.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="shrink-0">
                                                {contract.status === 'signed' ? (
                                                    <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                ) : selectedContracts.includes(contract.id) ? (
                                                    <div className="p-2 bg-scafoteam-navy text-white rounded-lg shadow-sm">
                                                        <CheckSquare className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm group-hover:text-scafoteam-navy">
                                                        <Square className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-scafoteam-navy truncate">{contract.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase">{new Date(contract.date).toLocaleDateString()}</p>
                                                    <span className={cn("text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase", contract.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                                                        {contract.status === 'signed' ? t('admin_status_signed') : t('admin_status_pending')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-scafoteam-navy hover:bg-scafoteam-navy/10 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadDocument(contract);
                                            }}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-scafoteam-navy/5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                            <h3 className="text-xs font-black text-scafoteam-navy uppercase tracking-widest flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                {t('admin_personal_documents')}
                            </h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="worker-doc-upload"
                                    className="hidden"
                                    onChange={handleAddDocument}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => document.getElementById('worker-doc-upload').click()}
                                    className="bg-scafoteam-gold hover:bg-scafoteam-gold/90 text-scafoteam-navy font-black h-8 px-4 text-[10px] rounded-lg shadow-lg shadow-scafoteam-gold/20"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 mr-2" />}
                                    {t('admin_upload_doc') || 'UPL.'}
                                </Button>
                            </div>
                        </div>

                        {(!worker.documents || worker.documents.length === 0) ? (
                            <div className="text-center py-10 text-gray-400 text-sm font-bold uppercase tracking-widest">
                                {t('admin_no_documents')}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {worker.documents?.map((doc) => (
                                    <div key={doc.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-scafoteam-navy/10 hover:bg-white transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-white rounded-lg text-scafoteam-navy shadow-sm group-hover:scale-110 transition-transform">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-scafoteam-navy truncate">{doc.name}</p>
                                                <p className="text-[9px] text-gray-400 font-black uppercase">{new Date(doc.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-scafoteam-navy hover:bg-scafoteam-navy/10"
                                            onClick={() => handleDownloadDocument(doc)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Card */}
                <div className="space-y-8">
                    <Card className="border-0 shadow-2xl shadow-scafoteam-navy/10 rounded-[32px] overflow-hidden bg-gradient-to-br from-scafoteam-navy to-slate-800 text-white">
                        <CardHeader className="pt-8 px-8">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-300/60">{t('current_assignment')}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Briefcase className="w-6 h-6 text-scafoteam-gold" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">{worker.adminData?.project || '---'}</p>
                                    <p className="text-[10px] text-blue-200/50 font-bold uppercase tracking-widest mt-0.5">{t('admin_project')}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/40 mb-2">{t('hourly_rate')}</p>
                                <p className="text-4xl font-black text-white">€ {worker.adminData?.hourlyRate || '0.00'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={handleSaveSignature}
                isSigning={isSigning}
            />

            {/* Success Toast */}
            {showToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-scafoteam-navy text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest">{t('admin_signed_successfully')}</p>
                            <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-widest mt-0.5">Visi dokumenti ir saglabāti</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings / Password Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title={t('change_password')}
                className="max-w-md"
            >
                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('new_password')}</label>
                            <Input
                                type="password"
                                required
                                value={passwords.new}
                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                className="h-12 bg-gray-50/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('confirm_password')}</label>
                            <Input
                                type="password"
                                required
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="h-12 bg-gray-50/20"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)} className="flex-1">
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={isSavingSettings} className="flex-1 bg-scafoteam-navy hover:bg-scafoteam-navy/90">
                            {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {t('save')}
                        </Button>
                    </div>
                </form>
            </Modal>

        </Layout>
    );
}
