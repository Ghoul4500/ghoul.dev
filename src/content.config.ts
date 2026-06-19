import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.string().optional(),
    /** Social card image (site-relative). Defaults to the bank-notice card. */
    image: z.string().default('/og-bank.png'),
    /** When true, emit FAQPage JSON-LD from the post's "## Question" headings. */
    faq: z.boolean().default(false),
    /** Short label shown on cards (defaults to title). */
    cardTitle: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
