"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, ArrowRight, Sparkles, ShieldCheck, Rocket, MessageCircle } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import SEO, { buildFAQSchema } from "@/components/SEO";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Submission" | "Community";
}

const faqs: FAQItem[] = [
  {
    id: "what-is-findbuilders",
    category: "General",
    question: "What is FindBuilders?",
    answer:
      "FindBuilders is a curated product discovery and community platform created by indie builders for indie builders. It provides developers, solo founders, and creators with a dedicated place to showcase what they have built, while giving tech enthusiasts, developers, and early adopters an easy way to discover emerging tools, SaaS apps, and projects before they blow up."
  },
  {
    id: "how-it-works",
    category: "General",
    question: "How does FindBuilders work?",
    answer:
      "Makers create an account, customize their builder profile, and submit their products with rich details including taglines, descriptions, URLs, categories, logos, and screenshots. Once reviewed and approved by moderators, products appear in the public discovery feed where visitors can browse, test, upvote, and leave direct feedback."
  },
  {
    id: "how-to-submit",
    category: "Submission",
    question: "How can I submit a product?",
    answer:
      "To submit a product, sign in to your FindBuilders account and click 'Launch Your Product' or navigate to the product submission page. Fill in your product name, a concise punchy tagline, a comprehensive description, live website URL, primary category, logo, and up to four screenshots. Once submitted, your product enters the review queue."
  },
  {
    id: "who-can-submit",
    category: "Submission",
    question: "Who can submit products?",
    answer:
      "Anyone who builds digital products! Whether you are a solo software engineer, indie hacker, open-source maintainer, design agency, or early-stage startup team, FindBuilders welcomes software tools, AI products, developer libraries, productivity utilities, and SaaS applications."
  },
  {
    id: "how-discovery-works",
    category: "General",
    question: "How does product discovery work?",
    answer:
      "Discovery on FindBuilders is multi-faceted: you can browse the newest launches, explore trending products sorted by community votes, filter by specific categories (such as AI, Developer Tools, Productivity, Education, Design, and Business), or use the search bar to locate products and makers."
  },
  {
    id: "how-votes-work",
    category: "Community",
    question: "How do votes work?",
    answer:
      "Registered users can cast upvotes for products they believe in or find valuable. Upvoting elevates a product's community visibility in the discovery rankings and signals traction to other users and potential supporters."
  },
  {
    id: "how-makers-showcase",
    category: "Community",
    question: "How can makers showcase their products?",
    answer:
      "Every maker has a dedicated public profile page highlighting their biography, role, external social links, technical interests, and a catalog of all approved products they have built. Profiles allow builders to establish an indexable web presence and connect with their audience."
  },
  {
    id: "is-findbuilders-free",
    category: "General",
    question: "Is FindBuilders free to use?",
    answer:
      "Yes. Browsing products, searching makers, submitting products, and voting are completely free for all builders and visitors."
  },
  {
    id: "product-moderation",
    category: "Submission",
    question: "How are products reviewed and moderated?",
    answer:
      "To prevent spam and guarantee that users discover functional, high-quality software, every product submission is manually reviewed by our moderation team. We verify that the website URL is accessible, the product is legitimate, and the description accurately represents the software."
  }
];

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>("what-is-findbuilders");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const faqSchemaData = buildFAQSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer }))
  );

  return (
    <div className="bg-[#0B100E] text-[#F5F1E8] font-[family-name:var(--font-heading)] min-h-screen">
      <SEO
        title="Frequently Asked Questions (FAQ) | FindBuilders"
        description="Find answers to common questions about FindBuilders: how to submit products, how product discovery works, voting, maker profiles, and community guidelines."
        canonical="/faq"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" }
        ]}
        structuredData={faqSchemaData}
      />

      <WebGLShader />

      {/* Hero */}
      <section className="relative z-10 pt-36 pb-16 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-sm text-[#789181] font-medium tracking-widest mb-8">
            HELP & ANSWERS
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.02em] leading-[1.1] bg-gradient-to-b from-[#F5F1E8] to-[#C5C8C1] bg-clip-text text-transparent mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-[#8C958E] font-[family-name:var(--font-body)] max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about FindBuilders, product submission, discovery, upvoting, and maker profiles.
          </p>
        </motion.div>
      </section>

      {/* FAQ Accordion List */}
      <section className="relative z-10 py-12 px-6 max-w-3xl mx-auto">
        <StaggerContainer className="space-y-4" staggerDelay={0.05}>
          {faqs.map((item) => {
            const isOpen = openId === item.id;
            return (
              <StaggerItem key={item.id}>
                <div className="rounded-2xl bg-[#151D19]/70 border border-[#202A25] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-[#2E6549]">
                  <button
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#202A25] text-[#D8C7A5] font-mono uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-[#F5F1E8] tracking-tight">
                        {item.question}
                      </h2>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#8C958E] shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#D8C7A5]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 sm:px-7 sm:pb-7 text-[#C5C8C1] font-[family-name:var(--font-body)] leading-relaxed text-[15px] sm:text-base border-t border-[#202A25]/60 pt-4">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>

      {/* Internal Navigation CTA */}
      <section className="relative z-10 py-20 px-6 max-w-4xl mx-auto border-t border-[#202A25] mt-16 text-center">
        <Reveal>
          <div className="p-8 sm:p-12 rounded-3xl bg-[#151D19]/60 border border-[#202A25] backdrop-blur-sm">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#101814] border border-[#202A25] text-xs font-semibold uppercase tracking-wider text-[#789181] mb-6">
              Still Have Questions?
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F1E8] mb-4">
              We're here to help you build and launch.
            </h3>
            <p className="text-[#8C958E] max-w-xl mx-auto mb-8 font-[family-name:var(--font-body)]">
              Learn more about our mission, explore platform capabilities, or contact our support team directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/products"
                className="px-6 py-3 rounded-full bg-[#D8C7A5] text-[#1A1A16] font-semibold text-sm hover:bg-[#E5D5B5] transition-all flex items-center gap-2"
              >
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
              >
                Explore Features
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
              >
                About Us
              </Link>
              <Link
                to="/support"
                className="px-6 py-3 rounded-full bg-[#1B2520] text-[#F5F1E8] font-semibold text-sm border border-[#29342E] hover:border-[#2E6549] transition-all"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
