"use client";

import React, { useState } from "react";
import SEO from "@/components/SEO";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function Support() {
    const { success } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) {
            errs.name = "Name is required";
        }
        if (!email.trim()) {
            errs.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errs.email = "Please enter a valid email address";
        }
        if (!subject.trim()) {
            errs.subject = "Subject is required";
        }
        if (!message.trim()) {
            errs.message = "Message is required";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitted(true);
        success("Thanks! Your message is ready to send. We'll get back to you through email.");
    };

    const handleReset = () => {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setErrors({});
        setSubmitted(false);
    };

    return (
        <main className="bg-[#0B100E] text-[#F5F1E8] px-4 sm:px-6 md:px-12 py-16 sm:py-24 min-h-screen">
            <SEO
                title="Support & Help Center | FindBuilders"
                description="Contact the FindBuilders team directly for platform help, feedback, or inquiries."
                canonical="/support"
                breadcrumbs={[
                    { name: "Home", url: "/" },
                    { name: "Support", url: "/support" }
                ]}
            />

            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <header className="mb-8 sm:mb-12 md:mb-16">
                    <p className="text-xs sm:text-sm tracking-widest text-[#789181] mb-3 sm:mb-4 font-semibold uppercase">
                        HELP &amp; SUPPORT
                    </p>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-[#F5F1E8]">
                        Contact Support
                    </h1>

                    <p className="text-[#8C958E] text-sm sm:text-base md:text-lg max-w-2xl">
                        We're here to help you with any questions or issues.
                    </p>
                </header>

                {/* TWO-COLUMN CONTACT SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT SIDE: Contact Information */}
                    <section className="bg-[#151D19] border border-[#202A25] rounded-2xl p-5 sm:p-8 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] mb-3">
                                Contact Us
                            </h2>

                            <p className="text-[#8C958E] text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8">
                                Have a question, need help, or want to get in touch with the FindBuilders team? Reach out to us directly.
                            </p>

                            <div className="space-y-4">
                                <a
                                    href="mailto:bharathtommandru1@gmail.com"
                                    className="group flex items-center gap-4 p-4 rounded-xl bg-[#101814] border border-[#202A25] hover:border-[#2E6549] hover:bg-[#121B17] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#151D19] border border-[#29342E] flex items-center justify-center text-[#D8C7A5] group-hover:text-[#F5F1E8] group-hover:border-[#789181] transition-colors shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-[#789181] uppercase tracking-wider mb-0.5">
                                            Direct Contact
                                        </p>
                                        <p className="text-sm sm:text-base font-medium text-[#F5F1E8] group-hover:text-[#D8C7A5] transition-colors truncate">
                                            bharathtommandru1@gmail.com
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href="mailto:rishichowdary2099@gmail.com"
                                    className="group flex items-center gap-4 p-4 rounded-xl bg-[#101814] border border-[#202A25] hover:border-[#2E6549] hover:bg-[#121B17] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#151D19] border border-[#29342E] flex items-center justify-center text-[#D8C7A5] group-hover:text-[#F5F1E8] group-hover:border-[#789181] transition-colors shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-[#789181] uppercase tracking-wider mb-0.5">
                                            Direct Contact
                                        </p>
                                        <p className="text-sm sm:text-base font-medium text-[#F5F1E8] group-hover:text-[#D8C7A5] transition-colors truncate">
                                            rishichowdary2099@gmail.com
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT SIDE: Contact Form */}
                    <section className="bg-[#151D19] border border-[#202A25] rounded-2xl p-6 sm:p-8">
                        {submitted ? (
                            <div className="py-8 flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-full bg-[#16291E] border border-[#235336] flex items-center justify-center text-[#7FAF8D] mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-[#F5F1E8] mb-2">
                                    Message Ready
                                </h3>
                                <p className="text-[#8C958E] text-sm sm:text-base max-w-sm mb-6 leading-relaxed">
                                    Thanks! Your message is ready to send. We'll get back to you through email.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-6 py-2.5 rounded-xl border border-[#29342E] bg-[#101814] hover:bg-[#1B2520] hover:text-[#F5F1E8] text-[#C5C8C1] text-sm font-medium transition-colors cursor-pointer"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label htmlFor="support-name" className="block text-sm font-medium text-[#C5C8C1]">
                                        Name
                                    </label>
                                    <input
                                        id="support-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) setErrors({ ...errors, name: "" });
                                        }}
                                        placeholder="Your name"
                                        required
                                        className={`w-full bg-[#101814] border rounded-xl px-4 py-3 text-sm text-[#F5F1E8] focus:outline-none transition-all placeholder-[#69736C] ${
                                            errors.name
                                                ? "border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/40"
                                                : "border-[#29342E] focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40"
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-[#C97878] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label htmlFor="support-email" className="block text-sm font-medium text-[#C5C8C1]">
                                        Email
                                    </label>
                                    <input
                                        id="support-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errors.email) setErrors({ ...errors, email: "" });
                                        }}
                                        placeholder="you@example.com"
                                        required
                                        className={`w-full bg-[#101814] border rounded-xl px-4 py-3 text-sm text-[#F5F1E8] focus:outline-none transition-all placeholder-[#69736C] ${
                                            errors.email
                                                ? "border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/40"
                                                : "border-[#29342E] focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40"
                                        }`}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-[#C97878] mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Subject */}
                                <div className="space-y-1.5">
                                    <label htmlFor="support-subject" className="block text-sm font-medium text-[#C5C8C1]">
                                        Subject
                                    </label>
                                    <input
                                        id="support-subject"
                                        type="text"
                                        value={subject}
                                        onChange={(e) => {
                                            setSubject(e.target.value);
                                            if (errors.subject) setErrors({ ...errors, subject: "" });
                                        }}
                                        placeholder="How can we help?"
                                        required
                                        className={`w-full bg-[#101814] border rounded-xl px-4 py-3 text-sm text-[#F5F1E8] focus:outline-none transition-all placeholder-[#69736C] ${
                                            errors.subject
                                                ? "border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/40"
                                                : "border-[#29342E] focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40"
                                        }`}
                                    />
                                    {errors.subject && (
                                        <p className="text-xs text-[#C97878] mt-1">{errors.subject}</p>
                                    )}
                                </div>

                                {/* Message */}
                                <div className="space-y-1.5">
                                    <label htmlFor="support-message" className="block text-sm font-medium text-[#C5C8C1]">
                                        Message
                                    </label>
                                    <textarea
                                        id="support-message"
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                            if (errors.message) setErrors({ ...errors, message: "" });
                                        }}
                                        placeholder="Tell us how we can help..."
                                        rows={5}
                                        required
                                        className={`w-full bg-[#101814] border rounded-xl px-4 py-3 text-sm text-[#F5F1E8] focus:outline-none transition-all resize-none placeholder-[#69736C] ${
                                            errors.message
                                                ? "border-[#C97878]/60 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]/40"
                                                : "border-[#29342E] focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40"
                                        }`}
                                    />
                                    {errors.message && (
                                        <p className="text-xs text-[#C97878] mt-1">{errors.message}</p>
                                    )}
                                </div>

                                {/* Submit button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-[#D8C7A5] px-6 py-3.5 text-sm sm:text-base font-bold text-[#1A1A16] hover:bg-[#E5D5B5] transition shadow-[0_0_20px_rgba(216,199,165,0.2)] hover:shadow-[0_0_25px_rgba(216,199,165,0.3)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
