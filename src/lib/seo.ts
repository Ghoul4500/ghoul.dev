import { experience } from './experience.ts';
import { projects, openSource } from './projects.ts';
import { clients } from './clients.ts';

export const SITE = {
  url: 'https://ghoul.dev',
  name: 'ghoul.dev',
  locale: 'en_US',
  twitter: '@Ghoul4500',
} as const;

export const PERSON = {
  fullName: 'Ahmed Yaseen Ibrahim',
  givenName: 'Ahmed',
  middleName: 'Yaseen',
  familyName: 'Ibrahim',
  // Every name and username someone might Google. Used as alternateName in JSON-LD
  // and woven into the description string for search snippets.
  aliases: [
    'Ahmed Yaseen',
    'Yaseen Ibrahim',
    'Yaseen',
    'Ahmed',
    'Ghoul',
    'Ghoul4500',
  ],
  email: 'yaseen@ghoul.dev',
  jobTitle: 'Full-stack Engineer',
  description:
    "Full-stack engineer from the Maldives. Engineer at OXIQA, founder of Zenryk, collaborator with Synetecs and iqdot. Upstream contributor to the asus-linux project and the Open Gaming Collective (OGC). Works in TypeScript, Rust, Python, PHP, Go.",
  address: {
    country: 'Maldives',
    countryCode: 'MV',
  },
  sameAs: [
    'https://github.com/Ghoul4500',
    'https://gitlab.com/Ghoul4500',
    'https://pypi.org/user/Ghoul4500/',
    'https://zenryk.com',
  ],
  knowsAbout: [
    'TypeScript', 'Rust', 'Python', 'PHP', 'Go',
    'Linux', 'systemd', 'D-Bus',
    'Svelte', 'Astro', 'React', 'React Native', 'Vue', 'Next.js',
    'Node.js', 'Hono', 'Django', 'Laravel', 'Actix',
    'PostgreSQL', 'Redis', 'MySQL',
    'Docker', 'Nginx', 'Ansible',
    'WordPress', 'Divi',
    'AI', 'NLP', 'Machine Learning',
    'Open source', 'asus-linux', 'Open Gaming Collective',
  ],
} as const;

// Default page-level metadata. Title is intentionally keyword-rich but readable.
export const DEFAULT_TITLE = `${PERSON.fullName} (Ghoul) — Full-stack Engineer · ${SITE.name}`;
export const DEFAULT_DESCRIPTION =
  `${PERSON.fullName} (Ghoul) — full-stack engineer in the Maldives. ` +
  `Engineer at OXIQA, founder of Zenryk. Contributor to asus-linux and Open Gaming Collective.`;

// Comma-separated keyword string. Engines that still use this tag will pick up names,
// usernames, orgs, projects and clients automatically from the source-of-truth lib files.
export function buildKeywords(): string {
  const orgs = new Set<string>();
  for (const r of experience) orgs.add(r.company);
  for (const c of clients) {
    orgs.add(c.short);
    // c.through can be a single org or a "Synetecs × OXIQA" chain. Split it.
    if (c.through) for (const t of c.through.split('×')) orgs.add(t.trim());
  }
  for (const o of openSource) orgs.add(o.org);

  const seen = new Set<string>();
  const out: string[] = [];
  const push = (s: string) => {
    const key = s.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  };

  push(PERSON.fullName);
  for (const a of PERSON.aliases) push(a);
  push('Maldives developer');
  push('Maldives software engineer');
  push('full-stack engineer Maldives');
  for (const o of orgs) push(o);
  push('OGC');
  for (const p of projects) push(p.name);
  push('Dhiraasa');

  return out.join(', ');
}

// Builds the JSON-LD graph. Pulls from the same lib files the page renders from,
// so any project / client / role we add later flows into structured data for free.
export function buildJsonLd(canonicalUrl: string): object {
  const personId = `${SITE.url}/#person`;
  const siteId = `${SITE.url}/#website`;
  const pageId = `${canonicalUrl}#webpage`;

  const orgs = new Map<string, { name: string; url?: string }>();
  for (const r of experience) {
    if (!orgs.has(r.company)) orgs.set(r.company, { name: r.company, url: r.url });
  }
  for (const o of openSource) {
    if (!orgs.has(o.org)) orgs.set(o.org, { name: o.org, url: o.url });
  }

  const worksFor = Array.from(orgs.values()).map((o) => ({
    '@type': 'Organization',
    name: o.name,
    ...(o.url ? { url: o.url } : {}),
  }));

  const creativeWorks = projects.map((p) => ({
    '@type': 'SoftwareSourceCode',
    name: p.name,
    description: p.description,
    codeRepository: p.url,
    ...(p.live ? { url: p.live } : {}),
    programmingLanguage: p.stack,
    author: { '@id': personId },
    dateCreated: p.year,
  }));

  const clientProjects = clients.map((c) => ({
    '@type': 'CreativeWork',
    name: c.name,
    description: c.summary,
    ...(c.url ? { url: c.url } : {}),
    creator: { '@id': personId },
    keywords: c.stack.join(', '),
    dateCreated: c.period,
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': siteId,
        url: SITE.url,
        name: SITE.name,
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': personId },
        inLanguage: 'en',
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: PERSON.fullName,
        givenName: PERSON.givenName,
        additionalName: PERSON.middleName,
        familyName: PERSON.familyName,
        alternateName: PERSON.aliases as unknown as string[],
        url: SITE.url,
        image: `${SITE.url}/og.png`,
        email: `mailto:${PERSON.email}`,
        jobTitle: PERSON.jobTitle,
        description: PERSON.description,
        nationality: { '@type': 'Country', name: PERSON.address.country },
        homeLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressCountry: PERSON.address.countryCode,
          },
        },
        worksFor,
        knowsAbout: PERSON.knowsAbout as unknown as string[],
        sameAs: PERSON.sameAs as unknown as string[],
      },
      {
        '@type': 'ProfilePage',
        '@id': pageId,
        url: canonicalUrl,
        name: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { '@id': siteId },
        about: { '@id': personId },
        mainEntity: { '@id': personId },
        inLanguage: 'en',
      },
      ...creativeWorks,
      ...clientProjects,
    ],
  };
}
