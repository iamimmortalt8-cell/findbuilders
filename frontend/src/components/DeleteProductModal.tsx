"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2, Layers, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface DeleteProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        image_url?: string | null;
    } | null;
    onSuccess: () => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
    isOpen,
    onClose,
    product,
    onSuccess,
}) => {
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setConfirmText("");
            setError(null);
            setIsDeleting(false);
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const isMatch = confirmText === "DELETE";

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isMatch || isDeleting) return;

        setIsDeleting(true);
        setError(null);

        try {
            await api.deleteProduct(product.id);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Delete product error:", err);
            setError(err?.message || "Failed to delete product. Please try again.");
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={isDeleting ? undefined : onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-lg bg-[#151D19] border border-[#C97878]/30 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 overflow-hidden"
                >
                    {/* Top ambient glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#C97878]/10 blur-2xl rounded-full pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#321C1C] border border-[#C97878]/30 flex items-center justify-center shrink-0 text-[#C97878] shadow-[0_0_15px_rgba(201,120,120,0.15)]">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#F5F1E8] tracking-tight">Delete Product?</h2>
                                <p className="text-xs text-[#8C958E] mt-0.5">Permanent action • Cannot be undone</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="p-2 rounded-xl text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors disabled:opacity-40"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Product Preview Card */}
                    <div className="bg-[#101814] border border-[#202A25] rounded-2xl p-4 mb-5 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#0B100E] border border-[#29342E] overflow-hidden shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <Layers className="w-5 h-5 text-[#69736C]" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-[#F5F1E8] truncate text-base">{product.name}</h3>
                            <p className="text-xs text-[#C97878]/90 font-medium mt-0.5">All database records & files will be erased</p>
                        </div>
                    </div>

                    {/* Warning Callout */}
                    <div className="bg-[#321C1C]/60 border border-[#C97878]/25 rounded-2xl p-4 mb-6 text-sm text-[#C5C8C1] leading-relaxed">
                        <p>
                            <strong className="text-[#C97878] font-semibold">This action is permanent.</strong> The product and all of its associated data (screenshots, votes, comments, and storage files) will be permanently deleted and cannot be recovered.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-[#321C1C] border border-[#C97878]/40 rounded-2xl p-3.5 mb-5 flex items-center gap-2.5 text-[#C97878] text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Confirmation */}
                    <form onSubmit={handleDelete} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-[#C5C8C1]">
                                Type <code className="px-1.5 py-0.5 rounded bg-[#321C1C] text-[#C97878] border border-[#C97878]/30 font-mono font-bold text-[11px]">DELETE</code> to permanently delete this product:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                autoFocus
                                disabled={isDeleting}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder-[#69736C] font-mono tracking-wider ${
                                    isMatch
                                        ? "border-[#C97878] ring-2 ring-[#C97878]/20 bg-[#321C1C]/30"
                                        : "border-[#29342E] focus:border-[#789181]"
                                }`}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors disabled:opacity-40 text-center justify-center"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={!isMatch || isDeleting}
                                className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg ${
                                    isMatch && !isDeleting
                                        ? "bg-[#C97878] hover:bg-[#d48989] text-[#1A1A16] shadow-[0_4px_16px_rgba(201,120,120,0.25)] cursor-pointer"
                                        : "bg-[#321C1C]/40 text-[#C97878]/40 border border-[#C97878]/20 cursor-not-allowed"
                                }`}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Permanently Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
