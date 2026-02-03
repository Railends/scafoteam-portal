import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { HelpCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    variant = 'info'
}) {
    const Icons = {
        info: HelpCircle,
        warning: AlertTriangle,
        danger: AlertCircle
    };
    const Icon = Icons[variant] || HelpCircle;

    const colors = {
        info: 'text-blue-500 bg-blue-50',
        warning: 'text-amber-500 bg-amber-50',
        danger: 'text-red-500 bg-red-50'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" className="sm:max-w-md">
            <div className="p-4 text-center">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", colors[variant])}>
                    <Icon className="w-6 h-6" />
                </div>
                {title && <h3 className="text-base font-black text-scafoteam-navy mb-2 uppercase tracking-tight">{title}</h3>}
                <p className="text-gray-600 mb-4 text-sm font-medium leading-relaxed">{message}</p>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={onClose} className="rounded-lg font-bold h-10 text-xs">
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={cn(
                            "rounded-lg font-bold h-10 text-xs",
                            variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-scafoteam-navy hover:bg-blue-900'
                        )}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
