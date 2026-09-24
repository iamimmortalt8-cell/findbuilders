"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Plus,
    Layers,
    Clock,
    CheckCircle,
    XCircle,
    ExternalLink,
    Edit,
    Trash2,
    TrendingUp,
    LogOut,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchUserProducts } from "@/lib/api";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import { DeleteProductModal } from "@/components/DeleteProductModal";
import { useToast } from "@/lib/toast-context";
import type { Product } from "@/lib/types";

export default function BuilderDashboard() {
    const navigate = useNavigate();
    const { user, profile, signOut, loading: authLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (!authLoading && !user) navigate("/login");
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            fetchUserProducts(user.id).then(setProducts).catch(console.error).finally(() => setLoading(false));
        }
    }, [user]);

    const handleSignOut = async () => { await signOut(); navigate("/"); };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#29342E] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case "approved": return <CheckCircle className="w-4 h-4 text-[#7FAF8D]" />;
            case "rejected": return <XCircle className="w-4 h-4 text-[#C97878]" />;
            case "draft": return <Edit className="w-4 h-4 text-[#8C958E]" />;
            default: return <Clock className="w-4 h-4 text-[#C9A96A]" />;
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "approved": return "bg-[#173022] border-[#7FAF8D]/30 text-[#7FAF8D]";
            case "rejected": return "bg-[#321C1C] border-[#C97878]/30 text-[#C97878]";
            case "draft": return "bg-[#151D19] border-[#202A25] text-[#8C958E]";
            default: return "bg-[#302817] border-[#C9A96A]/30 text-[#C9A96A]";
        }
    };

    return (
        <div className="min-h-screen bg-[#0B100E] text-[#F5F1E8]">
            {/* Top Bar */}
            <div className="border-b border-[#202A25] bg-[#101814]/90 backdrop-blur-2xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="text-lg font-bold tracking-tight text-[#F5F1E8]">
                        <span className="text-[#D8C7A5]">Find</span>Builders
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/submit"
                            className="flex items-center gap-2 px-4 py-2 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(216,199,165,0.25)]"
                        >
                            <Plus className="w-4 h-4" />
                            Submit Product
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1B2520] border border-[#29342E] flex items-center justify-center">
                                <span className="text-xs font-bold text-[#8C958E]">
                                    {profile?.display_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            </div>
                            <button onClick={handleSignOut} className="p-2 rounded-lg text-[#8C958E] hover:text-[#C97878] hover:bg-[#321C1C]/40 transition-all duration-300 cursor-pointer" title="Sign out">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <Reveal>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#2E6549] to-[#214C37]" />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8]">My Products</h1>
                            <p className="text-[#8C958E] text-sm mt-0.5">Manage your submitted products</p>
                        </div>
                    </div>
                </Reveal>

                {/* Stats */}
                <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" staggerDelay={0.05}>
                    {[
                        { label: "Total", value: products.length },
                        { label: "Drafts", value: products.filter((p) => p.status === "draft").length },
                        { label: "Pending", value: products.filter((p) => p.status === "pending").length },
                        { label: "Approved", value: products.filter((p) => p.status === "approved").length },
                    ].map((stat) => (
                        <StaggerItem key={stat.label}>
                            <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 hover:border-[#2E6549] transition-all duration-300">
                                <p className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.12em] mb-2">{stat.label}</p>
                                <p className="text-3xl font-bold text-[#F5F1E8]">{stat.value}</p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Products List */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-[#151D19] border border-[#202A25] rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#1B2520] rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-[#1B2520] rounded-lg w-1/3" />
                                        <div className="h-4 bg-[#1B2520] rounded-lg w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <StaggerContainer className="space-y-4" staggerDelay={0.06}>
                        {products.map((product) => (
                            <StaggerItem key={product.id}>
                                <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 hover:border-[#2E6549] transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#101814] border border-[#29342E] overflow-hidden shrink-0 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Layers className="w-5 h-5 text-[#69736C]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-[#F5F1E8] truncate">{product.name}</h3>
                                                {statusIcon(product.status)}
                                            </div>
                                            <p className="text-sm text-[#8C958E] truncate">{product.tagline}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-1 text-xs text-[#8C958E] mr-1">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                {product.upvotes_count}
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold capitalize ${statusBadge(product.status)}`}>
                                                {product.status}
                                            </span>
                                            <Link
                                                to={`/builder/product/${product.id}/edit`}
                                                className="p-2 rounded-lg text-[#8C958E] hover:text-[#D8C7A5] hover:bg-[#1B2520] transition-all duration-300"
                                                title="Edit product"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            {product.status === "approved" && (
                                                <a
                                                    href={product.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg text-[#8C958E] hover:text-[#D8C7A5] hover:bg-[#1B2520] transition-all duration-300"
                                                    title="Visit website"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setProductToDelete(product)}
                                                className="p-2 rounded-lg text-[#8C958E] hover:text-[#C97878] hover:bg-[#321C1C]/40 transition-all duration-300 cursor-pointer"
                                                title="Delete product permanently"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                ) : (
                    <Reveal>
                        <div className="flex flex-col items-center justify-center py-24 bg-[#151D19] border border-[#202A25] rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-5">
                                <Layers className="w-7 h-7 text-[#69736C]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#F5F1E8] mb-2">No products yet</h3>
                            <p className="text-[#8C958E] text-sm mb-6">Submit your first product and get discovered!</p>
                            <Link to="/submit" className="inline-flex items-center gap-2 px-6 py-3 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_20px_rgba(216,199,165,0.25)]">
                                <Plus className="w-4 h-4" />
                                Submit Product
                            </Link>
                        </div>
                    </Reveal>
                )}
            </div>

            {/* Permanent Delete Modal */}
            <DeleteProductModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                product={productToDelete}
                onSuccess={() => {
                    if (productToDelete) {
                        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
                        toast.success(`"${productToDelete.name}" was permanently deleted.`);
                    }
                }}
            />
        </div>
    );
}
