export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  url: string;
  live?: string;
  year: string;
  kind: 'systems' | 'backend' | 'fullstack' | 'tooling' | 'ai';
  highlight?: boolean;
  accent?: 'acid' | 'ember' | 'violet' | 'cyan';
};

export const projects: Project[] = [
  {
    slug: 'asusctl',
    name: 'asusctl',
    tagline: 'Rust patches to the asus-linux project',
    description:
      'The daemon that makes ASUS ROG laptops actually work on Linux. I added support for the Strix Scar 18 2025 line (G835LW, G635L), rewrote the AniMe Matrix image & GIF pipeline, enabled the GA402N board, added a pulse-mode aura effect, and fixed a couple of race conditions in the PPT power tuning. Seven MRs merged upstream so far.',
    stack: ['Rust', 'systemd', 'dbus', 'Linux'],
    url: 'https://gitlab.com/asus-linux/asusctl',
    year: '2026',
    kind: 'systems',
    highlight: true,
    accent: 'acid',
  },
  {
    slug: 'orchestrator',
    name: 'Orchestrator',
    tagline: 'TypeScript workflow runner',
    description:
      'TypeScript layer for long-running, multi-step workflows. Typed contracts between stages, retries, and observability hooks.',
    stack: ['TypeScript', 'Node'],
    url: 'https://github.com/Ghoul4500/Orchestrator',
    year: '2026',
    kind: 'backend',
    accent: 'violet',
  },
  {
    slug: 'autoclaude',
    name: 'autoclaude',
    tagline: 'Local agent that fixes GitHub issues with Claude CLI',
    description:
      'Watches a GitHub repo, picks up issues, runs Claude CLI against a sandbox checkout, and opens a PR with the proposed fix. No cloud service in the loop — it all runs on your own machine.',
    stack: ['Node', 'Claude CLI', 'GitHub API'],
    url: 'https://github.com/Ghoul4500/autoclaude',
    year: '2026',
    kind: 'tooling',
    highlight: true,
    accent: 'ember',
  },
  {
    slug: 'weatherloc',
    name: 'WeatherLoc',
    tagline: 'Python weather + geolocation wrapper',
    description:
      'A Python package on PyPI that wraps weatherapi.com — typed surface for weather-by-IP and geolocation lookups. Small, in use.',
    stack: ['Python', 'PyPI', 'REST'],
    url: 'https://github.com/Ghoul4500/weatherloc',
    live: 'https://pypi.org/project/WeatherLoc/',
    year: '2026',
    kind: 'backend',
    accent: 'cyan',
  },
  {
    slug: 'divi-network-fonts',
    name: 'divi-network-fonts',
    tagline: 'WordPress multisite plugin (part of Dhiraasa)',
    description:
      'WordPress plugin that pushes Divi fonts out to every site in a multisite network. The @font-face output matches Divi\'s internal naming so the theme actually picks them up. Written for Dhiraasa, the multisite I built for the Ministry of Dhivehi Language, Culture & Heritage.',
    stack: ['PHP', 'WordPress', 'Divi', 'Multisite'],
    url: 'https://github.com/Ghoul4500/divi-network-fonts',
    year: '2026',
    kind: 'fullstack',
    accent: 'ember',
  },
  {
    slug: 'discord-py-template',
    name: 'Discord.py-Template',
    tagline: 'Starter for new discord.py bots',
    description:
      'Starter template for Python Discord bots. Sensible project structure, cog-based commands, env config, a clean starting point.',
    stack: ['Python', 'discord.py'],
    url: 'https://github.com/Ghoul4500/Discord.py-Template',
    year: '2024',
    kind: 'tooling',
    accent: 'violet',
  },
  {
    slug: 'rust-actix-api',
    name: 'rust-actix-api',
    tagline: 'Rust API with Actix',
    description:
      'Rust API service using Actix. Handler composition, extractors, typed error boundaries. Built while trying Rust for production API work.',
    stack: ['Rust', 'Actix', 'SQL'],
    url: 'https://github.com/Ghoul4500/rust-actix-api',
    year: '2024',
    kind: 'backend',
    accent: 'acid',
  },
  {
    slug: 'traffic-signal-ai',
    name: 'traffic-signal-ai',
    tagline: 'ML-driven traffic signal control',
    description:
      'Traffic-signal simulation that adjusts cycle timings based on real-time load instead of a fixed schedule. Research project.',
    stack: ['Python', 'ML'],
    url: 'https://github.com/Ghoul4500/traffic-signal-ai',
    year: '2025',
    kind: 'ai',
    accent: 'violet',
  },
  {
    slug: 'genetic-algorithm',
    name: 'Genetic-Algorithm',
    tagline: 'Genetic algorithm from scratch',
    description:
      'Genetic algorithm built from scratch for AI coursework. Selection, crossover, mutation, fitness landscapes — all hand-rolled.',
    stack: ['Python', 'AI'],
    url: 'https://github.com/Ghoul4500/Genetic-Algorithm',
    year: '2024',
    kind: 'ai',
    accent: 'cyan',
  },
];

/**
 * Owners surfaced in the OpenSource section. The runtime fetcher
 * (src/server/github.ts) is the source of truth for live commit/diff counts;
 * this list exists so static consumers (SEO, JSON-LD) have a stable handle
 * on the same orgs without depending on a runtime fetch.
 */
export type TrackedOrg = { org: string; url: string; role: string };
export const trackedOrgs: TrackedOrg[] = [
  {
    org: 'Open Gaming Collective',
    url: 'https://github.com/OpenGamingCollective',
    role: 'Contributor · Linux + tooling',
  },
  {
    org: 'caelestia-dots',
    url: 'https://github.com/caelestia-dots',
    role: 'Contributor',
  },
];

/**
 * Patches that don't (yet) show up via GitHub's authorship graph — kernel
 * work in a maintainer's tree, patches sent via git-send-email, OGC PRs that
 * land in a release branch rather than master, etc. Hand-curated; update
 * `status` as the patch progresses upstream.
 */
export type ManualPatch = {
  /** Project slug — used for grouping under an owner card. */
  project: string;
  /** Owner login the patch should appear under (matches TRACKED_OWNERS). */
  owner: string;
  subject: string;
  /** Commit SHA — short or full. Used for display + as the link anchor. */
  sha: string;
  /** Where the commit currently lives (maintainer tree, lore archive, etc). */
  treeUrl?: string;
  patchworkUrl?: string;
  status: 'submitted' | 'in-maintainer-tree' | 'in-linux-next' | 'in-mainline';
  /** ISO date the patch was first sent. */
  submittedAt: string;
};

export const manualPatches: ManualPatch[] = [
  // Seed entries here. Example:
  // {
  //   project: 'linux',
  //   owner: 'OpenGamingCollective',
  //   subject: 'platform/x86: asus-wmi: ...',
  //   sha: 'abc1234',
  //   treeUrl: 'https://git.kernel.org/pub/scm/linux/kernel/git/ipilipczuk/linux-pdx86.git/commit/?id=abc1234',
  //   status: 'in-maintainer-tree',
  //   submittedAt: '2026-05-10',
  // },
];

export const techStack = [
  'TypeScript', 'Rust', 'Python', 'PHP', 'Go', 'Svelte', 'React', 'React Native',
  'Node', 'Hono', 'Astro', 'Django', 'Laravel', 'Actix', 'PostgreSQL', 'Redis',
  'Linux', 'systemd', 'Docker', 'Nginx', 'Tailwind', 'Neovim',
];
