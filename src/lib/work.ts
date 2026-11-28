// Jobs and client projects, shared by the homepage and the résumé. Edit them
// here and both pages follow (then regenerate the résumé PDF).

export interface Job {
  when: string;
  org: string;
  role: string;
  points: string[];
  /** False for non-software tech jobs. */
  software?: boolean;
}

export interface Project {
  name: string;
  /** Short category label. */
  pill: string;
  /** Who it was for. */
  sub: string;
  /** Role and years. */
  meta: string;
  /** Company the work came through, shown on the homepage only. */
  via?: string;
  text: string;
  tags: string[];
  /** Public proof link, shown on the homepage only. */
  link?: { href: string; label: string };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function started(j: Job): Date {
  const [mon, year] = j.when.split(' – ')[0].split(' ');
  return new Date(Number(year), MONTHS.indexOf(mon), 1);
}

function monthsSince(list: Job[], now: Date): number {
  const from = new Date(Math.min(...list.map((j) => started(j).getTime())));
  return (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth();
}

export function yearsInSoftware(now = new Date()): number {
  return Math.floor(monthsSince(jobs.filter((j) => j.software !== false), now) / 12);
}

/** Rounded: 4y 11m → 5. */
export function yearsInTech(now = new Date()): number {
  return Math.round(monthsSince(jobs, now) / 12);
}

export const jobs: Job[] = [
  {
    when: 'Feb 2025 – Present', org: 'OXIQA', role: 'Lead Platform Engineer',
    points: [
      "Led a team of 3 on Kuri Portal, the Ministry of Higher Education's main platform (Laravel APIs, Next.js portals), and set up its Elasticsearch, Grafana and Metabase monitoring.",
      'Built Chronokle, an event-sourced project tracker in Rust: a gRPC core over PostgreSQL with a transactional outbox, a Leptos web app, and plugins for GitHub sync and an AI coding agent.',
      "Rebuilt Hologo's education AI web app and its multi-tenant version in Next.js, and reworked its Laravel API.",
      "In collaboration with Synetecs, built UNDP Maldives' Dhivehi text-to-speech portals, API and LiveKit service, plus agent-router's GitHub App integration and AI-vs-human code attribution.",
      'Usually the lead or only engineer: API, frontend, Linux servers and deployments.',
    ],
  },
  {
    when: 'Nov 2023 – Feb 2025', org: 'Avas App', role: 'Full-stack Developer',
    points: [
      "Worked on Avas App, the Maldives' #1 taxi app (50K+ downloads): the rider and driver apps, the web APIs and the ops admin panel.",
    ],
  },
  {
    when: 'Dec 2021 – Nov 2023', org: 'Ooredoo Maldives', role: 'Provisioning Officer · earlier Fiber Technician', software: false,
    points: [
      'Configured fiber broadband connections, coordinated with 6 infrastructure partners, trained staff and ran UAT. Employee of the month twice.',
    ],
  },
];

export const isCurrent = (j: Job) => j.when.endsWith('Present');

export const work: Project[] = [
  { name: 'Kuri Portal', pill: 'GOV', sub: 'Ministry of Higher Education', meta: 'Lead developer · 2025—now', via: 'OXIQA',
    text: "The ministry's main platform. A Laravel backend and Next.js frontend for student and admin portals. Ansible for documented deployments.",
    tags: ['Laravel', 'TypeScript', 'Ansible'] },
  { name: 'UNDP · Dhivehi TTS', pill: 'AI', sub: 'United Nations Development Programme', meta: 'Full-stack · 2025', via: 'Synetecs',
    text: "Two web portals, a backend API and a LiveKit service for UNDP Maldives' Dhivehi text-to-speech project, which brings TTS to news and article websites with a simple embed.",
    tags: ['Next.js', 'TTS'] },
  { name: 'Avas App', pill: 'MOBILE', sub: "The Maldives' #1 taxi app · 50K+ downloads", meta: 'Full-stack · 2023—2025',
    text: 'Rider and driver apps, the web APIs and the ops admin panel for the country’s #1 taxi app.',
    tags: ['Mobile', 'REST APIs', 'Admin'],
    link: { href: 'https://play.google.com/store/apps/details?id=app.avas.rider', label: '50K+ on Google Play' } },
  { name: 'Hologo', pill: 'PRODUCT', sub: 'Education AI platform', meta: 'Web app rebuild · 2025', via: 'OXIQA',
    text: 'Rebuilt their web app in Next.js and reworked parts of the Laravel API behind it. The product uses Unity for its 3D models and LiveKit for its chatbot, and I worked with both from the web side.',
    tags: ['Next.js', 'Laravel', 'LiveKit', 'Unity'] },
  { name: 'RepSet', pill: 'PRODUCT', sub: 'Personal-trainer client management', meta: 'Sole engineer · 2026',
    text: 'Block-periodization programming, scheduling and progress tracking. Postgres, JWT auth, Docker, CI/CD.',
    tags: ['TypeScript', 'React', 'PostgreSQL'] },
];
