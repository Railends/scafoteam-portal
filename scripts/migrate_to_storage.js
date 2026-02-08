
// Usage: node scripts/migrate_to_storage.js
// PREREQUISITES:
// 1. Run 'npm install dotenv @supabase/supabase-js' if not installed
// 2. Add SUPABASE_SERVICE_ROLE_KEY to .env (TEMPORARILY)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use Service Role Key for admin access to bypass RLS and write to storage
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('Please add SUPABASE_SERVICE_ROLE_KEY=... to your .env file temporarily to run this script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function decodeBase64(dataString) {
    if (!dataString) return null;
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        // Maybe it's raw base64?
        return { type: 'application/octet-stream', buffer: Buffer.from(dataString, 'base64') };
    }
    return {
        type: matches[1],
        buffer: Buffer.from(matches[2], 'base64')
    };
}

async function uploadToStorage(bucket, path, buffer, contentType) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
            contentType: contentType,
            upsert: true
        });

    if (error) throw error;
    return data.path;
}

// Helper to create buckets if they don't exist
async function setupBuckets() {
    console.log('Verifying storage buckets...');
    const buckets = ['worker-documents', 'contract-signatures', 'worker-avatars'];

    // We can't check existence easily with admin client, so we just try to create.
    // createBucket returns error if exists, which we ignore.

    for (const bucket of buckets) {
        const { data, error } = await supabase.storage.createBucket(bucket, {
            public: bucket === 'worker-avatars',
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: bucket === 'contract-signatures' ? ['image/png'] : undefined
        });

        if (error) {
            if (error.message.includes('already exists')) {
                console.log(`  - Bucket '${bucket}' likely exists (OK)`);
            } else {
                console.warn(`  - Failed to create bucket '${bucket}':`, error.message);
            }
        } else {
            console.log(`  - Bucket '${bucket}' created.`);
        }
    }
}

async function migrateWorkers() {
    console.log('Starting migration script...');
    await setupBuckets();

    // 1. Fetch all workers
    const { data: workers, error } = await supabase.from('workers').select('*');
    if (error) {
        console.error('Failed to fetch workers:', error);
        return;
    }

    console.log(`Found ${workers.length} workers to process.`);

    for (const worker of workers) {
        console.log(`Processing worker: ${worker.name} ${worker.surname} (${worker.id})`);

        let updates = {};

        // --- A. Profile Image ---
        if (worker.admin_data?.profileImage && worker.admin_data.profileImage.startsWith('data:')) {
            console.log('  -> Migrating Profile Image...');
            try {
                const { type, buffer } = decodeBase64(worker.admin_data.profileImage);
                const ext = type.split('/')[1] || 'png';
                const filename = `avatar_${Date.now()}.${ext}`;
                const path = `${worker.id}/${filename}`;

                const storagePath = await uploadToStorage('worker-avatars', path, buffer, type);

                updates.admin_data = { ...worker.admin_data, profileImage: storagePath };
                console.log('     Done.');
            } catch (e) {
                console.error('     FAILED:', e.message);
            }
        }

        // --- B. Documents ---
        if (worker.documents && worker.documents.length > 0) {
            console.log(`  -> Migrating ${worker.documents.length} Documents...`);
            let newDocs = [...worker.documents];
            let docsChanged = false;

            for (let i = 0; i < newDocs.length; i++) {
                const doc = newDocs[i];
                if (doc.content && doc.content.startsWith('data:')) {
                    try {
                        const { type, buffer } = decodeBase64(doc.content);
                        const ext = doc.name.split('.').pop() || 'bin';
                        const filename = `${doc.id}.${ext}`; // Use doc ID for stable filename
                        const path = `${worker.id}/${filename}`;

                        const storagePath = await uploadToStorage('worker-documents', path, buffer, type);

                        newDocs[i] = {
                            ...doc,
                            content: storagePath,
                            storageType: 'supabase'
                        };
                        docsChanged = true;
                    } catch (e) {
                        console.error(`     FAILED doc ${doc.name}:`, e.message);
                    }
                }
            }
            if (docsChanged) {
                updates.documents = newDocs;
                console.log('     Done.');
            }
        }

        // --- C. Contracts ---
        if (worker.contracts && worker.contracts.length > 0) {
            console.log(`  -> Migrating ${worker.contracts.length} Contracts...`);
            let newContracts = [...worker.contracts];
            let contractsChanged = false;

            for (let i = 0; i < newContracts.length; i++) {
                const contract = newContracts[i];

                // 1. Contract File (PDF/DOCX)
                if (contract.content && contract.content.startsWith('data:')) {
                    try {
                        const { type, buffer } = decodeBase64(contract.content);
                        const isPdf = type.includes('pdf');
                        const ext = isPdf ? 'pdf' : 'docx';
                        const filename = `${contract.id}_contract.${ext}`;
                        const path = `${worker.id}/${filename}`;

                        const storagePath = await uploadToStorage('worker-documents', path, buffer, type);

                        newContracts[i] = { ...newContracts[i], content: storagePath, storageType: 'supabase' };
                        contractsChanged = true;
                    } catch (e) {
                        console.error(`     FAILED contract content ${contract.id}:`, e.message);
                    }
                }

                // 2. Signature (PNG)
                // Note: Old contracts might have signature embedded in content or separate?
                // Current logic: signature is passed to generateDOCX but not always stored separately in `contracts` array?
                // `workerStore` update `signContract` adds `signature` field effectively.
                if (contract.signature && contract.signature.startsWith('data:')) {
                    try {
                        const { type, buffer } = decodeBase64(contract.signature);
                        const filename = `${contract.id}_signature.png`;
                        const path = `${worker.id}/${filename}`;

                        const storagePath = await uploadToStorage('contract-signatures', path, buffer, type);

                        newContracts[i] = {
                            ...newContracts[i],
                            signature: null, // Clear base64
                            signaturePath: storagePath
                        };
                        contractsChanged = true;
                    } catch (e) {
                        console.error(`     FAILED contract signature ${contract.id}:`, e.message);
                    }
                }
            }

            if (contractsChanged) {
                updates.contracts = newContracts;
                console.log('     Done.');
            }
        }

        // --- Save Changes ---
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('workers')
                .update(updates)
                .eq('id', worker.id);

            if (updateError) {
                console.error('  -> Failed to update worker record:', updateError);
            } else {
                console.log('  -> Worker record updated successfully.');
            }
        } else {
            console.log('  -> No changes needed.');
        }

    }

    console.log('Migration complete.');
}

migrateWorkers();
