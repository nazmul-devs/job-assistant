# 🚀 VPS Production Deployment Guide — Job Assistant Pro

This guide walks you through deploying **Job Assistant Pro** to any Ubuntu/Debian/CentOS VPS server and reverse-proxying it with **Nginx** and **Let's Encrypt SSL (HTTPS)**.

---

## 🏗️ Architecture Overview

```text
[ Browser / Internet ]
         │ (HTTP :80 / HTTPS :443)
         ▼
  ┌──────────────┐
  │ Host NGINX   │  (SSL termination, caching, rate limiting)
  └──────┬───────┘
         │ (Reverse proxy -> http://127.0.0.1:4000)
         ▼
  ┌─────────────────────── Docker Network ────────────────────────┐
  │                                                               │
  │   ┌────────────────────────┐         ┌────────────────────┐   │
  │   │  job_tracker_app       │ ──────> │ job_tracker_postgres│   │
  │   │  (Next.js 16 :3000)    │  Prisma │ (PostgreSQL 16)    │   │
  │   └────────────────────────┘         └─────────┬──────────┘   │
  │                                                │              │
  │                                       [ postgres_data ]       │
  │                                        (Persistent Volume)    │
  └───────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites on Your VPS

Ensure your VPS has:
1. **Ubuntu 20.04 / 22.04 / 24.04** (or Debian 11/12).
2. A registered domain name with an **A Record** pointing to your VPS public IP address (e.g., `jobs.yourdomain.com` -> `YOUR_VPS_IP`).

---

## Step 1: Install Docker & Nginx on VPS

SSH into your server and run:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# 1. Install Docker & Docker Compose Plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Nginx and Certbot (for SSL)
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Open firewall ports (if UFW is active)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

> **Note:** If you added yourself to the `docker` group, log out and log back in to apply the group permissions:
> ```bash
> exit
> # SSH back in
> ```

---

## Step 2: Clone the Repository

Clone your repository to `/var/www/job-assistant` or your user home directory:

```bash
git clone https://github.com/nazmul-devs/job-assistant.git
cd job-assistant
```

---

## Step 3: Run the 1-Command Deployment Script

Run the automated deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

### What this command does:
1. Automatically initializes `.env` from `.env.example` with a secure random database password.
2. Builds the optimized Next.js production Docker image.
3. Starts PostgreSQL 16 and waits for the database health check.
4. Synchronizes Prisma database tables (`prisma db push`).
5. Seeds initial candidate profile preferences (`prisma/seed.ts`).
6. Starts the app bound locally to `127.0.0.1:4000`.

### Verify Docker Containers:
```bash
docker compose ps
```
You should see:
- `job_tracker_postgres` (Up, healthy)
- `job_tracker_app` (Up, 127.0.0.1:4000->3000/tcp)

---

## Step 4: Configure Nginx as Reverse Proxy

Job Assistant Pro includes a pre-configured production Nginx template in `nginx/job-assistant.conf`.

1. Copy the configuration file to Nginx's `sites-available`:
```bash
sudo cp nginx/job-assistant.conf /etc/nginx/sites-available/job-assistant.conf
```

2. Open the file and replace `yourdomain.com` with your actual domain name:
```bash
sudo nano /etc/nginx/sites-available/job-assistant.conf
```

Find the `server_name` line and update it:
```nginx
server_name jobs.yourdomain.com www.jobs.yourdomain.com;
```

3. Enable the site and test the configuration:
```bash
# Enable the site configuration
sudo ln -s /etc/nginx/sites-available/job-assistant.conf /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

At this point, you can already visit `http://jobs.yourdomain.com` in your browser!

---

## Step 5: Secure with Free SSL Certificate (HTTPS)

Use Certbot to automatically configure Let's Encrypt SSL:

```bash
sudo certbot --nginx -d jobs.yourdomain.com -d www.jobs.yourdomain.com
```

- When prompted, provide your email for renewal notifications.
- Agree to the Terms of Service.
- Certbot will automatically configure HTTPS, HTTP-to-HTTPS redirect, and SSL certificate renewals.

### Test Auto-Renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 6: Verify Environment Settings

Open `.env` to verify your public URL:

```bash
nano .env
```

Ensure `APP_URL` is set to your live HTTPS domain:
```ini
APP_URL="https://jobs.yourdomain.com"
```

If you made any changes to `.env`, restart the app container:
```bash
docker compose restart app
```

---

## 🔄 Automated Job Sync & Ingestion

Job Assistant Pro includes an automatic internal scheduler configured in `.env`:
- `AUTO_SYNC_ENABLED=true`
- `JOB_SYNC_INTERVAL_MINUTES=60`

The container automatically fetches, scores, and deduplicates listings from **all 10 job sources** every 60 minutes.

### (Optional) Trigger Ingestion via External Cron
If you prefer triggering syncs using system `cron`:

1. Check your `CRON_SECRET` in `.env`.
2. Add a cron job on your VPS:
```bash
crontab -e
```
Add this line to sync every 2 hours:
```cron
0 */2 * * * curl -s -X GET -H "Authorization: Bearer your_cron_secret_here" http://127.0.0.1:4000/api/cron/sync > /dev/null 2>&1
```

---

## 🛠️ Management & Maintenance Commands

### Pull Updates from GitHub
Whenever you push new features or fixes to GitHub:

```bash
cd /path/to/job-assistant
git pull origin main
./deploy.sh
```

### View Live Application Logs
```bash
# Next.js Application logs
docker compose logs -f app

# PostgreSQL Database logs
docker compose logs -f postgres
```

### Restart Application
```bash
docker compose restart app
```

### Stop All Containers
```bash
./stop.sh
# or
docker compose down
```

### Database Backup & Restore

**Backup:**
```bash
docker compose exec -T postgres pg_dump -U postgres job_tracker > job_tracker_backup_$(date +%F).sql
```

**Restore:**
```bash
cat job_tracker_backup_2026-10-10.sql | docker compose exec -T postgres psql -U postgres job_tracker
```

---

## ❓ Troubleshooting

| Issue | Cause & Solution |
| :--- | :--- |
| **502 Bad Gateway** | `job_tracker_app` container is still booting or exited. Check logs: `docker compose logs app`. |
| **Port 4000 conflict** | Another process is using port 4000. Change `PORT=4001` in `.env` and update `proxy_pass http://127.0.0.1:4001;` in `/etc/nginx/sites-available/job-assistant.conf`. |
| **Database error on startup** | PostgreSQL is still starting up. The entrypoint script waits up to 60 seconds automatically. Check `docker compose logs postgres`. |
| **Permission denied on docker** | Ensure your user belongs to the `docker` group: `sudo usermod -aG docker $USER` and re-login. |

---

## 🎉 You're Live!
Open your browser and navigate to **`https://jobs.yourdomain.com`**.
Job Assistant Pro is now live with automated rules-based matching, multi-source ingestion, and full lifecycle tracking!
