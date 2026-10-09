import prisma from "@/lib/prisma";
import { ApplicationStatus } from "@/types/job";

export interface UpdateJobStatusInput {
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  interviewDate?: Date | string | null;
  appliedAt?: Date | string | null;
}

export async function updateJobApplicationStatus(input: UpdateJobStatusInput) {
  const { jobId, status, notes, interviewDate, appliedAt } = input;

  const currentJob = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, appliedAt: true, notes: true },
  });

  if (!currentJob) {
    throw new Error(`Job not found with ID ${jobId}`);
  }

  const previousStatus = currentJob.status;
  const isStatusChanged = previousStatus !== status;

  // If status is APPLIED and appliedAt is not set, auto-default to now()
  let finalAppliedAt: Date | undefined | null = undefined;
  if (appliedAt !== undefined) {
    finalAppliedAt = appliedAt ? new Date(appliedAt) : null;
  } else if (status === "APPLIED" && !currentJob.appliedAt) {
    finalAppliedAt = new Date();
  }

  let finalInterviewDate: Date | undefined | null = undefined;
  if (interviewDate !== undefined) {
    finalInterviewDate = interviewDate ? new Date(interviewDate) : null;
  }

  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
        appliedAt: finalAppliedAt,
        interviewDate: finalInterviewDate,
      },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    ...(isStatusChanged
      ? [
          prisma.jobApplicationHistory.create({
            data: {
              jobId,
              fromStatus: previousStatus,
              toStatus: status,
              notes: notes || null,
            },
          }),
        ]
      : []),
  ]);

  return updatedJob;
}

export async function getJobTimeline(jobId: string) {
  return prisma.jobApplicationHistory.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}
