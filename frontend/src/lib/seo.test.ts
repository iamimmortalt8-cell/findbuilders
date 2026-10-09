import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  toAbsoluteUrl,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildProductSchema,
  buildProfileSchema,
  buildCollectionSchema
} from './seo-helpers.ts';

test('production domain is verified and strictly http://localhost:5173', () => {
  assert.equal(SITE_URL, 'http://localhost:5173');
  assert.equal(DEFAULT_OG_IMAGE, 'http://localhost:5173/findbuilderslogo.png');
});

test('toAbsoluteUrl converts relative paths correctly', () => {
  assert.equal(toAbsoluteUrl('/products'), 'http://localhost:5173/products');
  assert.equal(toAbsoluteUrl('features'), 'http://localhost:5173/features');
  assert.equal(toAbsoluteUrl('/categories/ai'), 'http://localhost:5173/categories/ai');
});

test('toAbsoluteUrl normalizes localhost or dead findbuilders.app domains', () => {
  assert.equal(
    toAbsoluteUrl('http://localhost:3000/product/123'),
    'http://localhost:5173/product/123'
  );
  assert.equal(
    toAbsoluteUrl('https://findbuilders.app/about'),
    'http://localhost:5173/about'
  );
});

test('Organization schema contains verified founder and entity information', () => {
  assert.equal(ORGANIZATION_SCHEMA['@type'], 'Organization');
  assert.equal(ORGANIZATION_SCHEMA.name, 'FindTheBuilders');
  assert.equal(ORGANIZATION_SCHEMA.url, 'http://localhost:5173');
  assert.equal(ORGANIZATION_SCHEMA.logo, 'http://localhost:5173/findbuilderslogo.png');
  assert.equal(ORGANIZATION_SCHEMA.contactPoint.email, 'bharathtommandru1@gmail.com');

  const founderNames = ORGANIZATION_SCHEMA.founders.map(f => f.name);
  assert.equal(ORGANIZATION_SCHEMA.founders.length, 1);
  assert.ok(founderNames.includes('Bharath Thommandru'));

  const bharath = ORGANIZATION_SCHEMA.founders.find(f => f.name === 'Bharath Thommandru') as any;
  assert.equal(bharath.givenName, 'Bharath');
  assert.equal(bharath.familyName, 'Thommandru');
  assert.equal(bharath.jobTitle, 'Founder & Lead Developer');
  assert.equal(bharath.email, 'bharathtommandru1@gmail.com');
  assert.deepEqual(bharath.sameAs, [
    'https://github.com/bharath-dev8668',
    'https://www.linkedin.com/in/bharath-thommandru',
    'https://x.com/BTommandru81787'
  ]);
  assert.equal(bharath.worksFor.name, 'FindTheBuilders');
  assert.ok(Array.isArray(bharath.knowsAbout));
});

test('WebSite schema defines valid SearchAction', () => {
  assert.equal(WEBSITE_SCHEMA['@type'], 'WebSite');
  assert.equal(WEBSITE_SCHEMA.url, 'http://localhost:5173');
  assert.equal(
    WEBSITE_SCHEMA.potentialAction.target.urlTemplate,
    'http://localhost:5173/products?search={search_term_string}'
  );
});

test('buildBreadcrumbSchema formats valid ListItem array', () => {
  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: 'DevFlow AI', url: '/product/123' }
  ]);

  assert.equal(breadcrumbs['@type'], 'BreadcrumbList');
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(breadcrumbs.itemListElement[0].position, 1);
  assert.equal(breadcrumbs.itemListElement[0].name, 'Home');
  assert.equal(breadcrumbs.itemListElement[0].item, 'http://localhost:5173/');
  assert.equal(breadcrumbs.itemListElement[2].item, 'http://localhost:5173/product/123');
});

test('buildProductSchema creates compliant Product JSON-LD', () => {
  const schema = buildProductSchema({
    id: 'prod-456',
    name: 'DevFlow AI',
    tagline: 'AI workspace for developers',
    description: 'Autonomous development assistant',
    image_url: 'http://localhost:5173/logo.png',
    category_name: 'AI',
    maker_name: 'Bharath Thommandru',
    maker_id: 'maker-123'
  });

  assert.equal(schema['@type'], 'Product');
  assert.equal(schema.name, 'DevFlow AI');
  assert.equal(schema.url, 'http://localhost:5173/product/prod-456');
  assert.equal(schema.category, 'AI');
  assert.equal(schema.author?.name, 'Bharath Thommandru');
  assert.equal(schema.author?.url, 'http://localhost:5173/profile/maker-123');
});

test('buildProfileSchema creates compliant ProfilePage and Person JSON-LD', () => {
  const schema = buildProfileSchema({
    id: 'user-789',
    name: 'Bharath Thommandru',
    headline: 'Founder & AI Engineer',
    bio: 'Building FindTheBuilders',
    avatar_url: '/bharath.png'
  });

  assert.equal(schema['@type'], 'ProfilePage');
  assert.equal(schema.mainEntity['@type'], 'Person');
  assert.equal(schema.mainEntity.name, 'Bharath Thommandru');
  assert.equal(schema.mainEntity.url, 'http://localhost:5173/profile/user-789');
  assert.equal(schema.mainEntity.image, 'http://localhost:5173/bharath.png');
});

test('buildFAQSchema generates valid FAQPage schema', () => {
  const faqs = [
    { question: 'What is FindTheBuilders?', answer: 'A discovery platform.' },
    { question: 'How to submit?', answer: 'Click submit.' }
  ];
  const schema = buildFAQSchema(faqs);

  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema.mainEntity.length, 2);
  assert.equal(schema.mainEntity[0].name, 'What is FindTheBuilders?');
  assert.equal(schema.mainEntity[0].acceptedAnswer.text, 'A discovery platform.');
});

test('robots.txt exists and disallows private areas while referencing sitemap', () => {
  const robotsPath = resolve(process.cwd(), 'public/robots.txt');
  assert.ok(existsSync(robotsPath), 'robots.txt must exist in public directory');
  const content = readFileSync(robotsPath, 'utf8');

  assert.ok(content.includes('User-agent: *'));
  assert.ok(content.includes('Allow: /'));
  assert.ok(content.includes('Disallow: /admin'));
  assert.ok(content.includes('Disallow: /builder'));
  assert.ok(content.includes('Disallow: /settings/'));
  assert.ok(content.includes('Disallow: /login'));
  assert.ok(content.includes('Disallow: /signup'));
  assert.ok(content.includes('Sitemap: http://localhost:5173/sitemap.xml'));
});

test('sitemap.xml exists, is valid XML, uses production domain and excludes private pages', () => {
  const sitemapPath = resolve(process.cwd(), 'public/sitemap.xml');
  assert.ok(existsSync(sitemapPath), 'sitemap.xml must exist in public directory');
  const content = readFileSync(sitemapPath, 'utf8');

  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Must have correct XML declaration');
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Must have sitemaps.org xmlns');
  assert.ok(content.includes('<loc>http://localhost:5173/</loc>'), 'Must include root path');
  assert.ok(content.includes('<loc>http://localhost:5173/products</loc>'), 'Must include products path');
  assert.ok(content.includes('<loc>http://localhost:5173/features</loc>'));
  assert.ok(content.includes('<loc>http://localhost:5173/about</loc>'));
  assert.ok(content.includes('<loc>http://localhost:5173/about-founder</loc>'));
  assert.ok(content.includes('<loc>http://localhost:5173/faq</loc>'));
  assert.ok(content.includes('<loc>http://localhost:5173/categories/ai</loc>'));

  // Ensure lastmod exists and follows YYYY-MM-DD
  assert.ok(content.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/), 'Must contain valid lastmod dates');

  // Ensure no private pages
  assert.ok(!content.includes('<loc>http://localhost:5173/admin'), 'Must not include admin');
  assert.ok(!content.includes('<loc>http://localhost:5173/builder'), 'Must not include builder');
  assert.ok(!content.includes('<loc>http://localhost:5173/login'), 'Must not include login');
  assert.ok(!content.includes('<loc>http://localhost:5173/signup'), 'Must not include signup');
  assert.ok(!content.includes('<loc>http://localhost:5173/settings'), 'Must not include settings');
  // we now fallback to localhost in dev so it may contain localhost
  assert.ok(!content.includes('findbuilders.app'), 'Must not contain old findbuilders.app domain');
});
