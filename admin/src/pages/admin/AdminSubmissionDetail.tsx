"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    ExternalLink,
    Layers,
    Clock,
    Loader2,
    ImageIcon,
    Maximize2,
    X,
    ChevronLeft,
    ChevronRight,
    Globe,
    Calendar,
    Tag,
} from "lucide-react";
import { fetchProduct, fetchProductImages, approveProduct, rejectProduct } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import type { Product, ProductImage } from "@/lib/types";

export default function AdminSubmissionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [screenshots, setScreenshots] = useState<ProductImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    
    // Lightbox state
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            fetchProduct(id),
            fetchProductImages(id).catch(() => [])
        ])
            .then(([prod, imgs]) => {
                setProduct(prod);
                setScreenshots(imgs || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleApprove = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await approveProduct(id);
            navigate("/admin/submissions");
        } catch (err) {
            console.error("Approve error:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await rejectProduct(id, rejectReason);
            navigate("/admin/submissions");
        } catch (err) {
            console.error("Reject error:", err);
        } finally {
            setActionLoading(false);
        }
    };

    // Lightbox keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (lightboxIndex === null) return;
        if (e.key === "Escape") {
            setLightboxIndex(null);
        } else if (e.key === "ArrowLeft") {
            setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1));
        } else if (e.key === "ArrowRight") {
            setLightboxIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0));
        }
    }, [lightboxIndex, screenshots.length]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-28">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-[#151D19] border border-[#202A25] flex items-center justify-center mx-auto mb-5">
                    <Layers className="w-7 h-7 text-[#789181]" />
                </div>
                <h2 className="text-xl font-bold text-[#F5F1E8] mb-4">Submission not found</h2>
                <Link to="/admin/submissions" className="text-[#D8C7A5] hover:underline">
                    Back to submissions
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <Reveal>
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to="/admin/submissions"
                        className="inline-flex items-center gap-1.5 text-sm text-[#8C958E] hover:text-[#D8C7A5] transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Submissions
                    </Link>
                    <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border ${
                        product.status === "approved"
                            ? "bg-[#173022] border-[#214C37] text-[#7FAF8D]"
                            : product.status === "rejected"
                            ? "bg-[#321C1C] border-[#C97878]/30 text-[#C97878]"
                            : "bg-[#302817] border-[#C9A96A]/30 text-[#C9A96A]"
                    }`}>
                        {product.status}
                    </span>
                </div>
            </Reveal>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Product Details, Logo, Description & Screenshots */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card with uncropped contained logo */}
                    <Reveal>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                {/* Product Logo */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#101814] border border-[#202A25] p-2 flex items-center justify-center flex-shrink-0 shadow-inner">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={`${product.name} logo`}
                                            className="w-full h-full object-contain rounded-xl"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#789181]">
                                            <Layers className="w-8 h-8 mb-1" />
                                            <span className="text-[9px] uppercase tracking-wider font-medium">No Logo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Title & Tagline */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F1E8] tracking-tight truncate">
                                            {product.name}
                                        </h1>
                                        {product.category && (
                                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-[#1B2520] text-[#C5C8C1] border border-[#202A25]">
                                                <Tag className="w-3 h-3 text-[#7FAF8D]" />
                                                {product.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[#8C958E] text-sm sm:text-base mt-1.5 leading-snug">
                                        {product.tagline}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-[#789181] flex-wrap">
                                        <a
                                            href={product.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[#D8C7A5] hover:text-[#E5D5B5] transition-colors font-medium"
                                        >
                                            <Globe className="w-3.5 h-3.5" />
                                            {product.website_url.replace(/^https?:\/\//, "")}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(product.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Description Card */}
                    <Reveal delay={0.05}>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 shadow-xl">
                            <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.14em] mb-3">
                                Product Description
                            </h3>
                            <div className="text-[#C5C8C1] text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {product.description}
                            </div>
                        </div>
                    </Reveal>

                    {/* Screenshots Gallery Section */}
                    <Reveal delay={0.1}>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#7FAF8D]" />
                                    <h3 className="text-xs font-bold text-[#C5C8C1] uppercase tracking-[0.14em]">
                                        Product Screenshots
                                    </h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B2520] border border-[#202A25] text-[#D8C7A5] font-semibold">
                                        {screenshots.length}
                                    </span>
                                </div>
                                <span className="text-xs text-[#8C958E]">
                                    Click any screenshot to view full-size
                                </span>
                            </div>

                            {screenshots.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {screenshots.map((img, idx) => (
                                        <div
                                            key={img.id || idx}
                                            onClick={() => setLightboxIndex(idx)}
                                            className="group relative aspect-video rounded-xl bg-[#101814] border border-[#202A25] overflow-hidden cursor-pointer hover:border-[#214C37] transition-all duration-300"
                                        >
                                            {/* Contained image with 16:9 aspect ratio preservation */}
                                            <img
                                                src={img.image_url}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02]"
                                            />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D19]/90 text-[#F5F1E8] text-xs font-semibold border border-[#202A25]">
                                                    <Maximize2 className="w-3.5 h-3.5 text-[#D8C7A5]" />
                                                    View Full Size
                                                </span>
                                            </div>
                                            {/* Index badge */}
                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0B100E]/80 border border-[#202A25] text-[10px] font-mono text-[#8C958E]">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-[#202A25] rounded-xl bg-[#101814]/50">
                                    <ImageIcon className="w-8 h-8 text-[#789181] mb-2" />
                                    <p className="text-sm text-[#8C958E] font-medium">No screenshots uploaded</p>
                                    <p className="text-xs text-[#789181] mt-1">
                                        The builder did not include any additional screenshots for this product.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Reveal>
                </div>

                {/* Right Column: Maker Details & Moderation Action Sidebar */}
                <Reveal delay={0.15}>
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 shadow-xl">
                            <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">
                                Submission Status
                            </h3>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C9A96A]" />
                                <span className="text-sm font-semibold text-[#C9A96A] capitalize">
                                    {product.status} Review
                                </span>
                            </div>
                        </div>

                        {/* Maker Profile */}
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 shadow-xl">
                            <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">
                                Submitted By (Maker)
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#1B2520] flex items-center justify-center ring-1 ring-[#202A25] overflow-hidden flex-shrink-0">
                                    {product.maker?.avatar_url ? (
                                        <img
                                            src={product.maker.avatar_url}
                                            alt={product.maker.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-[#8C958E]">
                                            {product.maker?.display_name?.charAt(0) || "?"}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#F5F1E8] truncate">
                                        {product.maker?.display_name || "Anonymous Maker"}
                                    </p>
                                    <p className="text-xs text-[#8C958E] truncate">
                                        ID: {product.maker_id.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Details */}
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 space-y-3 shadow-xl">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-xs text-[#789181]">Category</span>
                                <span className="text-[#F5F1E8] font-medium">{product.category?.name || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-xs text-[#789181]">Submitted On</span>
                                <span className="text-[#F5F1E8] font-medium">
                                    {new Date(product.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-xs text-[#789181]">Website URL</span>
                                <a
                                    href={product.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#D8C7A5] hover:underline flex items-center gap-1 font-medium"
                                >
                                    Open Link <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Moderation Actions */}
                        {product.status === "pending" && (
                            <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 space-y-3 shadow-xl">
                                <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-2">
                                    Moderation Decision
                                </h3>
                                <motion.button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    Approve Product
                                </motion.button>
                                <motion.button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#321C1C] hover:bg-[#402222] text-[#C97878] text-sm font-semibold rounded-xl border border-[#C97878]/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject Product
                                </motion.button>
                            </div>
                        )}

                        {product.status === "rejected" && product.rejection_reason && (
                            <div className="bg-[#321C1C]/40 border border-[#C97878]/20 rounded-2xl p-5 shadow-xl">
                                <h3 className="text-xs font-bold text-[#C97878] uppercase tracking-[0.12em] mb-2">
                                    Rejection Reason
                                </h3>
                                <p className="text-sm text-[#C5C8C1]">{product.rejection_reason}</p>
                            </div>
                        )}
                    </div>
                </Reveal>
            </div>

            {/* Lightbox / Full-Screen Screenshot Preview Modal */}
            <AnimatePresence>
                {lightboxIndex !== null && screenshots[lightboxIndex] && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                            onClick={() => setLightboxIndex(null)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10"
                        >
                            {/* Top Controls Bar */}
                            <div className="w-full flex items-center justify-between text-[#F5F1E8] mb-3 px-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#151D19] border border-[#202A25] text-[#C5C8C1]">
                                        Screenshot {lightboxIndex + 1} of {screenshots.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="p-2 rounded-xl bg-[#151D19] hover:bg-[#1B2520] text-[#F5F1E8] transition-colors border border-[#202A25]"
                                    title="Close (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Main Enlarged Screenshot Container */}
                            <div className="relative w-full flex items-center justify-center bg-[#101814] border border-[#202A25] rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-4">
                                <img
                                    src={screenshots[lightboxIndex].image_url}
                                    alt={`Screenshot ${lightboxIndex + 1}`}
                                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
                                />

                                {/* Previous Button */}
                                {screenshots.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((prev) =>
                                                prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
                                            );
                                        }}
                                        className="absolute left-4 p-3 rounded-full bg-[#0B100E]/80 hover:bg-[#151D19] text-[#F5F1E8] transition-all border border-[#202A25] hover:scale-105 shadow-xl"
                                        title="Previous (Left Arrow)"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                )}

                                {/* Next Button */}
                                {screenshots.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((prev) =>
                                                prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
                                            );
                                        }}
                                        className="absolute right-4 p-3 rounded-full bg-[#0B100E]/80 hover:bg-[#151D19] text-[#F5F1E8] transition-all border border-[#202A25] hover:scale-105 shadow-xl"
                                        title="Next (Right Arrow)"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reject Confirmation Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/75 backdrop-blur-md"
                            onClick={() => setShowRejectModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            transition={{ duration: 0.25, ease: [0.22, 0.03, 0.26, 1] }}
                            className="relative w-full max-w-md bg-[#151D19] border border-[#202A25] rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-6 z-10"
                        >
                            <h3 className="text-lg font-bold text-[#F5F1E8] mb-2">Reject Product</h3>
                            <p className="text-sm text-[#8C958E] mb-4">
                                Provide a reason for rejection so the builder knows how to improve.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Why is this product being rejected?"
                                rows={3}
                                className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#C97878]/50 focus:border-[#C97878] p-3 outline-none transition-all duration-300 placeholder-[#789181] resize-none mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] bg-[#1B2520] hover:bg-[#202A25] transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#C97878] hover:bg-[#B36868] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Reject
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
