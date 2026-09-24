import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Loader, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const isFormValid = password.length >= 6 && password === confirmPassword;

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionReady(!!session);
            setCheckingSession(false);
        }).catch(() => {
            setCheckingSession(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || loading) return;
        setError("");
        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        });

        setLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess(true);
            setTimeout(() => navigate("/admin/login"), 3000);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    if (!sessionReady) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center px-4">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#214C37]/15 rounded-full blur-[140px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D8C7A5]/5 rounded-full blur-[140px]" />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease: [0.22, 0.03, 0.26, 1] }}
                    className="relative w-full max-w-md"
                >
                    <div className="bg-[#151D19]/90 backdrop-blur-2xl border border-[#202A25] rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#321C1C] border border-[#C97878]/30 flex items-center justify-center mx-auto mb-5">
                            <AlertCircle className="w-7 h-7 text-[#C97878]" />
                        </div>
                        <p className="text-[10px] font-bold text-[#C97878] uppercase tracking-[0.2em] mb-2">Invalid Link</p>
                        <h1 className="text-2xl font-bold text-[#F5F1E8] tracking-tight mb-2">Session Expired</h1>
                        <p className="text-sm text-[#8C958E] mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link
                            to="/admin/forgot-password"
                            className="inline-flex items-center gap-2 text-sm text-[#D8C7A5] hover:text-[#E5D5B5] transition-colors font-medium"
                        >
                            Request a new reset link
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B100E] flex items-center justify-center px-4">
            {/* Background treatment */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#214C37]/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D8C7A5]/5 rounded-full blur-[140px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.22, 0.03, 0.26, 1] }}
                className="relative w-full max-w-md"
            >
                {/* Glass card */}
                <div className="bg-[#151D19]/90 backdrop-blur-2xl border border-[#202A25] rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D8C7A5] to-[#214C37] flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(216,199,165,0.15)]"
                        >
                            <KeyRound className="w-7 h-7 text-[#0B100E]" />
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-[10px] font-bold text-[#D8C7A5] uppercase tracking-[0.2em] mb-2"
                        >
                            Admin Panel
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="text-2xl font-bold text-[#F5F1E8] tracking-tight"
                        >
                            Set New Password
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-[#8C958E] mt-2"
                        >
                            Choose a strong password for your admin account
                        </motion.p>
                    </div>

                    {/* Success State */}
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center py-4"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[#173022] border border-[#7FAF8D]/30 flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle className="w-8 h-8 text-[#7FAF8D]" />
                                </div>
                                <h2 className="text-lg font-bold text-[#F5F1E8] mb-2">Password Updated</h2>
                                <p className="text-sm text-[#8C958E] mb-6">
                                    Your password has been successfully changed.
                                </p>
                                <p className="text-xs text-[#789181]">
                                    Redirecting to sign in...
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" exit={{ opacity: 0, y: -10 }}>
                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            className="mb-6 p-4 rounded-xl bg-[#321C1C] border border-[#C97878]/30 flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-5 h-5 text-[#C97878] shrink-0 mt-0.5" />
                                            <p className="text-sm text-[#C97878]">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* New Password */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 }}
                                    >
                                        <label className="block text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em] mb-2">
                                            New Password
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Minimum 6 characters"
                                                autoComplete="new-password"
                                                className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5] pl-11 pr-12 py-3 outline-none transition-all duration-300 placeholder-[#789181]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#789181] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-all duration-300"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Confirm Password */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <label className="block text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em] mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter your password"
                                                autoComplete="new-password"
                                                className="w-full bg-[#101814] border border-[#202A25] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5] pl-11 pr-12 py-3 outline-none transition-all duration-300 placeholder-[#789181]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#789181] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-all duration-300"
                                            >
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-[#C97878] mt-1.5">Passwords do not match</p>
                                        )}
                                    </motion.div>

                                    {/* Submit Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.45 }}
                                        className="pt-2"
                                    >
                                        <button
                                            type="submit"
                                            disabled={!isFormValid || loading}
                                            className="w-full relative group overflow-hidden rounded-xl py-3.5 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(216,199,165,0.15)] hover:shadow-[0_0_30px_rgba(216,199,165,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            <span className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : ""}`}>
                                                Update Password
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                            {loading && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Loader className="w-5 h-5 text-[#1A1A16] animate-spin" />
                                                </div>
                                            )}
                                        </button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
