# job-assistant

> **Job Assistant Pro** — A production-ready, multi-source automated remote job aggregator and application tracker built with Next.js 16, React 19, Tailwind CSS, Prisma, and PostgreSQL.

---

## ⚡ 1-Command VPS Deployment

On your VPS server (Ubuntu/Debian/CentOS), simply clone and run:

```bash
git clone https://github.com/nazmul-devs/job-assistant.git
cd job-assistant
chmod +x deploy.sh && ./deploy.sh
```

**That's it!** The automated deployment script will:
1. Verify Docker and Docker Compose.
2. Initialize `.env` with secure credentials if not already configured.
3. Launch PostgreSQL 16 container and wait for the database health check.
4. Synchronize Prisma schemas (`prisma db push`) and seed default candidate profiles.
5. Build and launch Next.js on port `80` (accessible immediately via your VPS public IP).

### Alternative: Direct Docker Compose

```bash
docker compose up -d --build
```

---

## 🌐 Optional Domain & Automatic HTTPS (SSL)

If you have a domain name pointed to your VPS (e.g., `jobs.yourdomain.com`), you can enable automated Let's Encrypt SSL with Caddy in one command:

```bash
DOMAIN=jobs.yourdomain.com docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

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
- **Production Hardened:** Non-exposed database port binding (`127.0.0.1`), container healthchecks, and auto-restart policies (`restart: unless-stopped`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4.0 (Turbopack, App Router)
- **Frontend:** React 19, Tailwind CSS, Lucide Icons, clsx, tailwind-merge
- **Backend / ORM:** Next.js API Routes, Prisma ORM 6.19
- **Database:** PostgreSQL 16
- **Validation & Parsing:** Zod, fast-xml-parser
- **Testing:** Vitest

---

## 💻 Local Development (Outside Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` points to your PostgreSQL database.

### 3. Setup Database Schema

```bash
npx prisma db push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev -- --port 4001
```

Visit [http://localhost:4001](http://localhost:4001) in your browser.

---

## 🔧 Management & Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Start / Deploy** | `./deploy.sh` *(or `docker compose up -d --build`)* |
| **Stop Services** | `./stop.sh` *(or `docker compose down`)* |
| **View Live Logs** | `docker compose logs -f app` |
| **View DB Logs** | `docker compose logs -f postgres` |
| **Trigger Manual Sync** | `curl -X POST http://localhost/api/jobs/sync` |
| **Run Tests** | `npm test` |

---

## 📄 License

MIT
