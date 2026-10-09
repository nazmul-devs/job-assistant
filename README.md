# job-assistant

> **Job Assistant Pro** — A multi-source automated remote job aggregator and application tracker built with Next.js 16, React 19, Tailwind CSS, Prisma, and PostgreSQL.

---

## 🚀 Overview

Job Assistant Pro automates your remote job search and application pipeline. It periodically fetches, normalizes, and deduplicates listings from **10 distinct remote job boards & RSS feeds**, evaluates every listing against your custom candidate profile with an intelligent scoring algorithm, and lets you manage application statuses throughout your interview journey.

---

## ⚡ Supported Job APIs & Sources

Job Assistant Pro integrates with **10 modular job adapters**:

1. **Himalayas** (`https://himalayas.app/jobs/api`)
2. **Remotive** (`https://remotive.com/api/remote-jobs`)
3. **Jobicy** (`https://jobicy.com/api/v2/remote-jobs`)
4. **RemoteJobs.org** (`https://remotejobs.org/feed`)
5. **Remote Landers** (`https://remotelanders.com/feed`)
6. **Arbeitnow** (`https://www.arbeitnow.com/api/job-board-api`)
7. **We Work Remotely** (`https://weworkremotely.com/categories/remote-programming-jobs.rss`)
8. **Remote OK** (`https://remoteok.com/api`)
9. **Working Nomads** (`https://www.workingnomads.com/api/exposed_jobs/`)
10. **LaraJobs** (`https://larajobs.com/feed`)

---

## ✨ Features

- **Automated Multi-Source Ingestion:** Fault-tolerant, parallel job fetching across all providers with configurable sync intervals.
- **Deduplication Engine:** Deterministic collision-free hashing via external IDs and canonical URL normalization (stripping tracking query params).
- **Candidate Match Scoring:** Configurable profile (target roles, tech stack, experience level, remote preference, location, salary requirements) with transparent weighted match scoring.
- **Application Status Pipeline:** Track jobs through complete lifecycle stages:
  - `NEW` ➔ `SAVED` ➔ `APPLY` ➔ `APPLIED` ➔ `INTERVIEW` ➔ `TECHNICAL_INTERVIEW` ➔ `FINAL_INTERVIEW` ➔ `OFFER` ➔ `SELECTED` ➔ `REJECTED` ➔ `WITHDRAWN`
- **Audit History & Timeline:** Tracks timestamped status transitions and application notes per job.
- **Advanced Filtering & Search:** Filter by source, application status, match score range, remote status, search queries, and custom sorting.
- **Docker & Compose Ready:** Production multi-stage Dockerfile and `docker-compose.yml` with healthchecks.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4.0 (Turbopack, App Router)
- **Frontend:** React 19, Tailwind CSS, Lucide Icons, clsx, tailwind-merge
- **Backend / ORM:** Next.js API Routes, Prisma ORM 6.19
- **Database:** PostgreSQL 16
- **Validation & Parsing:** Zod, fast-xml-parser
- **Testing:** Vitest

---

## 🏁 Getting Started

### Prerequisites

- Node.js 20+ or 22+
- PostgreSQL or Docker Desktop

### 1. Clone & Install

```bash
git clone https://github.com/nazmul-devs/job-assistant.git
cd job-assistant
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` points to your PostgreSQL database.

### 3. Setup Database Schema

```bash
npx prisma db push
# Optional: Seed initial profile data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev -- --port 4001
```

Visit [http://localhost:4001](http://localhost:4001) in your browser.

---

## 🐳 Running with Docker

Start both the PostgreSQL database and application container:

```bash
docker compose up -d
```

The app will be available at [http://localhost:4000](http://localhost:4000).

To stop the services:

```bash
docker compose down
```

---

## 🧪 Testing

Run the test suite with Vitest:

```bash
npm test
```

---

## 📄 License

MIT
