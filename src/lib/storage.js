import { supabase } from './supabase';

export const storageService = {
    /**
     * Uploads a file to Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} path - File path (e.g. 'user_id/filename.ext')
     * @param {File|Blob|string} file - The file content
     * @returns {Promise<string>} - The full path of the uploaded file
     */
    uploadFile: async (bucket, path, file) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                upsert: true,
                cacheControl: '3600'
            });

        if (error) {
            console.error(`Storage Upload Error (${bucket}/${path}):`, error);
            throw error;
        }

        return data.path;
    },

    /**
     * Get Public URL (for Avatars)
     */
    getPublicUrl: (bucket, path) => {
        if (!path) return '';
        // If path is full URL, return it
        if (path.startsWith('http')) return path;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;
    },

    /**
     * Create Signed URL (for Private Docs)
     * Expires in 1 hour by default
     */
    getSignedUrl: async (bucket, path, expiresIn = 3600) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // Already a URL (maybe migration legacy)

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            console.error(`Signed URL Error (${bucket}/${path}):`, error);
            return null;
        }
        return data.signedUrl;
    },

    /**
     * Download File as Blob
     */
    downloadFile: async (bucket, path) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);

        if (error) throw error;
        return data;
    },

    /**
     * Delete File
     */
    deleteFile: async (bucket, path) => {
        if (!path) return;
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error(`Storage Delete Error (${bucket}/${path}):`, error);
            throw error;
        }
    }
};
