export type PlayState = "playing" | "paused" | "idle";

export interface AudioFormat {
  extension: string;
  sampleRate: string;
  bits: string;
  channels: number;
}

export interface EversoloTrack {
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  positionMs: number;
  albumArtUrl: string | null;
  audioFormat: AudioFormat | null;
}

export interface EversoloState {
  track: EversoloTrack | null;
  playState: PlayState;
}

type ControlAction = "playOrPause" | "playNext" | "playLast";

export class EversoloClient {
  private baseUrl: string;

  constructor(host: string) {
    this.baseUrl = `http://${host}:9529`;
  }

  async getState(): Promise<EversoloState> {
    const res = await fetch(`${this.baseUrl}/ZidooMusicControl/v2/getState`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;

    const raw: number = data.state ?? 0;
    const playState: PlayState =
      raw === 3 ? "playing" : raw === 4 ? "paused" : "idle";

    let track: EversoloTrack | null = null;

    const pm = data.playingMusic;
    if (pm?.title) {
      track = {
        title: pm.title,
        artist: pm.artist ?? "",
        album: pm.album ?? "",
        durationMs: data.duration ?? 0,
        positionMs: data.position ?? 0,
        albumArtUrl: pm.albumArtBig ?? pm.albumArt ?? null,
        audioFormat:
          pm.extension || pm.sampleRate
            ? {
                extension: pm.extension ?? "",
                sampleRate: pm.sampleRate ?? "",
                bits: pm.bits ?? "",
                channels: pm.channels ?? 2,
              }
            : null,
      };
    }

    if (!track) {
      const ai = data.everSoloPlayInfo?.everSoloPlayAudioInfo;
      if (ai?.songName) {
        track = {
          title: ai.songName,
          artist: ai.artistName ?? "",
          album: ai.albumName ?? "",
          durationMs: data.duration ?? 0,
          positionMs: data.position ?? 0,
          albumArtUrl: ai.albumArt ?? null,
          audioFormat: null,
        };
      }
    }

    return { track, playState };
  }

  async control(action: ControlAction): Promise<void> {
    const res = await fetch(`${this.baseUrl}/ZidooMusicControl/v2/${action}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}
