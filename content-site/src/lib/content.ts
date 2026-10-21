import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;
export type Briefing = CollectionEntry<'briefings'>;

const byDateDesc = <T extends { data: { date: Date } }>(a: T, b: T) =>
  b.data.date.getTime() - a.data.date.getTime();

export async function publishedPosts(): Promise<Post[]> {
  return (await getCollection('blog', (e) => !e.data.draft)).sort(byDateDesc);
}

export async function allBriefings(): Promise<Briefing[]> {
  return (await getCollection('briefings')).sort(byDateDesc);
}

const norm = (xs: string[]) => xs.map((x) => x.trim().toLowerCase());
const shares = (a: string[], b: string[]) => {
  const set = new Set(norm(a));
  return norm(b).some((x) => set.has(x));
};

export function relatedPostsFor(briefing: Briefing, posts: Post[], limit = 3): Post[] {
  const explicit = new Set(briefing.data.relatedPosts);
  return posts
    .filter((p) => explicit.has(p.slug) || shares(briefing.data.topics, p.data.topics))
    .slice(0, limit);
}

export function relatedBriefingsFor(post: Post, briefings: Briefing[], limit = 3): Briefing[] {
  const explicit = new Set(post.data.relatedBriefings);
  return briefings
    .filter((b) => explicit.has(b.slug) || shares(post.data.topics, b.data.topics))
    .slice(0, limit);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
}

export const deltaGlyph = { accelerating: '▲', decelerating: '▼', stable: '●' } as const;
