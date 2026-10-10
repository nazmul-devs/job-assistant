import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const [
      totalJobs,
      statusCounts,
      sourceCounts,
      highMatchCount,
      recentSyncLogs,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.job.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.job.count({
        where: { matchScore: { gte: 70 } },
      }),
      prisma.syncLog.findMany({
        take: 7,
        orderBy: { startedAt: "desc" },
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          source: true,
          matchScore: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status] = item._count._all;
    }

    const interviewsCount =
      (statusMap["INTERVIEW"] || 0) +
      (statusMap["TECHNICAL_INTERVIEW"] || 0) +
      (statusMap["FINAL_INTERVIEW"] || 0);

    const stats = {
      totalJobs,
      newJobs: statusMap["NEW"] || 0,
      savedJobs: statusMap["SAVED"] || 0,
      appliedJobs: (statusMap["APPLIED"] || 0) + (statusMap["APPLY"] || 0),
      interviewsCount,
      offersCount: statusMap["OFFER"] || 0,
      selectedCount: statusMap["SELECTED"] || 0,
      rejectedCount: statusMap["REJECTED"] || 0,
      withdrawnCount: statusMap["WITHDRAWN"] || 0,
      highMatchCount,
      statusBreakdown: statusMap,
      sourcesBreakdown: sourceCounts.map((s: { source: string; _count: { _all: number } }) => ({
        source: s.source,
        count: s._count._all,
      })),
      recentSyncLogs,
      recentJobs,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error loading dashboard stats";
    console.error("[GET /api/dashboard/stats] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
