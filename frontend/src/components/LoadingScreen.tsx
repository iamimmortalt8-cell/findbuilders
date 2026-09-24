"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const STORAGE_KEY = "findbuilders_loading_seen";

export default function LoadingScreen({ children }: { children: React.ReactNode }) {
    const [showOverlay, setShowOverlay] = useState(
        () => !sessionStorage.getItem(STORAGE_KEY)
    );

    useEffect(() => {
        if (!showOverlay) return;
        const t = setTimeout(() => {
            sessionStorage.setItem(STORAGE_KEY, "1");
            setShowOverlay(false);
        }, 3000);
        return () => clearTimeout(t);
    }, [showOverlay]);

    return (
        <>
            {showOverlay && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#0B0F19]"
                    style={{
                        animation: "fb-exit 0.25s ease-out 2.75s forwards",
                    }}
                >
                    <div className="absolute inset-0">
                        <ShaderAnimation />
                    </div>
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
                </div>,
                document.body
            )}
            {children}
        </>
    );
}
