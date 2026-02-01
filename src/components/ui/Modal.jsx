import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Modal({ isOpen, onClose, title, children, className }) {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn("relative w-full bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col", className)}
                >
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold text-scafoteam-navy">{title}</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
