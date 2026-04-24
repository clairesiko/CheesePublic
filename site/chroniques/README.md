# Chroniques Fromagères — How-To

Everything you need to deploy and grow the Chroniques Fromagères — a unified newsletter + blog publication.

---

## 1. What lives where

| File | Role |
|------|------|
| `chroniques.html` | The single public landing page — hero + signup + promise grid + archive grid + footer signup |
| `chroniques/posts.json` | Manifest listing every published chronicle (loaded by `chroniques.html`) |
| `chroniques/bienvenue.html` | Sample first chronicle — doubles as template for new ones |
| `chroniques/README.md` | This file |
| `index.html` | Has a single "Chroniques" link in the "En savoir plus" dropdown (desktop) and the "Plus" menu (mobile) |
| `sitemap.xml` | Includes entries for `chroniques.html` and each individual chronicle |

No changes to `app.js`, `data.js`, `i18n.js`, or `style.css`. The Chroniques feature is self-contained.

---

## 2. Deploying to production

```bash
cd CheesePublic   # your GitHub Pages repo
git add site/chroniques.html site/chroniques/ site/index.html site/sitemap.xml
git rm site/blog.html site/newsletter.html 2>/dev/null
git rm -r site/blog/ 2>/dev/null
git commit -m "Launch Chroniques Fromagères (unified newsletter + blog)"
git push
```

GitHub Pages will deploy within a minute. No cache busters needed — these are new pages, not assets referenced by `index.html`.

---

## 3. Wiring in your newsletter provider (when you're ready)

### Choosing a provider (you want unlimited subscribers)

| Provider | Free subs | Fits "chronicle on site + email" workflow | Notes |
|----------|-----------|-------------------------------------------|-------|
| **Kit** (ex-ConvertKit) | 10,000 — effectively unlimited | ✅ Excellent | Clean embed, great deliverability. Recommended. |
| **Substack** | Truly unlimited | ⚠️ Works but chronicles live on substack.com; you mirror to `/chroniques` manually | Best if you also want their built-in discovery network |
| **Listmonk** (self-hosted) | Unlimited | ✅ | ~$5/mo VPS, requires Docker setup. Fully owned. |
| **Brevo** | Unlimited contacts, 300 emails/day | ❌ Breaks at ~300 subscribers per send | Skip for this use case |

### Wiring it in

1. Create your free account (Kit: [kit.com](https://kit.com), Substack: [substack.com](https://substack.com)).
2. Create an embedded form / widget and copy the HTML snippet.
3. Replace the placeholder `<form class="signup-form" ...>` in:
   - `chroniques.html` — two locations: the hero signup card (look for `NEWSLETTER PROVIDER FORM PLACEHOLDER`) and the footer signup strip.
   - `chroniques/bienvenue.html` — the post-footer signup strip.
   - Every future chronicle — they all get the same post-footer form.
4. Keep the class names `signup-form`, `signup-status` so the existing styling still applies.
5. The temporary `handleSignup()` / `handlePostSignup()` JavaScript functions can be deleted once the provider is wired — their embed handles submissions itself.

Until step 4 is done, the signup form opens a pre-filled email to `lesfromagesdubonheur@gmail.com` — so you still capture signups manually.

---

## 4. Adding a new chronicle

Each chronicle is a standalone HTML file — no build step, no database. The workflow:

### Step A — Write the chronicle

1. Copy `chroniques/bienvenue.html` to `chroniques/my-new-slug.html`.
2. Edit the following in the new file:
   - `<title>` tag (two occurrences: one in `<head>`, one in the `toggleLang()` JS function at the bottom)
   - `<meta name="description">` and `<meta property="og:*">` tags
   - `<link rel="canonical" href="...">` — update the URL
   - `<meta property="article:published_time">` — update the date
   - The breadcrumb, post-tag (category), `<h1>` titles (FR + EN)
   - The `<div class="post-meta">` date (FR + EN)
   - The `<div class="post-hero">` — swap the emoji for an `<img src="...">` when you have a photo
   - The article body — both `<div class="lang-fr">` and `<div class="lang-en">` blocks
3. Save.

### Step B — Register it in the manifest

Open `chroniques/posts.json` and add a new entry at the top of the `"posts"` array:

```json
{
  "slug": "my-new-slug",
  "date": "2026-05-15",
  "category": "histoires",
  "coverEmoji": "🐐",
  "cover": "",
  "title": {
    "fr": "Titre en français",
    "en": "English title"
  },
  "excerpt": {
    "fr": "Un résumé en 1-2 phrases qui apparaîtra sur la carte archive.",
    "en": "A 1-2 sentence summary shown on the archive card."
  }
}
```

**Categories** (use exactly these values): `histoires`, `itineraires`, `communaute`, `actualites`.

**Cover**: if empty, the card shows `coverEmoji`. If you provide `cover: "/img/my-photo.jpg"`, the card shows the image.

### Step C — Update the sitemap

Append one line to `sitemap.xml`:

```xml
<url><loc>https://www.lesfromagesdubonheur.com/chroniques/my-new-slug.html</loc><lastmod>2026-05-15</lastmod><changefreq>yearly</changefreq><priority>0.6</priority></url>
```

### Step D — Deploy

```bash
git add site/chroniques/ site/sitemap.xml
git commit -m "New chronicle: my-new-slug"
git push
```

---

## 5. The email → archive workflow

Each monthly chronicle follows this pattern:

1. **Write the chronicle** inside your provider's editor (Kit/Substack). Aim for 700-1200 words.
2. Once sent, **click "Export HTML"** (or copy the body).
3. **Create a new chronicle post** following steps A–D above. Paste the body inside the `<div class="lang-fr">` block of `post-body`. Translate to EN inside `<div class="lang-en">` (or use DeepL and polish).
4. **Link** the chronicle from the next issue ("Retrouvez toutes les chroniques sur le site").

Result: your subscribers get it in their inbox AND everyone else finds it via Google → discovers your site → signs up at the page's signup form.

---

## 6. Quick mental model

- Chroniques Fromagères = the unified publication (one name, two surfaces)
- Your provider (Kit/Substack) = the distribution channel
- `chroniques.html` = the public archive on your domain + the signup
- Each chronicle lives in both places
- Signup surfaces: hero form on `/chroniques`, footer form on `/chroniques`, — `post-footer` form on every chronicle, nav link

That's it. You own your readers, your content, and your design.
