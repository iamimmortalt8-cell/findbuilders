"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number;
    once?: boolean;
}

const directionMap = {
    up: { y: 36, x: 0 },
    down: { y: -36, x: 0 },
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    none: { x: 0, y: 0 },
};

export function Reveal({
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 0.65,
    once = true,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-80px" });
    const offset = directionMap[direction];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...offset, filter: "blur(4px)" }}
            animate={
                isInView
                    ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, ...offset, filter: "blur(4px)" }
            }
            transition={{
                duration,
                delay,
                ease: [0.22, 0.03, 0.26, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({
    children,
    className = "",
    staggerDelay = 0.1,
    once = true,
}: {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-80px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
                visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: {
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
