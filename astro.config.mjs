// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static build — deployed to GitHub Pages on the ghoul.dev custom domain.
// No server adapter: the old SSR portfolio couldn't be hosted anymore, so this
// is the static, movable replacement.
export default defineConfig({
  site: 'https://ghoul.dev',
  output: 'static',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
});
