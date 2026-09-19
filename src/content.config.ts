import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const moments = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/moments' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      type: z.enum(['achievement', 'photo', 'milestone']).default('photo'),
      description: z.string().optional(),
      cover: image().optional(),
      gallery: z.array(image()).default([]),
      // Video files are self-hosted as static assets under public/videos/,
      // so they're referenced by URL rather than imported like images.
      videos: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      // A "story" moment gets a hero slideshow on the homepage and opens
      // into a full-page, one-at-a-time viewer (gallery images, then
      // videos, in the order listed) instead of the standard grid layout.
      story: z.boolean().default(false),
      // YouTube/Vimeo links to embed as responsive players (for footage
      // that lives externally rather than as a self-hosted file).
      embeds: z.array(z.string().url()).default([]),
      // External citations/links worth surfacing as a card, e.g. an
      // official record listing. { label, url }.
      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),
    }),
});

export const collections = { moments };
