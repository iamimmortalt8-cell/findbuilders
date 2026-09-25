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

test('production domain is verified and strictly https://findbuilders.pages.dev', () => {
  assert.equal(SITE_URL, 'https://findbuilders.pages.dev');
  assert.equal(DEFAULT_OG_IMAGE, 'https://findbuilders.pages.dev/findbuilderslogo.png');
});

test('toAbsoluteUrl converts relative paths correctly', () => {
  assert.equal(toAbsoluteUrl('/products'), 'https://findbuilders.pages.dev/products');
  assert.equal(toAbsoluteUrl('features'), 'https://findbuilders.pages.dev/features');
  assert.equal(toAbsoluteUrl('/categories/ai'), 'https://findbuilders.pages.dev/categories/ai');
});

test('toAbsoluteUrl normalizes localhost or dead findbuilders.app domains', () => {
  assert.equal(
    toAbsoluteUrl('http://localhost:3000/product/123'),
    'https://findbuilders.pages.dev/product/123'
  );
  assert.equal(
    toAbsoluteUrl('https://findbuilders.app/about'),
    'https://findbuilders.pages.dev/about'
  );
});

test('Organization schema contains verified founder and entity information', () => {
  assert.equal(ORGANIZATION_SCHEMA['@type'], 'Organization');
  assert.equal(ORGANIZATION_SCHEMA.name, 'FindBuilders');
  assert.equal(ORGANIZATION_SCHEMA.url, 'https://findbuilders.pages.dev');
  assert.equal(ORGANIZATION_SCHEMA.logo, 'https://findbuilders.pages.dev/findbuilderslogo.png');
  assert.equal(ORGANIZATION_SCHEMA.contactPoint.email, 'support@findbuilders.app');

  const founderNames = ORGANIZATION_SCHEMA.founders.map(f => f.name);
  assert.ok(founderNames.includes('Bharath Thommandru'));
  assert.ok(founderNames.includes('Rishi Chowdary Karumanchi'));
});

test('WebSite schema defines valid SearchAction', () => {
  assert.equal(WEBSITE_SCHEMA['@type'], 'WebSite');
  assert.equal(WEBSITE_SCHEMA.url, 'https://findbuilders.pages.dev');
  assert.equal(
    WEBSITE_SCHEMA.potentialAction.target.urlTemplate,
    'https://findbuilders.pages.dev/products?search={search_term_string}'
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
  assert.equal(breadcrumbs.itemListElement[0].item, 'https://findbuilders.pages.dev/');
  assert.equal(breadcrumbs.itemListElement[2].item, 'https://findbuilders.pages.dev/product/123');
});

test('buildProductSchema creates compliant Product JSON-LD', () => {
  const schema = buildProductSchema({
    id: 'prod-456',
    name: 'DevFlow AI',
    tagline: 'AI workspace for developers',
    description: 'Autonomous development assistant',
    image_url: 'https://findbuilders.pages.dev/logo.png',
    category_name: 'AI',
    maker_name: 'Bharath Thommandru',
    maker_id: 'maker-123'
  });

  assert.equal(schema['@type'], 'Product');
  assert.equal(schema.name, 'DevFlow AI');
  assert.equal(schema.url, 'https://findbuilders.pages.dev/product/prod-456');
  assert.equal(schema.category, 'AI');
  assert.equal(schema.author?.name, 'Bharath Thommandru');
  assert.equal(schema.author?.url, 'https://findbuilders.pages.dev/profile/maker-123');
});

test('buildProfileSchema creates compliant ProfilePage and Person JSON-LD', () => {
  const schema = buildProfileSchema({
    id: 'user-789',
    name: 'Bharath Thommandru',
    headline: 'Founder & AI Engineer',
    bio: 'Building FindBuilders',
    avatar_url: '/bharath.png'
  });

  assert.equal(schema['@type'], 'ProfilePage');
  assert.equal(schema.mainEntity['@type'], 'Person');
  assert.equal(schema.mainEntity.name, 'Bharath Thommandru');
  assert.equal(schema.mainEntity.url, 'https://findbuilders.pages.dev/profile/user-789');
  assert.equal(schema.mainEntity.image, 'https://findbuilders.pages.dev/bharath.png');
});

test('buildFAQSchema generates valid FAQPage schema', () => {
  const faqs = [
    { question: 'What is FindBuilders?', answer: 'A discovery platform.' },
    { question: 'How to submit?', answer: 'Click submit.' }
  ];
  const schema = buildFAQSchema(faqs);

  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(schema.mainEntity.length, 2);
  assert.equal(schema.mainEntity[0].name, 'What is FindBuilders?');
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
  assert.ok(content.includes('Sitemap: https://findbuilders.pages.dev/sitemap.xml'));
});

test('sitemap.xml exists, is valid XML, uses production domain and excludes private pages', () => {
  const sitemapPath = resolve(process.cwd(), 'public/sitemap.xml');
  assert.ok(existsSync(sitemapPath), 'sitemap.xml must exist in public directory');
  const content = readFileSync(sitemapPath, 'utf8');

  assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/</loc>'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/products</loc>'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/features</loc>'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/about</loc>'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/faq</loc>'));
  assert.ok(content.includes('<loc>https://findbuilders.pages.dev/categories/ai</loc>'));

  // Ensure no private pages
  assert.ok(!content.includes('/admin'), 'Must not include admin');
  assert.ok(!content.includes('/builder'), 'Must not include builder');
  assert.ok(!content.includes('/login'), 'Must not include login');
  assert.ok(!content.includes('/signup'), 'Must not include signup');
  assert.ok(!content.includes('/settings'), 'Must not include settings');
  assert.ok(!content.includes('localhost'), 'Must not contain localhost');
  assert.ok(!content.includes('findbuilders.app'), 'Must not contain old findbuilders.app domain');
});
