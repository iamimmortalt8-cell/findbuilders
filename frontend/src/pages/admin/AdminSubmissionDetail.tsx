"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    ExternalLink,
    Layers,
    Clock,
    Loader2,
} from "lucide-react";
import { fetchProduct, approveProduct, rejectProduct } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/types";

export default function AdminSubmissionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchProduct(id).then(setProduct).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handleApprove = async () => {
        if (!id) return;
        setActionLoading(true);
        try { await approveProduct(id); navigate("/admin/submissions"); }
        catch (err) { console.error("Approve error:", err); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!id) return;
        setActionLoading(true);
        try { await rejectProduct(id, rejectReason); navigate("/admin/submissions"); }
        catch (err) { console.error("Reject error:", err); }
        finally { setActionLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
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
                <Link to="/admin/submissions" className="text-[#D8C7A5] hover:underline">Back to submissions</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Reveal>
                <Link to="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-[#8C958E] hover:text-[#D8C7A5] transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Submissions
                </Link>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Reveal>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full aspect-video object-cover" />
                            ) : (
                                <div className="w-full aspect-video flex items-center justify-center bg-[#101814]">
                                    <Layers className="w-16 h-16 text-[#789181]" />
                                </div>
                            )}
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6">
                            <h1 className="text-2xl font-bold text-[#F5F1E8] mb-2">{product.name}</h1>
                            <p className="text-[#8C958E] text-base mb-4">{product.tagline}</p>
                            <div className="h-px bg-[#202A25] my-4" />
                            <h3 className="text-sm font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">Description</h3>
                            <p className="text-[#C5C8C1] text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={0.15}>
                    <div className="space-y-4">
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">Status</h3>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#C9A96A]" />
                                <span className="text-sm font-semibold text-[#C9A96A] capitalize">{product.status}</span>
                            </div>
                        </div>

                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">Maker</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1B2520] flex items-center justify-center ring-1 ring-[#202A25]">
                                    {product.maker?.avatar_url ? (
                                        <img src={product.maker.avatar_url} alt={product.maker.display_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-[#8C958E]">{product.maker?.display_name?.charAt(0) || "?"}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#F5F1E8]">{product.maker?.display_name || "Unknown"}</p>
                                    <p className="text-xs text-[#8C958E]">{product.maker?.bio}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#789181]">Category</span>
                                <span className="text-sm text-[#F5F1E8] font-medium">{product.category?.name || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#789181]">Submitted</span>
                                <span className="text-sm text-[#F5F1E8] font-medium">
                                    {new Date(product.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#789181]">Website</span>
                                <a href={product.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#D8C7A5] hover:underline flex items-center gap-1 font-medium">
                                    Visit <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {product.status === "pending" && (
                            <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 space-y-3">
                                <h3 className="text-xs font-bold text-[#789181] uppercase tracking-[0.12em] mb-3">Moderation</h3>
                                <motion.button onClick={handleApprove} disabled={actionLoading} whileTap={{ scale: 0.97 }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 shadow-sm disabled:opacity-50">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve
                                </motion.button>
                                <motion.button onClick={() => setShowRejectModal(true)} disabled={actionLoading} whileTap={{ scale: 0.97 }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#321C1C] hover:bg-[#402222] text-[#C97878] text-sm font-semibold rounded-xl border border-[#C97878]/30 transition-all duration-300 disabled:opacity-50">
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </motion.button>
                            </div>
                        )}

                        {product.status === "rejected" && product.rejection_reason && (
                            <div className="bg-[#321C1C]/40 border border-[#C97878]/20 rounded-2xl p-5">
                                <h3 className="text-xs font-bold text-[#C97878] uppercase tracking-[0.12em] mb-2">Rejection Reason</h3>
                                <p className="text-sm text-[#C5C8C1]">{product.rejection_reason}</p>
                            </div>
                        )}
                    </div>
                </Reveal>
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowRejectModal(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.3, ease: [0.22, 0.03, 0.26, 1] }} className="relative w-full max-w-md bg-[#151D19] border border-[#202A25] rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-6">
                        <h3 className="text-lg font-bold text-[#F5F1E8] mb-2">Reject Product</h3>
                        <p className="text-sm text-[#8C958E] mb-4">Provide a reason for rejection (optional but recommended).</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Why is this product being rejected?"
                            rows={3}
                            className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#C97878]/50 focus:border-[#C97878] p-3 outline-none transition-all duration-300 placeholder-[#789181] resize-none mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] bg-[#1B2520] hover:bg-[#202A25] transition-all duration-300">Cancel</button>
                            <motion.button onClick={handleReject} disabled={actionLoading} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-4 py-2 bg-[#C97878] hover:bg-[#B36868] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Reject
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
