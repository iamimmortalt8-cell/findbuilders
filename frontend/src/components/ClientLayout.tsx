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
        <div className={`flex flex-col ${isHome ? "h-screen overflow-hidden" : "min-h-screen"}`}>
            <CustomCursor />
            {!isDashboardRoute && <Navbar />}
            <main className={`flex-1 ${isHome ? "h-full overflow-hidden flex flex-col" : ""}`}>{children}</main>
            {!isDashboardRoute && !isHome && <Footer />}
        </div>
    );
}
