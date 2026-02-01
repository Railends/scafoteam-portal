import Pizzip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import ImageModule from 'docxtemplater-image-module-free';

const base64ToBinary = (base64) => {
    if (!base64) return new Uint8Array(0).buffer;
    const binaryString = window.atob(base64.split(',')[1] || base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const docGenerator = {
    /**
     * Generates a PDF document from a .docx template and worker data
     * @param {string} templateBase64 - Base64 encoded .docx template
     * @param {Object} worker - Worker data object
     * @param {string} templateName - Name of the template (for filename)
     * @returns {Promise<{name: string, content: string}>} - Generated PDF as Base64
     */
    generatePDF: async (templateBase64, worker, templateName) => {
        try {
            // 1. Decode base64 to array buffer
            const binaryString = window.atob(templateBase64.split(',')[1] || templateBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const buffer = bytes.buffer;

            // 2. Prepare data for docxtemplater
            // Flatten worker data for easier access in templates
            const data = {
                name: worker.name || '',
                surname: worker.surname || '',
                nationality: worker.nationality || '',
                personalId: worker.personalId || '',
                finnishId: worker.finnishId || '',
                taxNumber: worker.taxNumber || '',
                email: worker.email || '',
                phone: worker.phone || '',
                address: worker.address || '',
                bankAccount: worker.bankAccount || '',
                bicCode: worker.bicCode || '',
                experienceType: worker.experienceType || '',
                experienceDuration: worker.experienceDuration || '',
                jacketSize: worker.jacketSize || '',
                pantsSize: worker.pantsSize || '',
                waistSize: worker.waistSize || '',
                bootsSize: worker.bootsSize || '',
                emergencyContact: worker.emergencyContact || '',
                project: worker.adminData?.project || '',
                hourlyRate: worker.adminData?.hourlyRate || '',
                contractStart: worker.adminData?.contractStart || '',
                contractEnd: worker.adminData?.contractEnd || '',
                rentAddress: worker.adminData?.rentAddress || '',
                rentPrice: worker.adminData?.rentPrice || '',
                date: new Date().toLocaleDateString(),
                signingDate: new Date().toLocaleDateString('lv-LV')
            };

            // 3. Fill Docx placeholders
            const zip = new Pizzip(buffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(data);
            const filledContent = doc.getZip().generate({
                type: 'arraybuffer',
                compression: 'DEFLATE',
            });

            // 4. Convert Filled Docx to HTML using Mammoth
            const { value: html } = await mammoth.convertToHtml({ arrayBuffer: filledContent });

            // 5. Convert HTML to PDF using html2pdf.js
            const element = document.createElement('div');
            element.innerHTML = `<div style="padding: 40px; font-family: Arial, sans-serif; line-height: 1.6;">${html}</div>`;

            const pdfBlob = await html2pdf()
                .from(element)
                .set({
                    margin: 10,
                    filename: `${templateName}_${worker.name}_${worker.surname}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                })
                .output('blob');

            // 6. Convert PDF Blob to Base64
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: `${templateName}_${worker.name}_${worker.surname}.pdf`,
                        content: reader.result
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
            });

        } catch (error) {
            console.error('Document generation error:', error);
            throw error;
        }
    },

    /**
     * Generates a filled .docx document and returns it as Base64
     */
    generateDOCX: async (templateBase64, worker, templateName, signature = null) => {
        try {
            const binaryString = window.atob(templateBase64.split(',')[1] || templateBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const buffer = bytes.buffer;

            const data = {
                name: worker.name || '',
                surname: worker.surname || '',
                nationality: worker.nationality || '',
                personalId: worker.personalId || '',
                finnishId: worker.finnishId || '',
                taxNumber: worker.taxNumber || '',
                email: worker.email || '',
                phone: worker.phone || '',
                address: worker.address || '',
                bankAccount: worker.bankAccount || '',
                bicCode: worker.bicCode || '',
                experienceType: worker.experienceType || '',
                experienceDuration: worker.experienceDuration || '',
                jacketSize: worker.jacketSize || '',
                pantsSize: worker.pantsSize || '',
                waistSize: worker.waistSize || '',
                bootsSize: worker.bootsSize || '',
                emergencyContact: worker.emergencyContact || '',
                project: worker.adminData?.project || '',
                hourlyRate: worker.adminData?.hourlyRate || '',
                contractStart: worker.adminData?.contractStart || '',
                contractEnd: worker.adminData?.contractEnd || '',
                rentAddress: worker.adminData?.rentAddress || '',
                rentPrice: worker.adminData?.rentPrice || '',
                date: new Date().toLocaleDateString(),
                signingDate: new Date().toLocaleDateString('lv-LV'),
                signature: signature
            };

            const imageOptions = {
                centered: false,
                getImage: (tagValue) => {
                    if (!tagValue) return null;
                    return base64ToBinary(tagValue);
                },
                getSize: () => [150, 60] // Constant size for signature
            };
            const imageModule = new ImageModule(imageOptions);

            const zip = new Pizzip(buffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: [imageModule]
            });

            doc.render(data);
            const filledContent = doc.getZip().generate({
                type: 'arraybuffer',
                compression: 'DEFLATE',
            });

            // Convert ArrayBuffer to Base64 for storage
            const binary = String.fromCharCode(...new Uint8Array(filledContent));
            const base64 = window.btoa(binary);

            return {
                name: `${templateName}_${worker.name}_${worker.surname}.docx`,
                content: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
            };
        } catch (error) {
            console.error('Docx generation error:', error);
            throw error;
        }
    }
};
