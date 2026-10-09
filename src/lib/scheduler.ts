import { runJobIngestion } from "@/services/ingestion";

let isSchedulerRunning = false;
let schedulerTimer: NodeJS.Timeout | null = null;

export function initializeScheduler() {
  if (isSchedulerRunning) return;

  const autoSyncEnabled = process.env.AUTO_SYNC_ENABLED !== "false";
  if (!autoSyncEnabled) {
    console.log("[Scheduler] Automatic job sync is disabled by configuration.");
    return;
  }

  const intervalMinutes = parseInt(process.env.JOB_SYNC_INTERVAL_MINUTES || "60", 10);
  const intervalMs = Math.max(5, intervalMinutes) * 60 * 1000;

  console.log(`[Scheduler] Initializing automated job sync every ${intervalMinutes} minutes.`);
  isSchedulerRunning = true;

  // Run initial delay check after 30 seconds
  setTimeout(async () => {
    try {
      console.log("[Scheduler] Running initial job sync check...");
      await runJobIngestion();
    } catch (e) {
      console.error("[Scheduler] Initial sync error:", e);
    }
  }, 30000);

  schedulerTimer = setInterval(async () => {
    try {
      console.log("[Scheduler] Triggering periodic job sync...");
      await runJobIngestion();
    } catch (e) {
      console.error("[Scheduler] Periodic sync error:", e);
    }
  }, intervalMs);

  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }
}
