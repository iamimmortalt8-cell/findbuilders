import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  type BreadcrumbItem,
  type SEOProps,
  toAbsoluteUrl,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildProductSchema,
  buildProfileSchema,
  buildCollectionSchema
} from "../lib/seo-helpers.ts";

export {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  type BreadcrumbItem,
  type SEOProps,
  toAbsoluteUrl,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildProductSchema,
  buildProfileSchema,
  buildCollectionSchema
};

/**
 * Reusable SEO head and meta management component.
 * Works across both React 19 declarative metadata hoisting and imperative DOM updates.
 */
export default function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  breadcrumbs,
  structuredData
}: SEOProps) {
  const location = useLocation();

  const canonicalUrl = canonical
    ? toAbsoluteUrl(canonical)
    : toAbsoluteUrl(location.pathname);

  const fullOgImage = toAbsoluteUrl(ogImage);

  useEffect(() => {
    // 1. Title
    document.title = title;

    // Helper for upserting meta tag
    const setMeta = (attrName: "name" | "property", attrVal: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // 2. Standard Meta
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    // 3. Canonical Link
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // 4. Open Graph Meta
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", fullOgImage);
    setMeta("property", "og:site_name", SITE_NAME);

    // 5. Twitter Meta
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", fullOgImage);

    // 6. Structured Data (JSON-LD)
    const schemaList: any[] = [];

    // Always include Website & Organization if not noindexed
    if (!noindex) {
      schemaList.push(ORGANIZATION_SCHEMA);
      schemaList.push(WEBSITE_SCHEMA);
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      schemaList.push(buildBreadcrumbSchema(breadcrumbs));
    }

    if (structuredData) {
      if (Array.isArray(structuredData)) {
        schemaList.push(...structuredData);
      } else {
        schemaList.push(structuredData);
      }
    }

    let scriptEl = document.getElementById("seo-structured-data") as HTMLScriptElement | null;
    if (schemaList.length > 0) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = "seo-structured-data";
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schemaList.length === 1 ? schemaList[0] : schemaList);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up script on unmount if needed
    };
  }, [title, description, canonicalUrl, ogType, fullOgImage, noindex, breadcrumbs, structuredData]);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </>
  );
}
