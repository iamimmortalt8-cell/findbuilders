"use client";

import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Web3HeroAnimated } from "@/components/ui/animated-web3-landing-page";

export default function Home() {
    return (
        <div className="bg-transparent text-white overflow-hidden h-full flex-1 relative flex flex-col justify-center">
            {/* WebGL Background */}
            <WebGLShader />

            {/* HERO */}
            <div id="home" className="h-full w-full flex flex-col justify-center">
                <Web3HeroAnimated />
            </div>
        </div>
    );
}
