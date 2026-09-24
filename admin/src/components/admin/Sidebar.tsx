"use client";

import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Inbox,
    Users,
    Layers,
    LogOut,
    ChevronLeft,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import AdminNotifications from "./AdminNotifications";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Submissions", href: "/admin/submissions", icon: Inbox },
    { label: "Products", href: "/admin/products", icon: Layers },
    { label: "Users", href: "/admin/users", icon: Users },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate("/admin/login");
    };

    const isActive = (href: string) => {
        if (href === "/admin") return location.pathname === "/admin";
        return location.pathname.startsWith(href);
    };

    const NavContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-[#202A25]">
                <div className="flex items-center justify-between">
                    <NavLink to="/admin" className="text-lg font-bold tracking-tight group">
                        <span className="text-[#D8C7A5] group-hover:text-[#E5D5B5] transition-colors font-serif">Find</span>
                        <span className="text-[#F5F1E8]">Builders</span>
                    </NavLink>
                    <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#151D19] transition-all duration-300">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block">
                        <AdminNotifications />
                    </div>
                </div>
                <p className="text-[10px] text-[#789181] uppercase tracking-[0.15em] mt-2 font-bold">Admin Panel</p>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                <StaggerContainer staggerDelay={0.05}>
                    {navItems.map((item) => (
                        <StaggerItem key={item.href}>
                            <NavLink
                                to={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                                    isActive(item.href)
                                        ? "bg-[#163326] text-[#7FAF8D] border border-[#214C37] shadow-[0_0_20px_rgba(33,76,55,0.25)]"
                                        : "text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#151D19] border border-transparent"
                                }`}
                            >
                                <item.icon className={`w-4 h-4 transition-colors ${isActive(item.href) ? "text-[#7FAF8D]" : "text-[#789181] group-hover:text-[#F5F1E8]"}`} />
                                {item.label}
                                {isActive(item.href) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7FAF8D] shadow-[0_0_8px_rgba(127,175,141,0.5)]" />}
                            </NavLink>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 space-y-1 border-t border-[#202A25] pt-3">
                <NavLink
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#151D19] transition-all duration-300 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Public Site
                </NavLink>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#C97878] hover:bg-[#321C1C]/40 transition-all duration-300 group w-full"
                >
                    <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 bg-[#0B100E]/95 backdrop-blur-2xl border-r border-[#202A25]">
                <NavContent />
            </aside>

            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0B100E]/95 backdrop-blur-2xl border-b border-[#202A25] flex items-center justify-between px-4">
                <NavLink to="/admin" className="text-base font-bold tracking-tight">
                    <span className="text-[#D8C7A5] font-serif">Find</span><span className="text-[#F5F1E8]">Builders</span>
                </NavLink>
                <div className="flex items-center gap-1">
                    <AdminNotifications />
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#151D19] transition-all duration-300">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B100E]/98 backdrop-blur-2xl border-r border-[#202A25]">
                        <NavContent />
                    </aside>
                </div>
            )}
        </>
    );
}
