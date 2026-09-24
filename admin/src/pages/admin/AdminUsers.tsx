"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Shield,
    Mail,
    CalendarDays,
    X,
} from "lucide-react";
import { fetchAllProfiles } from "@/lib/api";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import type { Profile } from "@/lib/types";

export default function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

    useEffect(() => {
        fetchAllProfiles().then(setProfiles).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = profiles.filter(
        (p) => p.display_name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <Reveal>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#D8C7A5] to-[#214C37]" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8]">Users</h1>
                        <p className="text-[#8C958E] text-sm mt-0.5">{profiles.length} registered users</p>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="relative max-w-md mb-6 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5] pl-10 pr-4 py-2.5 outline-none transition-all duration-300 placeholder-[#789181]" />
                </div>
            </Reveal>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-[#151D19]/80 border border-[#202A25] rounded-2xl p-5 animate-pulse">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#101814]" /><div className="flex-1 space-y-2"><div className="h-4 bg-[#1B2520] rounded-lg w-1/2" /><div className="h-3 bg-[#1B2520]/60 rounded-lg w-1/3" /></div></div>
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.04}>
                    {filtered.map((profile) => (
                        <StaggerItem key={profile.id}>
                            <div onClick={() => setSelectedProfile(profile)} className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 hover:border-[#214C37] transition-all duration-300 cursor-pointer hover:-translate-y-0.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1B2520] flex items-center justify-center shrink-0 ring-1 ring-[#202A25]">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-[#8C958E]">{profile.display_name?.charAt(0) || "?"}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-[#F5F1E8] text-sm truncate">{profile.display_name || "Unnamed"}</p>
                                            {profile.role === "admin" && <Shield className="w-3.5 h-3.5 text-[#C9A96A]" />}
                                        </div>
                                        <p className="text-xs text-[#8C958E] truncate">Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            ) : (
                <Reveal>
                    <div className="flex flex-col items-center justify-center py-24 bg-[#151D19]/90 border border-[#202A25] rounded-2xl">
                        <Users className="w-7 h-7 text-[#789181] mb-3" /><p className="text-[#8C958E] text-sm">No users found</p>
                    </div>
                </Reveal>
            )}

            <AnimatePresence>
                {selectedProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setSelectedProfile(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} transition={{ duration: 0.3, ease: [0.22, 0.03, 0.26, 1] }} className="relative w-full max-w-md bg-[#151D19] border border-[#202A25] rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
                            <div className="px-6 pt-6 pb-0 flex justify-between items-start">
                                <h3 className="text-lg font-bold text-[#F5F1E8] tracking-tight">User Profile</h3>
                                <button onClick={() => setSelectedProfile(null)} className="w-8 h-8 rounded-lg bg-[#1B2520] hover:bg-[#202A25] flex items-center justify-center text-[#8C958E] hover:text-[#F5F1E8] transition-all duration-300"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[#1B2520] flex items-center justify-center ring-2 ring-[#202A25]">
                                        {selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-xl font-bold text-[#8C958E]">{selectedProfile.display_name?.charAt(0) || "?"}</span>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xl font-bold text-[#F5F1E8]">{selectedProfile.display_name || "Unnamed"}</h4>
                                            {selectedProfile.role === "admin" && <span className="px-2 py-0.5 rounded-md bg-[#302817] border border-[#C9A96A]/30 text-[10px] font-bold text-[#C9A96A] uppercase">Admin</span>}
                                        </div>
                                        <p className="text-sm text-[#8C958E]">{selectedProfile.bio || "No bio"}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-[#202A25]" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2">
                                        <Mail className="w-4 h-4 text-[#789181] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">ID</p>
                                            <p className="text-xs text-[#C5C8C1] font-mono truncate">{selectedProfile.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="w-4 h-4 text-[#789181] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Joined</p>
                                            <p className="text-xs text-[#C5C8C1]">{new Date(selectedProfile.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
