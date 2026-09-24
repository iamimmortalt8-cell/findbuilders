"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, type === 'error' ? 5000 : 3000);
    }, []);

    const toast = useCallback((message: string, type?: ToastType) => addToast(message, type), [addToast]);
    const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast, success, error }}>
            {children}
            <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-full max-w-sm pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
                                t.type === 'success' ? 'bg-[#173022]/95 border-[#7FAF8D]/30 text-[#7FAF8D]' :
                                t.type === 'error' ? 'bg-[#321C1C]/95 border-[#C97878]/30 text-[#C97878]' :
                                'bg-[#151D19]/95 border-[#202A25] text-[#D8C7A5]'
                            }`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                {t.type === 'info' && <Info className="w-5 h-5" />}
                            </div>
                            <p className="flex-1 text-sm font-medium leading-relaxed">{t.message}</p>
                            <button 
                                onClick={() => removeToast(t.id)}
                                className="shrink-0 p-1 -mt-1 -mr-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};
