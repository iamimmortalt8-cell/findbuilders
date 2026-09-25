"use client";

import React from "react";
import SEO from "@/components/SEO";

export default function Support() {
    return (
        <main className="bg-[#0B100E] text-[#F5F1E8] px-6 md:px-12 py-24 min-h-screen">
            <SEO
                title="Support & Help Center | FindBuilders"
                description="Contact the FindBuilders support team for product submission inquiries, maker assistance, or platform feedback."
                canonical="/support"
                breadcrumbs={[
                    { name: "Home", url: "/" },
                    { name: "Support", url: "/support" }
                ]}
            />

            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <header className="mb-16">
                    <p className="text-sm tracking-widest text-[#789181] mb-4 font-semibold">
                        HELP & SUPPORT
                    </p>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#F5F1E8]">
                        Contact Support
                    </h1>

                    <p className="text-[#8C958E]">
                        We're here to help you with any questions or issues.
                    </p>
                </header>

                {/* CONTENT */}
                <article className="prose prose-invert max-w-none
          prose-headings:text-[#F5F1E8]
          prose-p:text-[#C5C8C1]
          prose-li:text-[#C5C8C1]
          prose-strong:text-[#F5F1E8]
          prose-a:text-[#D8C7A5]
          prose-a:no-underline hover:prose-a:underline text-[#C5C8C1]"
                >

                    <h2>How can we help?</h2>
                    <p>If you have any questions, concerns, or need assistance using FindBuilders, please don't hesitate to reach out to us.</p>
                    
                    <h3>Email Support</h3>
                    <p>
                        You can email our support team directly at: <a href="mailto:support@findbuilders.app">support@findbuilders.app</a>
                    </p>

                    <h3>Response Time</h3>
                    <p>We aim to respond to all inquiries within 24-48 hours during regular business days.</p>
                </article>
            </div>
        </main>
    );
}
