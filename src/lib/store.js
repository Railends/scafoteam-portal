import { create } from 'zustand';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage';
import { emailService } from './emailService';

const handleSupabaseError = (error, context) => {
    if (error) {
        console.error(`Supabase Error [${context}]:`, error);
        throw error;
    }
};
export const useSettingsStore = create((set) => ({
    announcement: '',
    fetchSettings: async () => {
        try {
            const { data, error } = await supabase.from('settings').select('*').eq('id', 'announcement_bar').maybeSingle();
            if (!error && data) {
                set({ announcement: data.value });
            }
        } catch (e) {
            console.error('Failed to fetch settings:', e);
        }
    },
    updateAnnouncement: async (text) => {
        try {
            const { error } = await supabase.from('settings').upsert({ id: 'announcement_bar', value: text }, { onConflict: 'id' });
            if (error) throw error;
            set({ announcement: text });
            return { success: true };
        } catch (error) {
            console.error('Failed to update announcement:', error);
            return { success: false, error: error.message };
        }
    }
}));

const mapWorkerFromDB = (w) => {
    if (!w) return null;

    // Merge worker_admin_info into adminData if it exists (for new schema)
    // Otherwise fallback to legacy admin_data column
    const info = w.worker_admin_info || {};
    const legacyAdminData = w.admin_data || {};

    const adminData = {
        ...legacyAdminData,
        ...info,
        // Ensure clothing_sizes is merged correctly if it's a nested object in worker_admin_info
        ...(info.clothing_sizes || {})
    };

    // Map profile image path to Public URL if it exists and isn't base64/http already
    if (adminData.profileImage && !adminData.profileImage.startsWith('data:') && !adminData.profileImage.startsWith('http')) {
        adminData.profileImage = storageService.getPublicUrl('worker-avatars', adminData.profileImage);
    }

    return {
        ...w,
        // Fallback to adminData for potentially missing columns
        role: w.role || adminData.role || 'worker',
        status: w.status || adminData.status || 'pending',
        phone: w.phone || adminData.phone || '',
        email: w.email || adminData.email || '',
        nationality: w.nationality || adminData.nationality || '',
        requirePasswordChange: adminData.require_password_change || false,
        adminData: adminData,
        documents: w.documents || [],
        contracts: w.contracts || [],
        folders: w.folders || [],
    };
};

export const workerStore = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('workers')
            .select('*, worker_admin_info(*)')
            .order('surname');
        handleSupabaseError(error, 'getAllWorkers');
        return (data || []).map(mapWorkerFromDB);
    },
    getById: async (id) => {
        const { data, error } = await supabase
            .from('workers')
            .select('*, worker_admin_info(*)')
            .eq('id', id)
            .single();
        handleSupabaseError(error, 'getWorkerById');
        return mapWorkerFromDB(data);
    },
    add: async (workerData) => {
        const adminInfoFields = [
            'personal_id', 'bank_account', 'bic_code', 'tax_number', 'finnish_id',
            'hourly_rate', 'has_per_diem', 'address', 'driving_licence',
            'has_green_card', 'green_card_show', 'green_card_expiry',
            'has_vas', 'has_hotworks', 'hotworks_type', 'hotworks_expiry',
            'clothing_sizes', 'internal_notes'
        ];

        const workerInsert = {};
        const adminInfoInsert = {};
        const sizes = {};

        // Split data between tables and handle mapping
        Object.keys(workerData).forEach(key => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

            // Handle sizes
            if (['bootSize', 'bootsSize', 'jacketSize', 'trouserSize', 'pantsSize'].includes(key)) {
                sizes[key] = workerData[key];
            } else if (adminInfoFields.includes(snakeKey)) {
                adminInfoInsert[snakeKey] = workerData[key];
            } else if (adminInfoFields.includes(key)) {
                adminInfoInsert[key] = workerData[key];
            } else if (key !== 'adminData') {
                workerInsert[key] = workerData[key];
            }
        });

        // Pack sizes if present
        if (Object.keys(sizes).length > 0) {
            adminInfoInsert.clothing_sizes = sizes;
        }

        // 1. Insert into workers table
        const { data, error: workerError } = await supabase
            .from('workers')
            .insert([workerInsert])
            .select()
            .single();
        handleSupabaseError(workerError, 'addWorker');

        // 2. Insert into worker_admin_info if there is data
        if (data && Object.keys(adminInfoInsert).length > 0) {
            const { error: adminError } = await supabase
                .from('worker_admin_info')
                .insert([{ id: data.id, ...adminInfoInsert }]);
            if (adminError) {
                console.warn('Failed to insert into worker_admin_info:', adminError.message);
                // Fallback: If info table fails, we still have the worker record
                // We'll store it back in admin_data as a last resort
                await supabase.from('workers').update({ admin_data: adminInfoInsert }).eq('id', data.id);
            }
        }

        return await workerStore.getById(data.id);
    },
    update: async (id, updates) => {
        // Handle password sync if provided in adminData
        if (updates.adminData?.password) {
            await workerStore.updateAuthPasswordByAdmin(id, updates.adminData.password);
        }

        // Handle email sync if provided
        if (updates.email) {
            try {
                const { error: syncError } = await supabase.rpc('update_worker_email_by_admin', {
                    target_user_id: id,
                    new_email: updates.email
                });
                if (syncError) console.warn('Auth email sync failed:', syncError.message);
            } catch (e) {
                console.error('Email sync failed:', e);
            }
        }

        const adminInfoFields = [
            'personal_id', 'bank_account', 'bic_code', 'tax_number', 'finnish_id',
            'hourly_rate', 'has_per_diem', 'address', 'driving_licence',
            'has_green_card', 'green_card_show', 'green_card_expiry',
            'has_vas', 'has_hotworks', 'hotworks_type', 'hotworks_expiry',
            'clothing_sizes', 'internal_notes'
        ];

        const workerUpdates = {};
        const adminInfoUpdates = {};

        // Split updates between tables
        Object.keys(updates).forEach(key => {
            if (adminInfoFields.includes(key)) {
                adminInfoUpdates[key] = updates[key];
            } else if (key !== 'adminData' && key !== 'id') {
                workerUpdates[key] = updates[key];
            }
        });

        // If updates were in adminData object (older UI), extract them
        if (updates.adminData) {
            const sizes = {};
            Object.keys(updates.adminData).forEach(key => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                if (['boot_size', 'jacket_size', 'trouser_size'].includes(snakeKey) || ['bootSize', 'jacketSize', 'trouserSize'].includes(key)) {
                    sizes[key] = updates.adminData[key];
                } else if (adminInfoFields.includes(snakeKey)) {
                    adminInfoUpdates[snakeKey] = updates.adminData[key];
                } else if (adminInfoFields.includes(key)) {
                    adminInfoUpdates[key] = updates.adminData[key];
                }
            });
            if (Object.keys(sizes).length > 0) {
                adminInfoUpdates.clothing_sizes = {
                    ...(adminInfoUpdates.clothing_sizes || {}),
                    ...sizes
                };
            }
        }

        // 1. Perform workers table update if there are changes
        if (Object.keys(workerUpdates).length > 0) {
            const { error: workerError } = await supabase
                .from('workers')
                .update(workerUpdates)
                .eq('id', id);
            if (workerError) throw workerError;
        }

        // 2. Perform worker_admin_info update if there are changes
        if (Object.keys(adminInfoUpdates).length > 0) {
            const { error: adminError } = await supabase
                .from('worker_admin_info')
                .upsert({ id, ...adminInfoUpdates });
            if (adminError) {
                console.warn('Failed to update worker_admin_info, falling back to legacy storage:', adminError.message);
                // Fallback: Store back in admin_data if info table fails (e.g. doesn't exist yet)
                await supabase.from('workers').update({ admin_data: updates.adminData }).eq('id', id);
            }
        }

        // Fetch fresh merged record
        return await workerStore.getById(id);
    },
    delete: async (id) => {
        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id);
        handleSupabaseError(error, 'deleteWorker');
    },
    generatePassword: () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 8; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    },

    addDocument: async (workerId, document) => {
        // 1. Upload file to Storage
        let contentPath = document.content; // Default if keeping as is (legacy)

        if (document.content && (document.content instanceof Blob || document.content.startsWith('data:'))) {
            // It's a file or base64. Upload it.
            const fileExt = document.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const path = `${workerId}/${fileName}`;

            // Convert base64 to Blob if needed for upload
            let fileToUpload = document.content;
            if (typeof document.content === 'string' && document.content.startsWith('data:')) {
                const base64 = document.content.split(',')[1];
                const binary = atob(base64);
                const array = [];
                for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
                fileToUpload = new Blob([new Uint8Array(array)], { type: 'application/octet-stream' });
            }

            try {
                contentPath = await storageService.uploadFile('worker-documents', path, fileToUpload);
            } catch (e) {
                console.error("Failed to upload document", e);
                return null; // Stop if upload fails
            }
        }

        const { data: worker } = await supabase.from('workers').select('documents').eq('id', workerId).single();
        const currentDocs = worker?.documents || [];

        // Store PATH, not Content
        const newDoc = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            name: document.name,
            folderId: document.folderId,
            content: contentPath, // Now a path like "user_id/uuid.pdf"
            storageType: 'supabase' // Marker for frontend to know how to fetch
        };

        const { data, error } = await supabase
            .from('workers')
            .update({ documents: [...currentDocs, newDoc] })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'addDocument');
        return mapWorkerFromDB(data);
    },

    deleteDocument: async (workerId, documentId) => {
        const { data: worker } = await supabase.from('workers').select('documents').eq('id', workerId).single();
        const currentDocs = worker?.documents || [];
        const docToDelete = currentDocs.find(d => d.id === documentId);

        // Try to delete from storage if it looks like a path
        if (docToDelete && docToDelete.storageType === 'supabase') {
            try {
                await storageService.deleteFile('worker-documents', docToDelete.content);
            } catch (e) {
                console.warn("Could not delete from storage, continuing db delete", e);
            }
        }

        const filteredDocs = currentDocs.filter(d => d.id !== documentId);

        const { data, error } = await supabase
            .from('workers')
            .update({ documents: filteredDocs })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteDocument');
        return mapWorkerFromDB(data);
    },

    addFolder: async (workerId, folderName) => {
        // ... (remains same)
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
        // ... (remains same)
        const { data: worker } = await supabase.from('workers').select('folders, documents').eq('id', workerId).single();
        const currentFolders = worker?.folders || [];
        const currentDocs = worker?.documents || [];

        const filteredFolders = currentFolders.filter(f => f.id !== folderId);
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
        // Upload Generated Contract
        let contentPath = contract.content;

        if (contract.content && (contract.content.startsWith('data:'))) {
            const fileName = `${uuidv4()}_${contract.name.replace(/[^a-z0-9]/gi, '_')}`; // Sanitize
            const path = `${workerId}/${fileName}`;

            // Convert base64
            const base64 = contract.content.split(',')[1];
            const binary = atob(base64);
            const array = [];
            for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
            const blob = new Blob([new Uint8Array(array)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); // or PDF

            try {
                contentPath = await storageService.uploadFile('worker-documents', path, blob);
            } catch (e) {
                console.error("Failed to upload contract", e);
                return null;
            }
        }

        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        const currentContracts = worker?.contracts || [];
        const newContract = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            status: 'pending',
            name: contract.name,
            templateId: contract.templateId,
            content: contentPath,
            storageType: 'supabase'
        };

        const { data, error } = await supabase
            .from('workers')
            .update({ contracts: [...currentContracts, newContract] })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'addContract');
        return mapWorkerFromDB(data);
    },

    deleteContract: async (workerId, contractId) => {
        // ... (delete logic similar to doc)
        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        const currentContracts = worker?.contracts || [];
        const contractToDelete = currentContracts.find(c => c.id === contractId);

        if (contractToDelete && contractToDelete.storageType === 'supabase') {
            try {
                // Delete contract file
                await storageService.deleteFile('worker-documents', contractToDelete.content);
                // Also delete signature if exists? No, it's separate bucket.
                if (contractToDelete.signaturePath) {
                    await storageService.deleteFile('contract-signatures', contractToDelete.signaturePath);
                }
            } catch (e) { console.warn("Storage delete failed", e); }
        }

        const filteredContracts = currentContracts.filter(c => c.id !== contractId);

        const { data, error } = await supabase
            .from('workers')
            .update({ contracts: filteredContracts })
            .eq('id', workerId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteContract');
        return mapWorkerFromDB(data);
    },

    signContract: async (workerId, contractId, signature, fileContent) => {
        // 1. Upload Signature
        let signaturePath = signature;
        if (signature && signature.startsWith('data:')) {
            const path = `${workerId}/${contractId}_sig.png`;
            // Convert
            const base64 = signature.split(',')[1];
            const binary = atob(base64);
            const array = [];
            for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
            const blob = new Blob([new Uint8Array(array)], { type: 'image/png' });

            signaturePath = await storageService.uploadFile('contract-signatures', path, blob);
        }

        // 2. Upload Signed Document
        let filePath = fileContent;
        if (fileContent && fileContent.startsWith('data:')) {
            const path = `${workerId}/${contractId}_signed.pdf`; // Assuming PDF
            // Convert
            const base64 = fileContent.split(',')[1];
            const binary = atob(base64);
            const array = [];
            for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
            const blob = new Blob([new Uint8Array(array)], { type: 'application/pdf' });

            filePath = await storageService.uploadFile('worker-documents', path, blob);
        }

        const { data: worker } = await supabase.from('workers').select('contracts').eq('id', workerId).single();
        if (worker) {
            const contracts = worker.contracts.map(c =>
                c.id === contractId
                    ? {
                        ...c,
                        status: 'signed',
                        signature: null, // Don't store base64 
                        signaturePath: signaturePath,
                        content: filePath,
                        storageType: 'supabase',
                        signedAt: new Date().toISOString()
                    }
                    : c
            );

            const { data, error } = await supabase
                .from('workers')
                .update({ contracts })
                .eq('id', workerId)
                .select()
                .single();
            handleSupabaseError(error, 'signContract');
            return mapWorkerFromDB(data);
        }
        return null;
    },

    login: async (identifier, password) => {
        let email = identifier;

        // Check if identifier is a username (doesn't contain @)
        if (!identifier.includes('@')) {
            const { data: workerByUsername } = await supabase
                .from('workers')
                .select('email')
                .eq('username', identifier)
                .single();

            if (workerByUsername) {
                email = workerByUsername.email;
            }
        }

        // Perform standard Supabase Auth login
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error('Login failed, checking legacy records:', authError.message);

            // Legacy fallback (checking by identifier, which could be username or email)
            const query = supabase.from('workers').select('*');
            if (identifier.includes('@')) {
                query.eq('email', identifier);
            } else {
                query.eq('username', identifier);
            }

            const { data: legacyWorker, error: legacyError } = await query.single();

            if (!legacyError && legacyWorker) {
                const legacyPassword = legacyWorker.admin_data?.password;
                const obfuscated = 'obf:' + btoa(password);

                if (legacyPassword === obfuscated || legacyPassword === password) {
                    console.warn('Worker login successful via legacy logic. Migration required.');
                    return {
                        ...mapWorkerFromDB(legacyWorker),
                        isLegacy: true
                    };
                }
            }
            // Return the actual error to the caller
            return { error: authError.message };
        }

        // Auth succeeded, fetch the associated worker record
        const { data: worker, error: workerError } = await supabase
            .from('workers')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (workerError || !worker) {
            console.warn('Auth record found but worker profile missing');
            // Check if it's an admin trying to login here
            const role = data.user?.user_metadata?.role;
            if (role === 'admin' || role === 'superadmin') {
                return { isAdminRedirect: true };
            }
            return null;
        }

        await workerStore.logAction(worker.id, 'LOGIN', { method: 'AUTH_SUCCESS' });

        return {
            ...mapWorkerFromDB(worker),
            requirePasswordChange: data.user.user_metadata?.require_password_change || false
        };
    },

    migrateAccount: async (workerId, email, password) => {
        try {
            // 1. Fetch the legacy worker data
            const { data: legacyWorker, error: fetchError } = await supabase
                .from('workers')
                .select('*')
                .eq('id', workerId)
                .single();

            if (fetchError || !legacyWorker) throw new Error('Legacy worker not found');

            // 2. Create the Supabase Auth user
            let authUser = null;
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: legacyWorker.name,
                        surname: legacyWorker.surname,
                        role: legacyWorker.admin_data?.role || 'worker'
                    }
                }
            });

            if (authError) {
                if (authError.message?.includes("User already registered") || authError.status === 422) {
                    console.log("User already registered, attempting sign-in to link account...");
                    // Try to sign in to get the UID
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (signInError) {
                        throw new Error("Konts jau eksistē, bet neizdevās pieslēgties. Iespējams, cita parole?");
                    }
                    authUser = signInData.user;
                } else {
                    throw authError;
                }
            } else {
                authUser = authData.user;
            }

            if (!authUser) throw new Error("Failed to authenticate user during migration");

            const newUid = authUser.id;

            // 3. Update the worker record ID to match new Auth UID
            // This is a direct UPDATE on the primary key.
            // If it fails, we catch it and explain.
            const { error: updateError } = await supabase
                .from('workers')
                .update({ id: newUid })
                .eq('id', workerId);

            if (updateError) {
                // If update fails, check if it's because the ID already exists in workers table (migration already done?)
                if (updateError.code === '23505') { // Unique violation
                    console.log("Worker record with this Auth ID already exists. Migration likely completed previously.");
                    return { success: true, email: email, uid: newUid };
                }
                console.error('Failed to update worker ID:', updateError);
                throw new Error('Nepieciešama manuāla migrācija (FK ierobežojums). Sazinieties ar adminu.');
            }

            return { success: true, email: email, uid: newUid };
        } catch (error) {
            console.error('Worker migration failed:', error);
            return { success: false, error: error.message };
        }
    },

    loginWithOtp: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: false, // Ensure we don't create new users via login
            }
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    verifyOtp: async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) return { success: false, error: error.message };

        // Fetch worker profile
        const { data: worker, error: workerError } = await supabase
            .from('workers')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (workerError || !worker) {
            return { success: false, error: "Profils nav atrasts." };
        }

        await workerStore.logAction(worker.id, 'LOGIN', { method: 'OTP_SUCCESS' });

        return {
            success: true,
            worker: mapWorkerFromDB(worker),
            requirePasswordChange: data.user.user_metadata?.require_password_change || false
        };
    },

    updateAuthPasswordByAdmin: async (userId, newPassword) => {
        try {
            const { error } = await supabase.rpc('update_worker_password_by_admin', {
                target_user_id: userId,
                new_password: newPassword
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Admin password update failed:', error);
            return { success: false, error: error.message };
        }
    },

    updateAuthPassword: async (newPassword) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 1. Update password and metadata in Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword,
                data: { require_password_change: false }
            });
            if (authError) throw authError;

            // 2. Clear flag in database as well (since we often read from DB for UI state)
            const { error: dbError } = await supabase
                .from('workers')
                .update({
                    admin_data: {
                        ...(user.user_metadata || {}),
                        require_password_change: false
                    }
                })
                .eq('id', user.id);
            if (dbError) console.warn('Database flag update failed:', dbError.message);

            return { success: true };
        } catch (error) {
            console.error('Password update failed:', error);
            return { success: false, error: error.message };
        }
    },

    exportData: async (workerId) => {
        const { data, error } = await supabase
            .from('workers')
            .select('*, audit_logs(*), project_participants(*)')
            .eq('id', workerId)
            .single();

        handleSupabaseError(error, 'exportWorkerData');
        return data;
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
    add: async (name, clientId = null, extra = {}) => {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ name, status: 'active', client_id: clientId, ...extra }])
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

export const vehicleStore = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*, workers(id, name, surname)')
            .order('plate_number');
        handleSupabaseError(error, 'getAllVehicles');
        return data || [];
    },
    getByHolderId: async (holderId) => {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('holder_id', holderId);
        handleSupabaseError(error, 'getVehiclesByHolder');
        return data || [];
    },
    add: async (vehicleData) => {
        const { data, error } = await supabase
            .from('vehicles')
            .insert([vehicleData])
            .select()
            .single();
        handleSupabaseError(error, 'addVehicle');

        // Log action
        const { data: { user } } = await supabase.auth.getUser();
        await workerStore.logAction(null, 'ADD_VEHICLE', {
            plate_number: vehicleData.plate_number,
            make: vehicleData.make,
            model: vehicleData.model
        });

        return data;
    },
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        handleSupabaseError(error, 'updateVehicle');
        return data;
    },
    delete: async (id) => {
        // Fetch before delete to log
        const { data: vehicle } = await supabase.from('vehicles').select('plate_number').eq('id', id).single();

        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        handleSupabaseError(error, 'deleteVehicle');

        if (vehicle) {
            await workerStore.logAction(null, 'DELETE_VEHICLE', {
                vehicle_id: id,
                plate_number: vehicle.plate_number
            });
        }
    },
    addDocument: async (vehicleId, document) => {
        let contentPath = document.content;

        if (document.content && (document.content instanceof Blob || document.content.startsWith('data:'))) {
            const fileExt = document.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const path = `${vehicleId}/${fileName}`;

            let fileToUpload = document.content;
            if (typeof document.content === 'string' && document.content.startsWith('data:')) {
                const base64 = document.content.split(',')[1];
                const binary = atob(base64);
                const array = [];
                for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
                fileToUpload = new Blob([new Uint8Array(array)], { type: 'application/octet-stream' });
            }

            try {
                // Use 'documents' bucket as a general bucket if 'vehicle-documents' doesn't exist
                // Or stay consistent with 'worker-documents' style. 
                // Let's use 'documents' as it's more generic if available.
                contentPath = await storageService.uploadFile('documents', `vehicles/${path}`, fileToUpload);
            } catch (e) {
                console.error("Failed to upload vehicle document", e);
                throw e;
            }
        }

        const { data: vehicle } = await supabase.from('vehicles').select('documents').eq('id', vehicleId).single();
        const currentDocs = vehicle?.documents || [];

        const newDoc = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            name: document.name,
            content: contentPath,
            storageType: 'supabase'
        };

        const { data, error } = await supabase
            .from('vehicles')
            .update({ documents: [...currentDocs, newDoc] })
            .eq('id', vehicleId)
            .select()
            .single();
        handleSupabaseError(error, 'addVehicleDocument');

        await workerStore.logAction(null, 'UPLOAD_VEHICLE_DOCUMENT', {
            vehicle_id: vehicleId,
            document_name: document.name
        });

        return data;
    },
    deleteDocument: async (vehicleId, documentId) => {
        const { data: vehicle } = await supabase.from('vehicles').select('documents').eq('id', vehicleId).single();
        const currentDocs = vehicle?.documents || [];
        const docToDelete = currentDocs.find(d => d.id === documentId);

        if (docToDelete && docToDelete.storageType === 'supabase') {
            try {
                await storageService.deleteFile('documents', docToDelete.content);
            } catch (e) {
                console.warn("Could not delete vehicle document from storage", e);
            }
        }

        const filteredDocs = currentDocs.filter(d => d.id !== documentId);

        const { data, error } = await supabase
            .from('vehicles')
            .update({ documents: filteredDocs })
            .eq('id', vehicleId)
            .select()
            .single();
        handleSupabaseError(error, 'deleteVehicleDocument');

        if (docToDelete) {
            await workerStore.logAction(null, 'DELETE_VEHICLE_DOCUMENT', {
                vehicle_id: vehicleId,
                document_name: docToDelete.name
            });
        }

        return data;
    },
    getHolderResidence: async (workerId) => {
        if (!workerId) return null;
        const { data, error } = await supabase
            .from('residence_occupants')
            .select('residences(address)')
            .eq('worker_id', workerId)
            .is('end_date', null)
            .maybeSingle();
        return data?.residences;
    },
    getSignedUrl: async (path) => {
        return await storageService.getSignedUrl('documents', path);
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
        let email = username;

        // If username doesn't look like email, try to find the admin's email
        // We can check the workers table first (as admins should be there too)
        // or just try to sign in. Since usernames are custom, we lookup workers.
        if (!username.includes('@')) {
            const { data: adminWorker } = await supabase
                .from('workers')
                .select('email')
                .eq('username', username)
                .single();

            if (adminWorker) {
                email = adminWorker.email;
            }
        }

        // 1. Try Supabase Auth (New secure method)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password
        });

        if (!authError && authData.user) {
            const userRole = authData.user.user_metadata?.role;
            if (userRole === 'admin' || userRole === 'superadmin') {
                return {
                    id: authData.user.id,
                    username: authData.user.email,
                    role: userRole,
                    full_name: authData.user.user_metadata?.full_name || authData.user.email
                };
            }
        }

        // 2. Fallback to Legacy admins table (Transition support)
        const { data: legacyAdmin, error: legacyError } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (!legacyError && legacyAdmin) {
            const obfuscated = 'obf:' + btoa(password);
            if (legacyAdmin.password === obfuscated || legacyAdmin.password === password) {
                console.warn('Login successful via legacy table. Please migrate to Supabase Auth.');
                return {
                    id: legacyAdmin.id,
                    username: legacyAdmin.username,
                    role: legacyAdmin.role || 'admin',
                    full_name: legacyAdmin.full_name || legacyAdmin.username,
                    isLegacy: true
                };
            }
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



    migrateAccount: async (username, password, fullName) => {
        try {
            let email = username.includes('@') ? username : `${username}@scafoteam.com`;
            if (username === 'railends') email = 'paypalrailends@gmail.com';

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        role: 'superadmin',
                        full_name: fullName || username
                    }
                }
            });

            if (error) throw error;
            return { success: true, email: data.user.email };
        } catch (error) {
            console.error('Migration failed:', error);
            return { success: false, error: error.message };
        }
    },

    delete: async (id) => {
        const { error } = await supabase.from('admins').delete().eq('id', id);
        handleSupabaseError(error, 'deleteAdmin');
    }
};

export const useNotificationStore = create((set, get) => ({
    isChecking: false,

    checkDailyEmail: async () => {
        if (get().isChecking) return;
        set({ isChecking: true });

        try {
            const todayStr = new Date().toISOString().split('T')[0];

            // 1. Check if already sent today
            const { data: setting, error: sError } = await supabase
                .from('settings')
                .select('value')
                .eq('id', 'last_alert_email_date')
                .maybeSingle();

            if (sError) console.warn('Settings fetch error:', sError);
            if (setting?.value === todayStr) {
                console.log('Alert email already sent today.');
                return;
            }

            // 2. Fetch data for alerts
            const { data: workerData } = await supabase.from('workers').select('id, name, surname, admin_data');
            const { data: vehicleData } = await supabase.from('vehicles').select('id, plate_number, make, model, inspection_expiry');

            const today = new Date();
            const urgentAlerts = [];

            // Contract Expiry
            workerData?.forEach(w => {
                const expiry = w.admin_data?.contractEnd;
                if (expiry) {
                    const days = Math.ceil((new Date(expiry) - today) / (1000 * 60 * 60 * 24));
                    if (days < 0) {
                        urgentAlerts.push({ severity: 'urgent', message: `${w.name} ${w.surname}: līgums BEIDZIES` });
                    }
                }
            });

            // Vehicle Inspection
            vehicleData?.forEach(v => {
                const expiry = v.inspection_expiry;
                if (expiry) {
                    const daysDiff = Math.ceil((new Date(expiry) - today) / (1000 * 60 * 60 * 24));
                    if (daysDiff < 0) {
                        urgentAlerts.push({ severity: 'urgent', message: `${v.make} ${v.model} (${v.plate_number}): TA BEIGUSIES` });
                    }
                }
            });

            // 3. Send email if urgent alerts exist
            if (urgentAlerts.length > 0) {
                await emailService.sendAlertReport(urgentAlerts);
                console.log('Urgent alert email sent.');
            }

            // 4. Update last sent date
            await supabase.from('settings').upsert({
                id: 'last_alert_email_date',
                value: todayStr
            }, { onConflict: 'id' });

        } catch (err) {
            console.error('Failed to process daily alerts:', err);
        } finally {
            set({ isChecking: false });
        }
    }
}));

