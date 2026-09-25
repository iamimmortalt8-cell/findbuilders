// scripts/generate-sitemap.mjs
// Generates a search-engine compliant XML sitemap for FindBuilders frontend
import { writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.VITE_APP_URL || 'https://findbuilders.pages.dev';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnlyxnffxmfsxlehsxps.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dBkR0WUad2kLgX9BqJpoYA_LhYtnEY9';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'hourly' },
  { path: '/features', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.8', changefreq: 'monthly' },
  { path: '/support', priority: '0.6', changefreq: 'monthly' },
  { path: '/terms', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.4', changefreq: 'monthly' },
];

const CATEGORY_SLUGS = [
  'ai',
  'developer-tools',
  'productivity',
  'education',
  'design',
  'business',
  'other'
];

async function generate() {
  console.log('[SEO] Generating sitemap.xml for', BASE_URL);

  let approvedProducts = [];
  let publicProfiles = [];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Fetch only approved public products
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, name, updated_at, status')
      .eq('status', 'approved');

    if (!pError && Array.isArray(products)) {
      approvedProducts = products;
    }

    // 2. Fetch public maker profiles with a display name
    const { data: profiles, error: prError } = await supabase
      .from('profiles')
      .select('id, display_name, updated_at');

    if (!prError && Array.isArray(profiles)) {
      publicProfiles = profiles.filter(p => p.display_name && p.display_name.trim().length > 0);
    }
  } catch (err) {
    console.warn('[SEO] Could not connect to Supabase dynamically, using fallback data:', err.message);
  }

  // Fallback if dynamic query returned empty
  if (approvedProducts.length === 0) {
    approvedProducts = [
      { id: '56b5060a-8166-4c3f-bcc4-64c4a930b368', updated_at: '2026-09-22T14:13:27.663Z' }
    ];
  }
  if (publicProfiles.length === 0) {
    publicProfiles = [
      { id: 'ac2092e5-ea9b-4b68-b5af-f21fe43cab87', updated_at: '2026-09-23T20:36:55.929Z' }
    ];
  }

  const urls = [];

  // Core Static routes
  for (const r of STATIC_ROUTES) {
    urls.push(`  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`);
  }

  // Category routes
  for (const slug of CATEGORY_SLUGS) {
    urls.push(`  <url>
    <loc>${BASE_URL}/categories/${slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Approved products
  for (const p of approvedProducts) {
    const lastmod = p.updated_at ? p.updated_at.split('T')[0] : '';
    urls.push(`  <url>
    <loc>${BASE_URL}/product/${p.id}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  // Public profiles
  for (const pr of publicProfiles) {
    const lastmod = pr.updated_at ? pr.updated_at.split('T')[0] : '';
    urls.push(`  <url>
    <loc>${BASE_URL}/profile/${pr.id}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  const targetPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(targetPath, xml, 'utf8');
  console.log(`[SEO] sitemap.xml generated successfully (${urls.length} URLs) at ${targetPath}`);
}

generate();
