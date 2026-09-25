"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ================= MAGNETIC BUTTON ================= */

const MagneticButton = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
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



/* ================= HERO ================= */

export function Web3HeroAnimated() {
    const typeText = "Where Builders Build, and Great Products Get Discovered.";
    const [displayText, setDisplayText] = useState("");

    useEffect(() => {
        let i = 0;
        let interval: ReturnType<typeof setInterval>;

        const startTimeout = setTimeout(() => {
            interval = setInterval(() => {
                setDisplayText(typeText.slice(0, i + 1));
                i++;
                if (i === typeText.length) clearInterval(interval);
            }, 80);
        }, 400);

        return () => {
            clearTimeout(startTimeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];
    const [isMounted, setIsMounted] = useState(false);
    const heroRef = useRef<HTMLElement>(null);

    // Cursor-based parallax
    const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

    const { scrollY } = useScroll();
    const yParallax = useTransform(scrollY, [0, 800], [0, 250]);
    const opacityParallax = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { width, height } = heroRef.current.getBoundingClientRect();
            const x = (e.clientX - width / 2) / width;
            const y = (e.clientY - height / 2) / height;
            mouseX.set(x * 12);
            mouseY.set(y * 12);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <>
            <section
                ref={heroRef}
                className="relative h-full w-full overflow-hidden bg-transparent text-white font-[family-name:var(--font-heading)] flex flex-col justify-center"
            >
                {/* ================= HERO CONTENT ================= */}

                <motion.div
                    style={{ y: yParallax, opacity: opacityParallax }}
                    className="relative z-10 mx-auto max-w-5xl text-center px-4 sm:px-6 pt-20 pb-8 sm:pt-24 sm:pb-12 h-full flex flex-col justify-center items-center my-auto"
                >
                    <motion.div
                        style={{ x: mouseX, y: mouseY }}
                        className="flex flex-col items-center gap-4 sm:gap-5"
                    >
                        {/* Live Dot Tag */}
                        <motion.span
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="group relative inline-flex items-center gap-2.5 rounded-full bg-[#151D19] px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-medium tracking-wide text-white border border-[#29342E] backdrop-blur cursor-pointer font-[family-name:var(--font-body)]"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#789181] opacity-60 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#214C37] shadow-[0_0_10px_rgba(33,76,55,0.8)] group-hover:scale-125 transition-transform duration-300"></span>
                            </span>
                            Where Builders Build, and Great Products Get Discovered
                        </motion.span>

                        <h1
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold tracking-[-0.025em] leading-[1.08] bg-gradient-to-br from-white via-[#F5F5F2] to-[#D5D8D4] bg-clip-text text-transparent min-h-[90px] sm:min-h-[115px] lg:min-h-[140px] max-w-4xl"
                            aria-label={typeText}
                        >
                            {displayText || <span className="opacity-0">{typeText}</span>}
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                            className="mx-auto max-w-2xl text-[#F5F5F2] text-sm sm:text-base md:text-lg font-[family-name:var(--font-body)] leading-relaxed"
                        >
                            FindBuilders is a product discovery platform where indie makers showcase developer tools, AI apps, and software to get discovered by early adopters looking for what's new.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.4 }}
                            className="mt-6 sm:mt-6 flex flex-wrap justify-center gap-4"
                        >
                            <MagneticButton>
                                <Link to="/products" className="group relative rounded-full bg-[#D8C7A5] px-7 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-bold text-[#1A1A16] hover:bg-[#E5D5B5] transition shadow-[0_0_25px_rgba(216,199,165,0.25)] hover:shadow-[0_0_35px_rgba(216,199,165,0.4)] active:scale-95 inline-block transform transition-all duration-300">
                                    Browse Products
                                </Link>
                            </MagneticButton>

                            <MagneticButton>
                                <Link to="/submit" className="group relative rounded-full border border-[#29342E] bg-[#1B2520]/80 px-7 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-bold text-[#F5F1E8] hover:bg-[#202B25] hover:border-[#2E6549] transition active:scale-95 inline-block transform transition-all duration-300 shadow-xl shadow-transparent hover:shadow-[0_0_20px_rgba(33,76,55,0.2)] backdrop-blur-md">
                                    Launch Your Product
                                </Link>
                            </MagneticButton>
                        </motion.div>

                        {/* SEO Discovery Topics */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.6 }}
                            className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#8C958E]"
                        >
                            <span className="font-semibold text-[#A5B5A8] tracking-wide">Popular Topics:</span>
                            <Link to="/products?category=AI" className="px-2.5 py-1 rounded-full bg-[#151D19]/90 border border-[#202A25] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-colors">
                                AI Tools
                            </Link>
                            <Link to="/products?category=Developer+Tools" className="px-2.5 py-1 rounded-full bg-[#151D19]/90 border border-[#202A25] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-colors">
                                Developer Tools
                            </Link>
                            <Link to="/products?category=Productivity" className="px-2.5 py-1 rounded-full bg-[#151D19]/90 border border-[#202A25] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-colors">
                                Productivity
                            </Link>
                            <Link to="/features" className="px-2.5 py-1 rounded-full bg-[#151D19]/90 border border-[#202A25] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-colors">
                                Features
                            </Link>
                            <Link to="/about" className="px-2.5 py-1 rounded-full bg-[#151D19]/90 border border-[#202A25] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-colors">
                                About
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* ================= PILLARS ================= */}

                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[72vh] sm:top-auto sm:translate-y-0 sm:bottom-0 sm:h-[32vh]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B100E]/50 via-transparent to-[#0B100E]/50 sm:from-[#0B100E] sm:via-[#0B100E]/80 sm:to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-center sm:items-end gap-[1px]">
                        {pillars.map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-[#214C37]/25 to-transparent transition-all duration-1000"
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
