"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const { user, profile, loading, isAdmin } = useAuth();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate("/admin/login");
            } else if (!isAdmin) {
                navigate("/");
            }
        }
    }, [user, loading, isAdmin, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    return (
        <div className="flex min-h-screen bg-[#0B100E]">
            <Sidebar />
            <main className="flex-1 min-w-0 pt-14 lg:pt-0">
                <div className="p-6 lg:p-10">{children}</div>
            </main>
        </div>
    );
}
