"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Shield,
    Mail,
    CalendarDays,
    X,
    Edit3,
    Save,
    Loader2,
    ExternalLink,
    User,
    Briefcase,
    Globe,
    Tag,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";

interface AdminUser {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
    bio: string | null;
    created_at: string;
    username?: string;
    headline?: string;
    email?: string;
    // Extended fields (from detail endpoint)
    bioText?: string;
    interests?: string[];
    links?: Array<{ title: string; url: string }>;
}

// Deterministic avatar color from user ID
function getAvatarColor(id: string): string {
    const colors = [
        "#2E6549", "#4A6B5D", "#3D7A5E", "#5B8A72", "#2C5F44",
        "#6B4E3D", "#4E6B5B", "#3A6B52", "#507A64", "#446B56",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return "?";
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ display_name: "", bio: "" });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        api.getAdminUsers()
            .then((data) => setUsers(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.display_name.toLowerCase().includes(q) ||
            (u.username || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            (u.headline || "").toLowerCase().includes(q)
        );
    });

    const openUserDetail = useCallback(async (user: AdminUser) => {
        setSelectedUser(user);
        setIsEditing(false);
        setSaveStatus("idle");
        setDetailLoading(true);
        try {
            const detail = await api.getAdminUser(user.id);
            setSelectedUser(detail);
        } catch {
            // Keep the basic data we already have
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const startEdit = () => {
        if (!selectedUser) return;
        // Parse existing bio to get structured data
        let bioStr = "";
        try {
            const parsed = selectedUser.bio ? JSON.parse(selectedUser.bio) : {};
            bioStr = typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : (selectedUser.bio || "");
        } catch {
            bioStr = selectedUser.bio || "";
        }
        setEditData({
            display_name: selectedUser.display_name || "",
            bio: bioStr,
        });
        setIsEditing(true);
        setSaveStatus("idle");
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setSaveStatus("idle");
    };

    const saveEdit = async () => {
        if (!selectedUser) return;
        setSaving(true);
        setSaveStatus("idle");
        setSaveError("");
        try {
            const updates: Record<string, unknown> = {};
            if (editData.display_name.trim()) updates.display_name = editData.display_name.trim();
            if (editData.bio !== undefined) updates.bio = editData.bio;

            await api.updateAdminUserProfile(selectedUser.id, updates);
            setSaveStatus("success");

            // Refresh user detail
            const detail = await api.getAdminUser(selectedUser.id);
            setSelectedUser(detail);

            // Update the user in the list
            setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...detail } : u));

            setTimeout(() => {
                setIsEditing(false);
                setSaveStatus("idle");
            }, 1500);
        } catch (err: any) {
            setSaveStatus("error");
            setSaveError(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setSelectedUser(null);
        setIsEditing(false);
        setSaveStatus("idle");
    };

    return (
        <div className="max-w-7xl mx-auto">
            <Reveal>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#D8C7A5] to-[#214C37]" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8]">Users</h1>
                        <p className="text-[#8C958E] text-sm mt-0.5">{users.length} registered users</p>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="relative max-w-md mb-6 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username, or email..." className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5] pl-10 pr-4 py-2.5 outline-none transition-all duration-300 placeholder-[#789181]" />
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
                    {filtered.map((user) => (
                        <StaggerItem key={user.id}>
                            <div onClick={() => openUserDetail(user)} className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5 hover:border-[#214C37] transition-all duration-300 cursor-pointer hover:-translate-y-0.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-1 ring-[#202A25] overflow-hidden" style={{ backgroundColor: user.avatar_url ? undefined : getAvatarColor(user.id) }}>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-[#F5F1E8]">{getInitials(user.display_name)}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-[#F5F1E8] text-sm truncate">{user.display_name}</p>
                                            {user.role === "admin" && <Shield className="w-3.5 h-3.5 text-[#C9A96A] shrink-0" />}
                                        </div>
                                        {user.username && (
                                            <p className="text-xs text-[#7FAF8D] truncate">@{user.username}</p>
                                        )}
                                        <p className="text-xs text-[#8C958E] truncate">
                                            {user.headline || `Joined ${new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                                        </p>
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

            {/* Profile Detail / Edit Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={closeModal} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            transition={{ duration: 0.3, ease: [0.22, 0.03, 0.26, 1] }}
                            className="relative w-full max-w-lg bg-[#151D19] border border-[#202A25] rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 pt-5 pb-4 flex justify-between items-center border-b border-[#202A25] shrink-0">
                                <h3 className="text-lg font-bold text-[#F5F1E8] tracking-tight">User Profile</h3>
                                <div className="flex items-center gap-2">
                                    {!isEditing && (
                                        <button onClick={startEdit} className="px-3 py-1.5 rounded-lg bg-[#1B2520] hover:bg-[#202A25] text-xs font-medium text-[#8C958E] hover:text-[#F5F1E8] transition-all flex items-center gap-1.5">
                                            <Edit3 className="w-3 h-3" /> Edit
                                        </button>
                                    )}
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-[#1B2520] hover:bg-[#202A25] flex items-center justify-center text-[#8C958E] hover:text-[#F5F1E8] transition-all duration-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body — scrollable */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-5 scrollbar-thin scrollbar-thumb-[#29342E] scrollbar-track-transparent">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-[#789181] animate-spin" />
                                    </div>
                                ) : isEditing ? (
                                    /* Edit Mode */
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em] mb-1.5 block">Display Name</label>
                                            <input
                                                type="text"
                                                value={editData.display_name}
                                                onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                                                maxLength={50}
                                                className="w-full bg-[#101814] border border-[#29342E] rounded-lg px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#789181] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em] mb-1.5 block">Bio (JSON)</label>
                                            <textarea
                                                value={editData.bio}
                                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                                rows={10}
                                                className="w-full bg-[#101814] border border-[#29342E] rounded-lg px-3 py-2 text-sm text-[#F5F1E8] focus:border-[#789181] focus:outline-none resize-none font-mono text-xs"
                                            />
                                        </div>

                                        {saveStatus === "success" && (
                                            <div className="flex items-center gap-2 text-sm text-[#7FAF8D]">
                                                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
                                            </div>
                                        )}
                                        {saveStatus === "error" && (
                                            <div className="flex items-center gap-2 text-sm text-[#C97878]">
                                                <AlertCircle className="w-4 h-4" /> {saveError}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg text-xs font-medium text-[#8C958E] hover:text-[#F5F1E8] bg-[#1B2520] border border-[#29342E] hover:bg-[#202A25] transition-colors">Cancel</button>
                                            <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-medium text-[#1A1A16] bg-[#D8C7A5] hover:bg-[#E5D5B5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                                                {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <><Save className="w-3 h-3" /> Save Changes</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <>
                                        {/* Identity Section */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center ring-2 ring-[#202A25] overflow-hidden shrink-0" style={{ backgroundColor: selectedUser.avatar_url ? undefined : getAvatarColor(selectedUser.id) }}>
                                                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-xl font-bold text-[#F5F1E8]">{getInitials(selectedUser.display_name)}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-bold text-[#F5F1E8] truncate">{selectedUser.display_name}</h4>
                                                    {selectedUser.role === "admin" && <span className="px-2 py-0.5 rounded-md bg-[#302817] border border-[#C9A96A]/30 text-[10px] font-bold text-[#C9A96A] uppercase shrink-0">Admin</span>}
                                                </div>
                                                {selectedUser.username && <p className="text-sm text-[#7FAF8D]">@{selectedUser.username}</p>}
                                                {selectedUser.headline && <p className="text-sm text-[#8C958E] mt-0.5">{selectedUser.headline}</p>}
                                            </div>
                                        </div>

                                        <div className="h-px bg-[#202A25]" />

                                        {/* Profile Details */}
                                        <div className="space-y-4">
                                            {selectedUser.bioText && (
                                                <div className="flex items-start gap-2.5">
                                                    <User className="w-4 h-4 text-[#789181] mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Bio</p>
                                                        <p className="text-xs text-[#C5C8C1] mt-0.5 whitespace-pre-wrap break-words">{selectedUser.bioText}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedUser.email && (
                                                <div className="flex items-start gap-2.5">
                                                    <Mail className="w-4 h-4 text-[#789181] mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Email</p>
                                                        <p className="text-xs text-[#C5C8C1] truncate">{selectedUser.email}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedUser.interests && selectedUser.interests.length > 0 && (
                                                <div className="flex items-start gap-2.5">
                                                    <Tag className="w-4 h-4 text-[#789181] mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Interests</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {selectedUser.interests.map((interest, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-full bg-[#1B2520] border border-[#29342E] text-[11px] text-[#C5C8C1]">{interest}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedUser.links && selectedUser.links.length > 0 && (
                                                <div className="flex items-start gap-2.5">
                                                    <Globe className="w-4 h-4 text-[#789181] mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Links</p>
                                                        <div className="space-y-1 mt-1">
                                                            {selectedUser.links.map((link, i) => (
                                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#7FAF8D] hover:text-[#D8C7A5] transition-colors truncate">
                                                                    <ExternalLink className="w-3 h-3 shrink-0" /> {link.title}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-[#202A25]" />

                                        {/* Account Section */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-start gap-2.5">
                                                <CalendarDays className="w-4 h-4 text-[#789181] mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Joined</p>
                                                    <p className="text-xs text-[#C5C8C1]">{new Date(selectedUser.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <Briefcase className="w-4 h-4 text-[#789181] mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#789181] uppercase tracking-[0.12em]">Role</p>
                                                    <p className="text-xs text-[#C5C8C1] capitalize">{selectedUser.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
