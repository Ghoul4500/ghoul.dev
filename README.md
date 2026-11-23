# ghoul.dev

Personal portfolio + blog for Ahmed Yaseen (Ghoul). Static [Astro](https://astro.build)
site, self-hosted on my homelab behind Caddy and a Cloudflare tunnel.

This repo previously hosted a single-page public notice about two Maldivian banks
blocking my hosting payments. That notice now lives on as blog posts under `/blog`, and
the root is the portfolio.

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # → dist/
npm run preview  # serve the production build
```

## Structure

```
public/            static assets (favicon, OG images, robots, IndexNow key)
og-card.html       source for the portfolio OG image (rendered to public/og-image.png)
src/
  content/blog/    blog posts (Markdown + frontmatter)
  content.config.ts
  layouts/Base.astro    <head>, SEO, theme init, nav + footer
  components/      Nav (with theme switcher), Footer, Contributions
  pages/
    index.astro            portfolio homepage
    blog/index.astro       blog listing
    blog/[...slug].astro   post pages
  styles/global.css    theme system (dark/light + 4 accents) + components
  lib/seo.ts           site constants + JSON-LD
```

## Theme

Dark/light and four accent colors (acid, ember, violet, cyan) are driven by
`data-theme` / `data-accent` on `<html>`, toggled in the nav and persisted to
`localStorage`. An inline `<head>` script applies the saved theme before first paint.

## Deploy

The site is served from the `ghoul.dev` homelab container: Caddy serves
`/var/www/ghoul.dev/dist`, and the ingress container routes the domain to it through a
Cloudflare tunnel. To deploy, push to `main`, then rebuild on the container:

```sh
ssh ghoul.dev 'cd /var/www/ghoul.dev && git pull --ff-only && npm ci && npm run build'
```

The container's `.env` holds `GH_PAT` (read:user) so the contribution graph includes
private activity. The GitHub stats are fetched at build time, so they only refresh on a
rebuild.

## Regenerate the portfolio OG image

`public/og-image.png` is rendered from `og-card.html` with headless Chrome:

```sh
google-chrome-stable --headless=new --disable-gpu --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot=public/og-image.png "file://$PWD/og-card.html"
```

Blog posts default to `public/og-bank.png` (the original bank-notice card); override
per-post with an `image:` field in frontmatter.
