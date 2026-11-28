// Render /resume to public/Ahmed-Yaseen-Resume.pdf (dark theme) and
// public/Ahmed-Yaseen-Resume-light.pdf with Playwright's Chromium.
// Run through `npm run resume` inside the nix dev shell (nix/), which provides the
// browser (PLAYWRIGHT_BROWSERS_PATH); playwright-core is pinned to the same
// version as nixpkgs' playwright-driver.
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { copyFile, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const themes = { dark: 'Ahmed-Yaseen-Resume.pdf', light: 'Ahmed-Yaseen-Resume-light.pdf' };

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
};

execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });

// Minimal static server over dist/, so fonts and CSS load from the same origin.
const server = createServer(async (req, res) => {
  try {
    let file = join(dist, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!file.startsWith(dist)) throw new Error('outside dist');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/resume/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  for (const [theme, name] of Object.entries(themes)) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.pdf({ path: join(root, 'public', name), format: 'A4', printBackground: true, preferCSSPageSize: true });
  }
} finally {
  await browser.close();
  server.close();
}

// Keep the fresh build consistent with public/ without a second build.
for (const name of Object.values(themes)) {
  await copyFile(join(root, 'public', name), join(dist, name));
  console.log(`wrote public/${name}`);
}
