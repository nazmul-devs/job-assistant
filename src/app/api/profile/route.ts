import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEFAULT_CANDIDATE_PROFILE } from "@/services/scorer";


export async function GET() {
  try {
    let profile = await prisma.candidateProfile.findUnique({
      where: { id: "default" },
    });

    if (!profile) {
      profile = await prisma.candidateProfile.create({
        data: {
          id: "default",
          name: DEFAULT_CANDIDATE_PROFILE.name || "Default Candidate Profile",
          targetRoles: DEFAULT_CANDIDATE_PROFILE.targetRoles,
          skills: DEFAULT_CANDIDATE_PROFILE.skills,
          minExperienceYears: DEFAULT_CANDIDATE_PROFILE.minExperienceYears,
          remoteOnly: DEFAULT_CANDIDATE_PROFILE.remoteOnly,
          preferredLocations: DEFAULT_CANDIDATE_PROFILE.preferredLocations,
          minSalary: DEFAULT_CANDIDATE_PROFILE.minSalary,
          salaryCurrency: DEFAULT_CANDIDATE_PROFILE.salaryCurrency || "BDT",
        },
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error getting profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const profile = await prisma.candidateProfile.upsert({
      where: { id: "default" },
      update: {
        name: body.name || undefined,
        targetRoles: Array.isArray(body.targetRoles) ? body.targetRoles : undefined,
        skills: Array.isArray(body.skills) ? body.skills : undefined,
        minExperienceYears: typeof body.minExperienceYears === "number" ? body.minExperienceYears : undefined,
        remoteOnly: typeof body.remoteOnly === "boolean" ? body.remoteOnly : undefined,
        preferredLocations: Array.isArray(body.preferredLocations) ? body.preferredLocations : undefined,
        minSalary: typeof body.minSalary === "number" ? body.minSalary : undefined,
        salaryCurrency: body.salaryCurrency || undefined,
      },
      create: {
        id: "default",
        name: body.name || "Default Candidate Profile",
        targetRoles: body.targetRoles || DEFAULT_CANDIDATE_PROFILE.targetRoles,
        skills: body.skills || DEFAULT_CANDIDATE_PROFILE.skills,
        minExperienceYears: body.minExperienceYears ?? 5,
        remoteOnly: body.remoteOnly ?? true,
        preferredLocations: body.preferredLocations || ["International", "Remote"],
        minSalary: body.minSalary ?? 100000,
        salaryCurrency: body.salaryCurrency || "BDT",
      },
    });

    return NextResponse.json({
      success: true,
      data: profile,
      message: "Candidate profile updated successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
