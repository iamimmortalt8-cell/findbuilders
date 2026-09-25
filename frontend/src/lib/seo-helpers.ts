export const SITE_URL = "https://findbuilders.pages.dev";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/findbuilderslogo.png`;
export const SITE_NAME = "FindBuilders";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Normalizes any relative or absolute URL to the verified production domain.
 * Guards against localhost, staging, or old domains.
 */
export function toAbsoluteUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      const url = new URL(pathOrUrl);
      if (url.hostname === "localhost" || url.hostname.includes("findbuilders.app")) {
        return `${SITE_URL}${url.pathname}${url.search}`;
      }
      return pathOrUrl;
    } catch {
      return pathOrUrl;
    }
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${cleanPath}`;
}

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FindBuilders",
  url: SITE_URL,
  logo: `${SITE_URL}/findbuilderslogo.png`,
  description:
    "FindBuilders is a curated product discovery platform where indie makers showcase their products and connect with early adopters.",
  founders: [
    {
      "@type": "Person",
      name: "Bharath Thommandru",
      jobTitle: "Founder & AI Engineer"
    },
    {
      "@type": "Person",
      name: "Rishi Chowdary Karumanchi",
      jobTitle: "Founder & SDE Engineer"
    }
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@findbuilders.app"
  }
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FindBuilders",
  url: SITE_URL,
  description:
    "Discover new startup products, developer tools, AI tools, and SaaS apps built by indie makers.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url)
    }))
  };
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function buildProductSchema(product: {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  image_url?: string | null;
  category_name?: string;
  website_url?: string;
  maker_name?: string;
  maker_id?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.tagline || product.name,
    image: product.image_url ? toAbsoluteUrl(product.image_url) : DEFAULT_OG_IMAGE,
    url: `${SITE_URL}/product/${product.id}`,
    category: product.category_name,
    author: product.maker_name
      ? {
          "@type": "Person",
          name: product.maker_name,
          url: product.maker_id ? `${SITE_URL}/profile/${product.maker_id}` : undefined
        }
      : undefined
  };
}

export function buildProfileSchema(profile: {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      url: `${SITE_URL}/profile/${profile.id}`,
      description: profile.headline || profile.bio,
      image: profile.avatar_url ? toAbsoluteUrl(profile.avatar_url) : DEFAULT_OG_IMAGE
    }
  };
}

export function buildCollectionSchema(name: string, description: string, urlPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: toAbsoluteUrl(urlPath)
  };
}
