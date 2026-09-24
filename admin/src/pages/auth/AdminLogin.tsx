import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "react-router-dom";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signIn, user, profile, loading: authLoading, isAdmin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchParams.get("denied") === "1") {
            setAccessDenied(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user && profile) {
            if (isAdmin) {
                navigate("/admin");
            } else {
                setAccessDenied(true);
                setLoading(false);
            }
        }
    }, [user, profile, isAdmin, authLoading, navigate]);

    const validateField = (field: 'email' | 'password', value: string) => {
        let err = "";
        if (field === 'email') {
            if (!value.trim()) err = "Email address is required.";
            else if (!/\S+@\S+\.\S+/.test(value)) err = "Please enter a valid email address (e.g. admin@example.com).";
        } else if (field === 'password') {
            if (!value) err = "Password is required.";
            else if (value.length < 6) err = "Password must be at least 6 characters long.";
        }
        setFieldErrors(prev => ({ ...prev, [field]: err }));
        return !err;
    };

    const isFormValid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        const isEmailOk = validateField('email', email);
        const isPassOk = validateField('password', password);

        if (!isEmailOk || !isPassOk || loading) return;
        setError("");
        setAccessDenied(false);
        setLoading(true);

        const { error: authError } = await signIn(email, password);
        if (authError) {
            setError(authError.message);
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#202A25] border-t-[#D8C7A5] animate-spin" />
                </div>
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
                            Admin Sign In
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-[#8C958E] mt-2"
                        >
                            Authorized administrators only
                        </motion.p>
                    </div>

                    {/* Access Denied Message */}
                    <AnimatePresence>
                        {accessDenied && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="mb-6 p-4 rounded-xl bg-[#321C1C] border border-[#C97878]/30 flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-[#C97878] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-[#C97878]">Admin access required</p>
                                    <p className="text-xs text-[#8C958E] mt-1">Your account does not have admin privileges. Contact an administrator to gain access.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                                        if (touched.email) validateField('email', e.target.value);
                                    }}
                                    onBlur={() => {
                                        setTouched(prev => ({ ...prev, email: true }));
                                        validateField('email', email);
                                    }}
                                    placeholder="admin@example.com"
                                    autoComplete="email"
                                    className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all duration-300 placeholder-[#789181] ${
                                        fieldErrors.email && touched.email
                                            ? 'border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/30'
                                            : 'border-[#202A25] focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5]'
                                    }`}
                                />
                            </div>
                            {fieldErrors.email && touched.email && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#C97878] font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{fieldErrors.email}</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Password Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="block text-[10px] font-bold text-[#789181] uppercase tracking-[0.15em] mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#789181] group-focus-within:text-[#D8C7A5] transition-colors" />
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password) validateField('password', e.target.value);
                                    }}
                                    onBlur={() => {
                                        setTouched(prev => ({ ...prev, password: true }));
                                        validateField('password', password);
                                    }}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl pl-11 pr-12 py-3 outline-none transition-all duration-300 placeholder-[#789181] ${
                                        fieldErrors.password && touched.password
                                            ? 'border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/30'
                                            : 'border-[#202A25] focus:ring-1 focus:ring-[#D8C7A5]/40 focus:border-[#D8C7A5]'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#789181] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-all duration-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {fieldErrors.password && touched.password && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#C97878] font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{fieldErrors.password}</span>
                                </div>
                            )}
                            <div className="flex justify-end mt-2">
                                <Link
                                    to="/admin/forgot-password"
                                    className="text-xs text-[#8C958E] hover:text-[#D8C7A5] transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </motion.div>
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
                                    Sign In
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

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-[11px] text-[#789181]">
                            Secure admin access • Supabase Auth
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
