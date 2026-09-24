"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layers,
    Search,
    Trash2,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { fetchAdminProducts, deleteProduct } from "@/lib/api";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import type { Product } from "@/lib/types";

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchAdminProducts(filter === "all" ? undefined : filter).then(setProducts).catch(console.error).finally(() => setLoading(false));
    }, [filter]);

    const filtered = products.filter((p) => {
        const s = search.toLowerCase().trim();
        if (!s) return true;
        return (
            p.name.toLowerCase().includes(s) ||
            p.tagline?.toLowerCase().includes(s) ||
            p.description?.toLowerCase().includes(s) ||
            p.category?.name?.toLowerCase().includes(s) ||
            p.maker?.display_name?.toLowerCase().includes(s)
        );
    });

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try { await deleteProduct(deleteId); setProducts((prev) => prev.filter((p) => p.id !== deleteId)); setDeleteId(null); }
        catch (err) { console.error("Delete error:", err); }
        finally { setDeleteLoading(false); }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "approved": return "bg-[#173022] border-[#214C37] text-[#7FAF8D]";
            case "rejected": return "bg-[#321C1C] border-[#C97878]/30 text-[#C97878]";
            default: return "bg-[#302817] border-[#C9A96A]/30 text-[#C9A96A]";
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <Reveal>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#D8C7A5] to-[#214C37]" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8]">All Products</h1>
                        <p className="text-[#8C958E] text-sm mt-0.5">Manage published and submitted products</p>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm w-full group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5] pl-10 pr-4 py-2.5 outline-none transition-all duration-300 placeholder-[#789181]" />
                    </div>
                    <div className="flex gap-2">
                        {(["all", "approved", "pending", "rejected"] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${filter === f ? "bg-[#D8C7A5] text-[#1A1A16] font-semibold shadow-sm" : "bg-[#151D19] border border-[#202A25] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520]"}`}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </Reveal>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-[#151D19]/80 border border-[#202A25] rounded-2xl p-5 animate-pulse"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-[#101814] rounded-xl" /><div className="flex-1 space-y-2"><div className="h-5 bg-[#1B2520] rounded-lg w-1/4" /><div className="h-4 bg-[#1B2520]/60 rounded-lg w-1/3" /></div></div></div>
                        ))}
                    </motion.div>
                ) : filtered.length > 0 ? (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="hidden md:block bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                                <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead><tr className="border-b border-[#202A25]">
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em]">Product</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em]">Maker</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map((product) => (
                                        <tr key={product.id} className="border-b border-[#202A25]/60 last:border-0 hover:bg-[#1B2520]/40 transition-colors duration-300">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#101814] border border-[#202A25] overflow-hidden shrink-0">{product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-4 h-4 text-[#789181]" /></div>}</div><div className="min-w-0"><p className="font-semibold text-[#F5F1E8] truncate">{product.name}</p><p className="text-xs text-[#8C958E] truncate">{product.tagline}</p></div></div></td>
                                            <td className="px-6 py-4 text-[#8C958E] text-sm">{product.maker?.display_name || "—"}</td>
                                            <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold capitalize ${statusBadge(product.status)}`}>{product.status}</span></td>
                                            <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><a href={product.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-[#8C958E] hover:text-[#D8C7A5] hover:bg-[#1B2520] transition-all duration-300"><ExternalLink className="w-4 h-4" /></a><button onClick={() => setDeleteId(product.id)} className="p-2 rounded-lg text-[#8C958E] hover:text-[#C97878] hover:bg-[#321C1C]/40 transition-all duration-300"><Trash2 className="w-4 h-4" /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                        <div className="md:hidden space-y-3">
                            {filtered.map((product) => (
                                <div key={product.id} className="bg-[#151D19]/90 border border-[#202A25] rounded-2xl p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#101814] border border-[#202A25] overflow-hidden shrink-0">{product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Layers className="w-4 h-4 text-[#789181]" /></div>}</div>
                                    <div className="flex-1 min-w-0"><p className="font-semibold text-[#F5F1E8] text-sm truncate">{product.name}</p><p className="text-xs text-[#8C958E]">by {product.maker?.display_name}</p></div>
                                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${statusBadge(product.status)}`}>{product.status}</span>
                                    <button onClick={() => setDeleteId(product.id)} className="p-2 rounded-lg text-[#8C958E] hover:text-[#C97878]"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 bg-[#151D19]/90 border border-[#202A25] rounded-2xl">
                        <Layers className="w-7 h-7 text-[#789181] mb-3" /><p className="text-[#8C958E] text-sm">No products found</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setDeleteId(null)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-[#151D19] border border-[#202A25] rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[#321C1C] border border-[#C97878]/30 text-[#C97878]"><Trash2 className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold text-[#F5F1E8] mb-2">Delete Product?</h3>
                        <p className="text-[#8C958E] text-sm mb-7">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-[#1B2520] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#202A25] transition-all duration-300 text-sm font-semibold border border-[#202A25]">Cancel</button>
                            <motion.button onClick={handleDelete} disabled={deleteLoading} whileTap={{ scale: 0.97 }} className="flex-1 py-2.5 rounded-xl bg-[#C97878] hover:bg-[#B36868] text-[#1A1A16] text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}Delete
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
