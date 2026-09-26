"use client";

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, HelpCircle, LifeBuoy, ArrowRight } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { Reveal } from "@/components/Reveal";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <div className="bg-[#0B100E] text-[#F5F1E8] font-[family-name:var(--font-heading)] min-h-screen relative flex items-center justify-center py-16 sm:py-20 px-4 sm:px-6">
      <SEO
        title="Page Not Found (404) | FindBuilders"
        description="The requested page could not be found. Explore top indie products, developer tools, or return to FindBuilders."
        noindex={true}
      />

      <WebGLShader />

      <div className="relative z-10 max-w-2xl mx-auto text-center w-full">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-xs font-semibold uppercase tracking-widest text-[#D8C7A5] mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-[#D8C7A5] animate-ping" />
            Error 404
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-b from-[#F5F1E8] via-[#D8C7A5] to-[#789181] bg-clip-text text-transparent mb-4 sm:mb-6">
            404
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5F1E8] tracking-tight mb-3 sm:mb-4">
            We couldn't find that page
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-[#8C958E] font-[family-name:var(--font-body)] max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
            The page you are looking for may have been moved, renamed, or is temporarily unavailable. Let's get you back to discovering great products.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto mb-8 sm:mb-10 text-left">
            <Link
              to="/"
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#151D19]/80 border border-[#202A25] hover:border-[#2E6549] transition-all flex items-center gap-3.5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#101814] border border-[#202A25] flex items-center justify-center shrink-0 group-hover:border-[#2E6549]">
                <Home className="w-5 h-5 text-[#789181] group-hover:text-[#D8C7A5] transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#F5F1E8] truncate">Return Home</div>
                <div className="text-xs text-[#8C958E] truncate">Head back to the start</div>
              </div>
            </Link>

            <Link
              to="/products"
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#151D19]/80 border border-[#202A25] hover:border-[#2E6549] transition-all flex items-center gap-3.5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#101814] border border-[#202A25] flex items-center justify-center shrink-0 group-hover:border-[#2E6549]">
                <Search className="w-5 h-5 text-[#789181] group-hover:text-[#D8C7A5] transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#F5F1E8] truncate">Explore Products</div>
                <div className="text-xs text-[#8C958E] truncate">Browse the directory</div>
              </div>
            </Link>

            <Link
              to="/faq"
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#151D19]/80 border border-[#202A25] hover:border-[#2E6549] transition-all flex items-center gap-3.5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#101814] border border-[#202A25] flex items-center justify-center shrink-0 group-hover:border-[#2E6549]">
                <HelpCircle className="w-5 h-5 text-[#789181] group-hover:text-[#D8C7A5] transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#F5F1E8] truncate">Frequently Asked Questions</div>
                <div className="text-xs text-[#8C958E] truncate">Get answers quickly</div>
              </div>
            </Link>

            <Link
              to="/support"
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#151D19]/80 border border-[#202A25] hover:border-[#2E6549] transition-all flex items-center gap-3.5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#101814] border border-[#202A25] flex items-center justify-center shrink-0 group-hover:border-[#2E6549]">
                <LifeBuoy className="w-5 h-5 text-[#789181] group-hover:text-[#D8C7A5] transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#F5F1E8] truncate">Contact Support</div>
                <div className="text-xs text-[#8C958E] truncate">Reach out for assistance</div>
              </div>
            </Link>
          </div>

          <Link
            to="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#D8C7A5] text-[#1A1A16] font-bold text-sm hover:bg-[#E5D5B5] transition shadow-[0_0_25px_rgba(216,199,165,0.25)]"
          >
            Browse Trending Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
