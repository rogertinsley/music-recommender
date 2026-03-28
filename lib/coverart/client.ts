const BASE_URL = "https://coverartarchive.org/release";

export class CoverArtArchiveClient {
  async getAlbumArt(releaseMbid: string): Promise<string | null> {
    const response = await fetch(`${BASE_URL}/${releaseMbid}`);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      images: Array<{ front: boolean; image: string }>;
    };

    return data.images.find((img) => img.front)?.image ?? null;
  }
}
