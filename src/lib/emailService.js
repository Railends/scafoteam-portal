/**
 * Mock Email Service
 * 
 * Since this is a frontend-only application using localStorage, 
 * this service simulates sending emails by logging to the console 
 * and providing a way for the UI to show success notifications.
 */

export const emailService = {
    /**
     * Simulates sending a password to a worker
     * @param {string} email - Recipient email
     * @param {string} name - Worker name
     * @param {string} password - Generated password
     * @returns {Promise<{success: boolean, message: string}>}
     */
    sendPassword: async (email, name, password) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.group('📧 Mock Email Sent');
        console.log(`To: ${email}`);
        console.log(`Subject: Jūsu Scafoteam portāla piekļuves dati`);
        console.log(`Hi ${name},`);
        console.log(`Jūsu reģistrācija ir apstiprināta!`);
        console.log(`Jūsu pagaidu parole ir: ${password}`);
        console.log('---');
        console.groupEnd();

        return {
            success: true,
            message: `Parole veiksmīgi nosūtīta uz ${email}`
        };
    }
};
