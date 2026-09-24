"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const mouse = useRef({ x: -100, y: -100 });
    const pos = useRef({ x: -100, y: -100 });
    const dotPos = useRef({ x: -100, y: -100 });
    const raf = useRef<number>(0);

    useEffect(() => {
        // Detect mobile/touch
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);

        const onMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Add interactive selectors as needed
            const interactive = target.closest("a, button, input, textarea, select, [role='button'], .magnetic-btn, .float-badge");
            if (interactive) {
                document.body.classList.add("h");
            } else {
                document.body.classList.remove("h");
            }
        };

        const onMouseOut = (e: MouseEvent) => {
            if (!e.relatedTarget) {
                document.body.classList.remove("h");
            }
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseover", onMouseOver);
        window.addEventListener("mouseout", onMouseOut);

        const animate = () => {
            // Smooth lerp for ring
            pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
            pos.current.y += (mouse.current.y - pos.current.y) * 0.15;

            // Faster lerp for dot
            dotPos.current.x += (mouse.current.x - dotPos.current.x) * 0.4;
            dotPos.current.y += (mouse.current.y - dotPos.current.y) * 0.4;

            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
            }
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${dotPos.current.x}px, ${dotPos.current.y}px) translate(-50%, -50%)`;
            }
            raf.current = requestAnimationFrame(animate);
        };
        raf.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseover", onMouseOver);
            window.removeEventListener("mouseout", onMouseOut);
            window.removeEventListener("resize", checkMobile);
            cancelAnimationFrame(raf.current);
            document.body.classList.remove("h");
        };
    }, []);

    if (isMobile) return null;

    return (
        <>
            <div id="c" ref={cursorRef} style={{ left: 0, top: 0 }} />
            <div id="cr" ref={ringRef} style={{ left: 0, top: 0 }} />
        </>
    );
}
