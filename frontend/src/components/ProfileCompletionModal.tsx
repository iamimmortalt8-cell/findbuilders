"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, UserCheck, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  shouldShowProfileOnboarding,
  markProfileOnboardingComplete,
  markProfileOnboardingDismissed,
} from "@/lib/profile-completion";

export default function ProfileCompletionModal() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Check if onboarding modal is eligible for this authenticated user on current route
    if (shouldShowProfileOnboarding(user, profile, location.pathname)) {
      // Small 600ms grace period after route load/session restore for smooth UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [user, profile, loading, location.pathname]);

  const handleCompleteProfile = useCallback(() => {
    if (user?.id) {
      markProfileOnboardingComplete(user.id);
    }
    setIsOpen(false);
    navigate("/settings/profile");
  }, [user?.id, navigate]);

  const handleDismiss = useCallback(() => {
    if (user?.id) {
      markProfileOnboardingDismissed(user.id);
    }
    setIsOpen(false);
  }, [user?.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md bg-[#151D19]/95 backdrop-blur-2xl border border-[#202A25] rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-completion-title"
        >
          {/* Subtle ambient glows */}
          

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close modal"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Icon + Title Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#214C37]/50 to-[#101814] border border-[#2E6549]/40 flex items-center justify-center text-[#D8C7A5] shadow-[0_0_20px_rgba(216,199,165,0.12)] shrink-0">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="pr-6">
              <h2
                id="profile-completion-title"
                className="text-lg sm:text-xl font-bold text-[#F5F1E8] tracking-tight font-[family-name:var(--font-heading)]"
              >
                Complete your profile
              </h2>
              <p className="text-xs text-[#789181] mt-0.5 font-medium">
                Welcome to FindBuilders
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#8C958E] leading-relaxed mb-4">
  Add your skills, interests, and experience so other builders can discover you and you can find better matches.
</p>

          {/* Highlight Callout */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#101814] border border-[#202A25] text-xs font-medium text-[#D8C7A5] flex items-center gap-2.5 mb-6 shadow-inner">
            <Sparkles className="w-4 h-4 text-[#D8C7A5] shrink-0" />
            <span>Complete your profile to get discovered and matched with relevant builders.</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-transparent hover:bg-[#1B2520] text-[#8C958E] hover:text-[#F5F1E8] font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={handleCompleteProfile}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] font-semibold text-xs sm:text-sm transition-all duration-200 shadow-[0_0_20px_rgba(216,199,165,0.2)] hover:shadow-[0_0_25px_rgba(216,199,165,0.3)] cursor-pointer"
            >
              <span>Complete Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
