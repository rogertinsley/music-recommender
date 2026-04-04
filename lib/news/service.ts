import Parser from "rss-parser";
import { FEEDS } from "./feeds";

const NEWS_CACHE_KEY = "news:raw";
const NEWS_CACHE_TTL = 60 * 60; // 1 hour

// Show up to this many articles total; artist-matched first, then general.
const MAX_ITEMS = 20;
// Always show at least this many general articles even when matches are plentiful.
const MIN_GENERAL = 5;

type NewsRedis = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

const parser = new Parser();

export interface RawNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
}

export interface NewsItem extends RawNewsItem {
  /** Artist name this article was matched to, or null for general music news. */
  matchedArtist: string | null;
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
          // Broader snippet — 400 chars gives the filter more text to match against
          summary: item.contentSnippet?.slice(0, 400) ?? null,
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

function byDateDesc(a: RawNewsItem, b: RawNewsItem): number {
  if (!a.publishedAt) return 1;
  if (!b.publishedAt) return -1;
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

/** Normalise an artist name for matching: lowercase, strip leading "The ". */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .trim();
}

export function filterNewsByArtists(
  items: RawNewsItem[],
  artistNames: string[]
): NewsItem[] {
  // Pre-build search terms: original name + normalised variant (deduped)
  const searchTerms = [
    ...new Set(
      artistNames
        .filter((a) => a.length > 2)
        .flatMap((a) => [a.toLowerCase(), normalise(a)])
        .filter((t) => t.length > 2)
    ),
  ];

  // Map artist search term → original display name
  const termToArtist = new Map<string, string>();
  for (const a of artistNames) {
    if (a.length > 2) {
      termToArtist.set(a.toLowerCase(), a);
      const norm = normalise(a);
      if (norm.length > 2) termToArtist.set(norm, a);
    }
  }

  const matched: NewsItem[] = [];
  const unmatched: RawNewsItem[] = [];
  const usedUrls = new Set<string>();

  for (const item of items) {
    if (!item.url || usedUrls.has(item.url)) continue;
    const text = `${item.title} ${item.summary ?? ""}`.toLowerCase();

    let foundArtist: string | null = null;
    for (const term of searchTerms) {
      if (text.includes(term)) {
        foundArtist = termToArtist.get(term) ?? term;
        break;
      }
    }

    if (foundArtist) {
      matched.push({ ...item, matchedArtist: foundArtist });
      usedUrls.add(item.url);
    } else {
      unmatched.push(item);
    }
  }

  matched.sort(byDateDesc);
  unmatched.sort(byDateDesc);

  // How many general articles to append:
  // Always at least MIN_GENERAL, and fill up to MAX_ITEMS total.
  const generalSlots = Math.max(MIN_GENERAL, MAX_ITEMS - matched.length);
  const general: NewsItem[] = unmatched
    .slice(0, generalSlots)
    .map((item) => ({ ...item, matchedArtist: null }));

  return [...matched, ...general].slice(0, MAX_ITEMS);
}

/**
 * Fetch and cache raw feeds in Redis, then filter by artist names.
 */
export async function getPersonalisedNews(
  artistNames: string[],
  redis: NewsRedis
): Promise<NewsItem[]> {
  let rawItems: RawNewsItem[] | null = await redis
    .get(NEWS_CACHE_KEY)
    .then((r) => (r ? (JSON.parse(r) as RawNewsItem[]) : null));

  if (!rawItems) {
    rawItems = await fetchAllFeeds().catch(() => []);
    if (rawItems.length > 0) {
      await redis.setex(
        NEWS_CACHE_KEY,
        NEWS_CACHE_TTL,
        JSON.stringify(rawItems)
      );
    }
  }

  return filterNewsByArtists(rawItems, artistNames);
}
