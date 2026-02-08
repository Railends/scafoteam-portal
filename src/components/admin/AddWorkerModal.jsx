import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTranslation } from 'react-i18next';
import { FileUp, UserPlus, Upload, Loader2, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { workerStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ocrService } from '@/lib/ocrService';
import { Scan } from 'lucide-react';
import { toast } from 'sonner';

export function AddWorkerModal({ open, onOpenChange, onWorkerAdded }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState('manual'); // 'manual' or 'excel'
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [importResults, setImportResults] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'worker',
        status: 'active'
    });

    const handleScanID = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        toast.info('Skenē ID karti...');
        try {
            const text = await ocrService.extractText(file);
            const personalIdMatch = text.match(/\d{6}-\d{5}/);
            const taxMatch = text.match(/\d{11}/);

            if (personalIdMatch || taxMatch) {
                // We don't have personalId/taxNumber in the INITIAL formData state of this component
                // but we should add them if they are detected to populate the adminData later
                setFormData(prev => ({
                    ...prev,
                    personalId: personalIdMatch ? personalIdMatch[0] : prev.personalId,
                    taxNumber: taxMatch ? taxMatch[0] : prev.taxNumber
                }));
                toast.success('Dati nolasīti!');
            } else {
                toast.warning('Neizdevās atrast ID datus.');
            }
        } catch (error) {
            toast.error('Kļūda: ' + error.message);
        } finally {
            e.target.value = '';
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await workerStore.add(formData);

        setIsLoading(false);
        if (result.success) {
            setSuccess({ type: 'manual', password: result.tempPassword });
            setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'worker', status: 'active' });
            if (onWorkerAdded) onWorkerAdded();
        } else {
            setError(result.error);
        }
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) throw new Error('Excel file is empty');

                let importedCount = 0;
                let failedCount = 0;
                const results = [];

                // Normalization helper
                const normalize = (row, ...keys) => {
                    for (const key of keys) {
                        const val = row[key];
                        if (val !== undefined && val !== null && val !== '') return val;
                    }
                    return '';
                };

                for (const row of data) {
                    // normalize header keys (case insensitive find)
                    const getCol = (key) => {
                        const rowKeys = Object.keys(row);
                        const found = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
                        return found ? row[found] : undefined;
                    };

                    const firstName = normalize(row, 'Name', 'Vārds', 'First Name', 'firstName');
                    const lastName = normalize(row, 'Surname', 'Uzvārds', 'Last Name', 'lastName');
                    const email = normalize(row, 'Email', 'E-pasts', 'email');

                    // Specific complex fields
                    const adminData = {
                        project: getCol('Project') || '',
                        nationality: getCol('Nationality') || '',
                        hourlyRate: getCol('Hourly Rate') || '',
                        personalId: getCol('Personal identity code') || '',
                        taxNumber: getCol('Tax Number') || '',
                        phone: getCol('Phone number') || getCol('Phone') || '',

                        hasGreenCard: (getCol('Green card') || '').toString().toLowerCase().includes('yes') ? 'yes' : 'no',
                        drivingLicence: getCol('Drivers licence') || '',

                        bankAccount: getCol('Bank account') || '',
                        bicCode: getCol('BIC Code') || '',
                        address: getCol('Adress') || getCol('Address') || '',

                        rentAddress: getCol('Rental Address') || '',
                        rentPrice: getCol('Rent') || '',

                        contractStart: getCol('Agreement START') || '',
                        contractEnd: getCol('Agreement END') || '',

                        bootSize: getCol('Size - Boots') || '',
                        jacketSize: getCol('Size - Jacket') || '',
                        trouserSize: getCol('Size - Trousers') || ''
                    };

                    const worker = {
                        firstName,
                        lastName,
                        email,
                        phone: adminData.phone, // Pass top level for fallback, but also in adminData
                        role: 'worker',
                        status: 'active',
                        adminData
                    };

                    if (!worker.email) {
                        worker.email = `missing.${Date.now()}.${Math.floor(Math.random() * 1000)}@placeholder.local`;
                    }

                    const result = await workerStore.add(worker);
                    if (result.success) {
                        importedCount++;
                        results.push({ email: worker.email, status: 'success' });
                    } else {
                        failedCount++;
                        results.push({ email: worker.email, status: 'error', message: result.error });
                    }
                }

                setImportResults({ imported: importedCount, failed: failedCount, details: results });
                setSuccess({ type: 'excel' });
                if (onWorkerAdded) onWorkerAdded();
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
            setTimeout(() => {
                setMode('manual');
                setSuccess(null);
                setError(null);
                setImportResults(null);
            }, 300);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Pievienot darbinieku"
            className="sm:max-w-[500px]"
        >
            <div className="space-y-6">
                {success ? (
                    <div className="text-center py-4 space-y-6">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>

                        {success.type === 'manual' ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-scafoteam-navy uppercase tracking-tight">Darbinieks pievienots!</h3>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Pagaidu parole</p>
                                    <p className="text-2xl font-black text-scafoteam-accent tracking-wider font-mono">
                                        {success.password}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 font-medium bg-blue-50/50 p-4 rounded-xl">
                                    Lūdzu, nododiet šo paroli darbiniekam. Viņš to varēs nomainīt pēc pirmās pieteikšanās.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-scafoteam-navy uppercase tracking-tight">Imports pabeigts!</h3>
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                        <p className="text-[10px] font-black uppercase text-green-600 mb-1 tracking-widest">Veiksmīgi</p>
                                        <p className="text-2xl font-black text-green-700">{importResults?.imported}</p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <p className="text-[10px] font-black uppercase text-red-600 mb-1 tracking-widest">Kļūdas</p>
                                        <p className="text-2xl font-black text-red-700">{importResults?.failed}</p>
                                    </div>
                                </div>
                                {importResults?.failed > 0 && (
                                    <div className="text-left text-[10px] max-h-32 overflow-y-auto p-4 bg-slate-50 rounded-xl space-y-1 custom-scrollbar">
                                        {importResults.details.filter(d => d.status === 'error').map((d, i) => (
                                            <p key={i} className="text-red-500 font-bold">• {d.email}: {d.message}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={() => setSuccess(null)}
                            className="w-full bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black h-12 rounded-xl"
                        >
                            Pievienot vēl vienu
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex p-1 bg-slate-100 rounded-2xl items-center">
                            <button
                                onClick={() => setMode('manual')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    mode === 'manual' ? 'bg-white shadow-sm text-scafoteam-navy' : 'text-slate-500'
                                )}
                            >
                                <UserPlus className="w-4 h-4" />
                                Manuāli
                            </button>
                            <button
                                onClick={() => setMode('excel')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    mode === 'excel' ? 'bg-white shadow-sm text-scafoteam-navy' : 'text-slate-500'
                                )}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel Imports
                            </button>
                        </div>

                        {mode === 'manual' ? (
                            <form onSubmit={handleManualSubmit} className="space-y-4 pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Vārds</label>
                                        <Input
                                            required
                                            className="h-11 border-slate-200 rounded-xl focus:ring-scafoteam-accent font-bold"
                                            value={formData.firstName}
                                            onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Uzvārds</label>
                                        <Input
                                            required
                                            className="h-11 border-slate-200 rounded-xl focus:ring-scafoteam-accent font-bold"
                                            value={formData.lastName}
                                            onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">E-pasts</label>
                                    <Input
                                        required
                                        type="email"
                                        className="h-11 border-slate-200 rounded-xl focus:ring-scafoteam-accent font-bold"
                                        value={formData.email}
                                        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Personas kods (Nav obligāts)</label>
                                        <div className="relative group/scan">
                                            <Input
                                                className="h-11 border-slate-200 rounded-xl pr-10 focus:ring-scafoteam-accent font-bold"
                                                value={formData.personalId || ''}
                                                onChange={e => setFormData(f => ({ ...f, personalId: e.target.value }))}
                                                placeholder="123456-12345"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <input type="file" id="add-id-scan" className="hidden" accept="image/*" onChange={handleScanID} />
                                                <label htmlFor="add-id-scan" className="p-2 text-slate-400 hover:text-scafoteam-accent cursor-pointer rounded-lg hover:bg-scafoteam-accent/5 transition-all block">
                                                    <Scan className="w-4 h-4" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Telefons</label>
                                    <Input
                                        className="h-11 border-slate-200 rounded-xl focus:ring-scafoteam-accent font-bold"
                                        value={formData.phone}
                                        onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black h-12 rounded-xl shadow-lg shadow-scafoteam-navy/20 mt-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Izveidot darbinieku'}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-[24px] p-8 text-center hover:border-scafoteam-accent hover:bg-scafoteam-accent/5 transition-all group cursor-pointer"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleExcelImport}
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                    />
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-scafoteam-accent/20 transition-colors">
                                        <FileUp className="w-8 h-8 text-slate-400 group-hover:text-scafoteam-accent transition-colors" />
                                    </div>
                                    <h4 className="text-base font-black text-scafoteam-navy mb-1 uppercase tracking-tight">Ievelciet Excel failu</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vai noklikšķiniet, lai izvēlētos</p>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-xl space-y-2 border border-blue-100/50">
                                    <h5 className="text-[10px] font-black uppercase text-scafoteam-navy tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        Svarīgi
                                    </h5>
                                    <p className="text-[10px] text-slate-600 leading-normal font-medium">
                                        Failā ir jābūt kolonnām <b>"First Name"</b> un <b>"Email"</b>. Atpazīsim arī "Vārds" un "E-pasts".
                                    </p>
                                </div>

                                {isLoading && (
                                    <div className="flex items-center justify-center gap-3 text-scafoteam-accent text-xs font-black animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Apstrādā darbinieku sarakstu...
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
