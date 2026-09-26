"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/ui/footer-section";
import CustomCursor from "@/components/CustomCursor";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const location = useLocation();

    const hideLayoutRoutes = [
        "/admin",
        "/login",
        "/signup",
        "/builder",
    ];

    const isDashboardRoute = hideLayoutRoutes.some(
        (route) =>
            location.pathname === route ||
            location.pathname.startsWith(route + "/")
    );

    const isHome = location.pathname === "/";

    return (
        <div className={`flex flex-col ${isHome ? "min-h-[100dvh] lg:h-screen lg:overflow-hidden relative" : "min-h-screen min-h-[100dvh]"}`}>
            <CustomCursor />
            {!isDashboardRoute && <Navbar />}
            <main className={`flex-1 flex flex-col ${isHome ? "min-h-0 relative" : "w-full"}`}>{children}</main>
            {!isDashboardRoute && !isHome && <Footer />}
        </div>
    );
}
