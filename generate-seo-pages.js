#!/usr/bin/env node
/**
 * SEO Pre-rendering Script — Les Fromages du Bonheur
 *
 * Generates one static HTML page per cheese at /fromage/{slug}.html
 * with proper meta tags, OpenGraph, structured data (JSON-LD).
 * Compatible with GitHub Pages (static files, no server needed).
 *
 * Usage: node generate-seo-pages.js
 * Run from the repo root (parent of /site/).
 */

const fs = require('fs');
const path = require('path');

// ── Load cheese data ──
const dataJs = fs.readFileSync(path.join(__dirname, 'site', 'data.js'), 'utf-8');
const b64Match = dataJs.match(/var CHEESE_DATA_B64\s*=\s*"([^"]+)"/);
if (!b64Match) { console.error('Could not find CHEESE_DATA_B64 in data.js'); process.exit(1); }
const data = JSON.parse(Buffer.from(b64Match[1], 'base64').toString('utf-8'));
const cheeses = data.cheeses;
console.log(`Found ${cheeses.length} cheeses. Generating SEO pages...`);

// ── Slug function (must match app.js cheeseSlug) ──
function slug(name) {
    return name ? name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['']/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
}

// ── Output directory ──
const outDir = path.join(__dirname, 'site', 'fromage');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Template ──
function generatePage(c) {
    const s = slug(c.nm);
    const title = `${c.nm} — Fromage de France | Les Fromages du Bonheur`;
    const desc = [
        c.nm,
        c.lb || '',
        c.an ? `Lait de ${c.an.toLowerCase()}` : '',
        c.tp || '',
        c.sa ? `Saison : ${c.sa}` : '',
        c.go ? `Goût ${c.go.toLowerCase()}` : '',
        c.rg && c.rg.length > 0 ? c.rg.join(', ') : ''
    ].filter(Boolean).join(' · ');

    const imgUrl = `https://www.lesfromagesdubonheur.com/site/img/${s}.jpg`;
    const pageUrl = `https://www.lesfromagesdubonheur.com/fromage/${s}.html`;
    const canonicalUrl = `https://www.lesfromagesdubonheur.com/#fromage=${encodeURIComponent(c.nm)}`;

    // Structured data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": c.nm,
        "description": desc,
        "category": "Fromage",
        "brand": { "@type": "Brand", "name": c.pr && c.pr.length > 0 ? c.pr[0].n : "Artisan fromager" },
        "url": pageUrl,
        "additionalProperty": []
    };
    if (c.tp) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Type de pâte", "value": c.tp });
    if (c.an) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Espèce", "value": c.an });
    if (c.af) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Affinage", "value": c.af });
    if (c.go) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Goût", "value": c.go });
    if (c.sa) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Saison optimale", "value": c.sa });
    if (c.rg && c.rg.length > 0) jsonLd.additionalProperty.push({ "@type": "PropertyValue", "name": "Région", "value": c.rg.join(', ') });

    // Build characteristics section
    const chars = [
        c.an ? `<li><strong>Espèce :</strong> ${c.an}</li>` : '',
        c.lc ? `<li><strong>Type de lait :</strong> ${c.lc}</li>` : '',
        c.tp ? `<li><strong>Type de pâte :</strong> ${c.tp}</li>` : '',
        c.af ? `<li><strong>Affinage :</strong> ${c.af}</li>` : '',
        c.sa ? `<li><strong>Saison optimale :</strong> ${c.sa}</li>` : '',
        c.go ? `<li><strong>Goût :</strong> ${c.go}</li>` : '',
    ].filter(Boolean).join('\n            ');

    const labels = [];
    if (c.ao && c.ao.da) labels.push('AOP');
    if (c.ao && c.ao.dc_aoc) labels.push('AOC');
    if (c.ao && c.ao.di) labels.push('IGP');
    const labelStr = labels.length > 0 ? labels.join(', ') : '';

    const producers = (c.pr || []).map(p => `<li>${p.n}${p.b ? ' (Bio)' : ''}</li>`).join('\n            ');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc.replace(/"/g, '&quot;')}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph -->
    <meta property="og:title" content="${c.nm} — Fromage de France">
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${imgUrl}">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="Les Fromages du Bonheur">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${c.nm} — Fromage de France">
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${imgUrl}">

    <!-- Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

    <!-- Redirect to main app after indexing -->
    <meta http-equiv="refresh" content="0;url=https://www.lesfromagesdubonheur.com/#fromage=${encodeURIComponent(c.nm)}">

    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; color: #3a3226; max-width: 700px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.7; }
        h1 { font-family: 'Playfair Display', serif; color: #5a4230; font-size: 2rem; margin-bottom: 0.3rem; }
        .sub { color: #8B6F47; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #FFE0B2; color: #E65100; margin-right: 0.3rem; }
        .chars { list-style: none; padding: 0; }
        .chars li { padding: 0.3rem 0; border-bottom: 1px solid #f0ede8; font-size: 0.9rem; }
        .ff { background: #f8f6f3; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.9rem; color: #666; }
        .back { display: inline-block; margin-top: 2rem; color: #8B6F47; text-decoration: none; font-weight: 500; }
        .back:hover { text-decoration: underline; }
        .producers { margin-top: 1rem; }
        .producers li { font-size: 0.9rem; padding: 0.2rem 0; }
        footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #f0ede8; font-size: 0.8rem; color: #999; }
    </style>
</head>
<body>
    <a href="https://www.lesfromagesdubonheur.com/" style="text-decoration:none;color:#5a4230;font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;">Les Fromages du Bonheur</a>

    <h1>${c.nm}</h1>
    <div class="sub">${c.lb || 'Fromage français'}${labelStr ? ' · ' + labelStr : ''}${c.rg && c.rg.length > 0 ? ' · ' + c.rg.join(', ') : ''}</div>

    ${labels.map(l => `<span class="badge">${l}</span>`).join('')}

    ${chars ? `<ul class="chars">\n            ${chars}\n        </ul>` : ''}

    ${c.ff && c.ff !== '-' ? `<div class="ff"><strong>Le saviez-vous ?</strong> ${c.ff}</div>` : ''}

    ${producers ? `<div class="producers"><h3>Producteurs</h3><ul>${producers}</ul></div>` : ''}

    <a class="back" href="https://www.lesfromagesdubonheur.com/#fromage=${encodeURIComponent(c.nm)}">← Voir sur la carte interactive</a>

    <footer>
        © 2025–2026 Les Fromages du Bonheur · Carte interactive des fromages de France
    </footer>
</body>
</html>`;
}

// ── Generate all pages ──
let count = 0;
cheeses.forEach(c => {
    const s = slug(c.nm);
    if (!s) return;
    const html = generatePage(c);
    fs.writeFileSync(path.join(outDir, `${s}.html`), html, 'utf-8');
    count++;
});

// ── Generate sitemap.xml ──
const sitemapEntries = cheeses.map(c => {
    const s = slug(c.nm);
    return `  <url><loc>https://www.lesfromagesdubonheur.com/fromage/${s}.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.lesfromagesdubonheur.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
${sitemapEntries}
</urlset>`;

fs.writeFileSync(path.join(__dirname, 'site', 'sitemap.xml'), sitemap, 'utf-8');

console.log(`✅ Generated ${count} SEO pages in site/fromage/`);
console.log(`✅ Updated sitemap.xml with ${count + 1} URLs`);
