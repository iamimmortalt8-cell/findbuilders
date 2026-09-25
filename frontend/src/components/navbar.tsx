"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, UserPlus, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

/* ================= MAGNETIC BUTTON ================= */
const MagneticButton = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { width, height, left, top } = ref.current.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x: x * 0.3, y: y * 0.3 });
    };

    const reset = () => setPosition({ x: 0, y: 0 });

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

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
            {/* Full-width Navbar with MagneticButton */}
            <header className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 font-[family-name:var(--font-heading)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
                    <div
                        className={`flex items-center justify-between rounded-full border transition-all duration-500 px-4 sm:px-6 py-2.5 sm:py-3 ${
                            scrolled
                                ? "bg-[#0B100E]/80 backdrop-blur-2xl border-[#202A25] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                                : "bg-[#0B100E]/50 backdrop-blur-xl border-[#202A25]/60"
                        }`}
                    >
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
                            <img
                                src="/findbuilderslogo.png"
                                alt="FindBuilders Logo"
                                className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
                            />
                            <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight ${isHome ? "text-white" : "text-[#F5F1E8]"}`}>
                                <span className={isHome ? "text-white" : "text-[#D8C7A5]"}>F</span>ind<span className={isHome ? "text-white" : "text-[#D8C7A5]"}>B</span>uilders
                            </span>
                        </Link>

                        {/* Desktop Nav Links with hover scale + underline */}
                        <nav className={`hidden lg:flex items-center gap-10 text-base font-medium ${isHome ? "text-[#D5D8D4]" : "text-[#C5C8C1]"}`}>
                            {navLinks.map((link) => (
                                <Link key={link.href} to={link.href}>
                                    <motion.span
                                        className={`relative cursor-pointer transition-colors duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-[#D8C7A5] after:transition-all hover:after:w-full ${
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
                            {/* Desktop buttons with MagneticButton */}
                            <div className="hidden md:flex items-center gap-3">
                                {user ? (
                                    <>
                                        <MagneticButton>
                                            <Link
                                                to="/builder"
                                                className="rounded-full bg-[#1B2520] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] hover:border-[#2E6549] transition-all duration-300 backdrop-blur-sm"
                                            >
                                                My Products
                                            </Link>
                                        </MagneticButton>
                                        <div className="relative profile-dropdown-container">
                                            <MagneticButton>
                                                <button
                                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1B2520] border border-[#29342E] hover:bg-[#202B25] hover:border-[#2E6549] transition-all duration-300 overflow-hidden shrink-0"
                                                >
                                                    {profile?.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-[#C5C8C1]" />
                                                    )}
                                                </button>
                                            </MagneticButton>

                                            <AnimatePresence>
                                                {isProfileOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 mt-3 w-40 rounded-2xl bg-[#1B2520] border border-[#29342E] shadow-2xl overflow-hidden py-1.5 z-50"
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
                                        <MagneticButton>
                                            <Link
                                                to="/login"
                                                className="rounded-full bg-[#1B2520] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] hover:border-[#2E6549] transition-all duration-300 backdrop-blur-sm"
                                            >
                                                Sign In
                                            </Link>
                                        </MagneticButton>
                                        <MagneticButton>
                                            <Link
                                                to="/signup"
                                                className="rounded-full bg-[#D8C7A5] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-[#1A1A16] border border-[#D8C7A5] hover:bg-[#E5D5B5] hover:border-[#E5D5B5] transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_20px_rgba(216,199,165,0.2)]"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Get Started
                                            </Link>
                                        </MagneticButton>
                                    </>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-all active:bg-[#202B25]"
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
                                className="lg:hidden mt-3 rounded-2xl bg-[#101814]/95 backdrop-blur-2xl border border-[#202A25] shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
                            >
                                <nav className="flex flex-col py-3">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            to={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`px-6 py-3.5 text-base font-medium transition-colors active:bg-[#1B2520] ${
                                                isActive(link.href)
                                                    ? "text-[#F5F1E8] bg-[#1B2520]"
                                                    : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#151D19]"
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="border-t border-[#202A25] px-6 py-4 flex flex-col gap-3">
                                    {user ? (
                                        <>
                                            <Link to="/builder" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#1B2520] px-5 py-3 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] transition-all">
                                                My Products
                                            </Link>
                                            <Link to={`/profile/${profile?.id}`} onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#1B2520] px-5 py-3 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] transition-all">
                                                My Profile
                                            </Link>
                                            <Link to="/settings/account" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#1B2520] px-5 py-3 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] transition-all">
                                                Settings
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#1B2520] px-5 py-3 text-sm font-semibold text-[#F5F1E8] border border-[#29342E] hover:bg-[#202B25] transition-all">
                                                Sign In
                                            </Link>
                                            <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center rounded-xl bg-[#D8C7A5] px-5 py-3 text-sm font-semibold text-[#1A1A16] border border-[#D8C7A5] hover:bg-[#E5D5B5] transition-all">
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
            {location.pathname !== "/" && <div className="h-20" />}
        </>
    );
}
