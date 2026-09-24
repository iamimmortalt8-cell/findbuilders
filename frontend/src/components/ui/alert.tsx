"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AlertProps {
    type?: "success" | "error" | "warning" | "info";
    message?: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const typeStyles = {
    success: "bg-[#173022] text-[#7FAF8D] border-[#7FAF8D]/30",
    error: "bg-[#321C1C] text-[#C97878] border-[#C97878]/30",
    warning: "bg-[#302817] text-[#C9A96A] border-[#C9A96A]/30",
    info: "bg-[#163326] text-[#8DA9A0] border-[#8DA9A0]/30",
};

const fadeInBlur = {
    initial: { opacity: 0, filter: "blur(10px)", y: 10, rotate: 0 },
    animate: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        rotate: 0,
        transition: { duration: 0.2, ease: "easeInOut" as const },
    },
};

const Alert: React.FC<AlertProps> = ({
    type = "info",
    message = "This is an alert message.",
    className,
    onClick,
}) => {
    return (
        <motion.div
            className={cn(
                "border px-4 py-3 flex gap-x-2 items-center rounded-2xl text-sm",
                typeStyles[type],
                className
            )}
            role="alert"
            variants={fadeInBlur}
            initial="initial"
            animate="animate"
            whileHover={{
                scale: 1.01,
                rotate: 1,
                transition: {
                    duration: 0.2,
                    ease: "easeInOut",
                },
            }}
            whileTap={{
                scale: 0.99,
                transition: {
                    duration: 0.2,
                    ease: "easeInOut",
                },
            }}
            onClick={onClick}
        >
            <span className="font-bold capitalize">{type}:</span> <span>{message}</span>
        </motion.div>
    );
};

export default Alert;
