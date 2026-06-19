# ghoul.dev

Personal portfolio + blog for Ahmed Yaseen (Ghoul). Static [Astro](https://astro.build)
site, deployed to GitHub Pages on the `ghoul.dev` custom domain.

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
public/            static assets (CNAME, favicon, OG images, robots, IndexNow key)
og-card.html       source for the portfolio OG image (rendered to public/og-image.png)
src/
  content/blog/    blog posts (Markdown + frontmatter)
  content.config.ts
  layouts/Base.astro    <head>, SEO, theme init, nav + footer
  components/      Nav (with theme switcher), Footer
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

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. Pages must be set to the **GitHub Actions** source
(Settings → Pages). The `CNAME` file keeps the `ghoul.dev` custom domain.

## Regenerate the portfolio OG image

`public/og-image.png` is rendered from `og-card.html` with headless Chrome:

```sh
google-chrome-stable --headless=new --disable-gpu --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot=public/og-image.png "file://$PWD/og-card.html"
```

Blog posts default to `public/og-bank.png` (the original bank-notice card); override
per-post with an `image:` field in frontmatter.
