"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { WebGLShader } from "@/components/ui/web-gl-shader";

/* ================= HERO ================= */

export function Web3HeroAnimated() {
    const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];
    const [isMounted, setIsMounted] = useState(false);
    const heroRef = useRef<HTMLElement>(null);

    const { scrollY } = useScroll();
    const yParallax = useTransform(scrollY, [0, 800], [0, 250]);
    const opacityParallax = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <section
                ref={heroRef}
                className="relative min-h-[100dvh] w-full overflow-hidden bg-transparent text-white font-[family-name:var(--font-heading)] flex flex-col justify-center sm:justify-start pt-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:pt-24 lg:pt-24 pb-6 sm:pb-8"
            >
                {/* ================= WEBGL BACKGROUND LAYER ================= */}
                <WebGLShader className="absolute inset-0 w-full h-full pointer-events-none -z-20" />

                {/* ================= HERO CONTENT ================= */}

                <motion.div
                    style={{ y: yParallax, opacity: opacityParallax }}
                    className="relative z-10 mx-auto max-w-5xl text-center px-4 sm:px-6 flex flex-col items-center w-full my-auto sm:my-0 py-2 sm:py-0"
                >
                    <div className="flex flex-col items-center gap-4 sm:gap-5 w-full">
                        {/* Live Dot Tag */}
                        <motion.span
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="group relative inline-flex items-center gap-2 rounded-full bg-[#151D19] px-3.5 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-xs font-medium tracking-wide text-white border border-[#29342E] backdrop-blur cursor-default font-[family-name:var(--font-body)] max-w-full text-center"
                        >
                            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
                                <span className="inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#2E6549] shadow-[0_0_8px_rgba(46,101,73,0.6)]"></span>
                            </span>
                            <span className="truncate sm:whitespace-normal">Where Builders Build, and Great Products Get Discovered</span>
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="text-fluid-hero font-bold tracking-[-0.025em] leading-[1.12] sm:leading-[1.08] bg-gradient-to-br from-white via-[#F5F5F2] to-[#D5D8D4] bg-clip-text text-transparent max-w-4xl px-2 break-words"
                        >
                            Where Builders Build, and Great Products Get Discovered.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="mx-auto max-w-2xl text-[#F5F5F2] text-xs sm:text-base md:text-lg font-[family-name:var(--font-body)] leading-relaxed px-2"
                        >
                            FindBuilders is a product discovery platform where indie makers showcase developer tools, AI apps, and software to get discovered by early adopters looking for what's new.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto px-4 max-w-xs sm:max-w-none mx-auto"
                        >
                            <Link to="/products" className="w-full sm:w-auto text-center rounded-full bg-[#D8C7A5] px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-[#1A1A16] hover:bg-[#E5D5B5] transition shadow-[0_0_25px_rgba(216,199,165,0.25)] hover:shadow-[0_0_35px_rgba(216,199,165,0.4)] active:scale-95 inline-block transform transition-all duration-300">
                                Browse Products
                            </Link>

                            <Link to="/submit" className="w-full sm:w-auto text-center rounded-full border border-[#29342E] bg-[#1B2520]/80 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-[#F5F1E8] hover:bg-[#202B25] hover:border-[#2E6549] transition active:scale-95 inline-block transform transition-all duration-300 shadow-xl shadow-transparent hover:shadow-[0_0_20px_rgba(33,76,55,0.2)] backdrop-blur-md">
                                Launch Your Product
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ================= PILLARS ================= */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48vh] sm:h-[54vh] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B100E] via-[#0B100E]/90 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-[1px]">
                        {pillars.map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-white/[0.07] to-transparent transition-all duration-1000"
                                style={{
                                    height: isMounted ? `${h}%` : "0%",
                                    transitionDelay: `${Math.abs(i - 8) * 60}ms`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
