import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, CheckSquare, UserCheck, Key, AtSign, Package, ClipboardCheck, Layers, Feather, Image, MessageSquare, ThumbsUp, Users, Ban, Copyright, FileCheck, ExternalLink, UserX, ShieldAlert, Scale, RefreshCw, Mail } from "lucide-react";
import LegalSection from "@/components/LegalSection";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    icon: CheckSquare,
    badgeClass: "bg-blue-500/10 border-blue-500/20",
    iconClass: "text-blue-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          By creating an account or otherwise using FindBuilders, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree to any part of these Terms, you may not use the service.
        </p>
        <p className="text-white/70 leading-relaxed">
          These Terms apply to all visitors, users, and others who access or use FindBuilders.
        </p>
      </>
    ),
  },
  {
    title: "2. Eligibility",
    icon: UserCheck,
    badgeClass: "bg-orange-500/10 border-orange-500/20",
    iconClass: "text-orange-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        You may only use FindBuilders if you are legally able to enter into a binding agreement under the laws that apply to you. The service is not directed at children.
      </p>
    ),
  },
  {
    title: "3. FindBuilders Accounts",
    icon: Key,
    badgeClass: "bg-green-500/10 border-green-500/20",
    iconClass: "text-green-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        You can register for FindBuilders with an email address and password, or sign in with Google. You agree to provide accurate information and to keep your password confidential. You are responsible for all activity that happens through your account.
      </p>
    ),
  },
  {
    title: "4. User Profiles",
    icon: AtSign,
    badgeClass: "bg-cyan-500/10 border-cyan-500/20",
    iconClass: "text-cyan-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        You can create a profile with a display name, username, headline, bio, avatar, links, interests, and optional contact details. Information you choose to publish on your profile is visible to other users and visitors to the platform. Our Privacy Policy explains which profile information is public.
      </p>
    ),
  },
  {
    title: "5. Product Submissions",
    icon: Package,
    badgeClass: "bg-purple-500/10 border-purple-500/20",
    iconClass: "text-purple-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          Builders can submit products to FindBuilders, including a product name, tagline, description, website link, category, logo, and screenshots. You can save a product as a draft or submit it for review.
        </p>
        <p className="text-white/70 leading-relaxed">
          You are responsible for the products and content you submit. By submitting a product, you confirm that it is your own product or that you have permission from its owner to list it on FindBuilders, and that the information you provide is accurate and not misleading.
        </p>
      </>
    ),
  },
  {
    title: "6. Product Review, Moderation and Removal",
    icon: ClipboardCheck,
    badgeClass: "bg-yellow-500/10 border-yellow-500/20",
    iconClass: "text-yellow-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          Submitted products may be reviewed by administrators before they are listed. We may approve a submission, reject it with a reason, or ask you to make changes. Review or approval of a product does not mean that FindBuilders endorses or guarantees it.
        </p>
        <p className="text-white/70 leading-relaxed">
          An approved product may later be unpublished or removed when we believe it violates these Terms or applicable rules. This applies both before and after a product has been approved, and helps keep FindBuilders useful and safe for everyone.
        </p>
      </>
    ),
  },
  {
    title: "7. Draft, Pending, Approved and Rejected Products",
    icon: Layers,
    badgeClass: "bg-teal-500/10 border-teal-500/20",
    iconClass: "text-teal-400",
    content: (
      <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
        <li><strong>Draft</strong> — saved by you but not submitted. Drafts are visible only to you in your dashboard and are not publicly listed.</li>
        <li><strong>Pending</strong> — submitted and awaiting review. Pending products are not publicly listed.</li>
        <li><strong>Approved</strong> — reviewed and accepted. Approved products are publicly listed and discoverable.</li>
        <li><strong>Rejected</strong> — not accepted for listing. We provide a reason, and you can edit the product and submit it for review again.</li>
      </ul>
    ),
  },
  {
    title: "8. User-Generated Content",
    icon: Feather,
    badgeClass: "bg-indigo-500/10 border-indigo-500/20",
    iconClass: "text-indigo-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        FindBuilders allows you to submit content, including your profile information, products, images, and comments. You retain ownership of the content you submit, and you remain responsible for it at all times. Public content — such as approved products, comments, and parts of your profile — may be visible to other users.
      </p>
    ),
  },
  {
    title: "9. Product Images, Screenshots and Submitted Links",
    icon: Image,
    badgeClass: "bg-pink-500/10 border-pink-500/20",
    iconClass: "text-pink-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          You may only upload images and other content that you have the right to use — content you created, or content you have the owner's permission or license to upload. Logos and screenshots should relate to the product you are submitting and must not infringe the rights of others.
        </p>
        <p className="text-white/70 leading-relaxed">
          The website links you submit must lead to pages you are authorized to represent. We may remove images, screenshots, or links that violate these Terms or applicable law.
        </p>
      </>
    ),
  },
  {
    title: "10. Comments",
    icon: MessageSquare,
    badgeClass: "bg-rose-500/10 border-rose-500/20",
    iconClass: "text-rose-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        Comments are visible to other users of the platform. You can edit or delete your own comments, and administrators may remove comments that violate these Terms. You are responsible for the comments you post.
      </p>
    ),
  },
  {
    title: "11. Votes and Community Interactions",
    icon: ThumbsUp,
    badgeClass: "bg-red-500/10 border-red-500/20",
    iconClass: "text-red-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        You can upvote products you like; you may only vote once per product and you can remove your vote at any time. Vote totals on products are visible to other users. You must not manipulate votes — for example, by using multiple accounts to inflate support for your own product.
      </p>
    ),
  },
  {
    title: "12. Follows and Profile Interactions",
    icon: Users,
    badgeClass: "bg-zinc-500/10 border-zinc-500/20",
    iconClass: "text-zinc-300",
    content: (
      <p className="text-white/70 leading-relaxed">
        You can follow other users on FindBuilders. Following relationships — including follower and following lists — are visible on public profiles. You can unfollow a user at any time.
      </p>
    ),
  },
  {
    title: "13. Prohibited Use",
    icon: Ban,
    badgeClass: "bg-blue-500/10 border-blue-500/20",
    iconClass: "text-blue-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          You must not use FindBuilders to:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>Submit content that is illegal, fraudulent, malicious, infringing, abusive, or misleading.</li>
          <li>Impersonate any person or misrepresent your identity or affiliation with any person or organization.</li>
          <li>Post content that harasses, threatens, or harms others, or that promotes hatred or discrimination.</li>
          <li>Upload files that contain malware or anything designed to disrupt or damage the service.</li>
          <li>Interfere with or disrupt the service, circumvent security or rate limits, or attempt unauthorized access to any system.</li>
          <li>Spam other users, or use the platform for unsolicited promotion.</li>
          <li>Manipulate votes, comments, or other community activity.</li>
          <li>Violate any applicable law or regulation.</li>
        </ul>
      </>
    ),
  },
  {
    title: "14. Content Ownership",
    icon: Copyright,
    badgeClass: "bg-orange-500/10 border-orange-500/20",
    iconClass: "text-orange-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        You keep all ownership of the content you submit to FindBuilders — your products, images, comments, and profile content. Posting content on FindBuilders does not transfer ownership of that content to us.
      </p>
    ),
  },
  {
    title: "15. Permission You Give Us for Your Content",
    icon: FileCheck,
    badgeClass: "bg-green-500/10 border-green-500/20",
    iconClass: "text-green-400",
    content: (
      <p className="text-white/70 leading-relaxed">
        When you submit content, you grant FindBuilders a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and display that content as needed to operate the service — for example, to show your product page, your profile, or your images to other users. This license exists only for running and displaying FindBuilders; we do not use your content for other purposes. The license ends when you delete your content, except for residual copies in backups for a limited period and content that other users already had access to.
      </p>
    ),
  },
  {
    title: "16. External Links",
    icon: ExternalLink,
    badgeClass: "bg-cyan-500/10 border-cyan-500/20",
    iconClass: "text-cyan-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          Products and profiles on FindBuilders may contain links to external websites. These links are controlled by their respective owners, not by FindBuilders. We do not control and are not responsible for any external website, including its content, safety, or privacy practices.
        </p>
        <p className="text-white/70 leading-relaxed">
          FindBuilders does not guarantee that any listed product is safe, accurate, legitimate, available, or endorsed by FindBuilders. You use external links and interact with other users at your own risk, and we encourage you to review the terms and privacy policy of any website you visit.
        </p>
      </>
    ),
  },
  {
    title: "17. Suspension and Termination",
    icon: UserX,
    badgeClass: "bg-purple-500/10 border-purple-500/20",
    iconClass: "text-purple-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          We may suspend or terminate your access to FindBuilders if you violate these Terms, including by repeatedly submitting prohibited content or by harming the platform or its users. We may also remove your content as described in these Terms.
        </p>
        <p className="text-white/70 leading-relaxed">
          You may stop using FindBuilders at any time. If you would like your account closed, you can contact us at support@findbuilders.app. Upon termination, your right to use the service ends, and content associated with your account may be removed.
        </p>
      </>
    ),
  },
  {
    title: "18. Service Availability and Disclaimer",
    icon: ShieldAlert,
    badgeClass: "bg-teal-500/10 border-teal-500/20",
    iconClass: "text-teal-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          FindBuilders is provided on an "as is" and "as available" basis, with all faults and defects, without warranty of any kind. To the maximum extent permitted by law, we make no guarantees that the service will be uninterrupted, error-free, or secure, or that product listings, descriptions, or other content on the platform will be accurate, complete, or reliable.
        </p>
        <p className="text-white/70 leading-relaxed">
          FindBuilders does not endorse, verify, or guarantee any user, product, or external link on the platform. Any dealings between users — or reliance on product information — are entirely at your own risk.
        </p>
      </>
    ),
  },
  {
    title: "19. Limitation of Liability",
    icon: Scale,
    badgeClass: "bg-indigo-500/10 border-indigo-500/20",
    iconClass: "text-indigo-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          To the maximum extent permitted by applicable law, FindBuilders and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, goodwill, or business opportunity, arising out of or in connection with your use of — or inability to use — the service, any content on the platform, or any external websites linked from it, even if we have been advised of the possibility of such damages.
        </p>
        <p className="text-white/70 leading-relaxed">
          Where liability cannot be excluded, our total liability shall be limited to the maximum extent permitted by applicable law. Some jurisdictions do not allow certain limitations of liability, so these limitations may not apply to you — in which case they apply to the greatest extent permitted.
        </p>
      </>
    ),
  },
  {
    title: "20. Changes to These Terms",
    icon: RefreshCw,
    badgeClass: "bg-pink-500/10 border-pink-500/20",
    iconClass: "text-pink-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          We may update these Terms from time to time. When we do, we will update the "Last Updated" date at the top of this page. If a change is material, we will make reasonable efforts to draw your attention to it — for example, by a notice on the site.
        </p>
        <p className="text-white/70 leading-relaxed">
          Your continued use of FindBuilders after updated Terms take effect means you accept the updated Terms. If you do not agree with the updated Terms, please stop using the service.
        </p>
      </>
    ),
  },
  {
    title: "21. Contact Us",
    icon: Mail,
    badgeClass: "bg-red-500/10 border-red-500/20",
    iconClass: "text-red-400",
    content: (
      <>
        <p className="text-white/70 leading-relaxed">
          If you have any questions about these Terms, you can contact us:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
          <li>By email: support@findbuilders.app</li>
        </ul>
      </>
    ),
  },
];

export default function Terms() {
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
              <FileText className="w-8 h-8 text-[#D8C7A5]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Terms &amp; Conditions</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Rules for using FindBuilders.
            </p>
            <p className="text-white/50 text-sm">
              Last Updated: September 24, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="space-y-4">
              <p className="text-white/70 leading-relaxed">
                Please read these Terms carefully before using FindBuilders. These Terms govern your access to and use of FindBuilders — the website <a href="https://findbuilders.app" target="_blank" rel="noopener noreferrer" className="text-[#D8C7A5] hover:underline">findbuilders.app</a> and its related services.
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
