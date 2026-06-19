export const SITE = {
  url: 'https://ghoul.dev',
  name: 'ghoul.dev',
  locale: 'en_US',
  twitter: '@Ghoul4500',
  author: 'Ahmed Yaseen Ibrahim',
  email: 'yaseen@ghoul.dev',
} as const;

export const DEFAULT_TITLE =
  'Ahmed Yaseen (Ghoul) — Linux Kernel Contributor in the Maldives · ghoul.dev';
export const DEFAULT_DESCRIPTION =
  'A Linux kernel contributor in the Maldives with a patch in the mainline tree. ' +
  'Lead engineer at OXIQA, founder of Zenryk, building government platforms in ' +
  'Rust, Go, C, TypeScript and PHP.';

// JSON-LD person graph for the homepage.
export function personJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}/#person`,
    name: 'Ahmed Yaseen Ibrahim',
    alternateName: ['Ahmed Yaseen', 'Yaseen', 'Ghoul', 'Ghoul4500'],
    url: SITE.url,
    email: `mailto:${SITE.email}`,
    jobTitle: ['Software Engineer', 'Linux Kernel Contributor'],
    image: `${SITE.url}/og-image.png`,
    description: DEFAULT_DESCRIPTION,
    nationality: { '@type': 'Country', name: 'Maldives' },
    homeLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'MV' } },
    worksFor: [
      { '@type': 'Organization', name: 'OXIQA', url: 'https://oxiqa.com' },
      { '@type': 'Organization', name: 'Zenryk', url: 'https://zenryk.com' },
      { '@type': 'Organization', name: 'Synetecs', url: 'https://synetecs.io' },
    ],
    knowsAbout: [
      'Linux kernel', 'Linux kernel development', 'C', 'TypeScript', 'Rust', 'Python', 'PHP', 'Go',
      'Linux', 'systemd', 'platform/x86', 'Svelte', 'React', 'Astro',
      'Laravel', 'Django', 'Actix', 'PostgreSQL', 'Docker', 'AI', 'NLP', 'Open source',
    ],
    sameAs: [
      'https://github.com/Ghoul4500',
      'https://gitlab.com/Ghoul4500',
      'https://pypi.org/user/Ghoul4500/',
    ],
  };
}
