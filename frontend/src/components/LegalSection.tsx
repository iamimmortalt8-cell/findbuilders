import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface LegalSectionProps {
  title: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  children: React.ReactNode;
}

export default function LegalSection({
  title,
  index,
  isOpen,
  onToggle,
  icon: Icon,
  badgeClass,
  iconClass,
  children,
}: LegalSectionProps) {
  const number = String(index + 1).padStart(2, "0");
  const mobileTitle = title.replace(/^\d+\.\s*/, "");

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="bg-[#151D19] border border-[#202A25] rounded-2xl p-4 transition-colors lg:bg-white/[0.02] lg:border-white/5 lg:rounded-3xl lg:p-8 lg:hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3 lg:gap-4 mb-0 lg:mb-6">
        <div className={`hidden lg:flex w-10 h-10 rounded-xl items-center justify-center border ${badgeClass}`}>
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <h2 className="flex-1 min-w-0 text-2xl font-bold text-white">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="w-full flex items-center gap-3 text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#D8C7A5]/40 lg:pointer-events-none"
          >
            <span
              className={`lg:hidden shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] font-semibold tabular-nums transition-colors ${
                isOpen
                  ? "bg-[#D8C7A5]/10 border-[#D8C7A5]/25 text-[#D8C7A5]"
                  : "bg-[#1B2520] border-[#29342E] text-[#8C958E]"
              }`}
            >
              {number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="lg:hidden block text-[15px] font-semibold leading-snug text-[#F5F1E8]">
                {mobileTitle}
              </span>
              <span className="hidden lg:inline">{title}</span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`lg:hidden w-4 h-4 shrink-0 text-[#8C958E] transition-transform duration-300 ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>
        </h2>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        } lg:grid-rows-[1fr]`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="space-y-4 pt-4 lg:pt-0">{children}</div>
        </div>
      </div>
    </motion.section>
  );
}
