'use client';

import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FooterLink {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}

import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="relative w-full flex flex-col items-center justify-center border-t border-[#202A25] bg-[#0B100E] px-6 py-12 lg:py-16 text-[#F5F1E8] overflow-hidden">
            {/* Ambient accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#214C37]/60 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-8 bg-[#214C37]/10 blur-3xl rounded-full" />

            <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto gap-8 justify-between relative z-10">

                {/* LOGO + BRAND */}
                <AnimatedContainer className="space-y-4 md:w-1/2">
                    <div className="relative">
                        <span className="text-2xl font-bold tracking-tight text-[#F5F1E8]">
                            <span className="text-[#D8C7A5]">F</span>ind<span className="text-[#D8C7A5]">B</span>uilders
                        </span>
                    </div>

                    <p className="text-[#8C958E] text-sm max-w-xs leading-relaxed">
                        FindBuilders is a platform where builders showcase their products and get discovered by people looking for what's new.
                    </p>
                </AnimatedContainer>

                {/* LINKS */}
                <AnimatedContainer delay={0.2} className="flex flex-col space-y-4 md:w-1/2 md:items-end justify-center">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <Link to="/privacy-policy" className="text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] transition-colors">
                            Terms & Conditions
                        </Link>
                        <Link to="/support" className="text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] transition-colors">
                            Support
                        </Link>
                    </div>
                </AnimatedContainer>

            </div>

            <div className="w-full max-w-6xl mx-auto mt-12 pt-8 border-t border-[#202A25]/50 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[#69736C] text-xs font-medium text-center md:text-left">
                    &copy; {new Date().getFullYear()} FindBuilders. All Rights Reserved.
                </p>
                <p className="text-[#69736C] text-xs font-medium text-center md:text-right">
                    Built/Founded by Bharath Thommandru.
                </p>
            </div>
        </footer>
    );
}

type ViewAnimationProps = {
    delay?: number;
    className?: ComponentProps<typeof motion.div>['className'];
    children: ReactNode;
};

function AnimatedContainer({
    className,
    delay = 0.1,
    children,
}: ViewAnimationProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.8 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
