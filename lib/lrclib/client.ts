const BASE_URL = "https://lrclib.net/api";

export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface Lyrics {
  synced: LyricLine[] | null;
  plain: string | null;
}

export class LRCLIBClient {
  async getLyrics(
    artist: string,
    title: string,
    album?: string,
    durationSecs?: number
  ): Promise<Lyrics | null> {
    const url = new URL(`${BASE_URL}/get`);
    url.searchParams.set("artist_name", artist);
    url.searchParams.set("track_name", title);
    if (album) url.searchParams.set("album_name", album);
    if (durationSecs !== undefined)
      url.searchParams.set("duration", String(durationSecs));

    const res = await fetch(url.toString(), {
      headers: {
        "Lrclib-Client": "Encore/0.1 (https://github.com/rogertinsley/encore)",
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`LRCLIB error: ${res.status}`);

    const data = (await res.json()) as {
      syncedLyrics: string | null;
      plainLyrics: string | null;
      instrumental: boolean;
    };

    if (data.instrumental) return null;

    return {
      synced: data.syncedLyrics ? parseLrc(data.syncedLyrics) : null,
      plain: data.plainLyrics || null,
    };
  }
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const line of lrc.split("\n")) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
    if (!match) continue;
    const [, mm, ss, cs, text] = match;
    const timeMs =
      parseInt(mm, 10) * 60_000 +
      parseInt(ss, 10) * 1_000 +
      (cs.length === 2 ? parseInt(cs, 10) * 10 : parseInt(cs, 10));
    lines.push({ timeMs, text });
  }
  return lines;
}
