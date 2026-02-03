import { create } from 'zustand';
import { supabase, supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const handleSupabaseError = (error, context) => {
    if (error) {
        console.error(`Supabase Error [${context}]:`, error);
        throw error;
    }
};

export const useSettingsStore = create((set, get) => ({
    announcement: '',
    loading: false,

    fetchSettings: async () => {
        set({ loading: true });
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'announcement')
            .single();

        if (data) {
            set({ announcement: data.value.text });
        }
        set({ loading: false });
    },

    updateAnnouncement: async (text) => {
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 'announcement',
                value: { text },
                updated_at: new Date().toISOString(),
                updated_by: (await supabase.auth.getUser()).data.user?.id
            });

        if (!error) {
            set({ announcement: text });
            return { success: true };
        }
        return { success: false, error };
    }
}));


const mapWorkerFromDB = (w) => {
    if (!w) return null;
    const adminData = w.admin_data || {};
    return {
        ...w,
        // Fallback to adminData for potentially missing columns
        role: w.role || adminData.role || 'worker',
        status: w.status || adminData.status || 'pending',
        phone: w.phone || adminData.phone || '',
        email: w.email || adminData.email || '',
        nationality: w.nationality || adminData.nationality || '',
        adminData: adminData,
    };
};

export const workerStore = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('created_at', { ascending: false });
        handleSupabaseError(error, 'getAllWorkers');
        return (data || []).map(mapWorkerFromDB);
    },



    getById: async (id) => {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') handleSupabaseError(error, 'getWorkerById');
        return mapWorkerFromDB(data);
    },


    add: async (workerData) => {
        try {
            // 1. Create Supabase Auth user
            const tempPassword = Math.random().toString(36).slice(-10) + '123!';
            let authData, authError;

            if (supabaseAdmin) {
                // Use Admin API to bypass rate limits and auto-confirm email
                console.log('Using Admin API for worker creation');
                const result = await supabaseAdmin.auth.admin.createUser({
                    email: workerData.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        name: workerData.firstName,
                        surname: workerData.lastName,
                        role: workerData.role || 'worker'
                    }
                });
                authData = result.data;
                authError = result.error;
            } else {
                // Fallback to client-side sign up (subject to rate limits)
                console.log('Using Standard API for worker creation (subject to rate limits)');
                const result = await supabase.auth.signUp({
                    email: workerData.email,
                    password: tempPassword,
                    options: {
                        data: {
                            name: workerData.firstName,
                            surname: workerData.lastName,
                            role: workerData.role || 'worker'
                        }
                    }
                });
                authData = result.data;
                authError = result.error;
            }

            if (authError) throw authError;

            // 2. Insert into workers table
            // Only use columns we know exist: id, name, surname, created_at, user_id (added via trigger/sql)
            // Store everything else in admin_data
            const adminData = {
                role: workerData.role || 'worker',
                status: workerData.status || 'pending',
                phone: workerData.phone,
                email: workerData.email, // Store email in admin_data too just in case
                ...workerData.adminData
            };

            console.log('Attempting to insert worker into DB:', {
                id: authData.user.id,
                email: workerData.email,
                status: adminData.status
            });

            const { data: dbData, error: dbError } = await supabase
                .from('workers')
                .insert([{
                    id: authData.user.id,
                    name: workerData.firstName,
                    surname: workerData.lastName,
                    // email: workerData.email, // Potentially missing column?
                    // phone: workerData.phone, // Missing column
                    // role: workerData.role,   // Missing column
                    // status: workerData.status, // Missing column
                    admin_data: adminData,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            return { success: true, tempPassword };
        } catch (error) {
            console.error('Error adding worker:', error);
            let errorMessage = error.message;
            if (errorMessage.includes('email rate limit exceeded')) {
                errorMessage = 'Pārsniegts e-pasta sūtīšanas limits. Lūdzu, uzgaidiet dažas minūtes vai izmantojiet citu e-pastu.';
            }
            return { success: false, error: errorMessage };
        }
    },




    update: async (id, updates) => {
        const payload = { ...updates };

        // Define fields that might be missing from schema and should go to admin_data
        const schemaFallbackFields = ['role', 'status', 'phone', 'email', 'nationality'];
        let fallbackUpdates = {};

        // Check if any payload keys are in our fallback list
        schemaFallbackFields.forEach(field => {
            if (payload[field] !== undefined) {
                fallbackUpdates[field] = payload[field];
                // We don't delete from payload yet, we'll try to update both or handle it smartly?
                // Actually, if we try to update a non-existent column, it throws.
                // So we MUST remove it from payload if we suspect it's missing.
                // To be safe given the errors, let's remove them from top-level payload.
                delete payload[field];
            }
        });

        // Handle adminData mapping and password obfuscation
        let incomingAdminData = payload.adminData || payload.admin_data || {};

        // Merge fallback updates into incomingAdminData
        incomingAdminData = { ...incomingAdminData, ...fallbackUpdates };

        if (Object.keys(incomingAdminData).length > 0) {
            // Fetch current to merge
            const { data: current } = await supabase.from('workers').select('admin_data').eq('id', id).single();
            const currentAdminData = current?.admin_data || {};

            // Password obfuscation logic
            if (incomingAdminData.password) {
                const pass = incomingAdminData.password;
                if (!pass.startsWith('obf:')) {
                    incomingAdminData.password = 'obf:' + btoa(pass);
                }
            }

            payload.admin_data = { ...currentAdminData, ...incomingAdminData };
            delete payload.adminData;
        }

        const { data, error } = await supabase
            .from('workers')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateWorker');
        return mapWorkerFromDB(data);
    },


    delete: async (id) => {
        const { error } = await supabase.from('workers').delete().eq('id', id);
        handleSupabaseError(error, 'deleteWorker');
    },

    generatePassword: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    addDocument: async (workerId, document) => {
        const { data: worker } = await supabase.from('workers').select('documents').eq('id', workerId).single();
        const currentDocs = worker?.documents || [];
        const newDoc = { id: crypto.randomUUID(), date: new Date().toISOString(), ...document };

        const { data, error } = await supabase
            .from('workers')
            .update({ documents: [...currentDocs, newDoc] })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'addDocument');
        return data;
    },

    deleteDocument: async (workerId, documentId) => {
        const { data: worker } = await supabase.from('workers').select('documents').eq('id', workerId).single();
        const currentDocs = worker?.documents || [];
        const filteredDocs = currentDocs.filter(d => d.id !== documentId);

        const { data, error } = await supabase
            .from('workers')
            .update({ documents: filteredDocs })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteDocument');
        return data;
    },

    addFolder: async (workerId, folderName) => {
        const { data: worker } = await supabase.from('workers').select('folders').eq('id', workerId).single();
        const currentFolders = worker?.folders || [];
        const newFolder = { id: crypto.randomUUID(), name: folderName, createdAt: new Date().toISOString() };

        const { data, error } = await supabase
            .from('workers')
            .update({ folders: [...currentFolders, newFolder] })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'addFolder');
        return data;
    },

    deleteFolder: async (workerId, folderId) => {
        const { data: worker } = await supabase.from('workers').select('folders, documents').eq('id', workerId).single();
        const currentFolders = worker?.folders || [];
        const currentDocs = worker?.documents || [];

        const filteredFolders = currentFolders.filter(f => f.id !== folderId);
        // Move docs to root
        const updatedDocs = currentDocs.map(d => d.folderId === folderId ? { ...d, folderId: null } : d);

        const { data, error } = await supabase
            .from('workers')
            .update({ folders: filteredFolders, documents: updatedDocs })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteFolder');
        return data;
    },

    addContract: async (workerId, contract) => {
        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        const currentContracts = worker?.contracts || [];
        const newContract = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            status: 'pending',
            ...contract
        };

        const { data, error } = await supabase
            .from('workers')
            .update({ contracts: [...currentContracts, newContract] })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'addContract');
        return data;
    },

    deleteContract: async (workerId, contractId) => {
        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        const currentContracts = worker?.contracts || [];
        const filteredContracts = currentContracts.filter(c => c.id !== contractId);

        const { data, error } = await supabase
            .from('workers')
            .update({ contracts: filteredContracts })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteContract');
        return data;
    },

    signContract: async (workerId, contractId, signature, content) => {
        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        const contracts = worker?.contracts || [];
        const contractIndex = contracts.findIndex(c => c.id === contractId);

        if (contractIndex !== -1) {
            contracts[contractIndex] = {
                ...contracts[contractIndex],
                status: 'signed',
                signature,
                content,
                signedAt: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('workers')
                .update({ contracts })
                .eq('id', workerId)
                .select()
                .single();
            handleSupabaseError(error, 'signContract');
            return data;
        }
        return null;
    },

    login: async (identifier, password) => {
        // First try standard Supabase Auth login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: identifier,
            password: password
        });

        if (error) {
            console.warn('Auth Login Failed:', error.message);
            return null;
        }

        // If auth succeeded, fetch the associated worker record
        const { data: worker, error: workerError } = await supabase
            .from('workers')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (workerError) {
            console.error('Worker Record Fetch Failed:', workerError);
            return null;
        }

        // Log successful login
        await this.logAction(worker.id, 'LOGIN', { method: 'AUTH' });

        return mapWorkerFromDB(worker);
    },

    logAction: async (workerId, action, details = {}) => {
        const { data: { user } } = await supabase.auth.getUser();

        try {
            await supabase.from('audit_logs').insert({
                user_id: user?.id,
                action: action,
                details: {
                    worker_id: workerId,
                    ...details,
                    timestamp: new Date().toISOString()
                },
                ip_address: 'client-side' // IP fetching is limited on client, but we can add more context here if needed
            });
        } catch (e) {
            console.error('Logging failed:', e);
        }
    }

};

export const projectStore = {
    getAll: async () => {
        const { data, error } = await supabase.from('projects').select('*');
        handleSupabaseError(error, 'getAllProjects');
        return data || [];
    },
    add: async (name, clientId = null) => {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ name, status: 'active', client_id: clientId }])
            .select()
            .single();
        handleSupabaseError(error, 'addProject');
        return data;
    },
    update: async (id, updates) => {
        // Map camelCase to snake_case if needed
        const payload = { ...updates };
        if (payload.clientId) {
            payload.client_id = payload.clientId;
            delete payload.clientId;
        }

        const { data, error } = await supabase
            .from('projects')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateProject');
        return data;
    },
    delete: async (id) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        handleSupabaseError(error, 'deleteProject');
    }
};

export const clientStore = {
    getAll: async () => {
        const { data, error } = await supabase.from('clients').select('*');
        handleSupabaseError(error, 'getAllClients');
        return data || [];
    },
    add: async (clientData) => {
        const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select()
            .single();
        handleSupabaseError(error, 'addClient');
        return data;
    },
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateClient');
        return data;
    },
    delete: async (id) => {
        // Also unassign projects
        await supabase.from('projects').update({ client_id: null }).eq('client_id', id);

        const { error } = await supabase.from('clients').delete().eq('id', id);
        handleSupabaseError(error, 'deleteClient');
    }
};

export const templateStore = {
    getAll: async () => {
        const { data, error } = await supabase.from('templates').select('*');
        handleSupabaseError(error, 'getAllTemplates');
        return data || [];
    },
    add: async (name, content) => {
        const { data, error } = await supabase
            .from('templates')
            .insert([{ name, content }])
            .select()
            .single();
        handleSupabaseError(error, 'addTemplate');
        return data;
    },
    delete: async (id) => {
        const { error } = await supabase.from('templates').delete().eq('id', id);
        handleSupabaseError(error, 'deleteTemplate');
    }
};

export const trainingStore = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('trainings')
            .select('*, training_participants(count)')
            .order('date', { ascending: true });
        handleSupabaseError(error, 'getAllTrainings');

        return (data || []).map(t => ({
            ...t,
            participants: t.training_participants?.[0]?.count || 0
        }));
    },

    add: async (trainingData) => {
        const { data, error } = await supabase
            .from('trainings')
            .insert([trainingData])
            .select()
            .single();
        handleSupabaseError(error, 'addTraining');
        return data;
    },

    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('trainings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateTraining');
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase.from('trainings').delete().eq('id', id);
        handleSupabaseError(error, 'deleteTraining');
    },

    addParticipant: async (trainingId, workerId) => {
        const { data, error } = await supabase
            .from('training_participants')
            .insert([{ training_id: trainingId, worker_id: workerId, status: 'registered' }])
            .select()
            .single();
        handleSupabaseError(error, 'addTrainingParticipant');
        return data;
    },

    removeParticipant: async (trainingId, workerId) => {
        const { error } = await supabase
            .from('training_participants')
            .delete()
            .eq('training_id', trainingId)
            .eq('worker_id', workerId);
        handleSupabaseError(error, 'removeTrainingParticipant');
    },

    getParticipants: async (trainingId) => {
        const { data, error } = await supabase
            .from('training_participants')
            .select('*, workers(id, name, surname, role)')
            .eq('training_id', trainingId);
        handleSupabaseError(error, 'getTrainingParticipants');
        return data || [];
    }
};



export const residenceStore = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('residences')
            .select('*, residence_occupants(count), projects(name)')
            .order('address');
        handleSupabaseError(error, 'getAllResidences');
        return (data || []).map(r => ({
            ...r,
            projectName: r.projects?.name || '',
            occupants: r.residence_occupants?.[0]?.count || 0
        }));
    },
    add: async (residenceData) => {
        const { data, error } = await supabase
            .from('residences')
            .insert([residenceData])
            .select()
            .single();
        handleSupabaseError(error, 'addResidence');
        return data;
    },
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('residences')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateResidence');
        return data;
    },
    delete: async (id) => {
        const { error } = await supabase.from('residences').delete().eq('id', id);
        handleSupabaseError(error, 'deleteResidence');
    },

    getOccupants: async (residenceId) => {
        const { data, error } = await supabase
            .from('residence_occupants')
            .select('*, workers(id, name, surname)')
            .eq('residence_id', residenceId)
            .order('start_date', { ascending: false });
        handleSupabaseError(error, 'getResidenceOccupants');
        return data || [];
    },

    addOccupant: async (occupantData) => {
        const { data, error } = await supabase
            .from('residence_occupants')
            .insert([occupantData])
            .select()
            .single();
        handleSupabaseError(error, 'addResidenceOccupant');
        return data;
    },

    updateOccupant: async (id, updates) => {
        const { data, error } = await supabase
            .from('residence_occupants')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateResidenceOccupant');
        return data;
    },

    deleteOccupant: async (id) => {
        const { error } = await supabase.from('residence_occupants').delete().eq('id', id);
        handleSupabaseError(error, 'deleteResidenceOccupant');
    }
};

// Extension for projects to handle participants
export const projectParticipantsStore = {
    getParticipants: async (projectId) => {
        const { data, error } = await supabase
            .from('project_participants')
            .select('*, workers(id, name, surname, role)')
            .eq('project_id', projectId)
            .order('start_date', { ascending: false });
        handleSupabaseError(error, 'getProjectParticipants');
        return data || [];
    },

    assignWorker: async (projectId, workerId, role, startDate) => {
        const { data, error } = await supabase
            .from('project_participants')
            .insert([{
                project_id: projectId,
                worker_id: workerId,
                role,
                start_date: startDate,
                status: 'active'
            }])
            .select()
            .single();
        handleSupabaseError(error, 'assignProjectParticipant');
        return data;
    },

    endAssignment: async (participantId, endDate) => {
        const { data, error } = await supabase
            .from('project_participants')
            .update({ end_date: endDate, status: 'ended' })
            .eq('id', participantId)
            .select()
            .single();
        handleSupabaseError(error, 'endProjectParticipant');
        return data;
    },

    getParticipantsByWorker: async (workerId) => {
        const { data, error } = await supabase
            .from('project_participants')
            .select('*, projects(name)')
            .eq('worker_id', workerId)
            .order('start_date', { ascending: false });
        handleSupabaseError(error, 'getParticipantsByWorker');
        return data || [];
    }
};

export const adminStore = {
    login: async (username, password) => {
        console.log('Admin login attempt:', username);
        const { data: admins } = await supabase.from('admins').select('*').eq('username', username);
        const admin = admins?.[0];

        if (admin) {
            let actualPassword = admin.password;
            if (admin.password && admin.password.startsWith('obf:')) {
                try {
                    actualPassword = atob(admin.password.substring(4));
                } catch (e) {
                    actualPassword = admin.password;
                }
            }
            if (actualPassword === password) return {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                full_name: admin.full_name
            };

        }
        return null;
    },

    getAll: async () => {
        const { data, error } = await supabase.from('admins').select('*').order('username');
        handleSupabaseError(error, 'getAllAdmins');
        return data || [];
    },



    add: async (adminData) => {
        const payload = { ...adminData };
        if (payload.password) {
            payload.password = 'obf:' + btoa(payload.password);
        }

        console.log('Adding admin with payload:', payload);
        const { data, error } = await supabase.from('admins').insert([payload]).select().single();
        if (error) {
            console.error('Error adding admin:', error);
            alert('Kļūda saglabājot adminu (pārliecinies, ka esi pievienojis full_name kolonnu datubāzē): ' + error.message);
            throw error;
        }
        return data;
    },

    update: async (id, updates) => {
        const payload = { ...updates };
        if (payload.password) {
            payload.password = 'obf:' + btoa(payload.password);
        }

        console.log('Updating admin with payload:', payload);
        const { data, error } = await supabase.from('admins').update(payload).eq('id', id).select().single();
        if (error) {
            console.error('Error updating admin:', error);
            alert('Kļūda atjaunojot adminu (pārliecinies, ka esi pievienojis full_name kolonnu datubāzē): ' + error.message);
            throw error;
        }
        return data;
    },



    delete: async (id) => {
        const { error } = await supabase.from('admins').delete().eq('id', id);
        handleSupabaseError(error, 'deleteAdmin');
    }
};
