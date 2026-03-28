export interface ArtistWithTags {
  name: string;
  playCount: number;
  tags: string[];
}

export interface SimilarArtist {
  name: string;
  match: number;
}

export interface Recommendation {
  artistName: string;
  score: number;
  sourceArtist: string;
  matchingTags: string[];
}

export interface RecommendInput {
  topArtists: ArtistWithTags[];
  similarArtistsMap: Record<string, SimilarArtist[]>;
  userTopTags: string[];
  excludeThreshold?: number;
}

const TAG_BONUS_PER_MATCH = 0.1;
const MAX_TAG_BONUS = 0.3;

export function recommend({
  topArtists,
  similarArtistsMap,
  userTopTags,
  excludeThreshold = 1,
}: RecommendInput): Recommendation[] {
  if (topArtists.length === 0) return [];

  const maxPlayCount = Math.max(...topArtists.map((a) => a.playCount));
  const knownArtists = new Set(
    topArtists
      .filter((a) => a.playCount >= excludeThreshold)
      .map((a) => a.name.toLowerCase())
  );

  const candidates = new Map<string, Recommendation>();

  for (const artist of topArtists) {
    const similar = similarArtistsMap[artist.name] ?? [];
    const playCountWeight = artist.playCount / maxPlayCount;
    const matchingTags = artist.tags.filter((t) =>
      userTopTags.map((u) => u.toLowerCase()).includes(t.toLowerCase())
    );
    const tagBonus = Math.min(
      matchingTags.length * TAG_BONUS_PER_MATCH,
      MAX_TAG_BONUS
    );

    for (const candidate of similar) {
      if (knownArtists.has(candidate.name.toLowerCase())) continue;

      const score = candidate.match * playCountWeight + tagBonus;
      const existing = candidates.get(candidate.name.toLowerCase());

      if (!existing || score > existing.score) {
        candidates.set(candidate.name.toLowerCase(), {
          artistName: candidate.name,
          score,
          sourceArtist: artist.name,
          matchingTags,
        });
      }
    }
  }

  return Array.from(candidates.values()).sort((a, b) => b.score - a.score);
}
