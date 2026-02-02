import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { workerStore, projectStore, templateStore } from '@/lib/store';
import { emailService } from '@/lib/emailService';
import { docGenerator } from '@/lib/docGenerator';
import { FileText, Upload, Trash2, Download, Save, Check, User, Mail, Phone, Calendar, Globe, CreditCard, ShieldCheck, MapPin, Folder, FolderPlus, RefreshCw, Loader2, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkerDetailModal({ worker, isOpen, onClose, onUpdate }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('profile'); // profile, admin, contracts, documents
    const [projects, setProjects] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [adminFormData, setAdminFormData] = useState({
        project: '',
        hourlyRate: '',
        contractStart: '',
        contractEnd: '',
        rentAddress: '',
        rentPrice: '',
        profileImage: '',
        hasPerDiem: false,
        password: '',
        portalLogin: ''
    });
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [availableTemplates, setAvailableTemplates] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (worker) {
                setAdminFormData({
                    project: worker.adminData?.project || '',
                    hourlyRate: worker.adminData?.hourlyRate || '',
                    contractStart: worker.adminData?.contractStart || '',
                    contractEnd: worker.adminData?.contractEnd || '',
                    rentAddress: worker.adminData?.rentAddress || '',
                    rentPrice: worker.adminData?.rentPrice || '',
                    profileImage: worker.adminData?.profileImage || '',
                    hasPerDiem: worker.adminData?.hasPerDiem || false,
                    password: worker.adminData?.password || '',
                    portalLogin: worker.adminData?.portalLogin || worker.email || ''
                });
                const projects = (await projectStore.getAll()) || [];
                setProjects(projects);
                const templates = (await templateStore.getAll()) || [];
                setAvailableTemplates(templates);
            }
        };
        loadData();
    }, [worker]);

    const [isSaved, setIsSaved] = useState(false);

    if (!worker) return null;

    const handleSaveAdminData = async () => {
        const updatedWorker = await workerStore.update(worker.id, { adminData: adminFormData });
        onUpdate(updatedWorker);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleResetPassword = async () => {
        if (!window.confirm(t('admin_confirm_reset_password'))) return;

        setIsResetting(true);
        const newPassword = workerStore.generatePassword();

        try {
            // Update in store
            const updatedWorker = await workerStore.update(worker.id, {
                adminData: { password: newPassword }
            });
            onUpdate(updatedWorker);

            // Send email
            await emailService.sendPassword(worker.email, `${worker.name} ${worker.surname}`, newPassword);
            alert(t('admin_password_sent', { email: worker.email }));
        } catch (error) {
            console.error('Reset password failed:', error);
            alert('Kļūda atiestatot paroli.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleGenerateDocument = async () => {
        if (!selectedTemplateId) {
            alert('Lūdzu, vispirms izvēlieties paraugu.');
            return;
        }

        const selected = availableTemplates.find(t => t.id === selectedTemplateId);
        if (!selected) return;

        setIsGenerating(true);
        try {
            const docx = await docGenerator.generateDOCX(selected.content, worker, selected.name);
            const updatedWorker = await workerStore.addContract(worker.id, {
                name: docx.name,
                content: docx.content,
                templateId: selected.id
            });
            if (updatedWorker) onUpdate(updatedWorker);
            setSelectedTemplateId(''); // Reset selection
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Kļūda dokumenta ģenerēšanā.');
        } finally {
            setIsGenerating(false);
        }
    };
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const updatedData = { ...adminFormData, profileImage: reader.result };
            setAdminFormData(updatedData);
            const updatedWorker = await workerStore.update(worker.id, { adminData: updatedData });
            onUpdate(updatedWorker);
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePhoto = async () => {
        if (window.confirm(t('admin_confirm_delete_photo'))) {
            const updatedData = { ...adminFormData, profileImage: '' };
            setAdminFormData(updatedData);
            const updatedWorker = await workerStore.update(worker.id, { adminData: updatedData });
            onUpdate(updatedWorker);
        }
    };

    const handleAddFolder = () => {
        setIsCreatingFolder(true);
        setNewFolderName('');
    };

    const handleSaveNewFolder = async () => {
        if (newFolderName.trim()) {
            const updatedWorker = await workerStore.addFolder(worker.id, newFolderName.trim());
            if (updatedWorker) onUpdate(updatedWorker);
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    };

    const handleCancelFolder = () => {
        setIsCreatingFolder(false);
        setNewFolderName('');
    };

    const handleDeleteFolder = async (e, folderId) => {
        e.stopPropagation();
        if (window.confirm(t('admin_delete_folder_confirm'))) {
            const updatedWorker = await workerStore.deleteFolder(worker.id, folderId);
            if (updatedWorker) onUpdate(updatedWorker);
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

    const handleDeleteDocument = async (id) => {
        if (window.confirm(t('admin_confirm_delete'))) {
            const updatedWorker = await workerStore.deleteDocument(worker.id, id);
            if (updatedWorker) onUpdate(updatedWorker);
        }
    };

    const handleDeleteContract = async (id) => {
        if (window.confirm(t('admin_confirm_delete'))) {
            const updatedWorker = await workerStore.deleteContract(worker.id, id);
            if (updatedWorker) onUpdate(updatedWorker);
        }
    };

    const handleAddDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const updatedWorker = await workerStore.addDocument(worker.id, {
                name: file.name,
                content: reader.result,
                folderId: currentFolderId
            });
            if (updatedWorker) onUpdate(updatedWorker);
        };
        reader.readAsDataURL(file);
    };

    const StatusBadge = ({ label, active }) => (
        <div className="flex items-center gap-2 text-xs font-bold">
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", active ? "bg-emerald-500 text-white" : "border-2 border-gray-200")}>
                {active && <Check className="w-3 h-3 stroke-[3px]" />}
            </div>
            <span className={active ? "text-emerald-600" : "text-gray-400"}>{label}</span>
        </div>
    );

    const DataField = ({ label, value }) => (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
            <div className="text-sm font-bold text-scafoteam-navy min-h-[20px]">
                {value || '---'}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setCurrentFolderId(null);
                onClose();
            }}
            title={t('admin_worker_details')}
            className="max-w-4xl h-[85vh] flex flex-col"

        >
            <div className="flex gap-4 mb-6 border-b shrink-0">
                <button
                    className={cn("pb-2 px-1 font-bold transition-colors text-sm", activeTab === 'profile' ? 'text-scafoteam-navy border-b-2 border-scafoteam-navy' : 'text-gray-400')}
                    onClick={() => setActiveTab('profile')}
                >
                    {t('admin_worker_details')}
                </button>
                <button
                    className={cn("pb-2 px-1 font-bold transition-colors text-sm", activeTab === 'admin' ? 'text-scafoteam-navy border-b-2 border-scafoteam-navy' : 'text-gray-400')}
                    onClick={() => setActiveTab('admin')}
                >
                    {t('admin_work_info')}
                </button>
                <button
                    className={cn("pb-2 px-1 font-bold transition-colors text-sm", activeTab === 'contracts' ? 'text-scafoteam-navy border-b-2 border-scafoteam-navy' : 'text-gray-400')}
                    onClick={() => setActiveTab('contracts')}
                >
                    {t('admin_contracts')}
                </button>
                <button
                    className={cn("pb-2 px-1 font-bold transition-colors text-sm", activeTab === 'documents' ? 'text-scafoteam-navy border-b-2 border-scafoteam-navy' : 'text-gray-400')}
                    onClick={() => setActiveTab('documents')}
                >
                    {t('admin_personal_documents')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                {activeTab === 'profile' && (
                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* LEFT COLUMN: Photo */}
                        <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-scafoteam-navy border-b border-scafoteam-navy pb-1 block">
                                    {t('admin_profile_photo_label')}
                                </label>
                                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden group">
                                    {adminFormData.profileImage ? (
                                        <>
                                            <img src={adminFormData.profileImage} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePhoto();
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <User className="w-16 h-16 mb-2" />
                                            <span className="text-xs font-bold uppercase">{t('no_image') || 'No Image'}</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={handlePhotoUpload}
                                        accept="image/*"
                                    />
                                    <div className="absolute inset-0 bg-scafoteam-navy/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="text-white w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Worker Information */}
                        <div className="flex-1 space-y-10">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-scafoteam-navy border-b border-scafoteam-navy pb-1 block">
                                    {t('admin_personal_info')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <DataField label={t('name')} value={worker.name} />
                                    <DataField label={t('surname')} value={worker.surname} />
                                    <DataField label={t('nationality')} value={worker.nationality} />
                                    <DataField label={t('personal_id')} value={worker.personalId} />
                                    <DataField label={t('finnish_id')} value={worker.finnishId} />
                                    <DataField label={t('tax_number')} value={worker.taxNumber} />
                                </div>
                            </div>

                            {/* Contact & Bank */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-scafoteam-navy border-b border-scafoteam-navy pb-1 block">
                                    {t('admin_contact_bank')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <DataField label={t('email')} value={worker.email} />
                                    <DataField label={t('phone')} value={worker.phone} />
                                    <DataField label={t('address')} value={worker.address} />
                                    <DataField label={t('bank_account')} value={worker.bankAccount} />
                                    <DataField label={t('bic_code')} value={worker.bicCode} />
                                </div>
                            </div>

                            {/* Registration Data */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-scafoteam-navy border-b border-scafoteam-navy pb-1 block">
                                    {t('experience_type')} & {t('admin_certificates')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <DataField label={t('experience_type')} value={`${worker.experienceType || ''} (${worker.experienceDuration || ''})`} />
                                    <DataField label={t('admin_drivers_licence')} value={String(worker.drivingLicence || '')} />
                                    <DataField label={t('green_card')} value={worker.hasGreenCard === 'yes' ? `${worker.greenCardShow || ''} (Exp: ${worker.greenCardExpiry || ''})` : t('no')} />
                                    <DataField label={t('vca_card')} value={worker.hasVas === 'yes' ? t('yes') : t('no')} />
                                    <DataField label={t('hotworks_as1')} value={worker.hasHotworks === 'yes' ? `${String(worker.hotworksType || '').toUpperCase()} (Exp: ${worker.hotworksExpiry || ''})` : t('no')} />
                                </div>
                            </div>

                            {/* Statuses Footer */}
                            <div className="flex flex-wrap items-center gap-6 pt-6 border-t mt-4">
                                <StatusBadge label={t('admin_registered')} active={true} />
                                <StatusBadge label={t('admin_confirmed')} active={worker.status === 'active'} />
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">{t('admin_project')} & {t('admin_hourly_rate')}</h3>
                                    <div className="grid gap-4">
                                        <Select
                                            value={adminFormData.project}
                                            onChange={e => setAdminFormData(prev => ({ ...prev, project: e.target.value }))}
                                            options={[
                                                { value: '', label: t('admin_select_project') },
                                                ...(projects || []).map(p => ({ value: p?.name || '', label: p?.name || '---' }))
                                            ]}
                                            className="h-12"
                                        />
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin_hourly_rate')}</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                                                    <Input
                                                        className="pl-8 h-11 shadow-sm font-bold"
                                                        value={adminFormData.hourlyRate}
                                                        onChange={e => setAdminFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                                                        placeholder="0.00"
                                                    />
                                                    {worker.adminData?.hasPerDiem && (
                                                        <div className="absolute -top-3 -right-2 px-2 py-0.5 bg-scafoteam-gold text-scafoteam-navy text-[8px] font-black uppercase rounded-md shadow-sm border border-scafoteam-gold/20">
                                                            + P.D
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pt-6">
                                                <div
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-scafoteam-navy/5 transition-colors group"
                                                    onClick={() => setAdminFormData(prev => ({ ...prev, hasPerDiem: !prev.hasPerDiem }))}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all",
                                                            adminFormData.hasPerDiem ? "bg-scafoteam-navy border-scafoteam-navy shadow-lg shadow-scafoteam-navy/20" : "border-gray-200 bg-white"
                                                        )}
                                                    >
                                                        {adminFormData.hasPerDiem && <Check className="w-4 h-4 text-white stroke-[4px]" />}
                                                    </div>
                                                    <span className={cn("text-xs font-black uppercase tracking-widest select-none", adminFormData.hasPerDiem ? "text-scafoteam-navy" : "text-gray-400")}>
                                                        {t('admin_per_diem')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">{t('admin_contract_period')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_contract_start')}</label>
                                            <Input type="date" className="h-12" value={adminFormData.contractStart} onChange={e => setAdminFormData(prev => ({ ...prev, contractStart: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_contract_end')}</label>
                                            <Input type="date" className="h-12" value={adminFormData.contractEnd} onChange={e => setAdminFormData(prev => ({ ...prev, contractEnd: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">{t('admin_rent_info')}</h3>
                                    <div className="grid gap-4">
                                        <Input
                                            className="h-12"
                                            value={adminFormData.rentAddress}
                                            onChange={e => setAdminFormData(prev => ({ ...prev, rentAddress: e.target.value }))}
                                            placeholder={t('admin_rent_address')}
                                        />
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">€</span>
                                            <Input
                                                className="h-12 pl-8 font-bold text-emerald-600"
                                                value={adminFormData.rentPrice}
                                                onChange={e => setAdminFormData(prev => ({ ...prev, rentPrice: e.target.value }))}
                                                placeholder={t('admin_rent_price')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        {t('admin_portal_access')}
                                    </h3>
                                    <div className="grid gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_portal_identifier')}</label>
                                            <Input
                                                className="h-11 bg-white border-emerald-100 font-bold"
                                                value={adminFormData.portalLogin}
                                                onChange={e => setAdminFormData(prev => ({ ...prev, portalLogin: e.target.value }))}
                                                placeholder={worker.email}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin_portal_password')}</label>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 bg-white border-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-2 hover:bg-emerald-50"
                                                onClick={handleResetPassword}
                                                disabled={isResetting}
                                            >
                                                {isResetting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                                {isResetting ? t('admin_sending_password') : t('admin_reset_password')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center pt-10 pb-4">
                            <Button
                                className={cn(
                                    "px-16 h-14 font-bold rounded-xl shadow-xl transition-all text-base",
                                    isSaved
                                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                        : "bg-scafoteam-navy hover:bg-scafoteam-navy/90 shadow-scafoteam-navy/20"
                                )}
                                onClick={handleSaveAdminData}
                            >
                                {isSaved ? (
                                    <>
                                        <Check className="mr-3 w-5 h-5" />
                                        {t('admin_saved')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-3 w-5 h-5" />
                                        {t('admin_save_mgmt')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100">
                            <div>
                                <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">{t('admin_contracts')}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{t('admin_contracts_desc')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {availableTemplates.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Select
                                            className="h-9 w-48 text-xs font-bold"
                                            value={selectedTemplateId}
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            placeholder={t('admin_select_template')}
                                            options={availableTemplates.map(t => ({ value: t.id, label: t.name }))}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 px-4 border-emerald-200 text-emerald-700 font-bold rounded-lg shadow-sm hover:bg-emerald-50 whitespace-nowrap"
                                            onClick={handleGenerateDocument}
                                            disabled={isGenerating || !selectedTemplateId}
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                            {isGenerating ? t('admin_generating') : t('admin_generate_document')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(worker.contracts || []).map((contract) => (
                                <div key={contract.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-32 relative overflow-hidden">
                                    {contract.status === 'signed' && (
                                        <div className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-white rounded-bl-xl shadow-lg animate-in slide-in-from-top slide-in-from-right duration-300">
                                            <Check className="w-3 h-3 stroke-[4px]" />
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className={cn("p-2 rounded-lg", contract.status === 'signed' ? "bg-emerald-50 text-emerald-600" : "bg-scafoteam-navy/5 text-scafoteam-navy")}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-scafoteam-navy truncate">{contract.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-gray-400 font-medium uppercase">{new Date(contract.date).toLocaleDateString()}</p>
                                                <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase", contract.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                                                    {contract.status === 'signed' ? t('admin_status_signed') : t('admin_status_pending')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-scafoteam-navy hover:bg-scafoteam-navy/10 rounded-lg"
                                            onClick={() => handleDownloadDocument(contract)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteContract(contract.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(worker.contracts || []).length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('admin_no_documents')}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                {currentFolderId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentFolderId(null)}
                                        className="text-scafoteam-navy font-bold hover:bg-scafoteam-navy/5"
                                    >
                                        ← {t('admin_back_to_root')}
                                    </Button>
                                )}
                                <h3 className="text-sm font-black text-scafoteam-navy uppercase tracking-widest">
                                    {currentFolderId ? worker.folders?.find(f => f.id === currentFolderId)?.name : t('admin_personal_documents')}
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 border-gray-200 text-scafoteam-navy font-bold rounded-lg shadow-sm flex items-center gap-2"
                                    onClick={handleAddFolder}
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    <span>{t('admin_add_folder')}</span>
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* New Folder Inline Form */}
                            {isCreatingFolder && !currentFolderId && (
                                <div className="p-4 bg-white border-2 border-dashed border-emerald-500/50 rounded-2xl shadow-sm flex flex-col justify-between h-32 animate-in fade-in zoom-in-50 duration-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                            <FolderPlus className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                autoFocus
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                placeholder={t('admin_folder_name')}
                                                className="h-8 text-sm font-bold border-emerald-200 focus-visible:ring-emerald-500"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveNewFolder();
                                                    if (e.key === 'Escape') handleCancelFolder();
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCancelFolder}
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSaveNewFolder}
                                            className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}


                            {/* Render Folders (only in root) */}
                            {!currentFolderId && worker.folders?.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between h-32"
                                    onClick={() => setCurrentFolderId(folder.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-scafoteam-navy/5 rounded-xl text-scafoteam-navy shadow-inner">
                                            <Folder className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-scafoteam-navy truncate">{folder.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                                                {(worker.documents || []).filter(d => d.folderId === folder.id).length} {t('admin_documents_count')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleDeleteFolder(e, folder.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Render Documents for current level */}
                            {worker.documents?.filter(doc => doc.folderId === currentFolderId).map((doc) => (
                                <div key={doc.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-32">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-scafoteam-navy/5 rounded-lg text-scafoteam-navy">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-scafoteam-navy truncate">{doc.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{new Date(doc.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-scafoteam-navy hover:bg-scafoteam-navy/10 rounded-lg"
                                            onClick={() => handleDownloadDocument(doc)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteDocument(doc.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Document placeholder */}
                            <label className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-32 hover:bg-gray-50 transition-colors cursor-pointer group relative">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAddDocument} />
                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-scafoteam-navy transition-colors mb-2" />
                                <span className="text-xs font-bold text-gray-400 group-hover:text-scafoteam-navy transition-colors">
                                    {t('admin_upload_doc')}
                                </span>
                            </label>
                        </div>

                        {worker.documents?.filter(d => d.folderId === currentFolderId).length === 0 && (!currentFolderId && worker.folders?.length === 0) && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('admin_no_documents')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
