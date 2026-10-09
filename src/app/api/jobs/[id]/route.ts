import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateJobApplicationStatus } from "@/services/tracker";
import { ApplicationStatus } from "@prisma/client";


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error getting job";
    console.error("[GET /api/jobs/[id]] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const status = body.status as ApplicationStatus;
    if (status && !Object.values(ApplicationStatus).includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    const updatedJob = await updateJobApplicationStatus({
      jobId: id,
      status: status,
      notes: body.notes,
      interviewDate: body.interviewDate,
      appliedAt: body.appliedAt,
    });

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: `Job updated to ${updatedJob.status}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating job";
    console.error("[PATCH /api/jobs/[id]] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.job.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Job deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting job";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
