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
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-6 text-center">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6", colors[variant])}>
                    <Icon className="w-8 h-8" />
                </div>
                {title && <h3 className="text-xl font-black text-scafoteam-navy mb-2">{title}</h3>}
                <p className="text-gray-500 mb-8 font-medium">{message}</p>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl font-bold h-12 uppercase tracking-wider text-[10px]">
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={cn(
                            "rounded-xl font-bold h-12 uppercase tracking-wider text-[10px]",
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
