import type { MusicBrainzClient } from "@/lib/musicbrainz/client";
import type { FanartTVClient, ArtistImages } from "@/lib/fanart/client";

type Clients = {
  musicBrainz: Pick<MusicBrainzClient, "searchArtist">;
  fanartTV: Pick<FanartTVClient, "getArtistImages">;
};

/**
 * Resolves artist images for a given artist name.
 * Returns null if the artist is not found in MusicBrainz.
 * Throws if MusicBrainz itself errors (so the caller can choose not to cache).
 */
export async function getArtistImages(
  name: string,
  { musicBrainz, fanartTV }: Clients
): Promise<ArtistImages | null> {
  const mbid = await musicBrainz.searchArtist(name);
  if (!mbid) return null;
  return fanartTV.getArtistImages(mbid).catch(() => null);
}
