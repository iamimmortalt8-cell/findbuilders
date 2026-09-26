"use client";

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Code,
  Rocket,
  Target,
  Lightbulb,
  ArrowRight,
  Star,
  Mail,
  CheckCircle2,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  Globe
} from "lucide-react";
import SEO, { SITE_URL, ORGANIZATION_SCHEMA } from "@/components/SEO";

const FOUNDER_PAGE_URL = `${SITE_URL}/about-founder`;

const founderJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${FOUNDER_PAGE_URL}#profile`,
      url: FOUNDER_PAGE_URL,
      name: "About Bharath Thommandru — Founder of FindBuilders",
      isPartOf: {
        "@type": "WebSite",
        name: "FindBuilders",
        url: SITE_URL
      },
      mainEntity: {
        "@id": `${SITE_URL}#/schema/person/bharath-thommandru`
      }
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}#/schema/person/bharath-thommandru`,
      name: "Bharath Thommandru",
      givenName: "Bharath",
      familyName: "Thommandru",
      jobTitle: "Founder & Lead Developer",
      url: FOUNDER_PAGE_URL,
      image: `${SITE_URL}/bharath.png`,
      email: "bharathtommandru1@gmail.com",
      sameAs: [
        "https://github.com/bharath-dev8668",
        "https://www.linkedin.com/in/bharath-thommandru",
        "https://x.com/BTommandru81787"
      ],
      worksFor: {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "FindBuilders",
        url: SITE_URL
      },
      knowsAbout: [
        "React",
        "TypeScript",
        "Full-Stack Development",
        "UI/UX Design",
        "Artificial Intelligence",
        "Web Development",
        "Cloud Infrastructure",
        "Product Architecture"
      ]
    },
    ORGANIZATION_SCHEMA
  ]
};

const milestones = [
  {
    year: "2025",
    title: "Independent Builder Journey",
    event: "Started building developer and career tools including CVFolioX — an AI-powered platform simplifying resume and portfolio creation."
  },
  {
    year: "2025",
    title: "Identifying the Discovery Gap",
    event: "Observed firsthand how difficult it is for solo developers and indie makers to get their products seen after spending months building."
  },
  {
    year: "2026",
    title: "FindBuilders Production Launch",
    event: "Launched FindBuilders as a dedicated product discovery platform with curated categories, maker profiles, voting, and verified SEO indexing."
  }
];

const roadmapItems = [
  "Expanding category discovery with intelligent search and filtering",
  "Builder spotlight series and maker interview features",
  "Real-time feedback systems and product launch analytics for makers",
  "Developer API access for tool directories and ecosystem syndication",
  "Community-driven showcase badges and early-adopter discovery incentives"
];

const technicalSkills = [
  { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"] },
  { category: "Backend & Cloud", items: ["Node.js", "Supabase", "PostgreSQL", "Cloudflare Edge", "REST APIs"] },
  { category: "Specializations", items: ["Full-Stack Architecture", "UI/UX Design", "AI Integration", "Product Discovery SEO"] }
];

export default function AboutFounder() {
  return (
    <div className="bg-[#0B100E] text-[#F5F1E8] font-[family-name:var(--font-heading)] min-h-screen">
      <SEO
        title="About Bharath Thommandru — Founder of FindBuilders"
        description="Learn about Bharath Thommandru, Founder & Lead Developer of FindBuilders. Full-stack developer building platforms where indie makers get discovered."
        canonical="/about-founder"
        ogType="profile"
        ogImage={`${SITE_URL}/bharath.png`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
          { name: "Founder", url: "/about-founder" }
        ]}
        structuredData={founderJsonLd}
      />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-[#202A25]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-[#214C37]/15 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[#D8C7A5]/5 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-10 md:gap-14">
            
            {/* Founder Avatar Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative shrink-0"
            >
              <div className="w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-3xl overflow-hidden border-2 border-[#29342E] bg-[#151D19] shadow-[0_0_40px_rgba(33,76,55,0.25)] relative group">
                <img
                  src="/bharath.png"
                  alt="Bharath Thommandru — Founder & Lead Developer of FindBuilders"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B100E]/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>

            {/* Hero Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-center md:text-left flex-1"
            >
              <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-xs font-semibold uppercase tracking-[0.25em] text-[#789181] mb-4 sm:mb-6">
                <span className="w-2 h-2 rounded-full bg-[#7FAF8D] animate-pulse" />
                About the Founder
              </span>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 sm:mb-4">
                Bharath{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D8C7A5] to-[#F5F1E8]">
                  Thommandru
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-[#D8C7A5] font-semibold mb-3 sm:mb-4 tracking-wide">
                Founder &amp; Lead Developer at FindBuilders
              </p>

              <p className="text-xs sm:text-sm md:text-base text-[#8C958E] leading-relaxed max-w-2xl font-[family-name:var(--font-body)] mb-6 sm:mb-8">
                Full-stack developer and indie maker passionate about building products that empower creators, solve distribution friction, and give innovative tools a dedicated stage to be discovered.
              </p>

              {/* Social Profiles */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3">
                <a
                  href="https://www.linkedin.com/in/bharath-thommandru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:text-[#F5F1E8] text-[#C5C8C1] transition-all text-xs font-medium"
                  aria-label="Bharath Thommandru LinkedIn profile"
                >
                  <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                  LinkedIn
                </a>

                <a
                  href="https://github.com/bharath-dev8668"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:text-[#F5F1E8] text-[#C5C8C1] transition-all text-xs font-medium"
                  aria-label="Bharath Thommandru GitHub profile"
                >
                  <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                  GitHub
                </a>

                <a
                  href="https://x.com/BTommandru81787"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:text-[#F5F1E8] text-[#C5C8C1] transition-all text-xs font-medium"
                  aria-label="Bharath Thommandru X (Twitter) profile"
                >
                  <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  X
                </a>

                <a
                  href="mailto:bharathtommandru1@gmail.com"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:text-[#F5F1E8] text-[#C5C8C1] transition-all text-xs font-medium"
                  aria-label="Email Bharath Thommandru"
                >
                  <Mail className="w-4 h-4 text-[#D8C7A5]" />
                  Email
                </a>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ================= WHO IS BHARATH THOMMANDRU? ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Star className="w-3.5 h-3.5 text-[#D8C7A5]" /> Introduction
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              Who is Bharath Thommandru?
            </h2>
            <div className="space-y-6 text-[#C5C8C1] font-[family-name:var(--font-body)] text-base sm:text-lg leading-relaxed">
              <p>
                Bharath Thommandru is a full-stack developer, software engineer, and the founder behind FindBuilders. He creates software centered around product discovery, user experience design, and giving indie creators an equal opportunity to reach an appreciative audience.
              </p>
              <p>
                With expertise spanning React, TypeScript, UI/UX architecture, full-stack systems, and modern AI integration, Bharath approaches software engineering from a maker's perspective: identifying where builders spend unnecessary energy and replacing that friction with clean, intuitive software.
              </p>
              <p>
                Before launching FindBuilders, he developed <a href="https://cvfoliox.in" target="_blank" rel="noopener noreferrer" className="text-[#D8C7A5] underline decoration-[#2E6549] hover:text-[#F5F1E8] transition-colors">CVFolioX</a> — an AI-powered resume intelligence and portfolio generation platform designed to transform traditional career documents into shareable digital identities.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= ORIGIN & STORY ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Rocket className="w-3.5 h-3.5 text-[#D8C7A5]" /> Origin
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              The Story Behind FindBuilders
            </h2>
            <div className="space-y-6 text-[#C5C8C1] font-[family-name:var(--font-body)] text-base sm:text-lg leading-relaxed">
              <p>
                FindBuilders originated from a direct observation in the maker community. Countless independent creators, engineers, and designers spend weeks or months pouring creativity and code into exceptional projects, only to hit a wall when attempting to get their work discovered.
              </p>
              <p>
                Together with co-founder Rishi Chowdary Karumanchi, Bharath set out to build a platform that serves as a launchpad for products of all sizes. FindBuilders was created not as another cluttered link directory, but as an engaging discovery environment where makers can display their creations with pride, gather authentic feedback, and connect with early adopters searching for the next breakthrough tool.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= WHY WAS FINDBUILDERS BUILT? ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Lightbulb className="w-3.5 h-3.5 text-[#D8C7A5]" /> Motivation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              Why was FindBuilders built?
            </h2>
            <div className="space-y-6 text-[#C5C8C1] font-[family-name:var(--font-body)] text-base sm:text-lg leading-relaxed">
              <p>
                Traditional discovery mechanisms are heavily weighted toward well-funded corporations with massive marketing teams. Solo builders and independent teams are often overlooked by mainstream platforms.
              </p>
              <p>
                Our core philosophy is that <strong className="text-[#F5F1E8]">building a great product is only half the journey; getting it discovered is the other half</strong>. FindBuilders levels the playing field, making sure that what matters is the quality, utility, and craftsmanship of the product itself.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= HOW DOES THE PLATFORM WORK? ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Target className="w-3.5 h-3.5 text-[#D8C7A5]" /> Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              How does FindBuilders work?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Submit & Showcase",
                  description: "Makers submit their products with descriptive summaries, screenshots, tags, category selections, and live product links."
                },
                {
                  step: "02",
                  title: "Discover & Explore",
                  description: "Early adopters, developers, and tech enthusiasts browse curated categories, test innovative products, and upvote the best tools."
                },
                {
                  step: "03",
                  title: "Connect & Grow",
                  description: "Makers receive direct community comments, build a public builder profile, track engagement, and establish early user momentum."
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-[#151D19] border border-[#202A25] rounded-2xl p-6 hover:border-[#2E6549] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#101814] border border-[#29342E] flex items-center justify-center text-[#D8C7A5] font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[#F5F1E8] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8C958E] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= TECHNOLOGY & EXPERTISE ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Code className="w-3.5 h-3.5 text-[#D8C7A5]" /> Engineering
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              Technology &amp; Architecture
            </h2>
            <p className="text-[#C5C8C1] text-base sm:text-lg mb-8 leading-relaxed font-[family-name:var(--font-body)]">
              FindBuilders is engineered as a modern, high-performance web application utilizing modern edge infrastructure, client-side reactivity, and search-engine indexable metadata.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {technicalSkills.map((col) => (
                <div key={col.category} className="bg-[#151D19] border border-[#202A25] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-[#D8C7A5] uppercase tracking-wider mb-4">
                    {col.category}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.items.map((skill) => (
                      <li key={skill} className="flex items-center gap-2.5 text-sm text-[#C5C8C1]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF8D]" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= MILESTONES ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <Rocket className="w-3.5 h-3.5 text-[#D8C7A5]" /> Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              Milestones
            </h2>
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-4 sm:gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#D8C7A5] ring-4 ring-[#D8C7A5]/20 mt-1" />
                    {i < milestones.length - 1 && (
                      <div className="w-px flex-1 bg-[#202A25] min-h-[48px] my-2" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D8C7A5] uppercase tracking-wider">
                      {m.year} — {m.title}
                    </span>
                    <p className="text-[#C5C8C1] text-sm sm:text-base mt-1.5 leading-relaxed font-[family-name:var(--font-body)]">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FUTURE ROADMAP ================= */}
      <section className="py-20 md:py-24 border-b border-[#202A25]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs text-[#789181] font-semibold uppercase tracking-[0.25em] mb-4">
              <ArrowRight className="w-3.5 h-3.5 text-[#D8C7A5]" /> Future
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-[#F5F1E8]">
              Future Roadmap
            </h2>
            <div className="space-y-4 text-[#C5C8C1] leading-relaxed font-[family-name:var(--font-body)] text-base sm:text-lg">
              <p>
                FindBuilders continues to expand its feature set to empower makers and early adopters. Current roadmap priorities include:
              </p>
              <ul className="space-y-3 pt-2">
                {roadmapItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#C5C8C1] text-sm sm:text-base">
                    <span className="w-2 h-2 rounded-full bg-[#7FAF8D] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= GET IN TOUCH / CONTACT ================= */}
      <section className="py-16 sm:py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-[#F5F1E8]">
              Get in Touch
            </h2>
            <p className="text-[#8C958E] mb-8 sm:mb-10 max-w-lg mx-auto text-xs sm:text-sm md:text-base leading-relaxed font-[family-name:var(--font-body)]">
              Have an idea, collaboration inquiry, or want to feature your product on FindBuilders? Reach out directly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
              <a
                href="mailto:bharathtommandru1@gmail.com"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:bg-[#1B2520] transition-all text-xs sm:text-sm font-semibold text-[#F5F1E8]"
              >
                <Mail className="w-4 h-4 text-[#D8C7A5]" />
                bharathtommandru1@gmail.com
              </a>

              <a
                href="https://github.com/bharath-dev8668"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:bg-[#1B2520] transition-all text-xs sm:text-sm font-semibold text-[#F5F1E8]"
                aria-label="GitHub profile"
              >
                <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/bharath-thommandru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:bg-[#1B2520] transition-all text-xs sm:text-sm font-semibold text-[#F5F1E8]"
                aria-label="LinkedIn profile"
              >
                <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                LinkedIn
              </a>

              <a
                href="https://x.com/BTommandru81787"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#151D19] border border-[#202A25] hover:border-[#789181] hover:bg-[#1B2520] transition-all text-xs sm:text-sm font-semibold text-[#F5F1E8]"
                aria-label="X (Twitter) profile"
              >
                <svg className="w-4 h-4 text-[#D8C7A5]" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                X
              </a>

              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-[#D8C7A5] text-[#1A1A16] hover:bg-[#E5D5B5] transition-all text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(216,199,165,0.2)]"
              >
                Support Page
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
