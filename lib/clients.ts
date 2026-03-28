import { LastFMClient } from "@/lib/lastfm/client";
import { MusicBrainzClient } from "@/lib/musicbrainz/client";
import { FanartTVClient } from "@/lib/fanart/client";
import { CoverArtArchiveClient } from "@/lib/coverart/client";
import { EversoloClient } from "@/lib/eversolo/client";
import { LRCLIBClient } from "@/lib/lrclib/client";

export interface ApiClients {
  lastfm: LastFMClient;
  /**
   * General-purpose MusicBrainz client. Used by artist pages, artist-image
   * lookups, and the new-releases job.
   */
  musicBrainz: MusicBrainzClient;
  /**
   * Dedicated MusicBrainz client for the now-playing poller ONLY.
   * MusicBrainzClient serialises all requests through a 1 req/s queue.
   * Without a separate instance, heavy artist-page lookups (up to 12
   * getReleaseGroupYear calls) would block enrichment for 10+ seconds,
   * causing the background image on Now Playing to disappear mid-session.
   */
  musicBrainzEnrichment: MusicBrainzClient;
  fanartTV: FanartTVClient;
  coverArt: CoverArtArchiveClient;
  eversolo: EversoloClient;
  lrclib: LRCLIBClient;
}

export const clients: ApiClients = {
  lastfm: new LastFMClient(process.env.LASTFM_API_KEY ?? ""),
  musicBrainz: new MusicBrainzClient(1000), // MusicBrainz ToS: 1 req/s
  musicBrainzEnrichment: new MusicBrainzClient(1000),
  fanartTV: new FanartTVClient(process.env.FANART_TV_API_KEY ?? ""),
  coverArt: new CoverArtArchiveClient(),
  eversolo: new EversoloClient(process.env.EVERSOLO_HOST ?? "192.168.1.138"),
  lrclib: new LRCLIBClient(),
};
