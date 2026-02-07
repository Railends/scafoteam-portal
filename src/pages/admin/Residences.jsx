import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Home, Plus, Users, MapPin, Euro, Filter, Trash2, Pencil, Search, Check, Car } from 'lucide-react';
import { residenceStore, projectStore, workerStore, vehicleStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { geocodeAddress, calculateDistance } from '@/lib/geo';
import { ProjectMap } from '@/components/maps/ProjectMap';
import { cn } from '@/lib/utils';

export default function Residences() {
    const { t } = useTranslation();
    const [residences, setResidences] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [allActiveOccupants, setAllActiveOccupants] = useState([]);

    const [newResidence, setNewResidence] = useState({
        address: '',
        apartment_number: '',
        city: '', // kept for compatibility in filtered
        landlord: '',
        capacity: '',
        cost: '',
        description: '',
        project_id: '',
        lat: '',
        lng: ''
    });

    // Debounced geocoding for new/edit residence
    useEffect(() => {
        if (newResidence.address.trim().length < 5) {
            setSearchError(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setGeoLoading(true);
                setSearchError(false);
                const coords = await geocodeAddress(newResidence.address);
                if (coords && coords.lat !== undefined && coords.lng !== undefined) {
                    const newLat = coords.lat.toString();
                    const newLng = coords.lng.toString();

                    setNewResidence(prev => {
                        if (!prev) return prev;
                        const updates = {
                            lat: newLat,
                            lng: newLng
                        };

                        // Intelligent snapping: 
                        // Only snap address if the result has a house number (digit)
                        // OR if current address is very short (user is just starting)
                        // This prevents losing "Häränajajanpolku 41" if Nominatim only returns "Häränajajanpolku"
                        const hasHouseNumber = /\d/.test(coords.address || '');
                        const prevHasHouseNumber = /\d/.test(prev.address || '');

                        if (coords.address && coords.address !== prev.address) {
                            if (hasHouseNumber || !prevHasHouseNumber || (prev.address || '').length < 5) {
                                updates.address = coords.address;
                            }
                        }
                        if (coords.city && coords.city !== prev.city) {
                            updates.city = coords.city;
                        }
                        return { ...prev, ...updates };
                    });
                } else {
                    setSearchError(true);
                }
            } catch (err) {
                console.error('Geocoding effect error:', err);
                setSearchError(true);
            } finally {
                setGeoLoading(false);
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [newResidence.address]);

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

    const loadData = async () => {
        const [resData, projData, workersData, vehicleData] = await Promise.all([
            residenceStore.getAll(),
            projectStore.getAll(),
            workerStore.getAll(),
            vehicleStore.getAll()
        ]);

        // Fetch all active occupants specifically to link vehicles to residences
        const { data: occData } = await supabase
            .from('residence_occupants')
            .select('residence_id, worker_id')
            .is('end_date', null);

        setResidences(resData || []);
        setProjects(projData || []);
        setWorkers((workersData || []).filter(w => w.status === 'active'));
        setVehicles(vehicleData || []);
        setAllActiveOccupants(occData || []);
    };

    const calculateProjectFinancials = async (projectId) => {
        if (projectId === 'all') {
            setProjectFinancials({ income: 0, cost: 0, balance: 0 });
            return;
        }

        const projectResidences = residences.filter(r => r.project_id === projectId);
        const totalCost = projectResidences.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

        const occupantsPromises = projectResidences.map(r => residenceStore.getOccupants(r.id));
        const allOccupantsArrays = await Promise.all(occupantsPromises);
        const allOccupants = allOccupantsArrays.flat();

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

    const handleSave = async () => {
        if (!newResidence.address || !newResidence.project_id) {
            alert('Lūdzu, norādiet adresi un projektu.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                address: newResidence.address,
                apartment_number: newResidence.apartment_number,
                city: newResidence.city,
                landlord: newResidence.landlord,
                capacity: newResidence.capacity === '' ? null : parseInt(newResidence.capacity),
                cost: newResidence.cost === '' ? null : parseFloat(newResidence.cost),
                description: newResidence.description,
                project_id: newResidence.project_id === '' ? null : newResidence.project_id,
                lat: newResidence.lat === '' ? null : parseFloat(newResidence.lat),
                lng: newResidence.lng === '' ? null : parseFloat(newResidence.lng)
            };

            if (isEditMode && editId) {
                await residenceStore.update(editId, payload);
            } else {
                await residenceStore.add(payload);
            }

            await loadData();
            handleCloseModal();
        } catch (e) {
            console.error(e);
            alert('Error saving residence: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (residence) => {
        setNewResidence({
            address: residence.address, // Already full address or will be merged by geocoder
            apartment_number: residence.apartment_number || '',
            city: residence.city || '',
            landlord: residence.landlord || '',
            capacity: residence.capacity || '',
            cost: residence.cost || '',
            description: residence.description || '',
            project_id: residence.project_id || '',
            lat: residence.lat || '',
            lng: residence.lng || ''
        });
        setEditId(residence.id);
        setIsEditMode(true);
        setIsAddOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddOpen(false);
        setIsEditMode(false);
        setEditId(null);
        setNewResidence({ address: '', apartment_number: '', city: '', landlord: '', capacity: '', cost: '', description: '', project_id: '', lat: '', lng: '' });
    };

    const handleDelete = async (residenceId) => {
        if (!confirm('Vai tiešām vēlaties dzēst šo dzīvesvietu? Visi saistītie iemītnieki arī tiks dzēsti.')) {
            return;
        }
        setLoading(true);
        try {
            await residenceStore.delete(residenceId);
            await loadData();
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

    const handleViewOccupants = async (residence) => {
        setSelectedResidence(residence);
        setOccupantsLoading(true);
        try {
            const data = await residenceStore.getOccupants(residence.id);
            setOccupants(data || []);
        } catch (error) {
            console.error(error);
            alert('Kļūda ielādējot iemītniekus');
        } finally {
            setOccupantsLoading(false);
        }
    };

    const handleAddOccupant = async () => {
        if (!newOccupant.worker_id || !newOccupant.start_date) {
            alert('Lūdzu, izvēlieties darbinieku un sākuma datumu.');
            return;
        }
        const workerAlreadyAssigned = occupants.some(occ => occ.worker_id === newOccupant.worker_id && !occ.end_date);
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
            const data = await residenceStore.getOccupants(selectedResidence.id);
            setOccupants(data || []);
            setIsAddingOccupant(false);
            setNewOccupant({
                worker_id: '',
                start_date: new Date().toISOString().split('T')[0],
                monthly_rent: ''
            });
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
            const data = await residenceStore.getOccupants(selectedResidence.id);
            setOccupants(data || []);
            await loadData();
        } catch (error) {
            console.error(error);
            alert('Kļūda dzēšot iemītnieku: ' + error.message);
        } finally {
            setOccupantsLoading(false);
        }
    };

    const handleHealLocations = async () => {
        const withoutGeo = residences.filter(r => !r.lat || !r.lng);
        if (withoutGeo.length === 0) {
            alert('Visām dzīvesvietām jau ir lokācija!');
            return;
        }

        if (!confirm(`Vai vēlaties automātiski atrast lokāciju ${withoutGeo.length} dzīvokļiem?`)) return;

        setLoading(true);
        let count = 0;
        try {
            for (const res of withoutGeo) {
                // Combine existing address and city (if any) for better search
                const searchString = res.address + (res.city ? ', ' + res.city : '');
                const coords = await geocodeAddress(searchString);

                if (coords) {
                    // CRITICAL: Only send valid database columns to update
                    const cleanedUpdate = {
                        address: coords.address || res.address,
                        lat: coords.lat,
                        lng: coords.lng
                    };
                    // Only send city if we specifically want to clear it (we do)
                    if (res.city) cleanedUpdate.city = null;

                    await residenceStore.update(res.id, cleanedUpdate);
                    count++;
                }
                // Sleep slightly to respect Nominatim rate limit
                await new Promise(r => setTimeout(r, 1000));
            }
            await loadData();
            alert(`Sistēma veiksmīgi atrada lokāciju ${count} no ${withoutGeo.length} dzīvokļiem.`);
        } catch (error) {
            console.error('Heal locations error:', error);
            alert('Kļūda masveida apstrādē: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = residences.filter(r => {
        const address = r.address || '';
        const city = r.city || '';
        const matchesSearch = address.toLowerCase().includes(search.toLowerCase()) ||
            city.toLowerCase().includes(search.toLowerCase());
        const matchesProject = selectedProject === 'all' || r.project_id === selectedProject;
        return matchesSearch && matchesProject;
    });

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
                        {residences.some(r => !r.lat || !r.lng) && (
                            <Button
                                onClick={handleHealLocations}
                                variant="outline"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                disabled={loading}
                            >
                                <MapPin className="w-4 h-4 mr-2" /> Labot lokācijas
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                handleCloseModal();
                                setIsAddOpen(true);
                            }}
                            className="bg-scafoteam-navy hover:bg-scafoteam-navy/90"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Pievienot
                        </Button>
                    </div>
                </div>

                {selectedProject !== 'all' && (() => {
                    const projectResidences = filtered;
                    const isProfit = projectFinancials.balance >= 0;

                    return (
                        <div className={`rounded-xl border-2 p-6 ${isProfit ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'}`}>
                            <h2 className="font-bold text-lg mb-4 text-scafoteam-navy">
                                Projekta finansiālais kopsavilkums - {projects.find(p => p.id === selectedProject)?.name}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <p className="text-sm text-gray-600 mb-1">Dzīvokļu skaits</p>
                                    <p className="text-2xl font-bold text-scafoteam-navy">{projectResidences.length}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <p className="text-sm text-gray-600 mb-1">Brīvās vietas</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {projectResidences.reduce((sum, r) => sum + (Math.max(0, (r.capacity || 0) - (r.occupants || 0))), 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Gultas vietas</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <p className="text-sm text-gray-600 mb-1">Ieņēmumi (mēnesī)</p>
                                    <p className="text-2xl font-bold text-green-700">€{projectFinancials.income.toFixed(2)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <p className="text-sm text-gray-600 mb-1">Izmaksas (mēnesī)</p>
                                    <p className="text-2xl font-bold text-red-700">€{projectFinancials.cost.toFixed(2)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <p className="text-sm text-gray-600 mb-1">Bilance</p>
                                    <p className={`text-2xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                        €{projectFinancials.balance.toFixed(2)}
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
                        filtered.map(residence => {
                            const project = projects.find(p => p.id === residence.project_id);
                            const distance = project && project.lat && project.lng && residence.lat && residence.lng
                                ? calculateDistance(project.lat, project.lng, residence.lat, residence.lng)
                                : null;

                            return (
                                <div key={residence.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <Home className="w-6 h-6 text-scafoteam-navy" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${residence.occupants >= residence.capacity && residence.capacity > 0
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {residence.occupants} / {residence.capacity || '-'} vietas
                                            </span>
                                            {(!residence.lat || !residence.lng) && (
                                                <span className="text-[9px] font-bold text-orange-500 uppercase flex items-center gap-0.5">
                                                    <MapPin className="w-2.5 h-2.5" /> Nav lokācijas
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 px-2 lg:px-0">
                                        <div className="flex items-center justify-between gap-2 overflow-hidden mb-1">
                                            <h3 className="font-bold text-scafoteam-navy text-lg leading-tight truncate flex-1"
                                                title={`${residence.address}${residence.apartment_number ? ` - Dz. ${residence.apartment_number}` : ''}${residence.city ? `, ${residence.city}` : ''}`}>
                                                {residence.address}
                                                {residence.apartment_number && (
                                                    <span className="text-scafoteam-accent mx-2">
                                                        - Dz. {residence.apartment_number}
                                                    </span>
                                                )}
                                            </h3>

                                            {(() => {
                                                const resOccupantIds = allActiveOccupants
                                                    .filter(occ => occ.residence_id === residence.id)
                                                    .map(occ => occ.worker_id);
                                                const resVehicles = vehicles.filter(v => v.holder_id && resOccupantIds.includes(v.holder_id));

                                                if (resVehicles.length === 0) return null;

                                                return (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {resVehicles.map(v => (
                                                            <div
                                                                key={v.id}
                                                                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-scafoteam-navy/20 bg-white text-scafoteam-navy shadow-sm"
                                                                title={`${v.make} ${v.model}`}
                                                            >
                                                                <Car className="w-3 h-3 opacity-70" />
                                                                <span className="text-[9px] font-bold tracking-tighter uppercase">{v.plate_number}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {project && (
                                        <div className="mb-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-widest">
                                                {project.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Users className="w-3.5 h-3.5 opacity-60" />
                                                <span className="truncate max-w-[120px]">{residence.landlord || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-scafoteam-navy">
                                                <Euro className="w-3.5 h-3.5 opacity-60" />
                                                <span>{residence.cost ? `${residence.cost} €` : '-'}</span>
                                            </div>
                                        </div>

                                        {selectedProject !== 'all' && (() => {
                                            const currentProject = projects.find(p => p.id === selectedProject);
                                            if (currentProject?.lat && currentProject?.lng && residence.lat && residence.lng) {
                                                const dist = calculateDistance(currentProject.lat, currentProject.lng, residence.lat, residence.lng);
                                                return (
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50/50 rounded-full border border-blue-100/50 text-[10px] font-bold text-blue-600/80 uppercase tracking-tight">
                                                            <MapPin className="w-2.5 h-2.5" />
                                                            {dist.toFixed(1)} km
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleViewOccupants(residence)}>Iemītnieki</Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(residence)}><Pencil className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(residence.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {selectedProject !== 'all' && (() => {
                    const currentProject = projects.find(p => p.id === selectedProject);
                    if (!currentProject?.lat || !currentProject?.lng) return null;

                    const residencesWithDistance = filtered.map(r => ({
                        ...r,
                        distance: calculateDistance(currentProject.lat, currentProject.lng, r.lat, r.lng)
                    }));

                    // Only show map if there are some residences to display or at least the site
                    return (
                        <div className="mt-8 space-y-4 pt-8 border-t">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Objekta un dzīvokļu izvietojums</h3>
                                <div className="flex gap-4 text-[10px] font-bold">
                                    <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-600"></span> OBJEKTS</span>
                                    <span className="flex items-center gap-1.5 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span> DZĪVESVIETAS</span>
                                </div>
                            </div>
                            <ProjectMap
                                site={{
                                    lat: currentProject.lat,
                                    lng: currentProject.lng,
                                    name: currentProject.name,
                                    address: currentProject.site_address
                                }}
                                residences={residencesWithDistance}
                            />
                        </div>
                    );
                })()}
            </div>

            <Modal
                isOpen={isAddOpen}
                onClose={handleCloseModal}
                title={isEditMode ? "Rediģēt Dzīvesvietu" : "Pievienot Dzīvesvietu"}
                className="max-w-md"
            >
                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adrese (Iela, Pilsēta)</label>
                                {geoLoading && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Meklē...</span>}
                            </div>
                            <Input
                                value={newResidence.address}
                                onChange={e => setNewResidence({ ...newResidence, address: e.target.value })}
                                placeholder="piem. Brīvības iela 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dzīvokļa Nr.</label>
                            <Input
                                value={newResidence.apartment_number}
                                onChange={e => setNewResidence({ ...newResidence, apartment_number: e.target.value })}
                                placeholder="piem. 5"
                            />
                        </div>
                    </div>
                    {searchError && !geoLoading && <p className="text-[10px] text-red-500 font-bold">Adrese nav atrasta! Lūdzu precizējiet.</p>}
                    {newResidence.lat && !geoLoading && <p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Lokācija fiksēta kartē</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vietas (Gultas)</label>
                            <Input type="number" value={newResidence.capacity} onChange={e => setNewResidence({ ...newResidence, capacity: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Īre (€/mēn)</label>
                            <Input type="number" value={newResidence.cost} onChange={e => setNewResidence({ ...newResidence, cost: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Izīrētājs</label>
                            <Input value={newResidence.landlord} onChange={e => setNewResidence({ ...newResidence, landlord: e.target.value })} placeholder="vārds vai uzņēmums" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Projekts</label>
                            <Select
                                value={newResidence.project_id}
                                onChange={e => setNewResidence({ ...newResidence, project_id: e.target.value })}
                                options={projects.map(p => ({ value: p.id, label: p.name }))}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleCloseModal}>Atcelt</Button>
                        <Button className="bg-scafoteam-navy text-white" onClick={handleSave} disabled={loading}>{loading ? 'Saglabā...' : 'Saglabāt'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!selectedResidence}
                onClose={() => setSelectedResidence(null)}
                title={`Iemītnieki - ${selectedResidence?.address}`}
                className="max-w-2xl"
            >
                <div className="space-y-4 pt-4">
                    {occupantsLoading ? (
                        <div className="text-center py-8">Ielādē...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-scafoteam-navy uppercase tracking-widest text-[10px]">Saraksts</h3>
                                <Button size="sm" onClick={() => setIsAddingOccupant(!isAddingOccupant)}>
                                    {isAddingOccupant ? 'Atcelt' : 'Pievienot'}
                                </Button>
                            </div>
                            {isAddingOccupant && (
                                <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select
                                            value={newOccupant.worker_id}
                                            onChange={e => setNewOccupant({ ...newOccupant, worker_id: e.target.value, monthly_rent: workers.find(w => w.id === e.target.value)?.accommodation_cost || '360' })}
                                            options={[{ value: '', label: 'Izvēlies darbinieku' }, ...workers.map(w => ({ value: w.id, label: `${w.name} ${w.surname}` }))]}
                                        />
                                        <Input type="date" value={newOccupant.start_date} onChange={e => setNewOccupant({ ...newOccupant, start_date: e.target.value })} />
                                        <Input type="number" placeholder="Īre" value={newOccupant.monthly_rent} onChange={e => setNewOccupant({ ...newOccupant, monthly_rent: e.target.value })} />
                                        <Button onClick={handleAddOccupant} className="w-full">Pievienot</Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                {occupants.map(occ => (
                                    <div key={occ.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                        <div>
                                            <p className="font-bold text-scafoteam-navy">{occ.workers?.name} {occ.workers?.surname}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(occ.start_date).toLocaleDateString()} - {occ.end_date ? new Date(occ.end_date).toLocaleDateString() : 'Tagad'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-green-700">€{parseFloat(occ.monthly_rent || 0).toFixed(2)}</span>
                                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRemoveOccupant(occ.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
