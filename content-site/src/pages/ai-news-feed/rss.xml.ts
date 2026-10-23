import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { allBriefings } from '../../lib/content';

export async function GET(context: APIContext) {
  const briefings = await allBriefings();
  return rss({
    title: 'Rewrite Labs AI News Feed',
    description: 'Daily AI briefings synthesized across eight curated sources.',
    site: context.site!,
    items: briefings.map((b) => ({
      title: b.data.title,
      pubDate: b.data.date,
      description: b.data.summary ?? '',
      link: `/ai-news-feed/${b.id}/`,
    })),
  });
}
