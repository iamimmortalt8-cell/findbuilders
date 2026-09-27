"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { WebGLShader } from "@/components/ui/web-gl-shader";

/* ================= HERO ================= */

export function Web3HeroAnimated() {
    const pillars = [56, 62, 68, 74, 78, 82, 86, 90, 94, 90, 86, 82, 78, 74, 68, 62, 56];
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
                className="relative min-h-[100dvh] w-full overflow-hidden bg-transparent text-white font-[family-name:var(--font-heading)] flex flex-col justify-start pt-[calc(5.75rem+env(safe-area-inset-top,0px))] sm:pt-24 lg:pt-24 pb-6 sm:pb-8"
            >
                {/* ================= WEBGL BACKGROUND LAYER ================= */}
                <WebGLShader className="absolute inset-0 w-full h-full pointer-events-none -z-20" />

                {/* ================= HERO CONTENT ================= */}

                <motion.div
                    style={{ y: yParallax, opacity: opacityParallax }}
                    className="relative z-10 mx-auto max-w-5xl text-center px-4 sm:px-6 flex flex-col items-center w-full"
                >
                    <div className="flex flex-col items-center gap-3.5 sm:gap-5 w-full">
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
                            className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 max-w-xs sm:max-w-none mx-auto"
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

                {/* ================= ARCHITECTURAL GRID & DEPTH STRUCTURE ================= */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[54vh] sm:h-[50vh] lg:h-[52vh] overflow-hidden -z-10">
                    {/* Perspective / Architectural Grid */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(46,101,73,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(46,101,73,0.18)_1px,transparent_1px)] bg-[size:28px_28px] sm:bg-[size:36px_36px] lg:bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_100%,black_40%,transparent_100%)] opacity-80 sm:opacity-65"
                    />
                    {/* Subtle Architectural Depth Pyramid / Angular Guide Lines */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-full [mask-image:linear-gradient(to_top,black_25%,transparent_90%)] opacity-40 sm:opacity-30"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, rgba(120,145,129,0.08) 0px, rgba(120,145,129,0.08) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(-45deg, rgba(120,145,129,0.08) 0px, rgba(120,145,129,0.08) 1px, transparent 1px, transparent 28px)`
                        }}
                    />
                    {/* Subtle Ambient Emerald Depth Glow */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[750px] lg:w-[900px] h-[280px] bg-gradient-to-t from-[#214C37]/35 via-[#2E6549]/15 to-transparent blur-3xl rounded-full" />
                </div>

                {/* ================= PILLARS ================= */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] sm:h-[40vh] lg:h-[42vh] overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-[1px]">
                        {pillars.map((h, i) => (
                            <div
                                key={i}
                                className="relative flex-1 bg-gradient-to-t from-[#152B20]/40 via-[#214C37]/25 to-[#4E8766]/20 border-t border-[#789181]/30 border-x border-[#2E6549]/15 transition-all duration-1000"
                                style={{
                                    height: isMounted ? `${h}%` : "0%",
                                    transitionDelay: `${Math.abs(i - 8) * 60}ms`,
                                }}
                            />
                        ))}
                    </div>
                    {/* Soft bottom grounding fade */}
                    <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-[#0B100E] via-[#0B100E]/70 to-transparent pointer-events-none z-10" />
                </div>
            </section>
        </>
    );
}
