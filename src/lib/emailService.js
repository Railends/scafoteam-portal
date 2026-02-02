import emailjs from '@emailjs/browser';

/**
 * Email Service using EmailJS
 * 
 * This service handles sending credentials to workers.
 * It uses environment variables for configuration.
 */

// Initialize EmailJS with Public Key if available
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

export const emailService = {
    /**
     * Sends a password to a worker using EmailJS
     */
    sendPassword: async (email, name, password) => {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

        if (!serviceId || !templateId || !PUBLIC_KEY) {
            console.warn('EmailJS not configured. Falling back to mock logs.');
            console.group('📧 Mock Email Sent (EmailJS Missing)');
            console.log(`To: ${email}`);
            console.log(`Hi ${name}, your password is: ${password}`);
            console.groupEnd();
            return { success: true, message: 'Mock email logged' };
        }

        try {
            const templateParams = {
                to_email: email,
                to_name: name,
                temp_password: password,
                reply_to: 'info@scafoteam.fi'
            };

            const response = await emailjs.send(serviceId, templateId, templateParams);

            return {
                success: true,
                message: `E-pasts nosūtīts! (ID: ${response.status})`
            };
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw new Error('E-pasta sūtīšana neizdevās. Lūdzu, pārbaudiet EmailJS iestatījumus.');
        }
    }
};

