import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default candidate profile...");

  await prisma.candidateProfile.upsert({
    where: { id: "default" },
    update: {
      name: "Default Candidate Profile",
      targetRoles: [
        "Senior Software Engineer",
        "Senior Node.js Developer",
        "Senior Full-Stack Engineer",
        "AI & Integrations Engineer",
        "Backend Developer",
        "Node.js Developer",
      ],
      skills: [
        "JavaScript",
        "TypeScript",
        "Node.js",
        "NestJS",
        "React.js",
        "Next.js",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "AWS",
        "Docker",
        "CI/CD",
        "AI APIs",
        "Travel APIs",
        "Tailwind CSS",
      ],
      minExperienceYears: 5,
      remoteOnly: true,
      preferredLocations: ["International", "Remote", "Worldwide", "Anywhere"],
      minSalary: 100000,
      salaryCurrency: "BDT",
    },
    create: {
      id: "default",
      name: "Default Candidate Profile",
      targetRoles: [
        "Senior Software Engineer",
        "Senior Node.js Developer",
        "Senior Full-Stack Engineer",
        "AI & Integrations Engineer",
        "Backend Developer",
        "Node.js Developer",
      ],
      skills: [
        "JavaScript",
        "TypeScript",
        "Node.js",
        "NestJS",
        "React.js",
        "Next.js",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "AWS",
        "Docker",
        "CI/CD",
        "AI APIs",
        "Travel APIs",
        "Tailwind CSS",
      ],
      minExperienceYears: 5,
      remoteOnly: true,
      preferredLocations: ["International", "Remote", "Worldwide", "Anywhere"],
      minSalary: 100000,
      salaryCurrency: "BDT",
    },
  });

  console.log("Candidate profile successfully seeded.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
