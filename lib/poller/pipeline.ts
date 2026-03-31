import { clients } from "@/lib/clients";
import { redis } from "@/lib/redis";
import { createNowPlayingPipeline } from "./now-playing";

export const nowPlayingPipeline = createNowPlayingPipeline(
  {
    eversolo: clients.eversolo,
    lastfm: clients.lastfm,
    musicBrainz: clients.musicBrainzEnrichment,
    fanartTV: clients.fanartTV,
    coverArt: clients.coverArt,
  },
  redis
);
