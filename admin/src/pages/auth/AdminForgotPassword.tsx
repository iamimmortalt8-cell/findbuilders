import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const validateEmail = (val: string) => {
        let err = "";
        if (!val.trim()) err = "Email address is required.";
        else if (!/\S+@\S+\.\S+/.test(val)) err = "Please enter a valid email address.";
        setEmailError(err);
        return !err;
    };

    const isValidEmail = /\S+@\S+\.\S+/.test(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!validateEmail(email) || loading) return;
        setError("");
        setLoading(true);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin/reset-password`,
        });

        setLoading(false);

        if (resetError) {
            setError(resetError.message);
        } else {
            setSent(true);
        }
    };

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
                            <Shield className="w-7 h-7 text-[#0B100E]" />
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
                            Reset Password
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-[#8C958E] mt-2"
                        >
                            Enter your email to receive a reset link
                        </motion.p>
                    </div>

                    {/* Success State */}
                    <AnimatePresence mode="wait">
                        {sent ? (
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
                                <h2 className="text-lg font-bold text-[#F5F1E8] mb-2">Check your email</h2>
                                <p className="text-sm text-[#8C958E] mb-6">
                                    We sent a password reset link to<br />
                                    <span className="text-[#F5F1E8] font-medium">{email}</span>
                                </p>
                                <p className="text-xs text-[#789181] mb-6">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Link
                                    to="/admin/login"
                                    className="inline-flex items-center gap-2 text-sm text-[#D8C7A5] hover:text-[#E5D5B5] transition-colors font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Sign In
                                </Link>
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
                                    {/* Email Input */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 }}
                                    >
                                        <label className="block text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em] mb-2">
                                            Email
                                        </label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (touched) validateEmail(e.target.value);
                                                }}
                                                onBlur={() => {
                                                    setTouched(true);
                                                    validateEmail(email);
                                                }}
                                                placeholder="admin@example.com"
                                                autoComplete="email"
                                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all duration-300 placeholder-[#789181] ${
                                                    emailError && touched
                                                        ? 'border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/30'
                                                        : 'border-[#202A25] focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5]'
                                                }`}
                                            />
                                        </div>
                                        {emailError && touched && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#C97878] font-medium">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{emailError}</span>
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Submit Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="pt-2"
                                    >
                                        <button
                                            type="submit"
                                            disabled={!isValidEmail || loading}
                                            className="w-full relative group overflow-hidden rounded-xl py-3.5 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(216,199,165,0.15)] hover:shadow-[0_0_30px_rgba(216,199,165,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            <span className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : ""}`}>
                                                Send Reset Link
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

                                {/* Back to login */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 text-center"
                                >
                                    <Link
                                        to="/admin/login"
                                        className="inline-flex items-center gap-2 text-sm text-[#8C958E] hover:text-[#D8C7A5] transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Sign In
                                    </Link>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
