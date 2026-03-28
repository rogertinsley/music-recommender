export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNowPlayingPoller } = await import("@/lib/poller/now-playing");
    startNowPlayingPoller();
  }
}
