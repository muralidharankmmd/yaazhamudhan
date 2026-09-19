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
    }),
});

export const collections = { moments };
