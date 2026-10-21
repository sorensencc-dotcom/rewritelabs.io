import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { publishedPosts } from '../../lib/content';

export async function GET(context: APIContext) {
  const posts = await publishedPosts();
  return rss({
    title: 'Rewrite Labs Blog',
    description: 'Market research and notes from Rewrite Labs.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: `/blog/${p.slug}/`,
    })),
  });
}
