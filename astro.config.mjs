// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ghoul.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 3000,
    host: true,
  },
  devToolbar: { enabled: false },
});
