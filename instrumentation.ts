export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNowPlayingPoller } = await import("@/lib/poller/now-playing");
    const { startRecommendationsJob } =
      await import("@/lib/jobs/recommendations");
    startNowPlayingPoller();
    startRecommendationsJob();
  }
}
