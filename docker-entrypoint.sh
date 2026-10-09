#!/bin/sh
set -e

echo "Running database schema migrations/push..."
npx prisma db push --skip-generate

echo "Running seed script..."
npx tsx prisma/seed.ts || true

echo "Starting application..."
exec "$@"
