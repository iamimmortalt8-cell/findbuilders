"use client";

import React from "react";
import { Link } from "react-router-dom";
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
    ArrowRight,
} from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import SEO, { buildCollectionSchema } from "@/components/SEO";

const features = [
    {
        icon: Server,
        title: "Product Discovery",
        description: "Browse curated products and innovative tools launched by independent makers and developers.",
    },
    {
        icon: Key,
        title: "Upvote & Community",
        description: "Vote for the products you love and help surface exceptional tools to the wider tech community.",
    },
    {
        icon: Layers,
        title: "Maker Profiles",
        description: "Showcase your portfolio, social links, bio, and all the digital products you have built.",
    },
    {
        icon: Database,
        title: "Product Categories",
        description: "Discover products organized by intuitive categories including AI, Developer Tools, and SaaS.",
    },
    {
        icon: Terminal,
        title: "Moderation & Review",
        description: "Every submission is verified before going live to keep the platform clean, high-quality, and spam-free.",
    },
    {
        icon: Activity,
        title: "New & Trending",
        description: "Follow real-time launches and spot trending projects gaining community traction early.",
    },
];

const categories = [
    {
        icon: BrainCircuit,
        title: "AI",
        query: "AI",
        description: "Explore products built with artificial intelligence, machine learning, and automation.",
    },
    {
        icon: Code,
        title: "Developer Tools",
        query: "Developer Tools",
        description: "Discover tools that help developers write, test, debug, and ship software faster.",
    },
    {
        icon: Clock,
        title: "Productivity",
        query: "Productivity",
        description: "Find apps, task managers, and utilities designed to organize workflows and save time.",
    },
    {
        icon: GraduationCap,
        title: "Education",
        query: "Education",
        description: "Discover interactive tools and platforms built for learning, teaching, and skill building.",
    },
    {
        icon: Palette,
        title: "Design",
        query: "Design",
        description: "Explore UI kits, creative utilities, design assets, and styling resources for creators.",
    },
    {
        icon: Briefcase,
        title: "Business",
        query: "Business",
        description: "Discover software and micro-SaaS built to help founders, operators, and small teams grow.",
    },
    {
        icon: HelpCircle,
        title: "Other",
        query: "Other",
        description: "Explore unique utilities, unconventional projects, and experiments by indie builders.",
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
            <SEO
                title="Platform Features - Product Discovery, Upvotes & Maker Showcase | FindBuilders"
                description="Explore FindBuilders platform features: curated product discovery, community upvotes, maker profiles, category navigation, and quality moderation."
                canonical="/features"
                breadcrumbs={[
                    { name: "Home", url: "/" },
                    { name: "Features", url: "/features" }
                ]}
                structuredData={buildCollectionSchema(
                    "FindBuilders Platform Features",
                    "Explore product discovery, community upvoting, maker profiles, and categories on FindBuilders.",
                    "/features"
                )}
            />

            <WebGLShader />

            {/* Hero */}
            <section className="relative z-10 pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-xs sm:text-sm text-[#789181] font-medium tracking-widest mb-6 sm:mb-8">
                        PLATFORM FEATURES
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.08] bg-gradient-to-b from-[#F5F1E8] to-[#C5C8C1] bg-clip-text text-transparent mb-6 sm:mb-8">
                        Everything you need to discover and showcase products.
                    </h1>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-base sm:text-lg md:text-xl text-[#8C958E] font-[family-name:var(--font-body)] leading-relaxed max-w-3xl mx-auto"
                >
                    Everything is designed to help makers showcase their products and help people discover what is being built. From submission to discovery, we keep the experience simple, fast, and community-focused.
                </motion.p>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 py-14 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" staggerDelay={0.08}>
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <StaggerItem key={feature.title}>
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-5 sm:mb-6 group-hover:border-[#2E6549] group-hover:bg-[#1B2520] transition-all duration-500">
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#789181] group-hover:text-[#D8C7A5] transition-colors duration-500" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-[#F5F1E8] mb-2 sm:mb-3 tracking-tight">{feature.title}</h3>
                                        <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-sm sm:text-[15px]">{feature.description}</p>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            </section>

            {/* Categories */}
            <section className="relative z-10 py-14 sm:py-24 px-4 sm:px-6 border-t border-[#202A25]">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12 sm:mb-16">
                            <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-6 sm:mb-8">
                                DISCOVER PRODUCTS
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br from-[#F5F1E8] via-[#C5C8C1] to-[#8C958E] bg-clip-text text-transparent">
                                Browse by Category
                            </h2>
                            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-[#8C958E] max-w-2xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
                                Explore products built by indie makers and new builders. Find useful tools, apps, and ideas across different categories.
                            </p>
                        </div>
                    </Reveal>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <motion.div
                                    key={category.title}
                                    variants={cardVariants}
                                    whileHover={{ y: -6 }}
                                >
                                    <Link
                                        to={`/products?category=${encodeURIComponent(category.query)}`}
                                        className="block group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#151D19]/60 backdrop-blur-sm border border-[#202A25] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(33,76,55,0.2)] hover:border-[#2E6549] hover:bg-[#151D19]/90 h-full"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#214C37]/0 to-transparent group-hover:from-[#214C37]/15 transition-colors duration-500" />
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8C7A5]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left" />
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#101814] border border-[#202A25] flex items-center justify-center mb-5 sm:mb-6 group-hover:border-[#2E6549] group-hover:bg-[#1B2520] transition-all duration-500">
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#789181] group-hover:text-[#D8C7A5] transition-colors duration-500" />
                                            </div>
                                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                                <h3 className="text-lg sm:text-xl font-bold text-[#F5F1E8] tracking-tight">{category.title}</h3>
                                                <ArrowRight className="w-4 h-4 text-[#789181] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                            </div>
                                            <p className="text-[#8C958E] leading-relaxed font-[family-name:var(--font-body)] text-sm sm:text-[15px]">{category.description}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA & Links */}
            <section className="relative z-10 py-14 sm:py-24 px-4 sm:px-6 border-t border-[#202A25]">
                <div className="max-w-4xl mx-auto text-center">
                    <Reveal>
                        <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] border border-[#202A25] bg-[#151D19] rounded-full mb-6 sm:mb-8">
                            GET STARTED
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F5F1E8] mb-4 sm:mb-6">
                            Ready to explore or showcase your product?
                        </h2>
                        <p className="text-sm sm:text-base text-[#8C958E] max-w-xl mx-auto mb-8 font-[family-name:var(--font-body)]">
                            Join other indie makers, discover emerging startup products, and share your work with an active community.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
                            <Link
                                to="/products"
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#D8C7A5] text-[#1A1A16] font-semibold text-sm hover:bg-[#E5D5B5] transition-all flex items-center justify-center gap-2"
                            >
                                Browse All Products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/submit"
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all flex items-center justify-center"
                            >
                                Submit Your Product
                            </Link>
                            <Link
                                to="/faq"
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all flex items-center justify-center"
                            >
                                Frequently Asked Questions
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}
