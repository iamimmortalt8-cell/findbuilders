"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Server,
    Key,
    Layers,
    Database,
    Terminal,
    Activity,
    BrainCircuit,
    Code,
    Clock,
    GraduationCap,
    Palette,
    Briefcase,
    HelpCircle,
} from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";

const features = [
    {
        icon: Server,
        title: "Product Discovery",
        description: "Browse curated products from indie makers.",
    },
    {
        icon: Key,
        title: "Upvote & Community",
        description: "Vote for products you love and join the conversation.",
    },
    {
        icon: Layers,
        title: "Maker Profiles",
        description: "Showcase your products and your work as a maker.",
    },
    {
        icon: Database,
        title: "Product Categories",
        description: "Discover products organized by category.",
    },
    {
        icon: Terminal,
        title: "Moderation & Review",
        description: "Products are reviewed before they become publicly discoverable.",
    },
    {
        icon: Activity,
        title: "New & Trending",
        description: "Discover newly launched and trending products.",
    },
];

const categories = [
    {
        icon: BrainCircuit,
        title: "AI",
        description: "Explore products built with artificial intelligence and machine learning.",
    },
    {
        icon: Code,
        title: "Developer Tools",
        description: "Discover tools that help developers build, test, deploy, and ship faster.",
    },
    {
        icon: Clock,
        title: "Productivity",
        description: "Find apps and tools designed to help you work and organize better.",
    },
    {
        icon: GraduationCap,
        title: "Education",
        description: "Discover products built for learning, teaching, and education.",
    },
    {
        icon: Palette,
        title: "Design",
        description: "Explore creative tools and products for designers and creators.",
    },
    {
        icon: Briefcase,
        title: "Business",
        description: "Discover products built to help businesses, teams, and makers grow.",
    },
    {
        icon: HelpCircle,
        title: "Other",
        description: "Explore interesting products that do not fit into another category.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function FeaturesPage() {
    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] font-[family-name:var(--font-heading)] min-h-screen">
            <WebGLShader />

            {/* Hero */}
            <section className="relative z-10 pt-36 pb-24 px-6 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-sm text-[#789181] font-medium tracking-widest mb-8">
                        PLATFORM FEATURES
                    </span>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.08] bg-gradient-to-b from-[#F5F1E8] to-[#C5C8C1] bg-clip-text text-transparent mb-8">
                        Everything you need to discover and showcase products.
                    </h1>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-lg md:text-xl text-[#8C958E] font-[family-name:var(--font-body)] leading-relaxed max-w-3xl mx-auto"
                >
                    Everything is designed to help makers showcase their products and help people discover what is being built. From submission to discovery, we keep the experience simple and focused.
                </motion.p>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <StaggerItem key={feature.title}>
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    className="group relative p-8 rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-6 group-hover:border-[#2E6549] group-hover:bg-[#1B2520] transition-all duration-500">
                                            <Icon className="w-6 h-6 text-[#789181] group-hover:text-[#D8C7A5] transition-colors duration-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#F5F1E8] mb-3 tracking-tight">{feature.title}</h3>
                                        <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-[15px]">{feature.description}</p>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            </section>

            {/* Categories */}
            <section className="relative z-10 py-24 px-6 border-t border-[#202A25]">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="inline-block px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-8">
                                Discover Products
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br from-[#F5F1E8] via-[#C5C8C1] to-[#8C958E] bg-clip-text text-transparent">
                                Browse by Category
                            </h2>
                            <p className="mt-6 text-lg md:text-xl text-[#8C958E] max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
                                Explore products built by indie makers and new builders. Find useful tools, apps, and ideas across different categories.
                            </p>
                        </div>
                    </Reveal>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <motion.div
                                    key={category.title}
                                    variants={cardVariants}
                                    whileHover={{ y: -6 }}
                                    className="group relative p-8 rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-6 group-hover:border-[#2E6549] group-hover:bg-[#1B2520] transition-all duration-500">
                                            <Icon className="w-6 h-6 text-[#789181] group-hover:text-[#D8C7A5] transition-colors duration-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#F5F1E8] mb-3 tracking-tight">{category.title}</h3>
                                        <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-[15px]">{category.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
