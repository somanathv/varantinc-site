# Varant Inc — redesigned website

A complete redesign of varantinc.com: modern multi-page static site, deployable
anywhere (optimized for Vercel). Includes a content manager so job postings
(and news) can be edited without touching code.

## Pages

- `/` — home (interactive "live systems" hero: animated network canvas + deploy terminal + count-up stats, stats, services, products, why-us, process, news, CTA)
- `/about` — story, values, milestones, offices
- `/services` — 9 practices + engagement models
- `/products` — InvestWick + Budgewise
- `/careers` — culture + searchable job board (data-driven)
- `/contact` — US/India offices, map, contact form (mailto)
- `/admin` — content manager (Decap CMS): job postings, news

## Structure

```
index.html  about.html  services.html  products.html  careers.html  contact.html
assets/
  css/style.css          # entire design system
  js/main.js             # nav, reveal animations, news/jobs loaders, form, tabs
  img/                   # hero / office / product imagery
  brand/                 # varant-logo.png, favicon.svg
content/
  jobs.json              # job postings (edited via /admin or directly)
  news.json              # news & announcements (edited via /admin or directly)
admin/
  index.html  config.yml # Decap CMS
api/
  auth.js  callback.js   # GitHub OAuth gateway for the CMS (Vercel functions)
vercel.json robots.txt sitemap.xml
```

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. Vercel → New Project → import the repo. Zero-config: static files are served
   as-is, `/api/*.js` become serverless functions, `vercel.json` enables clean URLs.
3. Point `varantinc.com` at the project and set it as the production domain
   (so the address bar shows varantinc.com, not *.vercel.app).

Any static host works too (Netlify, Cloudflare Pages, Oracle VM + nginx) —
only the `/admin` GitHub login needs the two `/api` functions, which are
Vercel-style; on other hosts, use their serverless equivalent or skip CMS
login and edit `content/*.json` directly.

## Managing job postings (two ways)

**A. Admin panel (recommended)** — open `https://varantinc.com/admin`, log in
with GitHub, edit "Job Postings": add, edit, hide (toggle *Visible on site*),
or delete roles. Changes go through an editorial review step, then publish —
Vercel redeploys automatically and the careers page updates within a minute.

One-time setup (5 minutes):
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://varantinc.com`
   - Authorization callback URL: `https://varantinc.com/api/callback`
2. Vercel → Project → Settings → Environment Variables, add:
   - `GITHUB_OAUTH_CLIENT_ID` = Client ID from step 1
   - `GITHUB_OAUTH_CLIENT_SECRET` = Client secret from step 1
3. In `admin/config.yml`, set `repo:` to your GitHub `username/repo` and
   `base_url:` to `https://varantinc.com`, then redeploy.

**B. Direct edit (no setup)** — edit `content/jobs.json` in the GitHub web UI
(github.dev works too), commit, and Vercel redeploys automatically.

## Managing the site well (recommendations)

- **One repo = source of truth.** Every change is a commit: full history,
  easy rollback, and Vercel gives a preview URL for every change before it
  goes live.
- **Content vs. code split.** Text you change often (jobs, news) lives in
  `content/*.json` and is editable in `/admin`. Design/copy overhauls stay in
  code — ask Kai and he'll make them.
- **Keep it static.** No server to patch, no database to back up, loads fast,
  costs $0. The marketing site doesn't need a backend; Vsphere and InvestWick
  already cover the interactive parts (the Employee Portal link in the header
  connects them).
- **Fix the domain.** Serve the apex domain directly from Vercel instead of
  redirecting to `*.vercel.app` — it looks far more professional in the
  address bar and in search results.
- **Fix or drop Budgewise's old link.** This redesign points Budgewise at an
  on-site section with a "Request a demo" CTA instead of the dead
  www.budgewise.com domain.
- **Review quarterly:** news items, job list accuracy, service descriptions,
  and the footer copyright (auto-updates via JS, but good to glance).
