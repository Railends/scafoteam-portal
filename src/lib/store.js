import { supabase } from './supabase';

const handleSupabaseError = (error, context) => {
    if (error) {
        console.error(`Supabase Error [${context}]:`, error);
        throw error;
    }
};


const mapWorkerFromDB = (w) => {
    if (!w) return null;
    return {
        ...w,
        adminData: w.admin_data || {},
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
        // Map camelCase form fields to snake_case database columns
        const mapping = {
            personalId: 'personal_id',
            hasFinnishId: 'has_finnish_id',
            finnishId: 'finnish_id',
            taxNumber: 'tax_number',
            emergencyName: 'emergency_name',
            emergencyPhone: 'emergency_phone',
            hasGreenCard: 'has_green_card',
            greenCardShow: 'green_card_show',
            greenCardExpiry: 'green_card_expiry',
            hasVas: 'has_vas',
            vcaNumber: 'vca_number',
            vcaExpiry: 'vca_expiry',
            hasLicense: 'driving_licence',
            hasHotworks: 'has_hotworks',
            hotworksType: 'hotworks_type',
            hotworksNumber: 'hotworks_number',
            hotworksExpiry: 'hotworks_expiry',
            bankAccount: 'bank_account',
            bicCode: 'bic_code',
            experienceType: 'experience_type',
            experienceDuration: 'experience_duration',
            jacketSize: 'jacket_size',
            pantsSize: 'pants_size',
            bootsSize: 'boots_size',
            referred: 'referred',
            referredBy: 'referred_by',
            gdpr: 'gdpr_consent',
            phonePrefix: 'phone_prefix'
        };




        const mappedData = {};
        Object.keys(workerData).forEach(key => {
            if (mapping[key]) {
                mappedData[mapping[key]] = workerData[key];
            } else {
                mappedData[key] = workerData[key];
            }
        });

        // Generate temporary password for the new worker
        const password = this.generatePassword();

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: workerData.email,
            password: password,
            options: {
                data: {
                    role: 'worker'
                }
            }
        });

        if (authError) {
            console.error('Auth Sign Up Error:', authError);
            throw authError;
        }

        const newWorker = {
            ...mappedData,
            user_id: authData.user.id,
            status: 'pending',
            admin_data: {
                project: '',
                contractStart: '',
                contractEnd: '',
                hourlyRate: '',
                rent: '',
                rentAddress: '',
                profileImage: '',
                hasPerDiem: false,
                portalLogin: workerData.email
            },
            documents: [],
            contracts: [],
            folders: []
        };

        const { data, error } = await supabase
            .from('workers')
            .insert([newWorker])
            .select()
            .single();

        handleSupabaseError(error, 'addWorker');

        // Log the registration
        await this.logAction(data.id, 'REGISTER', { email: workerData.email });

        return { ...mapWorkerFromDB(data), temporaryPassword: password };
    },




    update: async (id, updates) => {
        const payload = { ...updates };

        // Handle adminData mapping and password obfuscation
        if (payload.adminData || payload.admin_data) {
            const incomingAdminData = payload.adminData || payload.admin_data;

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
