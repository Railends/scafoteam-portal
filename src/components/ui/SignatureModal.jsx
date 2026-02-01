import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SignatureModal({ isOpen, onClose, onSave, isSigning }) {
    const { t } = useTranslation();
    const sigPad = useRef(null);

    const clear = () => {
        sigPad.current.clear();
    };

    const save = () => {
        console.log('SignatureModal: Save clicked');
        if (!sigPad.current) {
            console.error('SignatureModal: sigPad.current is null');
            return;
        }
        if (sigPad.current.isEmpty()) {
            console.warn('SignatureModal: Canvas is empty');
            alert(t('admin_please_sign') || 'Lūdzu, parakstieties!');
            return;
        }
        try {
            // Using getCanvas() instead of getTrimmedCanvas() because of a known dependency bug 
            // with trim-canvas in react-signature-canvas alpha versions
            const canvas = sigPad.current.getCanvas();
            const dataUrl = canvas.toDataURL('image/png');
            console.log('SignatureModal: Captured signature data URL via getCanvas');
            onSave(dataUrl);
        } catch (e) {
            console.error('SignatureModal: Failed to capture signature', e);
            alert('Neizdevās saglabāt parakstu: ' + e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-scafoteam-navy/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-scafoteam-navy text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-tight">{t('admin_signature_pad')}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                        <SignatureCanvas
                            ref={sigPad}
                            penColor="#1a2b4b"
                            canvasProps={{
                                className: "w-full h-64 cursor-crosshair",
                            }}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                    <Button variant="ghost" onClick={clear} className="text-gray-500 hover:text-scafoteam-navy">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t('admin_clear_signature')}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={save} disabled={isSigning} className="bg-scafoteam-navy hover:bg-scafoteam-navy/90 text-white min-w-[100px]">
                            {isSigning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {t('save')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
