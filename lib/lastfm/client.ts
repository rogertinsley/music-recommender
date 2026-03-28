export type {
  NowPlayingTrack,
  TopArtist,
  TopTag,
  SimilarArtist,
  ArtistInfo,
  AlbumInfo,
  Period,
} from "./types";
import type {
  NowPlayingTrack,
  TopArtist,
  TopTag,
  SimilarArtist,
  ArtistInfo,
  AlbumInfo,
  Period,
} from "./types";

const BASE_URL = "https://ws.audioscrobbler.com/2.0";

export class LastFMClient {
  constructor(private readonly apiKey: string) {}

  private async fetch<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(BASE_URL);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("format", "json");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Last.FM API error: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getAlbumInfo(artist: string, album: string): Promise<AlbumInfo | null> {
    const data = await this.fetch<{
      error?: number;
      album?: { name: string; artist: string; mbid: string };
    }>({ method: "album.getInfo", artist, album });

    if (data.error || !data.album) return null;

    const a = data.album;
    return {
      name: a.name,
      artist: a.artist,
      mbid: a.mbid || null,
    };
  }

  async getArtistInfo(artistName: string): Promise<ArtistInfo | null> {
    const data = await this.fetch<{
      error?: number;
      artist?: {
        name: string;
        mbid: string;
        stats: { listeners: string };
        bio: { summary: string };
        tags: { tag: Array<{ name: string }> };
      };
    }>({ method: "artist.getInfo", artist: artistName });

    if (data.error || !data.artist) return null;

    const a = data.artist;
    return {
      name: a.name,
      mbid: a.mbid || null,
      bio: a.bio.summary || null,
      tags: a.tags.tag.map((t) => t.name),
      listeners: parseInt(a.stats.listeners, 10),
    };
  }

  async getSimilarArtists(artistName: string): Promise<SimilarArtist[]> {
    const data = await this.fetch<{
      similarartists: { artist: Array<{ name: string; match: string }> };
    }>({ method: "artist.getSimilar", artist: artistName });

    return data.similarartists.artist.map((a) => ({
      name: a.name,
      match: parseFloat(a.match),
    }));
  }

  async getTopTags(username: string): Promise<TopTag[]> {
    const data = await this.fetch<{
      toptags: { tag: Array<{ name: string; count: string }> };
    }>({ method: "user.getTopTags", user: username });

    return data.toptags.tag.map((t) => ({
      name: t.name,
      count: parseInt(t.count, 10),
    }));
  }

  async getTopArtists(username: string, period: Period): Promise<TopArtist[]> {
    const data = await this.fetch<{
      topartists: {
        artist: Array<{
          name: string;
          playcount: string;
          "@attr": { rank: string };
        }>;
      };
    }>({ method: "user.getTopArtists", user: username, period });

    return data.topartists.artist.map((a) => ({
      name: a.name,
      playCount: parseInt(a.playcount, 10),
      rank: parseInt(a["@attr"].rank, 10),
    }));
  }

  async getNowPlaying(username: string): Promise<NowPlayingTrack | null> {
    const data = await this.fetch<{
      recenttracks: {
        track: Array<{
          "@attr"?: { nowplaying?: string };
          name: string;
          artist: { "#text": string };
          album: { "#text": string; mbid: string };
        }>;
      };
    }>({ method: "user.getRecentTracks", user: username, limit: "1" });

    const track = data.recenttracks.track[0];
    if (!track?.["@attr"]?.nowplaying) return null;

    return {
      trackName: track.name,
      artistName: track.artist["#text"],
      albumName: track.album["#text"] || null,
      albumMbid: track.album.mbid || null,
    };
  }
}
