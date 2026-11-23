// Jobs and client projects, shared by the homepage and the résumé. Edit them
// here and both pages follow (then regenerate the résumé PDF).

export interface Job {
  when: string;
  org: string;
  role: string;
  points: string[];
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

export const jobs: Job[] = [
  {
    when: 'Feb 2025 — now', org: 'OXIQA', role: 'Lead Platform Engineer',
    points: [
      'Lead engineer on platforms for government ministries and product teams. I work on the APIs, the frontends and the Linux servers, and make the deployment and infrastructure decisions.',
    ],
  },
  {
    when: '2025 — now', org: 'Synetecs', role: 'Collaborator · AI',
    points: [
      'AI work: thaana.ai (Dhivehi language models), legalnotes and the UNDP Dhivehi TTS dashboard.',
    ],
  },
  {
    when: 'Nov 2023 — Feb 2025', org: 'Avas App', role: 'Full-stack Developer',
    points: [
      "One of the engineers on Avas App, the Maldives' most-used ride-hailing app (50K+ downloads). Worked on the rider and driver apps, the web APIs and the ops admin panel.",
    ],
  },
  {
    when: 'Dec 2021 — Nov 2023', org: 'Ooredoo Maldives', role: 'Provisioning Officer · earlier Fiber Technician',
    points: [
      'Device configuration for mobile and fiber, managing 6 infrastructure partners, staff training and UAT. Employee of the month twice.',
    ],
  },
];

export const work: Project[] = [
  { name: 'Kuri Portal', pill: 'GOV', sub: 'Ministry of Higher Education', meta: 'Lead developer · 2025—now', via: 'OXIQA',
    text: "The ministry's main platform. A Laravel backend and Next.js frontend for student and admin portals. Ansible for documented deployments.",
    tags: ['Laravel', 'TypeScript', 'Ansible'] },
  { name: 'UNDP · Dhivehi TTS', pill: 'AI', sub: 'United Nations Development Programme', meta: 'Full-stack · 2025', via: 'Synetecs',
    text: "Two web portals, a backend API and a LiveKit service for UNDP Maldives' Dhivehi text-to-speech project, which brings TTS to news and article websites with a simple embed.",
    tags: ['Next.js', 'TTS'] },
  { name: 'Avas App', pill: 'MOBILE', sub: "The Maldives' #1 taxi app · 50K+ downloads", meta: 'Full-stack · 2023—2025',
    text: 'Rider and driver apps, the web APIs and the ops admin panel for the country’s most-used ride-hailing app.',
    tags: ['Mobile', 'REST APIs', 'Admin'],
    link: { href: 'https://play.google.com/store/apps/details?id=app.avas.rider', label: '50K+ on Google Play' } },
  { name: 'Hologo', pill: 'PRODUCT', sub: 'Education AI platform', meta: 'Web app rebuild · 2024—now', via: 'OXIQA',
    text: 'Rebuilt their web app in Next.js and reworked parts of the Laravel API behind it. The product uses Unity for its 3D models and LiveKit for its chatbot, and I worked with both from the web side.',
    tags: ['Next.js', 'Laravel', 'LiveKit', 'Unity'] },
  { name: 'RepSet', pill: 'PRODUCT', sub: 'Personal-trainer client management', meta: 'Sole engineer · 2026',
    text: 'Block-periodization programming, scheduling and progress tracking. Postgres, JWT auth, Docker, CI/CD.',
    tags: ['TypeScript', 'React', 'PostgreSQL'] },
];
