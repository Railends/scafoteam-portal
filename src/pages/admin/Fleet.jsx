import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Car, FileText, Plus, Search, Trash2, Pencil, Calendar, User, Home, Shield, AlertCircle } from 'lucide-react';
import { vehicleStore, workerStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Fleet() {
    const [vehicles, setVehicles] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const [newVehicle, setNewVehicle] = useState({
        make: '',
        model: '',
        plate_number: '',
        inspection_expiry: '',
        owner: '',
        holder_id: ''
    });

    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [residences, setResidences] = useState({}); // holderId -> residenceInfo

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [vData, wData] = await Promise.all([
                vehicleStore.getAll(),
                workerStore.getAll()
            ]);
            setVehicles(vData);
            setWorkers(wData);

            // Fetch residences for holders
            const resData = {};
            const holderIds = [...new Set(vData.map(v => v.holder_id).filter(Boolean))];
            await Promise.all(holderIds.map(async id => {
                const res = await vehicleStore.getHolderResidence(id);
                if (res) resData[id] = res;
            }));
            setResidences(resData);
        } catch (error) {
            console.error('Error loading fleet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newVehicle.make || !newVehicle.model || !newVehicle.plate_number) {
            alert('Lūdzu, aizpildiet obligātos laukus (Marka, Modelis, Numurs).');
            return;
        }

        try {
            if (isEditMode && editId) {
                await vehicleStore.update(editId, newVehicle);
            } else {
                await vehicleStore.add(newVehicle);
            }
            setIsAddOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            alert('Kļūda saglabājot: ' + error.message);
        }
    };

    const handleEdit = (vehicle) => {
        setNewVehicle({
            make: vehicle.make,
            model: vehicle.model,
            plate_number: vehicle.plate_number,
            inspection_expiry: vehicle.inspection_expiry || '',
            owner: vehicle.owner || '',
            holder_id: vehicle.holder_id || ''
        });
        setEditId(vehicle.id);
        setIsEditMode(true);
        setIsAddOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Vai tiešām vēlaties dzēst šo transportlīdzekli?')) return;
        try {
            await vehicleStore.delete(id);
            loadData();
        } catch (error) {
            alert('Kļūda dzēšot: ' + error.message);
        }
    };

    const resetForm = () => {
        setNewVehicle({
            make: '',
            model: '',
            plate_number: '',
            inspection_expiry: '',
            owner: '',
            holder_id: ''
        });
        setIsEditMode(false);
        setEditId(null);
    };

    const filtered = vehicles.filter(v =>
        v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
        v.make.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase())
    );

    const getInspectionDays = (expiry) => {
        if (!expiry) return null;
        const diff = new Date(expiry) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-scafoteam-navy flex items-center gap-2">
                            <Car className="w-8 h-8 text-scafoteam-accent" />
                            Autoparks
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Uzņēmuma transportlīdzekļu un to turētāju pārvaldība</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-scafoteam-navy hover:bg-scafoteam-navy-light shadow-lg shadow-scafoteam-navy/20">
                        <Plus className="w-4 h-4 mr-2" /> Pievienot auto
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Meklēt pēc numura, markas vai modeļa..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-12 bg-white border-gray-100 shadow-sm rounded-xl focus:ring-scafoteam-accent/20"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />)
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">Transportlīdzekļi nav atrasti</p>
                        </div>
                    ) : (
                        filtered.map(vehicle => {
                            const daysLeft = getInspectionDays(vehicle.inspection_expiry);
                            const holderRes = residences[vehicle.holder_id];

                            return (
                                <Card key={vehicle.id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-scafoteam-accent group-hover:w-2 transition-all" />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Numura zīme</span>
                                                <div className="inline-block bg-white border-2 border-scafoteam-navy px-3 py-1 rounded font-black text-lg tracking-wider shadow-sm group-hover:border-scafoteam-accent transition-colors">
                                                    {vehicle.plate_number}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedVehicle(vehicle)} className="p-2 hover:bg-scafoteam-accent/10 text-gray-400 hover:text-scafoteam-accent transition-colors rounded-lg" title="Dokumenti">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEdit(vehicle)} className="p-2 hover:bg-gray-50 text-gray-400 hover:text-scafoteam-navy transition-colors rounded-lg">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(vehicle.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-bold text-scafoteam-navy">{vehicle.make} {vehicle.model}</h3>
                                                <p className="text-xs text-gray-400 font-medium">Īpašnieks: {vehicle.owner || 'Nav norādīts'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Tehniskā apskate</span>
                                                    <div className={cn(
                                                        "text-[11px] font-bold flex items-center gap-1.5",
                                                        daysLeft !== null && daysLeft < 30 ? "text-red-600" : "text-gray-700"
                                                    )}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {vehicle.inspection_expiry || 'Nav norādīts'}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Turētājs</span>
                                                    <div className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        {vehicle.workers ? `${vehicle.workers.name} ${vehicle.workers.surname}` : 'Nav piesaistīts'}
                                                    </div>
                                                </div>
                                            </div>

                                            {holderRes && (
                                                <div className="flex items-start gap-2 p-3 bg-scafoteam-navy/5 rounded-xl border border-scafoteam-navy/5">
                                                    <Home className="w-4 h-4 text-scafoteam-navy mt-0.5" />
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-scafoteam-navy/50 block mb-0.5">Atrodas pie dzīvesvietas</span>
                                                        <span className="text-[11px] font-bold text-scafoteam-navy">{holderRes.address}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                <Modal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    title={isEditMode ? 'Rediģēt transportlīdzekli' : 'Jauns transportlīdzeklis'}
                    className="max-w-sm"
                >
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-2 mb-4 bg-scafoteam-navy/5 p-4 rounded-2xl border border-scafoteam-navy/5">
                            <Car className="w-10 h-10 text-scafoteam-accent" />
                            <div className="text-center">
                                <h4 className="text-xs font-black text-scafoteam-navy uppercase tracking-widest">Informācija par auto</h4>
                                <p className="text-[10px] text-gray-500 font-medium">Ievadiet pamatdatus</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Marka</label>
                                <Input value={newVehicle.make} onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })} placeholder="Volkswagen" className="h-10 bg-gray-50/50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Modelis</label>
                                <Input value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Golf" className="h-10 bg-gray-50/50" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valsts numurs</label>
                            <Input value={newVehicle.plate_number} onChange={e => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} placeholder="AA-1234" className="h-11 text-center font-black text-lg tracking-widest border-2 focus:border-scafoteam-accent transition-all rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">TA termiņš</label>
                                <Input type="date" value={newVehicle.inspection_expiry} onChange={e => setNewVehicle({ ...newVehicle, inspection_expiry: e.target.value })} className="h-10 bg-gray-50/50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Īpašnieks</label>
                                <Input value={newVehicle.owner} onChange={e => setNewVehicle({ ...newVehicle, owner: e.target.value })} placeholder="Uzņēmums" className="h-10 bg-gray-50/50" />
                            </div>
                        </div>

                        <div className="space-y-1.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="text-[10px] font-black text-gray-400 border-b border-gray-100 pb-1 mb-2 uppercase tracking-widest flex items-center gap-1.5 w-full">
                                <User className="w-3 h-3 text-scafoteam-accent" /> Turētājs (Darbinieks)
                            </label>
                            <Select
                                value={newVehicle.holder_id}
                                onChange={e => setNewVehicle({ ...newVehicle, holder_id: e.target.value })}
                                className="bg-white border-gray-100 font-bold text-scafoteam-navy h-10 shadow-sm"
                                options={[
                                    { value: '', label: 'Nav piesaistīts' },
                                    ...workers.map(w => ({ value: w.id, label: `${w.name} ${w.surname}` }))
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-4">
                            <Button onClick={handleSave} className="bg-scafoteam-navy hover:bg-scafoteam-navy-light text-white font-black h-12 rounded-xl shadow-lg shadow-scafoteam-navy/20">
                                SAGLABĀT
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-gray-400 font-bold hover:text-gray-600">
                                Atcelt
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={!!selectedVehicle}
                    onClose={() => setSelectedVehicle(null)}
                    title={`Auto Dokumenti: ${selectedVehicle?.plate_number}`}
                    className="max-w-2xl"
                >
                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-scafoteam-navy/5 rounded-2xl border border-scafoteam-navy/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black text-scafoteam-navy uppercase tracking-wider">{selectedVehicle?.make} {selectedVehicle?.model}</h4>
                                <p className="text-[10px] text-gray-500 font-medium">Īpašnieks: {selectedVehicle?.owner || 'Nav norādīts'}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Turētājs</span>
                                <Select
                                    value={selectedVehicle?.holder_id || ''}
                                    onChange={async (e) => {
                                        const newHolderId = e.target.value;
                                        await vehicleStore.update(selectedVehicle.id, { holder_id: newHolderId || null });
                                        loadData();
                                        setSelectedVehicle(prev => ({ ...prev, holder_id: newHolderId }));
                                    }}
                                    className="bg-white border-gray-200 font-bold text-scafoteam-navy text-[11px] h-8 min-w-[140px]"
                                    options={[
                                        { value: '', label: 'Nav piesaistīts' },
                                        ...workers.map(w => ({ value: w.id, label: `${w.name} ${w.surname}` }))
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pievienotie dokumenti</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {(!selectedVehicle?.documents || selectedVehicle.documents.length === 0) ? (
                                    <p className="text-xs text-gray-400 font-medium italic p-4 text-center">Nav pievienotu dokumentu</p>
                                ) : (
                                    selectedVehicle.documents.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-scafoteam-accent/10 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-scafoteam-accent" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">{doc.name}</p>
                                                    <p className="text-[10px] text-gray-400">{new Date(doc.date).toLocaleDateString('lv-LV')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Dzēst dokumentu?')) {
                                                        await vehicleStore.deleteDocument(selectedVehicle.id, doc.id);
                                                        loadData();
                                                        // Update local selectedVehicle 
                                                        setSelectedVehicle(prev => ({
                                                            ...prev,
                                                            documents: prev.documents.filter(d => d.id !== doc.id)
                                                        }));
                                                    }
                                                }}
                                                className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-3">Pievienot jaunu dokumentu</h4>
                            <form
                                className="flex gap-2"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const name = e.target.docName.value;
                                    if (!name) return;
                                    const newDoc = await vehicleStore.addDocument(selectedVehicle.id, { name });
                                    loadData();
                                    setSelectedVehicle(newDoc); // Error here: store returns full vehicle or doc? 
                                    // store.addDocument returns full vehicle normally
                                    e.target.reset();
                                }}
                            >
                                <Input name="docName" placeholder="Dokumenta nosaukums (piem. Apdrošināšana)" className="flex-1 h-10 text-xs" />
                                <Button type="submit" size="sm" className="bg-scafoteam-accent text-scafoteam-navy font-black text-[10px]">PIEVIENOT</Button>
                            </form>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="ghost" onClick={() => setSelectedVehicle(null)}>Aizvērt</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}
