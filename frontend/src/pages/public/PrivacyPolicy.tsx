import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Globe, Package, Settings, Share2, Cloud, Trash2, Lock, UserCheck, Link, RefreshCw, Mail } from "lucide-react";
import LegalSection from "@/components/LegalSection";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const sections = [
  {
    title: "Information We Collect",
    icon: Eye,
    badgeClass: "bg-blue-500/10 border-blue-500/20",
    iconClass: "text-blue-400",
    content: (
      <>
        <h3 className="text-xl font-semibold text-white/90 mt-6">Account Information</h3>
        <p className="text-white/70 leading-relaxed">
          When you create an account, we collect your email address, your password (stored by our authentication provider), and the display name you choose. You can also sign in with Google; in that case Google provides your name and email address to us according to Google's own privacy policy.
        </p>

        <h3 className="text-xl font-semibold text-white/90 mt-6">Profile Information</h3>
        <p className="text-white/70 leading-relaxed">
          You can build a profile with a display name, username, headline, bio, avatar image, links you add (such as your website or social profiles), and interests. You may also optionally add contact details — a contact email address, WhatsApp number, or phone number. You choose whether to add these and they are only shown if you add them.
        </p>

        <h3 className="text-xl font-semibold text-white/90 mt-6">Products and Community Activity</h3>
        <p className="text-white/70 leading-relaxed">
          When you submit a product, we store the product name, tagline, description, website link, category, logo, and the screenshots you upload. We also store your activity on the platform: comments you write, votes (upvotes) you cast, and the profiles you follow.
        </p>

        <h3 className="text-xl font-semibold text-white/90 mt-6">Technical Information</h3>
        <p className="text-white/70 leading-relaxed">
          Like most web services, FindBuilders automatically receives your IP address when your browser makes a request. We use IP addresses for security purposes only, such as rate limiting and preventing abuse. We store sign-in tokens in your browser's local storage so that you stay signed in, and a small flag in session storage that is used once for the loading screen. FindBuilders does not use advertising or analytics cookies, and we do not run third-party analytics or tracking tools.
        </p>
      </>
    ),
  },
  {
    title: "Public Information",
    icon: Globe,
    badgeClass: "bg-orange-500/10 border-orange-500/20",
    iconClass: "text-orange-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          FindBuilders is a public platform. Some information is meant to be seen by others:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>Your public profile — display name, username, headline, bio, avatar, links, interests, and any contact details you choose to add.</li>
          <li>Products you submit once they are approved — including name, tagline, description, logo, screenshots, and category.</li>
          <li>Your comments and your votes on products.</li>
          <li>The profiles you follow and the users who follow you.</li>
        </ul>
        <p className="text-white/70 leading-relaxed">
          Your login email address is not displayed on your public profile. If you want an email address to be visible to others, you can add a separate contact email in your profile settings — it becomes public only if you add it there.
        </p>
        <p className="text-white/70 leading-relaxed">
          Draft, pending, and rejected products are not published in product listings. Only approved products are publicly discoverable.
        </p>
      </>
    ),
  },
  {
    title: "Product Submissions and Review",
    icon: Package,
    badgeClass: "bg-green-500/10 border-green-500/20",
    iconClass: "text-green-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          Builders can submit products to be listed on FindBuilders. Submissions are handled as follows:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>You can save a product as a draft. Drafts stay private to you until you submit them.</li>
          <li>When you submit a product, it enters review. Administrators may review your submission before it appears publicly.</li>
          <li>Approved products become publicly discoverable on FindBuilders.</li>
          <li>If a product is rejected, we provide a reason. Rejected products are not listed publicly, and you can edit and submit them again for review.</li>
          <li>Administrators may remove products that violate platform rules, including after approval.</li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    icon: Settings,
    badgeClass: "bg-cyan-500/10 border-cyan-500/20",
    iconClass: "text-cyan-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>Create and manage your account and keep you signed in.</li>
          <li>Display your profile and products in the way you have chosen to publish them.</li>
          <li>Review product submissions and moderate content on the platform.</li>
          <li>Enable votes, comments, and follows.</li>
          <li>Protect the service, prevent abuse, and enforce platform rules.</li>
          <li>Maintain and improve FindBuilders.</li>
          <li>Respond to support requests and questions.</li>
        </ul>
        <p className="text-white/70 leading-relaxed">
          We do not send marketing emails, and we do not sell your personal information.
        </p>
      </>
    ),
  },
  {
    title: "When We Share Information",
    icon: Share2,
    badgeClass: "bg-purple-500/10 border-purple-500/20",
    iconClass: "text-purple-400",
    content: (
      <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
        <li><strong>Publicly.</strong> The profile, product, and community information described above is visible to other users and visitors by design, because you chose to publish it.</li>
        <li><strong>With our service providers.</strong> We rely on Supabase to operate our database, authentication, and file storage, and on Google if you sign in with Google. These providers process data only to run the service for us.</li>
        <li><strong>When required by law.</strong> We may disclose information if we are required to do so by law, or where necessary to protect the rights, safety, and property of FindBuilders, our users, or others.</li>
      </ul>
    ),
  },
  {
    title: "Service Providers and Storage",
    icon: Cloud,
    badgeClass: "bg-yellow-500/10 border-yellow-500/20",
    iconClass: "text-yellow-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          FindBuilders uses the following services to operate:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li><strong>Supabase</strong> — provides our database, user authentication, and file storage. Your account, profile, products, and uploaded images are stored on Supabase.</li>
          <li><strong>Google</strong> — if you choose to sign in with Google, Google handles the sign-in on your behalf according to its privacy policy.</li>
        </ul>
        <p className="text-white/70 leading-relaxed">
          Images you upload — your avatar, product logos, and screenshots — are stored so they can be displayed on FindBuilders. If your profile or product is public, its images are public too. We do not send marketing emails; any account-related email you receive comes from our authentication provider or Google.
        </p>
      </>
    ),
  },
  {
    title: "Keeping and Deleting Your Information",
    icon: Trash2,
    badgeClass: "bg-teal-500/10 border-teal-500/20",
    iconClass: "text-teal-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          We keep your information for as long as your account is active or as needed to provide the service. You control much of your data directly:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>You can delete your products. Deleting a product removes the product, its images, and the votes and comments on it.</li>
          <li>You can delete your comments.</li>
          <li>You can edit your profile at any time, including removing your avatar and clearing the contact details you added.</li>
        </ul>
        <p className="text-white/70 leading-relaxed">
          There is currently no self-service account deletion button. If you want your account and profile removed, email us at support@findbuilders.app and we will delete what the system can delete — including your profile, products, comments, and votes. Residual copies may remain in system backups for a limited period until they are overwritten, and we cannot remove copies of public information that other people saved independently before deletion.
        </p>
      </>
    ),
  },
  {
    title: "How We Protect Your Information",
    icon: Lock,
    badgeClass: "bg-indigo-500/10 border-indigo-500/20",
    iconClass: "text-indigo-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        We use reasonable technical and organizational measures to protect your information, including encrypted connections (HTTPS), access controls, password storage handled by our authentication provider, and rate limiting to reduce abuse. However, no method of transmitting or storing information over the Internet is completely secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: "Children's Privacy",
    icon: UserCheck,
    badgeClass: "bg-pink-500/10 border-pink-500/20",
    iconClass: "text-pink-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        FindBuilders is not intended for young children, and we do not knowingly collect personal information from children. If you believe a child has provided personal information to us, contact us at support@findbuilders.app and we will take steps to remove it.
      </p>
    ),
  },
  {
    title: "Links to Other Websites",
    icon: Link,
    badgeClass: "bg-rose-500/10 border-rose-500/20",
    iconClass: "text-rose-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        Products and profiles on FindBuilders can contain links to external websites — for example, a builder's own product site. These links are provided by users. We do not control these websites and are not responsible for their content or privacy practices. We encourage you to review the privacy policy of any website you visit.
      </p>
    ),
  },
  {
    title: "Changes to This Privacy Policy",
    icon: RefreshCw,
    badgeClass: "bg-red-500/10 border-red-500/20",
    iconClass: "text-red-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        We may update this policy from time to time. When we do, we will update the "Last Updated" date at the top of this page. We encourage you to review this page periodically.
      </p>
    ),
  },
  {
    title: "Contact Us",
    icon: Mail,
    badgeClass: "bg-zinc-500/10 border-zinc-500/20",
    iconClass: "text-zinc-300",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          If you have any questions about this Privacy Policy or your information, you can contact us:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>By email: support@findbuilders.app</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="flex-1 w-full flex flex-col bg-[#0B100E] pt-32 pb-24 px-6 md:px-12 lg:px-24 font-[Inter,system-ui,sans-serif] antialiased">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={pageVariants}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D8C7A5]/10 border border-[#D8C7A5]/20 mb-4">
              <Shield className="w-8 h-8 text-[#D8C7A5]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Your privacy matters.
            </p>
            <p className="text-white/50 text-sm">
              Last Updated: September 24, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="space-y-4">
              <p className="text-white/70 leading-relaxed">
                FindBuilders is a platform where builders can create profiles and showcase their products, and visitors can discover products and the people who build them. It is available at <a href="https://findbuilders.app" target="_blank" rel="noopener noreferrer" className="text-[#D8C7A5] hover:underline">findbuilders.app</a>.
              </p>
              <p className="text-white/70 leading-relaxed">
                This Privacy Policy explains what information we collect when you use FindBuilders, how we use and protect it, and the choices you have. By using FindBuilders, you agree to the practices described here. If you do not agree, please do not use the service.
              </p>
            </section>

            {sections.map((section, index) => (
              <LegalSection
                key={section.title}
                title={section.title}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                icon={section.icon}
                badgeClass={section.badgeClass}
                iconClass={section.iconClass}
              >
                {section.content}
              </LegalSection>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
