import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

import { Select } from '@/components/ui/Select';
import { Home, Plus, Users, MapPin, Euro, Filter, Trash2 } from 'lucide-react';
import { residenceStore, projectStore, workerStore } from '@/lib/store';

export default function Residences() {
    const { t } = useTranslation();
    const [residences, setResidences] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newResidence, setNewResidence] = useState({
        address: '',
        city: '',
        landlord: '',
        capacity: '',
        cost: '',
        description: '',
        project_id: ''
    });

    const [selectedResidence, setSelectedResidence] = useState(null);
    const [occupants, setOccupants] = useState([]);
    const [occupantsLoading, setOccupantsLoading] = useState(false);

    // Occupant adding state
    const [workers, setWorkers] = useState([]);
    const [isAddingOccupant, setIsAddingOccupant] = useState(false);
    const [newOccupant, setNewOccupant] = useState({
        worker_id: '',
        start_date: new Date().toISOString().split('T')[0],
        monthly_rent: ''
    });

    // Project financial summary
    const [projectFinancials, setProjectFinancials] = useState({ income: 0, cost: 0, balance: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const handleViewOccupants = async (residence) => {
        setSelectedResidence(residence);
        setOccupantsLoading(true);
        try {
            const data = await residenceStore.getOccupants(residence.id);
            setOccupants(data);
        } catch (error) {
            console.error(error);
            alert('Kļūda ielādējot iemītniekus');
        } finally {
            setOccupantsLoading(false);
        }
    };

    const loadData = async () => {
        const [resData, projData, workersData] = await Promise.all([
            residenceStore.getAll(),
            projectStore.getAll(),
            workerStore.getAll()
        ]);
        setResidences(resData);
        setProjects(projData || []);
        // Filter to show only active workers
        setWorkers((workersData || []).filter(w => w.status === 'active'));
    };

    const calculateProjectFinancials = async (projectId) => {
        if (projectId === 'all') {
            setProjectFinancials({ income: 0, cost: 0, balance: 0 });
            return;
        }

        const projectResidences = residences.filter(r => r.project_id === projectId);
        const totalCost = projectResidences.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

        // Fetch occupants for all residences in this project
        const occupantsPromises = projectResidences.map(r => residenceStore.getOccupants(r.id));
        const allOccupantsArrays = await Promise.all(occupantsPromises);
        const allOccupants = allOccupantsArrays.flat();

        // Calculate total income from active occupants
        const activeOccupants = allOccupants.filter(occ => !occ.end_date);
        const totalIncome = activeOccupants.reduce((sum, occ) => sum + (parseFloat(occ.monthly_rent) || 0), 0);

        setProjectFinancials({
            income: totalIncome,
            cost: totalCost,
            balance: totalIncome - totalCost
        });
    };

    useEffect(() => {
        if (selectedProject && residences.length > 0) {
            calculateProjectFinancials(selectedProject);
        }
    }, [selectedProject, residences]);

    const handleCreate = async () => {
        if (!newResidence.address || !newResidence.project_id) {
            alert('Lūdzu, norādiet adresi un projektu.');
            return;
        }
        setLoading(true);
        try {
            // Sanitize payload: convert empty strings to null
            const payload = {
                ...newResidence,
                capacity: newResidence.capacity === '' ? null : newResidence.capacity,
                cost: newResidence.cost === '' ? null : newResidence.cost,
                project_id: newResidence.project_id === '' ? null : newResidence.project_id // Should be caught by validation above but safe to keep
            };

            await residenceStore.add(payload);
            await loadData();
            setIsAddOpen(false);
            setNewResidence({ address: '', city: '', landlord: '', capacity: '', cost: '', description: '', project_id: '' });
        } catch (e) {
            console.error(e);
            alert('Error creating residence: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (residenceId) => {
        if (!confirm('Vai tiešām vēlaties dzēst šo dzīvesvietu? Visi saistītie iemītnieki arī tiks dzēsti.')) {
            return;
        }
        setLoading(true);
        try {
            await residenceStore.delete(residenceId);
            await loadData();
            // Recalculate project financials after deletion
            if (selectedProject !== 'all') {
                await calculateProjectFinancials(selectedProject);
            }
        } catch (error) {
            console.error(error);
            alert('Kļūda dzēšot dzīvesvietu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = residences.filter(r => {
        const matchesSearch = r.address.toLowerCase().includes(search.toLowerCase()) ||
            (r.city || '').toLowerCase().includes(search.toLowerCase());
        const matchesProject = selectedProject === 'all' || r.project_id === selectedProject;
        return matchesSearch && matchesProject;
    });

    const handleAddOccupant = async () => {
        if (!newOccupant.worker_id || !newOccupant.start_date) {
            alert('Lūdzu, izvēlieties darbinieku un sākuma datumu.');
            return;
        }

        // Check if worker is already assigned to an active residence
        const workerAlreadyAssigned = occupants.some(
            occ => occ.worker_id === newOccupant.worker_id && !occ.end_date
        );

        if (workerAlreadyAssigned) {
            alert('Šis darbinieks jau ir piesaistīts šim dzīvoklim!');
            return;
        }

        setOccupantsLoading(true);
        try {
            await residenceStore.addOccupant({
                residence_id: selectedResidence.id,
                worker_id: newOccupant.worker_id,
                start_date: newOccupant.start_date,
                monthly_rent: newOccupant.monthly_rent === '' ? null : parseFloat(newOccupant.monthly_rent)
            });
            // Reload occupants
            const data = await residenceStore.getOccupants(selectedResidence.id);
            setOccupants(data);
            setIsAddingOccupant(false);
            setNewOccupant({
                worker_id: '',
                start_date: new Date().toISOString().split('T')[0],
                monthly_rent: ''
            });
            // Also reload residences to update the count on the card
            await loadData();
        } catch (error) {
            console.error(error);
            alert('Kļūda pievienojot iemītnieku: ' + error.message);
        } finally {
            setOccupantsLoading(false);
        }
    };

    const handleRemoveOccupant = async (occupantId) => {
        if (!confirm('Vai tiešām vēlaties noņemt šo iemītnieku?')) {
            return;
        }
        setOccupantsLoading(true);
        try {
            await residenceStore.deleteOccupant(occupantId);
            // Reload occupants
            const data = await residenceStore.getOccupants(selectedResidence.id);
            setOccupants(data);
            // Reload residences to update the count
            await loadData();
        } catch (error) {
            console.error(error);
            alert('Kļūda dzēšot iemītnieku: ' + error.message);
        } finally {
            setOccupantsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-scafoteam-navy">Dzīvesvietas</h1>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Meklēt..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-72 bg-white"
                        />
                        <Select
                            className="w-48 bg-white"
                            value={selectedProject}
                            onChange={e => setSelectedProject(e.target.value)}
                            options={[
                                { value: 'all', label: 'Visi projekti' },
                                ...projects.map(p => ({ value: p.id, label: p.name }))
                            ]}
                            placeholder="Filtrēt pēc projekta"
                        />
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-scafoteam-navy hover:bg-scafoteam-navy/90"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Pievienot
                        </Button>
                    </div>
                </div>

                {/* Project Financial Summary */}
                {selectedProject !== 'all' && (() => {
                    const projectResidences = filtered;
                    const isProfit = projectFinancials.balance >= 0;

                    return (
                        <div className={`rounded-xl border-2 p-6 ${isProfit ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'}`}>
                            <h2 className="font-bold text-lg mb-4 text-scafoteam-navy">
                                Projekta finansiālais kopsavilkums - {projects.find(p => p.id === selectedProject)?.name}
                            </h2>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Dzīvokļu skaits</p>
                                    <p className="text-2xl font-bold text-scafoteam-navy">{projectResidences.length}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Ieņēmumi (mēnesī)</p>
                                    <p className="text-2xl font-bold text-green-700">€{projectFinancials.income.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500 mt-1">No aktīvajiem iemītniekiem</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Izmaksas (mēnesī)</p>
                                    <p className="text-2xl font-bold text-red-700">€{projectFinancials.cost.toFixed(2)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Bilance</p>
                                    <p className={`text-3xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                        {isProfit ? '+' : ''}€{projectFinancials.balance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-xl border">
                            Nav atrasti ieraksti.
                        </div>
                    ) : (
                        filtered.map(residence => (
                            <div key={residence.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <Home className="w-6 h-6 text-scafoteam-navy" />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${residence.occupants >= residence.capacity && residence.capacity > 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {residence.occupants} / {residence.capacity || '-'} vietas
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-scafoteam-navy mb-1">{residence.address}</h3>
                                <p className="text-gray-500 text-sm mb-4">{residence.city}</p>

                                {residence.projectName && (
                                    <div className="mb-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-widest">
                                            {residence.projectName}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{residence.landlord || 'Nav norādīts izīrētājs'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Euro className="w-4 h-4" />
                                        <span>{residence.cost ? `${residence.cost} €/mēn` : '-'}</span>
                                    </div>
                                    <div className="text-xs italic text-gray-400">
                                        💡 Skatīt detalizētu bilanci: "Skatīt iemītniekus"
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewOccupants(residence)}
                                    >
                                        Skatīt iemītniekus
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(residence.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Pievienot Dzīvesvietu"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adrese</label>
                        <Input
                            value={newResidence.address}
                            onChange={e => setNewResidence({ ...newResidence, address: e.target.value })}
                            placeholder="Ielas nosaukums, mājas nr."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilsēta</label>
                            <Input
                                value={newResidence.city}
                                onChange={e => setNewResidence({ ...newResidence, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ietilpība (vietas)</label>
                            <Input
                                type="number"
                                value={newResidence.capacity}
                                onChange={e => setNewResidence({ ...newResidence, capacity: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Izīrētājs</label>
                        <Input
                            value={newResidence.landlord}
                            onChange={e => setNewResidence({ ...newResidence, landlord: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Izmaksas (EUR/mēn)</label>
                        <Input
                            type="number"
                            value={newResidence.cost}
                            onChange={e => setNewResidence({ ...newResidence, cost: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Projekts *</label>
                        <Select
                            value={newResidence.project_id}
                            onChange={e => setNewResidence({ ...newResidence, project_id: e.target.value })}
                            options={[
                                { value: '', label: 'Izvēlies projektu' },
                                ...projects.map(p => ({ value: p.id, label: p.name }))
                            ]}
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

            {/* Occupants Modal */}
            <Modal
                isOpen={!!selectedResidence}
                onClose={() => {
                    setSelectedResidence(null);
                    setIsAddingOccupant(false);
                }}
                title={`Iemītnieki - ${selectedResidence?.address || ''}`}
                className="max-w-2xl"
            >
                <div className="space-y-4">
                    {/* Financial Balance */}
                    {selectedResidence && (() => {
                        const activeOccupants = occupants.filter(occ => !occ.end_date);
                        const totalIncome = activeOccupants.reduce((sum, occ) => sum + (parseFloat(occ.monthly_rent) || 0), 0);
                        const residenceCost = parseFloat(selectedResidence.cost) || 0;
                        const balance = totalIncome - residenceCost;
                        const isProfit = balance >= 0;

                        return (
                            <div className={`p-4 rounded-lg border-2 ${isProfit ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                <h3 className="font-bold text-sm mb-2">Finansiālais aprēķins (mēnesī)</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Ieņēmumi (īre)</p>
                                        <p className="font-bold text-green-700">€{totalIncome.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">{activeOccupants.length} aktīvi iemītnieki</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Izmaksas (īre)</p>
                                        <p className="font-bold text-red-700">€{residenceCost.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Bilance</p>
                                        <p className={`font-bold text-lg ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                            {isProfit ? '+' : ''}€{balance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-500">Saraksts</h3>
                        {!isAddingOccupant && (
                            <Button size="sm" onClick={() => setIsAddingOccupant(true)} className="flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Pievienot
                            </Button>
                        )}
                    </div>

                    {isAddingOccupant && (
                        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                            <h4 className="font-semibold text-sm">Jauns iemītnieks</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Darbinieks</label>
                                    <Select
                                        value={newOccupant.worker_id}
                                        onChange={e => {
                                            const workerId = e.target.value;
                                            const selectedWorker = workers.find(w => w.id === workerId);
                                            setNewOccupant({
                                                ...newOccupant,
                                                worker_id: workerId,
                                                // Auto-fill with default 360 EUR or worker's accommodation cost if available
                                                monthly_rent: workerId ? (selectedWorker?.accommodation_cost || '360') : ''
                                            });
                                        }}
                                        options={[
                                            { value: '', label: 'Izvēlies darbinieku' },
                                            ...workers.map(w => ({ value: w.id, label: `${w.name} ${w.surname}` }))
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Sākuma datums</label>
                                    <Input
                                        type="date"
                                        value={newOccupant.start_date}
                                        onChange={e => setNewOccupant({ ...newOccupant, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Mēneša īre (EUR)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newOccupant.monthly_rent}
                                        onChange={e => setNewOccupant({ ...newOccupant, monthly_rent: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 text-sm">
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingOccupant(false)}>Atcelt</Button>
                                <Button size="sm" onClick={handleAddOccupant}>Saglabāt</Button>
                            </div>
                        </div>
                    )}

                    {occupantsLoading ? (
                        <div className="text-center py-8">Ielādē...</div>
                    ) : occupants.length === 0 && !isAddingOccupant ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            Šajā dzīvesvietā nav reģistrētu iemītnieku.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {occupants.map((occ) => (
                                <div key={occ.id} className="p-3 bg-white border rounded-lg flex justify-between items-center shadow-sm">
                                    <div className="flex-1">
                                        <p className="font-bold text-scafoteam-navy">
                                            {occ.workers?.name} {occ.workers?.surname}
                                        </p>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>No: {new Date(occ.start_date).toLocaleDateString()}</span>
                                            {occ.end_date && <span>Līdz: {new Date(occ.end_date).toLocaleDateString()}</span>}
                                            {occ.monthly_rent && (
                                                <span className="font-semibold text-green-700">
                                                    Īre: €{parseFloat(occ.monthly_rent).toFixed(2)}/mēn
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!occ.end_date ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Aktīvs</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase">Vēsture</span>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveOccupant(occ.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="ghost" onClick={() => setSelectedResidence(null)}>Aizvērt</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout >
    );
}
