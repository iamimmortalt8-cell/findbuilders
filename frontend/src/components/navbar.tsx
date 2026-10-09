"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, UserPlus, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.profile-dropdown-container')) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const isHome = location.pathname === "/";

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: "Features", href: "/features" },
        { label: "About", href: "/about" },
        { label: "FAQ", href: "/faq" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return location.pathname === "/";
        return location.pathname.startsWith(href);
    };

    return (
        <>
            {/* Full-width Navbar */}
            <header className="fixed top-0 left-0 right-0 z-100 transition-all duration-300 font-(family-name:--font-heading) pt-[max(0rem,env(safe-area-inset-top))]">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 sm:py-4">
                    <div
                        className={`flex items-center justify-between rounded-full border transition-all duration-500 px-3 sm:px-6 py-2 sm:py-3 ${
                            scrolled
                                ? "bg-[#0B120E]/80 backdrop-blur-2xl backdrop-saturate-180 border-[#2E6549]/35 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_0_20px_rgba(46,101,73,0.1)]"
                                : "bg-[#0E1712]/50 backdrop-blur-xl backdrop-saturate-150 border-[#2E6549]/25 hover:border-[#2E6549]/45 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_0_16px_rgba(46,101,73,0.06)]"
                        }`}
                    >
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
                            <img
                                src="/findbuilderslogo.png"
                                alt="FindTheBuilders Logo"
                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0"
                            />
                            <span className={`text-base sm:text-xl md:text-2xl font-bold tracking-tight ${isHome ? "text-white" : "text-[#F5F1E8]"}`}>
                                <span className={isHome ? "text-white" : "text-[#D8C7A5]"}>F</span>ind<span className={isHome ? "text-white" : "text-[#D8C7A5]"}>T</span>he<span className={isHome ? "text-white" : "text-[#D8C7A5]"}>B</span>uilders
                            </span>
                        </Link>

                        {/* Desktop Nav Links with hover scale + underline */}
                        <nav className={`hidden lg:flex items-center gap-8 xl:gap-10 text-base font-medium ${isHome ? "text-[#D5D8D4]" : "text-[#C5C8C1]"}`}>
                            {navLinks.map((link) => (
                                <Link key={link.href} to={link.href}>
                                    <motion.span
                                        className={`relative cursor-pointer transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#D8C7A5] after:transition-all hover:after:w-full ${
                                            isActive(link.href) ? (isHome ? "text-white after:w-full" : "text-[#F5F1E8] after:w-full") : (isHome ? "hover:text-white" : "hover:text-[#F5F1E8]")
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {link.label}
                                    </motion.span>
                                </Link>
                            ))}
                        </nav>

                        {/* Portal Buttons + Mobile Menu Toggle */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Desktop buttons */}
                            <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
                                {user ? (
                                    <>
                                        <Link
                                            to="/builder"
                                            className="rounded-full bg-[#16231B]/60 hover:bg-[#1E3227]/80 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:border-[#2E6549]/70 transition-all duration-300 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                        >
                                            My Products
                                        </Link>
                                        <div className="relative profile-dropdown-container">
                                            <button
                                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16231B]/60 border border-[#2E6549]/35 hover:bg-[#1E3227]/80 hover:border-[#2E6549]/70 transition-all duration-300 overflow-hidden shrink-0 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                            >
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5C8C1]" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {isProfileOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 mt-3 w-40 rounded-2xl bg-[#0D1511]/90 backdrop-blur-2xl border border-[#2E6549]/35 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden py-1.5 z-50"
                                                    >
                                                        <Link
                                                            to={`/profile/${profile?.id}`}
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="block px-4 py-2.5 text-sm font-medium text-[#F5F1E8] hover:bg-[#202B25] transition-colors"
                                                        >
                                                            Profile
                                                        </Link>
                                                        <Link
                                                            to="/settings/account"
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="block px-4 py-2.5 text-sm font-medium text-[#F5F1E8] hover:bg-[#202B25] transition-colors"
                                                        >
                                                            Settings
                                                        </Link>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="rounded-full bg-[#16231B]/60 hover:bg-[#1E3227]/80 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:border-[#2E6549]/70 transition-all duration-300 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="rounded-full bg-[#D8C7A5] px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#1A1A16] border border-[#D8C7A5] hover:bg-[#E5D5B5] hover:border-[#E5D5B5] transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_20px_rgba(216,199,165,0.25)] hover:shadow-[0_0_30px_rgba(216,199,165,0.4)]"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 min-w-9 min-h-9 rounded-full text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#16231B]/60 border border-transparent hover:border-[#2E6549]/30 transition-all active:bg-[#1E3227] shrink-0"
                                aria-label="Toggle menu"
                            >
                                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="lg:hidden mt-2 sm:mt-3 rounded-2xl bg-[#0D1511]/92 backdrop-blur-2xl backdrop-saturate-180 border border-[#2E6549]/35 shadow-[0_16px_48px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden max-h-[calc(100dvh-5.5rem)] overflow-y-auto"
                            >
                                <nav className="flex flex-col py-2 sm:py-3">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            to={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`px-5 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors active:bg-[#16231B] ${
                                                isActive(link.href)
                                                    ? "text-[#F5F1E8] bg-[#16231B]/70"
                                                    : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#16231B]/40"
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="border-t border-[#2E6549]/25 px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col gap-2.5 sm:gap-3">
                                    {user ? (
                                        <>
                                            <Link to="/builder" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#16231B]/70 px-4 py-2.5 sm:py-3 text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:bg-[#1E3227] hover:border-[#2E6549]/60 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                My Products
                                            </Link>
                                            <Link to={`/profile/${profile?.id}`} onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#16231B]/70 px-4 py-2.5 sm:py-3 text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:bg-[#1E3227] hover:border-[#2E6549]/60 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                My Profile
                                            </Link>
                                            <Link to="/settings/account" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#16231B]/70 px-4 py-2.5 sm:py-3 text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:bg-[#1E3227] hover:border-[#2E6549]/60 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                Settings
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#16231B]/70 px-4 py-2.5 sm:py-3 text-sm font-semibold text-[#F5F1E8] border border-[#2E6549]/35 hover:bg-[#1E3227] hover:border-[#2E6549]/60 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                Sign In
                                            </Link>
                                            <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#D8C7A5] px-4 py-2.5 sm:py-3 text-sm font-semibold text-[#1A1A16] border border-[#D8C7A5] hover:bg-[#E5D5B5] transition-all shadow-[0_0_20px_rgba(216,199,165,0.25)]">
                                                Get Started
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Spacer (hidden on home page so hero fits perfectly in viewport) */}
            {location.pathname !== "/" && <div className="h-16 sm:h-20" />}
        </>
    );
}
