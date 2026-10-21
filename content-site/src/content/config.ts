import { defineCollection, z } from 'astro:content';

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'only http(s) links are allowed');

const topics = z.array(z.string().min(1)).default([]);

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    topics,
    relatedBriefings: z.array(z.string()).default([]),
    originalUrl: httpUrl.optional(),
    originalLabel: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const briefings = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    sourcesEvaluated: z.number().int().positive().default(8),
    confidenceScore: z.number().min(0).max(1),
    summary: z.string().optional(),
    topics,
    relatedPosts: z.array(z.string()).default([]),
    themes: z
      .array(
        z.object({
          name: z.string(),
          delta7d: z.enum(['accelerating', 'stable', 'decelerating']),
          summary: z.string(),
          tags: z.array(z.string()),
          primarySources: z.array(z.object({ title: z.string(), url: httpUrl })).min(1),
        }),
      )
      .min(1),
  }),
});

export const collections = { blog, briefings };
