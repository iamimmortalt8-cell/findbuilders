import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, FileText, LifeBuoy, LogOut, Trash2, ChevronRight, AlertTriangle, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { api } from "@/lib/api";
import {
    DELETE_CONFIRMATION,
    DELETE_STEP_ONE_TITLE,
    DELETE_STEP_ONE_MESSAGE,
    DELETE_STEP_ONE_CONTINUE,
    DELETE_STEP_ONE_CANCEL,
    DELETE_STEP_TWO_TITLE,
    DELETE_STEP_TWO_HINT,
    DELETE_STEP_TWO_BUTTON,
    DELETE_LOADING_LABEL,
    DELETE_SUCCESS_MESSAGE,
    DELETE_FAILURE_MESSAGE,
    isDeleteConfirmed,
    clearStoredAuthTokens,
} from "@/lib/account-deletion";

export default function AccountSettings() {
    const { user, profile, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const { success: toastSuccess, error: toastError } = useToast();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [loading, user, navigate]);

    const closeDeleteModal = () => {
        if (isDeleting) return;
        setIsDeleteOpen(false);
        setDeleteStep(1);
        setConfirmText("");
    };

    useEffect(() => {
        if (!isDeleteOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDeleteModal();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isDeleteOpen, isDeleting]);

    const openDeleteModal = () => {
        setDeleteStep(1);
        setConfirmText("");
        setIsDeleteOpen(true);
    };

    const handleDeleteAccount = async () => {
        if (isDeleting || !isDeleteConfirmed(confirmText)) return;
        setIsDeleting(true);
        try {
            await api.deleteAccount();
            clearStoredAuthTokens();
            toastSuccess(DELETE_SUCCESS_MESSAGE);
            await signOut();
            navigate("/");
        } catch {
            toastError(DELETE_FAILURE_MESSAGE);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    const privacyLinks = [
        { to: "/privacy-policy", label: "Privacy Policy", icon: Shield },
        { to: "/terms", label: "Terms & Conditions", icon: FileText },
        { to: "/support", label: "Support", icon: LifeBuoy },
    ];

    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header */}
                <div className="mb-6 sm:mb-8 border-b border-[#202A25] pb-5 sm:pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">Account Settings</h1>
                    <p className="text-[#8C958E] mt-1 text-sm sm:text-base">Manage your profile, preferences, and account security.</p>
                </div>

                <div className="space-y-5 sm:space-y-6">
                    {/* Profile */}
                    <section className="rounded-2xl border border-[#202A25] bg-[#151D19] p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-[#F5F1E8] mb-4 sm:mb-5">Profile</h2>

                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#1B2520] border border-[#29342E] shrink-0 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold text-[#8C958E]">
                                        {profile?.display_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-[#F5F1E8] truncate">{profile?.display_name || "—"}</p>
                                <p className="text-sm text-[#8C958E] truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="account-full-name" className="block text-xs font-medium text-[#8C958E]">
                                    Full Name
                                </label>
                                <div
                                    id="account-full-name"
                                    className="w-full bg-[#0B100E] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] truncate"
                                >
                                    {profile?.display_name || "—"}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="account-email" className="block text-xs font-medium text-[#8C958E]">
                                    Email Address <span className="text-[#69736C]">(read-only)</span>
                                </label>
                                <input
                                    id="account-email"
                                    type="email"
                                    value={user.email || ""}
                                    readOnly
                                    aria-readonly="true"
                                    className="w-full bg-[#0B100E] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#C5C8C1] cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <Link
                                to="/settings/profile"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Profile
                            </Link>
                        </div>
                    </section>

                    {/* Privacy & Legal */}
                    <section className="rounded-2xl border border-[#202A25] bg-[#151D19] p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-[#F5F1E8] mb-2 sm:mb-3">Privacy &amp; Legal</h2>
                        <div className="space-y-1">
                            {privacyLinks.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1B2520] transition-colors group"
                                >
                                    <span className="w-9 h-9 rounded-lg bg-[#1B2520] border border-[#29342E] flex items-center justify-center shrink-0 group-hover:border-[#2E6549] transition-colors">
                                        <Icon className="w-4 h-4 text-[#D8C7A5]" />
                                    </span>
                                    <span className="flex-1 min-w-0 text-sm font-medium text-[#F5F1E8] truncate">{label}</span>
                                    <ChevronRight className="w-4 h-4 shrink-0 text-[#69736C] group-hover:text-[#C5C8C1] transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Account Actions */}
                    <section className="rounded-2xl border border-[#202A25] bg-[#151D19] p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-[#F5F1E8] mb-4 sm:mb-5">Account Actions</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#321C1C] border border-[#C97878]/30 text-[#C97878] hover:bg-[#3D2222] text-sm font-semibold transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                            <button
                                type="button"
                                onClick={openDeleteModal}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#C97878]/40 text-[#C97878] hover:bg-[#321C1C]/60 text-sm font-semibold transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Account confirmation modal (two-step, type DELETE) */}
            <AnimatePresence>
                {isDeleteOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDeleteModal}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative w-full max-w-lg bg-[#151D19] border border-[#C97878]/30 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10"
                        >
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-[#321C1C] border border-[#C97878]/30 flex items-center justify-center shrink-0 text-[#C97878]">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 id="delete-account-title" className="text-xl font-bold text-[#F5F1E8] tracking-tight">
                                            {deleteStep === 1 ? DELETE_STEP_ONE_TITLE : DELETE_STEP_TWO_TITLE}
                                        </h2>
                                        <p className="text-xs text-[#8C958E] mt-0.5">Permanent action • Requires confirmation</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    aria-label="Close"
                                    className="p-2 rounded-xl text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {deleteStep === 1 ? (
                                <>
                                    <div className="bg-[#321C1C]/60 border border-[#C97878]/25 rounded-2xl p-4 mb-5 text-sm text-[#C5C8C1] leading-relaxed whitespace-pre-line">
                                        {DELETE_STEP_ONE_MESSAGE}
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeDeleteModal}
                                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors"
                                        >
                                            {DELETE_STEP_ONE_CANCEL}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteStep(2)}
                                            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#C97878] hover:bg-[#d48989] text-[#1A1A16] transition-colors"
                                        >
                                            {DELETE_STEP_ONE_CONTINUE}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-[#321C1C]/60 border border-[#C97878]/25 rounded-2xl p-4 mb-5 text-sm text-[#C5C8C1] leading-relaxed">
                                        <p>
                                            <strong className="text-[#C97878] font-semibold">Deleting your account is permanent.</strong>{" "}
                                            Your profile, products, comments, votes, follows, uploaded images, and other account-owned data
                                            will be permanently removed. This action cannot be undone.
                                        </p>
                                    </div>

                                    <label htmlFor="delete-account-confirmation" className="block text-xs font-medium text-[#8C958E] mb-1.5">
                                        {DELETE_STEP_TWO_HINT}
                                    </label>
                                    <input
                                        id="delete-account-confirmation"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        disabled={isDeleting}
                                        placeholder={DELETE_CONFIRMATION}
                                        className="w-full bg-[#0B100E] border border-[#C97878]/40 rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] outline-none focus:border-[#C97878] disabled:opacity-60 disabled:cursor-not-allowed mb-5"
                                    />

                                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeDeleteModal}
                                            disabled={isDeleting}
                                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {DELETE_STEP_ONE_CANCEL}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting || !isDeleteConfirmed(confirmText)}
                                            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#C97878] hover:bg-[#d48989] text-[#1A1A16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#C97878]"
                                        >
                                            {isDeleting ? DELETE_LOADING_LABEL : DELETE_STEP_TWO_BUTTON}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
