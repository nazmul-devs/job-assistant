import { NextRequest, NextResponse } from "next/server";
import { runJobIngestion } from "@/services/ingestion";


export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting scheduled automatic job ingestion...");
    const result = await runJobIngestion();
    console.log(`[CRON] Ingestion complete. Fetched: ${result.totalFetched}, Saved: ${result.totalSaved}`);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cron execution failed";
    console.error("[CRON] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
