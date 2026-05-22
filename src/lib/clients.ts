export type Client = {
  name: string;
  short: string;
  kind: 'government' | 'product' | 'ai' | 'mobile' | 'aviation' | 'security';
  role: string;
  through: string;
  period: string;
  summary: string;
  stack: string[];
  notable?: string[];
  url?: string;
  accent?: 'acid' | 'ember' | 'violet' | 'cyan';
};

export const clients: Client[] = [
  {
    name: 'Ministry of Higher Education — Kuri Portal',
    short: 'MoHE · Kuri Portal',
    kind: 'government',
    role: 'Lead developer',
    through: 'OXIQA',
    period: '2025 — Present',
    summary:
      'The web platform the Ministry of Higher Education uses. Students, admin staff, and the ministry itself all talk to the same backend. Split into a core services layer, a student API, an admin API, and two separate frontends. Go for the cloud infra, Ansible for deploys.',
    stack: ['TypeScript', 'PHP', 'Go', 'Ansible', 'Linux'],
    notable: [
      'Student portal + admin portal + core services split',
      'Go-based cloud infra (Cloud-MV)',
      'Ansible deploys across environments',
    ],
    url: 'https://github.com/MoHE-HEMS',
    accent: 'acid',
  },
  {
    name: 'MOTCA — Transport & Civil Aviation',
    short: 'MOTCA',
    kind: 'government',
    role: 'Full-stack engineer',
    through: 'OXIQA',
    period: '2024 — Present',
    summary:
      'A bunch of internal systems for the Ministry of Transport & Civil Aviation — vehicle registration, permit verification, domain management, ticketing APIs, plus the admin tools the staff use every day.',
    stack: ['Laravel/PHP', 'Vue', 'TypeScript', 'Rust', 'Docker'],
    notable: [
      'Rust backends (vAPI, ticket API)',
      'TRID / MATRIS / CRS internal management systems',
      'Permit verification + the public website admin',
    ],
    url: 'https://github.com/motcadev',
    accent: 'ember',
  },
  {
    name: 'Ministry of Dhivehi Language — Dhiraasa',
    short: 'MoDLCH · Dhiraasa',
    kind: 'government',
    role: 'Integration engineer',
    through: 'OXIQA',
    period: '2025',
    summary:
      'WordPress multisite for the Ministry of Dhivehi Language, Culture & Heritage. Shared infra across the ministry\'s subsites, a stack of plugins, plus a custom plugin I wrote (divi-network-fonts) to push fonts across the whole network. Most of the build was config and plugin wiring, not code — not my usual stack but it was the right answer for what they needed.',
    stack: ['WordPress', 'PHP', 'Divi', 'MySQL', 'Nginx'],
    notable: [
      'Multisite network with shared custom-font plugin',
      'Content split across ministry subsites',
    ],
    accent: 'acid',
  },
  {
    name: 'UNDP — Dhivehi TTS dashboard',
    short: 'UNDP · TTS',
    kind: 'ai',
    role: 'Collaborator',
    through: 'Synetecs',
    period: '2025',
    summary:
      'Admin dashboard for the UNDP\'s Dhivehi text-to-speech project. Voice samples get recorded in Mimic, trained into a TTS voice, then managed from the dashboard UN staff log into.',
    stack: ['TypeScript', 'Next.js', 'TTS', 'Docker'],
    notable: [
      'TTS training pipeline',
      'Management dashboard for UN staff',
    ],
    accent: 'cyan',
  },
  {
    name: 'thaana.ai',
    short: 'thaana.ai',
    kind: 'ai',
    role: 'Collaborator',
    through: 'Synetecs × OXIQA',
    period: '2025 — Present',
    summary:
      'AI work on Thaana — the Dhivehi script. Real language models for a language that usually gets left out. Built with the Synetecs team.',
    stack: ['AI', 'NLP', 'Python'],
    url: 'https://thaana.ai',
    accent: 'cyan',
  },
  {
    name: 'legalnotes',
    short: 'legalnotes',
    kind: 'ai',
    role: 'Collaborator',
    through: 'Synetecs × OXIQA',
    period: '2025 — Present',
    summary:
      'AI tooling for legal work. Joint build with Synetecs.',
    stack: ['AI', 'NLP'],
    accent: 'cyan',
  },
  {
    name: 'Hologo — education AI platform',
    short: 'Hologo',
    kind: 'product',
    role: 'Full-stack engineer',
    through: 'OXIQA',
    period: '2024 — Present',
    summary:
      'Education AI product. Web, admin dashboard, native Android apps, plus a smart-screen variant for classrooms. WebSocket backend for the AI side, one unified API behind both web and mobile.',
    stack: ['TypeScript', 'PHP', 'Java', 'C#/Xamarin', 'WebSocket'],
    notable: [
      'One unified API behind web + mobile',
      'AI backend on WebSocket transport',
      'Smart-screen Android build with school auth and free-trial tier',
    ],
    url: 'https://github.com/Hologo-World',
    accent: 'violet',
  },
  {
    name: 'Avas App & Avas Driver App',
    short: 'AvasRide',
    kind: 'mobile',
    role: 'Full-stack developer',
    through: 'AvasRide',
    period: 'Nov 2023 — Feb 2025',
    summary:
      'Rider app, driver app, the web APIs behind them, and the admin panel the ops team ran the business from. Worked closely with management and ops on what they needed day to day.',
    stack: ['Mobile', 'REST APIs', 'Admin dashboards'],
    notable: ['Core web APIs', 'Admin panel for the ops team', 'Some hardware / OS work on the infra'],
    accent: 'ember',
  },
  {
    name: 'SentinelOne deployments',
    short: 'iqdot · EDR',
    kind: 'security',
    role: 'Collaborator',
    through: 'iqdot',
    period: '2025 — Present',
    summary:
      'Endpoint security work with iqdot. SentinelOne rollouts and EDR integration across client fleets.',
    stack: ['SentinelOne', 'EDR', 'Security'],
    accent: 'ember',
  },
];

export type Education = {
  school: string;
  /** Secondary school line (e.g. "UWE Bristol · Villa College") for joint programs. */
  partnerSchool?: string;
  qualification: string;
  period: string;
  /** Awards / credentials earned through this entry. Rendered as sub-bullets. */
  awards?: string[];
};

export const education: Education[] = [
  {
    school: 'UWE Bristol',
    partnerSchool: 'Villa College',
    qualification: 'BSc (Hons) Computer Science',
    period: 'Sep 2022 — Aug 2025',
    awards: [
      'College Medal',
      'First Class Honours',
      "Dean's List Diploma",
      'Diploma in Computer Science',
    ],
  },
  {
    school: 'Villa College',
    qualification: 'Foundation in Engineering (C4)',
    period: 'Jan 2021 — Dec 2021',
  },
  {
    school: 'M.Atoll School',
    qualification: 'GCE / IGCSE / SSC O Levels',
    period: '2019',
    awards: ['National Top 7'],
  },
];

/** Non-academic / extracurricular wins. Rendered as a small trailing row. */
export type OtherAward = { title: string; where: string; year: string };
export const otherAwards: OtherAward[] = [
  { title: '2nd Place · CyberExpo CTF', where: 'CyberExpo', year: '2024' },
];
