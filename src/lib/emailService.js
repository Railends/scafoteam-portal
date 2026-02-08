import emailjs from '@emailjs/browser';

/**
 * Email Service using EmailJS
 * 
 * This service handles sending credentials to workers and alert reports to office.
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
                message: `E-pasts nosūtīts! (Status: ${response.status})`
            };
        } catch (error) {
            console.error('EmailJS Error:', error);
            const errorDetail = error?.text || error?.message || JSON.stringify(error);
            throw new Error(`E-pasta sūtīšana neizdevās: ${errorDetail}. Pārbaudiet EmailJS iestatījumus vai limitus.`);
        }
    },

    /**
     * Sends an urgent alert report to office@scafoteam.fi
     */
    sendAlertReport: async (alerts) => {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        // Use a dedicated template for alerts, fallback to registration template with a warning
        const templateId = import.meta.env.VITE_EMAILJS_ALERT_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

        if (!serviceId || !templateId || !PUBLIC_KEY) {
            console.warn('EmailJS not configured for alerts.');
            return { success: false, message: 'EmailJS Missing' };
        }

        try {
            const urgentAlertsList = alerts
                .filter(a => a.severity === 'urgent')
                .map(a => `
                    <div style="margin-bottom: 12px; background-color: #fff5f5; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; padding: 15px; border-radius: 6px;">
                        <span style="color: #991b1b; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;">
                            ⚠️ ${a.message}
                        </span>
                    </div>
                `)
                .join('');

            if (!urgentAlertsList) return { success: true, message: 'No urgent alerts' };

            const templateParams = {
                to_email: 'office@scafoteam.fi',
                to_name: 'SCAFOTEAM Office',
                subject: 'SVARĪGI: Sistēmas Brīdinājumi',

                // Design variables
                sender_name: 'Scafoteam Portal',
                time: new Date().toLocaleDateString('lv-LV') + ' ' + new Date().toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' }),
                message: urgentAlertsList,
                portal_url: (import.meta.env.VITE_APP_URL || window.location.origin) + '/admin',

                reply_to: 'office@scafoteam.fi'
            };

            await emailjs.send(serviceId, templateId, templateParams);
            return { success: true };
        } catch (error) {
            console.error('Failed to send alert report:', error);
            throw error;
        }
    }
};
