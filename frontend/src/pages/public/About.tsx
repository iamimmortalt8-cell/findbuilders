"use client";

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Search, MessageCircle, Heart, Sprout, ArrowRight } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import SEO, { ORGANIZATION_SCHEMA } from "@/components/SEO";

const whatWeDo = [
    {
        icon: Rocket,
        title: "Showcase their products",
        description: "Give builders a place to present what they have built.",
    },
    {
        icon: Search,
        title: "Get discovered by new audiences",
        description: "Help new products reach people who are looking for what's new.",
    },
    {
        icon: MessageCircle,
        title: "Receive feedback from the community",
        description: "Create a space where builders can get early reactions and feedback.",
    },
    {
        icon: Heart,
        title: "Build early support around their products",
        description: "Help promising products find their first supporters.",
    },
    {
        icon: Sprout,
        title: "Give new ideas a chance to grow",
        description: "Give new builders and products a place to be seen.",
    },
];

export default function AboutPage() {
    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] font-[family-name:var(--font-heading)] min-h-screen">
            <SEO
                title="About FindBuilders - The Product Discovery Platform for Makers"
                description="Learn about FindBuilders, our mission to help indie makers get their products discovered, and the founding team Bharath Thommandru and Rishi Chowdary Karumanchi."
                canonical="/about"
                breadcrumbs={[
                    { name: "Home", url: "/" },
                    { name: "About", url: "/about" }
                ]}
                structuredData={ORGANIZATION_SCHEMA}
            />

            <WebGLShader />

            {/* Hero */}
            <section className="relative z-10 pt-36 pb-24 px-6 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-sm text-[#789181] font-medium tracking-widest mb-8">
                        ABOUT
                    </span>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.08] bg-gradient-to-b from-[#F5F1E8] to-[#C5C8C1] bg-clip-text text-transparent mb-6">
                        About FindBuilders
                    </h1>
                    <p className="text-xl md:text-2xl text-[#D8C7A5] font-[family-name:var(--font-body)]">
                        Built by builders, for builders.
                    </p>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-lg md:text-xl text-[#8C958E] font-[family-name:var(--font-body)] leading-relaxed max-w-3xl mx-auto mt-8"
                >
                    FindBuilders is a platform created to give builders a place to showcase the products they create and get them in front of people looking for what's new.
                </motion.p>
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="text-lg md:text-xl text-[#8C958E] font-[family-name:var(--font-body)] leading-relaxed max-w-3xl mx-auto mt-6"
                >
                    We believe building a great product is only half the journey. Getting it discovered is the other half.
                </motion.p>
            </section>

            {/* The People Behind FindBuilders */}
            <section className="relative z-10 py-24 px-6 border-t border-[#202A25]">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-block px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-8">
                                THE TEAM
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br from-[#F5F1E8] via-[#C5C8C1] to-[#8C958E] bg-clip-text text-transparent">
                                The People Behind FindBuilders
                            </h2>
                        </div>
                    </Reveal>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8" staggerDelay={0.15}>
                        {/* Bharath */}
                        <StaggerItem>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="group relative rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                <div className="relative z-10">
                                    <div className="w-full aspect-[4/3] bg-[#101814] border-b border-[#202A25] flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/bharath.png"
                                            alt="Bharath Thommandru - Founder & AI Engineer at FindBuilders"
                                            className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        />
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-2xl font-bold text-[#F5F1E8] mb-1 tracking-tight">Bharath Thommandru</h3>
                                        <p className="text-sm text-[#D8C7A5] font-semibold uppercase tracking-wider mb-4">Founder & AI Engineer</p>
                                        <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-[15px]">
                                            Bharath is a curious builder who enjoys turning ideas into products that people can actually use. He is driven by the process of experimenting, learning, and creating from the ground up, with a strong belief that good ideas deserve a place to be seen and explored.
                                        </p>
                                        <div className="pt-4 mt-4 border-t border-[#202A25]/60">
                                            <Link
                                                to="/about-founder"
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8C7A5] hover:text-[#F5F1E8] transition-colors"
                                            >
                                                Meet the Founder &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </StaggerItem>

                        {/* Co-Founder */}
                        <StaggerItem>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="group relative rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                <div className="relative z-10">
                                    <div className="w-full aspect-[4/3] bg-[#101814] border-b border-[#202A25] flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/Rishi.png"
                                            alt="Karumanchi Rishi Chowdary - Founder & SDE Engineer at FindBuilders"
                                            className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        />
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-2xl font-bold text-[#F5F1E8] mb-1 tracking-tight">Rishi Chowdary Karumanchi</h3>
                                        <p className="text-sm text-[#D8C7A5] font-semibold uppercase tracking-wider mb-4">Founder & SDE Engineer</p>
                                        <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-[15px]">
                                            Rishi is a creative-minded builder who enjoys shaping ideas into thoughtful digital experiences. He brings a strong sense of curiosity and attention to detail to everything he creates, and shares the vision of building products that are meaningful, useful, and worth discovering.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* What We Do */}
            <section className="relative z-10 py-24 px-6 border-t border-[#202A25]">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-block px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-8">
                                WHAT WE DO
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br from-[#F5F1E8] via-[#C5C8C1] to-[#8C958E] bg-clip-text text-transparent mb-6">
                                Builders build the products.
                                <br />
                                FindBuilders helps them get discovered.
                            </h2>
                        </div>
                    </Reveal>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                        {whatWeDo.map((item) => {
                            const Icon = item.icon;
                            return (
                                <StaggerItem key={item.title}>
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        className="group relative p-8 rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                        <div className="relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-6 group-hover:border-[#2E6549] group-hover:bg-[#1B2520] transition-all duration-500">
                                                <Icon className="w-6 h-6 text-[#789181] group-hover:text-[#D8C7A5] transition-colors duration-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-[#F5F1E8] mb-3 tracking-tight">{item.title}</h3>
                                            <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-[15px]">{item.description}</p>
                                        </div>
                                    </motion.div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                </div>
            </section>

            {/* Mission & Internal Links */}
            <section className="relative z-10 py-32 px-6 border-t border-[#202A25]">
                <div className="max-w-4xl mx-auto text-center">
                    <Reveal>
                        <span className="inline-block px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-8">
                            OUR MISSION
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br from-[#F5F1E8] via-[#C5C8C1] to-[#8C958E] bg-clip-text text-transparent mb-12">
                            Make great products easier to discover.
                        </h2>

                        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                            <Link
                                to="/products"
                                className="px-6 py-3 rounded-full bg-[#D8C7A5] text-[#1A1A16] font-semibold text-sm hover:bg-[#E5D5B5] transition-all flex items-center gap-2"
                            >
                                Discover Products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/features"
                                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
                            >
                                Platform Features
                            </Link>
                            <Link
                                to="/faq"
                                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
                            >
                                Read FAQ
                            </Link>
                            <Link
                                to="/support"
                                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
                            >
                                Get in Touch
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}
