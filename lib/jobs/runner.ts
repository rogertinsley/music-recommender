/**
 * Starts a recurring background job. Runs immediately, then on the given
 * interval. Errors are caught and logged — the job always reschedules.
 */
export function startJob(
  name: string,
  intervalMs: number,
  run: () => Promise<void>
): void {
  const safeRun = async () => {
    try {
      await run();
    } catch (err) {
      console.error(`[${name}] failed:`, err);
    }
  };

  void safeRun();
  setInterval(safeRun, intervalMs);
}
