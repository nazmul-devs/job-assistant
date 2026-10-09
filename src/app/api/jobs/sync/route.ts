import { NextRequest, NextResponse } from "next/server";
import { runJobIngestion } from "@/services/ingestion";
import { JobSource } from "@/types/job";

export async function POST(req: NextRequest) {
  try {
    let sources: JobSource[] | undefined = undefined;
    try {
      const body = await req.json();
      if (Array.isArray(body?.sources) && body.sources.length > 0) {
        sources = body.sources;
      }
    } catch {
      // Empty or non-json body is fine, triggers all sources
    }

    const result = await runJobIngestion({ sources });
    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully synced ${result.totalFetched} jobs (${result.totalSaved} new saved) across ${result.sources.length} sources.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[POST /api/jobs/sync] Error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
