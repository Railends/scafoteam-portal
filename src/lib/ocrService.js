import { createWorker } from 'tesseract.js';

/**
 * OCR Service using Tesseract.js
 * 
 * Provides methods to extract text and dates from images.
 */
export const ocrService = {
    /**
     * Extracts text from an image (File or URL)
     */
    extractText: async (imageSource, lang = 'lav+eng') => {
        const worker = await createWorker(lang);
        try {
            const { data: { text } } = await worker.recognize(imageSource);
            return text;
        } catch (error) {
            console.error('OCR Error:', error);
            throw new Error('Neizdevās nolasīt tekstu no dokumenta.');
        } finally {
            await worker.terminate();
        }
    },

    /**
     * Attempts to find a date in the text (specifically for TA expiry)
     * Looking for formats like YYYY-MM-DD, DD.MM.YYYY, etc.
     */
    findDate: (text) => {
        if (!text) return null;

        // Regex for various date formats
        // 1. YYYY-MM-DD
        const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
        if (isoMatch) return isoMatch[0];

        // 2. DD.MM.YYYY
        const dotMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (dotMatch) {
            return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
        }

        // 3. DD/MM/YYYY
        const slashMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (slashMatch) {
            return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
        }

        return null;
    }
};
