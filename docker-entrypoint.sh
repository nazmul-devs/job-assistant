#!/bin/sh
set -e

echo "=================================================="
echo " Starting Job Assistant Pro Container"
echo "=================================================="

# Wait for PostgreSQL to be ready and accepting connections
echo "[1/4] Waiting for PostgreSQL database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { process.exit(0); })
  .catch(() => { process.exit(1); });
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "[ERROR] Database connection timed out after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "      Postgres is initializing ($RETRY_COUNT/$MAX_RETRIES)... retrying in 2s"
  sleep 2
done

echo "[2/4] Database connected successfully!"

# Apply Prisma migrations / schema push
echo "[3/4] Ensuring database schema is synchronized..."
npx prisma db push --skip-generate

# Seed initial candidate profile if empty
echo "[4/4] Ensuring candidate profile is seeded..."
npx tsx prisma/seed.ts || true

echo "=================================================="
echo " Database initialization complete. Starting Next.js app..."
echo "=================================================="

exec "$@"
