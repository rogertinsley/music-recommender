import Parser from "rss-parser";
import { FEEDS } from "./feeds";

const parser = new Parser();

export interface RawNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
}

export interface NewsItem extends RawNewsItem {
  matchedArtist: string;
}

export async function fetchAllFeeds(): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.map(
        (item): RawNewsItem => ({
          title: item.title ?? "",
          url: item.link ?? "",
          source: feed.name,
          publishedAt: item.isoDate ?? null,
          summary: item.contentSnippet?.slice(0, 200) ?? null,
        })
      );
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<RawNewsItem[]> =>
        r.status === "fulfilled"
    )
    .flatMap((r) => r.value);
}

export function filterNewsByArtists(
  items: RawNewsItem[],
  artistNames: string[]
): NewsItem[] {
  const matched: NewsItem[] = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary ?? ""}`.toLowerCase();
    for (const artist of artistNames) {
      if (artist.length > 2 && text.includes(artist.toLowerCase())) {
        matched.push({ ...item, matchedArtist: artist });
        break;
      }
    }
  }

  return matched
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    })
    .slice(0, 10);
}
