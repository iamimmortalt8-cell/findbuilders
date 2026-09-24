"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Layers,
    Clock,
    CheckCircle,
    XCircle,
    Users,
    Inbox,
    ArrowRight,
} from "lucide-react";
import { fetchAdminStats } from "@/lib/api";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        total_products: 0, pending_products: 0, approved_products: 0, rejected_products: 0, total_users: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    const statCards = [
        { label: "Total Products", value: stats.total_products, icon: Layers, iconStyle: "bg-[#1B2520] text-[#C5C8C1] border border-[#202A25]" },
        { label: "Pending Review", value: stats.pending_products, icon: Clock, iconStyle: "bg-[#302817] text-[#C9A96A] border border-[#C9A96A]/30", link: "/admin/submissions" },
        { label: "Approved", value: stats.approved_products, icon: CheckCircle, iconStyle: "bg-[#173022] text-[#7FAF8D] border border-[#7FAF8D]/30" },
        { label: "Rejected", value: stats.rejected_products, icon: XCircle, iconStyle: "bg-[#321C1C] text-[#C97878] border border-[#C97878]/30" },
        { label: "Total Users", value: stats.total_users, icon: Users, iconStyle: "bg-[#1A2624] text-[#D8C7A5] border border-[#D8C7A5]/30" },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Reveal>
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#D8C7A5] to-[#214C37]" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8]">Admin Dashboard</h1>
                        <p className="text-[#8C958E] text-sm mt-0.5">Platform overview and moderation</p>
                    </div>
                </div>
            </Reveal>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10" staggerDelay={0.05}>
                {statCards.map((stat) => (
                    <StaggerItem key={stat.label}>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 hover:border-[#214C37] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${stat.iconStyle} flex items-center justify-center`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                {stat.link && (
                                    <Link to={stat.link} className="text-xs text-[#C9A96A] hover:underline flex items-center gap-1 font-medium">
                                        View <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                            <p className="text-3xl font-bold text-[#F5F1E8]">{loading ? "—" : stat.value}</p>
                            <p className="text-xs text-[#8C958E] mt-1 font-medium">{stat.label}</p>
                        </div>
                    </StaggerItem>
                ))}
            </StaggerContainer>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5" staggerDelay={0.1}>
                <StaggerItem>
                    <Link to="/admin/submissions" className="group block bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 hover:border-[#C9A96A]/40 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#302817] border border-[#C9A96A]/30 flex items-center justify-center">
                                <Inbox className="w-6 h-6 text-[#C9A96A]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#F5F1E8] group-hover:text-[#C9A96A] transition-colors">Review Submissions</h3>
                                <p className="text-sm text-[#8C958E]">{loading ? "Loading..." : `${stats.pending_products} products waiting for review`}</p>
                            </div>
                        </div>
                    </Link>
                </StaggerItem>
                <StaggerItem>
                    <Link to="/admin/products" className="group block bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-6 hover:border-[#214C37] transition-all duration-300 hover:-translate-y-0.5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#173022] border border-[#214C37] flex items-center justify-center">
                                <Layers className="w-6 h-6 text-[#7FAF8D]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#F5F1E8] group-hover:text-[#D8C7A5] transition-colors">Manage Products</h3>
                                <p className="text-sm text-[#8C958E]">{loading ? "Loading..." : `${stats.approved_products} published products`}</p>
                            </div>
                        </div>
                    </Link>
                </StaggerItem>
            </StaggerContainer>
        </div>
    );
}
