export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNowPlayingPoller } = await import("@/lib/poller/now-playing");
    const { startRecommendationsJob } =
      await import("@/lib/jobs/recommendations");
    const { startNewReleasesJob } = await import("@/lib/jobs/new-releases");
    startNowPlayingPoller();
    startRecommendationsJob();
    startNewReleasesJob();
  }
}
