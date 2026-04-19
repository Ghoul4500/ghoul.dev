export type Role = {
  company: string;
  group?: string;
  url?: string;
  role: string;
  period: string;
  description: string;
  current?: boolean;
  prior?: boolean;
};

export const experience: Role[] = [
  {
    company: 'OXIQA',
    url: 'https://oxiqa.com',
    role: 'Full-stack Engineer',
    period: 'Feb 2025 — Present',
    current: true,
    description:
      'Main job. I build web platforms and internal tools for clients — government ministries, product companies, a couple of mixed setups. Often as the lead dev on a project. Databases, APIs, frontend, and the Linux servers things run on. I also make the deploy and infra calls on the bigger engagements.',
  },
  {
    company: 'Zenryk',
    url: 'https://zenryk.com',
    role: 'Founder',
    period: '2025 — Present',
    current: true,
    description:
      'My own thing. Where I take work directly — anything from a one-off consulting gig to a full end-to-end build. Contact: info@zenryk.com.',
  },
  {
    company: 'Synetecs',
    url: 'https://synetecs.io',
    role: 'Collaborator · AI',
    period: '2025 — Present',
    current: true,
    description:
      'Long-running collab on the AI side. thaana.ai, legalnotes, the UNDP Dhivehi TTS dashboard — all built with the Synetecs team, usually brokered through OXIQA.',
  },
  {
    company: 'iqdot',
    url: 'https://iqdot.io',
    role: 'Collaborator · Cybersecurity',
    period: '2025 — Present',
    current: true,
    description:
      'Endpoint security work. SentinelOne rollouts and EDR integration across client fleets.',
  },
  {
    company: 'asus-linux',
    url: 'https://asus-linux.org',
    role: 'Open-source contributor',
    period: '2026',
    current: true,
    description:
      'Rust patches to asusctl — the daemon that makes ASUS ROG laptops behave on Linux. Added Scar 18 2025 support, reworked the AniMe Matrix image & GIF pipeline, fixed race conditions in PPT power tuning.',
  },
  {
    company: 'Open Gaming Collective',
    url: 'https://opengamingcollective.org',
    role: 'Contributor',
    period: '2026',
    current: true,
    description:
      'Helping out at OGC — open standards and tooling around Linux gaming. Mostly web stuff so far but there\'s some kernel-level work in progress too.',
  },
  {
    company: 'AvasRide',
    role: 'Full-stack Developer',
    period: 'Nov 2023 — Feb 2025',
    prior: true,
    description:
      'Built the Avas App (riders), the Driver App, the web APIs behind them, and the admin panel the ops team used every day. Also pitched in on hardware and OS work when the servers needed hands.',
  },
  {
    company: 'Ooredoo Maldives',
    url: 'https://www.ooredoo.mv',
    role: 'Officer Provisioning (prev. Fiber Technician)',
    period: 'Dec 2021 — Nov 2023',
    prior: true,
    description:
      'Started in the field pulling fiber and managing six infra partners across different regions. Got moved into the provisioning office — device configs for mobile and fiber from the backend, training staff, running UAT for new services. Employee of the month twice (June and September 2022).',
  },
];
