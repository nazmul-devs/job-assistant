import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApplicationStatus, Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "preview";
    const olderThanDays = typeof body.olderThanDays === "number" ? body.olderThanDays : 7;
    const statuses: ApplicationStatus[] = Array.isArray(body.statuses) && body.statuses.length > 0
      ? body.statuses
      : [ApplicationStatus.NEW, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN];
    const keepActiveApplications = body.keepActiveApplications !== false;
    const source = body.source && body.source !== "ALL" ? body.source : null;

    const andClauses: Prisma.JobWhereInput[] = [];

    // Date cutoff if olderThanDays > 0
    if (olderThanDays > 0) {
      const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      andClauses.push({
        OR: [
          { postedAt: { lt: cutoff } },
          {
            AND: [
              { postedAt: null },
              { createdAt: { lt: cutoff } },
            ],
          },
        ],
      });
    }

    // Status filter
    if (statuses.length > 0) {
      andClauses.push({
        status: { in: statuses },
      });
    }

    // Safeguard active applications (never delete saved, applied, interviews, offers)
    if (keepActiveApplications) {
      andClauses.push({
        status: {
          notIn: [
            ApplicationStatus.SAVED,
            ApplicationStatus.APPLY,
            ApplicationStatus.APPLIED,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.TECHNICAL_INTERVIEW,
            ApplicationStatus.FINAL_INTERVIEW,
            ApplicationStatus.OFFER,
            ApplicationStatus.SELECTED,
          ],
        },
      });
    }

    // Source filter if requested
    if (source) {
      andClauses.push({ source });
    }

    const where: Prisma.JobWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    if (action === "preview") {
      const [count, sample] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.findMany({
          where,
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            company: true,
            source: true,
            status: true,
            postedAt: true,
            createdAt: true,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        count,
        sample,
      });
    }

    if (action === "delete") {
      const result = await prisma.job.deleteMany({ where });

      return NextResponse.json({
        success: true,
        count: result.count,
        deleted: result.count,
        message: `Successfully deleted ${result.count} previous job(s).`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error during cleanup";
    console.error("[POST /api/jobs/cleanup] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
