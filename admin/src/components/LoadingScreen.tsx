"use client";

import React, { useState, useEffect } from "react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

export default function LoadingScreen({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for 3.5 seconds
        const t = setTimeout(() => { setLoading(false); }, 3500);
        return () => clearTimeout(t);
    }, []);

    if (loading) {
        return (
            <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0B0F19]">
                <ShaderAnimation />
                <div className="absolute pointer-events-none z-10 flex flex-col items-center gap-4">
                    <img
                        src="/findbuilderslogo.png"
                        alt="FindBuilders Logo"
                        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
                    />
                    <span className="text-center text-5xl md:text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white drop-shadow-lg">
                        FIND BUILDERS
                    </span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}