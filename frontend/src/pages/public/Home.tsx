"use client";

import React from "react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Web3HeroAnimated } from "@/components/ui/animated-web3-landing-page";
import SEO from "@/components/SEO";

export default function Home() {
    return (
        <div className="bg-transparent text-white relative w-full flex-1 flex flex-col">
            <SEO
                title="FindBuilders - Product Discovery Platform for Indie Makers & Startup Products"
                description="Discover new startup products, developer tools, AI tools, and SaaS apps built by indie makers. Upvote, explore, and launch emerging products on FindBuilders."
                canonical="/"
            />

            {/* WebGL Background */}
            <WebGLShader />

            {/* HERO */}
            <div id="home" className="w-full flex-1 flex flex-col">
                <Web3HeroAnimated />
            </div>
        </div>
    );
}
