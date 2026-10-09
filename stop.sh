#!/usr/bin/env bash
set -e

if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

echo "Stopping Job Assistant Pro services..."
$DOCKER_COMPOSE down
echo "All containers have been stopped."
