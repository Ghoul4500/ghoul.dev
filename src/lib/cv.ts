// Résumé content shared by the homepage, /resume and /resume/plain.

import { yearsInSoftware, yearsInTech } from './work';

export const NAME = 'Ahmed Yaseen';
export const HEADLINE = 'Software Engineer · Linux Kernel Contributor · asusctl Maintainer';
export const LOCATION = 'Malé, Maldives (UTC+5) · open to remote';

export const contact = [
  { label: 'yaseen@ghoul.dev', href: 'mailto:yaseen@ghoul.dev' },
  { label: 'ghoul.dev', href: 'https://ghoul.dev' },
  { label: 'github.com/Ghoul4500', href: 'https://github.com/Ghoul4500' },
  { label: 'gitlab.com/Ghoul4500', href: 'https://gitlab.com/Ghoul4500' },
];

export type Run = { t: string; b?: boolean };

export function summary(patches: number): Run[] {
  return [
    { t: `Software engineer with ${yearsInTech()} years in tech, ${yearsInSoftware()}+ of them in software development, building web platforms for government ministries, UNDP and the Maldives' #1 taxi app. ${patches} patches merged in the mainline ` },
    { t: 'Linux kernel', b: true },
    { t: ' (C, USB HID and platform/x86 drivers), most backported to stable. Maintainer of ' },
    { t: 'asusctl', b: true },
    { t: ' (Rust) and community manager of the ' },
    { t: 'Open Gaming Collective', b: true },
    { t: '. Lead Platform Engineer at ' },
    { t: 'OXIQA', b: true },
    { t: ', building government platforms for the Maldives.' },
  ];
}

export const plain = (runs: Run[]) => runs.map((r) => r.t).join('');

/** 701 → "700+" */
export const roughly = (n: number) => `${Math.floor(n / 50) * 50}+`;

export const asusctl = (stars: number) => ({
  name: 'asusctl',
  org: 'ASUS Linux',
  role: 'Maintainer',
  when: '2026 – Present',
  sub: 'ASUS Linux · Rust · systemd · D-Bus',
  text:
    `The daemon that controls fan curves, power limits, keyboard lighting and the AniMe Matrix display on ASUS ROG laptops under Linux. ` +
    `${roughly(stars)} GitHub stars, preinstalled in Bazzite. I review contributions and handle the releases. ` +
    'Added Scar 18 2025 support, rebuilt the AniMe Matrix image/GIF pipeline, fixed PPT power-tuning races.',
});

export const ogc = {
  name: 'Open Gaming Collective',
  role: 'Community Manager · Org Admin',
  when: '2026 – Present',
  sub: 'OpenTofu · NixOS · Rust',
  text:
    'Five Linux gaming projects: Universal Blue / Bazzite, Fyra Labs, PikaOS, ShadowBlip and ASUS Linux. ' +
    'I manage the GitHub org as code with OpenTofu (teams, permissions, roster) and co-develop Kairi, ' +
    'the Rust bot that counts governance votes from the mailing list. ' +
    "I'm also building the OGC kernel devkit for bisecting and testing kernels, on top of linux-bisector, where my first fixes are merged.",
};

export const skills = [
  { k: 'Languages', v: ['C', 'Rust', 'TypeScript', 'JavaScript', 'Python', 'PHP', 'Go', 'SQL', 'Shell'] },
  { k: 'Kernel & systems', v: ['Linux kernel', 'Device drivers', 'USB HID', 'platform/x86', 'WMI / ACPI', 'D-Bus', 'systemd', 'Upstream review', 'Stable backports'] },
  { k: 'Backend', v: ['Tokio', 'Axum', 'gRPC / Protobuf', 'Event sourcing', 'Laravel', 'Node.js', 'Bun / Elysia', 'Django', 'REST APIs', 'OpenAPI'] },
  { k: 'Data', v: ['PostgreSQL', 'sqlx', 'Drizzle ORM', 'MySQL', 'MongoDB', 'Redis'] },
  { k: 'Frontend', v: ['React', 'Next.js', 'TanStack Query / Router / Start', 'Tailwind CSS', 'Radix UI', 'Leptos (WASM)', 'Vue', 'Svelte', 'Astro'] },
  { k: 'AI', v: ['LLM APIs (OpenAI, Claude)', 'Claude Agent SDK', 'MCP', 'LLM guardrails', 'ONNX models', 'LiveKit'] },
  { k: 'Infrastructure', v: ['Linux servers', 'Docker / Compose', 'Podman', 'Ansible', 'Nix / NixOS', 'OpenTofu', 'GitHub Actions', 'GitHub Apps', 'Turborepo', 'Git'] },
  { k: 'Observability & BI', v: ['OpenTelemetry', 'Elasticsearch', 'Grafana', 'Sentry', 'Metabase'] },
];

export interface Education {
  when: string;
  what: string;
  where: string;
  result?: string;
  topAward?: string;
  awards?: string[];
}

export const education: Education[] = [
  { when: '2022 – 2025', what: 'BSc (Hons) Computer Science', where: 'University of the West of England (UWE Bristol)',
    result: 'First Class Honours', topAward: 'College Medal · top of cohort', awards: ["Dean's Award", "Dean's List"] },
  { when: '2021', what: 'Foundation in Engineering', where: 'Villa College' },
  { when: '2019', what: 'O Levels', where: 'M.Atoll School', topAward: 'National Top 7' },
];

export const allAwards = (e: Education) => [...(e.topAward ? [e.topAward] : []), ...(e.awards ?? [])];
export const hasTags = (e: Education) => Boolean(e.result || allAwards(e).length);

export const awards = [
  '2nd place, CyberExpo CTF (national)',
];
