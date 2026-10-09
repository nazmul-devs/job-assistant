import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApplicationStatus, Prisma } from "@prisma/client";


export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim();
    const source = searchParams.get("source")?.trim();
    const minScore = searchParams.get("minScore");
    const remoteOnly = searchParams.get("remoteOnly");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {};

    // Search filter across title, company, location, source
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status && status !== "ALL" && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      where.status = status as ApplicationStatus;
    }

    // Source filter
    if (source && source !== "ALL") {
      where.source = source;
    }

    // Minimum match score filter
    if (minScore) {
      const parsedScore = parseInt(minScore, 10);
      if (!isNaN(parsedScore)) {
        where.matchScore = { gte: parsedScore };
      }
    }

    // Remote filter
    if (remoteOnly === "true") {
      where.isRemote = true;
    }

    // Sorting
    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: "desc" };
    switch (sort) {
      case "highest_score":
      case "score_desc":
        orderBy = { matchScore: "desc" };
        break;
      case "lowest_score":
      case "score_asc":
        orderBy = { matchScore: "asc" };
        break;
      case "newest":
        orderBy = { postedAt: { sort: "desc", nulls: "last" } };
        break;
      case "oldest":
        orderBy = { postedAt: { sort: "asc", nulls: "last" } };
        break;
      case "company":
        orderBy = { company: "asc" };
        break;
      case "title":
        orderBy = { title: "asc" };
        break;
      case "status":
        orderBy = { status: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [totalCount, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          source: true,
          externalId: true,
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          isRemote: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          jobUrl: true,
          applyUrl: true,
          postedAt: true,
          matchScore: true,
          matchDetails: true,
          status: true,
          notes: true,
          interviewDate: true,
          appliedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          totalCount,
          totalPages,
          page,
          limit,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error querying jobs";
    console.error("[GET /api/jobs] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
