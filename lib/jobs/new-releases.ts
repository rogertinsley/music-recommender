import { LastFMClient } from "@/lib/lastfm/client";
import { MusicBrainzClient } from "@/lib/musicbrainz/client";
import { CoverArtArchiveClient } from "@/lib/coverart/client";
import { NewReleasesService } from "@/lib/new-releases/service";
import { prisma } from "@/lib/prisma";

const JOB_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STALENESS_HOURS = 20;

function sinceDate(): Date {
  const days = parseInt(process.env.NEW_RELEASES_DAYS_WINDOW ?? "90", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

async function isStale(): Promise<boolean> {
  const latest = await prisma.newRelease.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return true;
  const ageMs = Date.now() - latest.createdAt.getTime();
  return ageMs > STALENESS_HOURS * 60 * 60 * 1000;
}

async function runNewReleasesJob(): Promise<void> {
  if (!(await isStale())) return;

  console.log("[NewReleasesJob] running…");

  const lastfm = new LastFMClient(process.env.LASTFM_API_KEY ?? "");
  const musicBrainz = new MusicBrainzClient();
  const coverArt = new CoverArtArchiveClient();
  const service = new NewReleasesService(lastfm, musicBrainz);

  const releases = await service.getNewReleases(
    process.env.LASTFM_USERNAME ?? "",
    sinceDate()
  );

  // Fetch cover art in parallel for all releases
  const coverArtUrls = await Promise.all(
    releases.map((r) =>
      r.mbid
        ? coverArt.getAlbumArtByReleaseGroup(r.mbid).catch(() => null)
        : Promise.resolve(null)
    )
  );

  await prisma.$transaction([
    prisma.newRelease.deleteMany(),
    prisma.newRelease.createMany({
      data: releases.map((r, i) => ({
        artistName: r.artistName,
        title: r.title,
        releaseDate: new Date(r.date),
        releaseType: r.type,
        mbid: r.mbid || undefined,
        coverArtUrl: coverArtUrls[i],
        playCount: r.playCount,
      })),
      skipDuplicates: true,
    }),
  ]);

  console.log(`[NewReleasesJob] saved ${releases.length} releases`);
}

export function startNewReleasesJob(): void {
  const run = async () => {
    try {
      await runNewReleasesJob();
    } catch (err) {
      console.error("[NewReleasesJob] failed:", err);
    }
  };

  void run();
  setInterval(run, JOB_INTERVAL_MS);
}
