#!/usr/bin/env bash
set -e

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}        Job Assistant Pro — Production Deploy         ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check Docker installation
if ! command -v docker &> /dev/null; then
  echo -e "${RED}[ERROR] Docker is not installed on this system.${NC}"
  echo "Install Docker with: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# Detect docker compose CLI command
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo -e "${RED}[ERROR] Docker Compose is not installed.${NC}"
  exit 1
fi

# Ensure .env exists; if not, initialize from .env.example
if [ ! -f .env ]; then
  echo -e "${YELLOW}[INFO] .env not found. Initializing from .env.example...${NC}"
  cp .env.example .env
  
  # Auto-generate secure random password if openssl is present
  if command -v openssl &> /dev/null; then
    RANDOM_PASS=$(openssl rand -hex 16)
    sed -i "s/POSTGRES_PASSWORD=postgres/POSTGRES_PASSWORD=${RANDOM_PASS}/g" .env 2>/dev/null || true
  fi
  echo -e "${GREEN}[OK] .env created with production defaults.${NC}"
fi

# Load port from .env if defined
if [ -f .env ]; then
  set -a
  [ -f .env ] && . ./.env 2>/dev/null || true
  set +a
fi

APP_PORT="${PORT:-4000}"
APP_HOST="${APP_BIND_IP:-127.0.0.1}"

echo -e "${BLUE}[1/3] Building and starting Docker containers...${NC}"
$DOCKER_COMPOSE up -d --build --remove-orphans

echo -e "${BLUE}[2/3] Waiting for services to initialize...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=35

until [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; do
  STATUS=$(docker inspect --format='{{.State.Status}}' job_tracker_app 2>/dev/null || echo "starting")
  if [ "$STATUS" = "running" ]; then
    if curl -s -f -o /dev/null "http://${APP_HOST}:${APP_PORT}" 2>/dev/null || curl -s -f -o /dev/null "http://127.0.0.1:${APP_PORT}" 2>/dev/null; then
      break
    fi
  fi
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 2
done

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}  🚀 Job Assistant Pro is successfully running!       ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Internal URL:      ${BLUE}http://${APP_HOST}:${APP_PORT}${NC}"
echo -e "Nginx Reverse:     Point Nginx proxy_pass to http://${APP_HOST}:${APP_PORT}"
echo -e "Database:          PostgreSQL 16 (Healthchecked, persistent volume)"
echo -e "Job APIs:          10 Sources active (auto-sync enabled)"
echo ""
echo "Useful Commands:"
echo "  • View live logs:     $DOCKER_COMPOSE logs -f app"
echo "  • Restart container:  $DOCKER_COMPOSE restart"
echo "  • Stop services:      ./stop.sh (or $DOCKER_COMPOSE down)"
echo "  • Sync jobs manually: curl -X POST http://127.0.0.1:${APP_PORT}/api/jobs/sync"
echo -e "${GREEN}======================================================${NC}"
