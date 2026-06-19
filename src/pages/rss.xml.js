import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/seo';

// Feed of published (non-draft) writing. Drafts are excluded so unfinished
// posts never leak into subscribers' readers.
export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  return rss({
    title: 'ghoul.dev — Writing',
    description:
      'Writing by Ahmed Yaseen (Ghoul) — notes on the Maldives, banking, Linux and building software.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.published,
      link: `/blog/${p.id}/`,
    })),
    customData: `<language>${SITE.locale.replace('_', '-')}</language>`,
  });
}
