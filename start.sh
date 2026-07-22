#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo
echo "=== Mutux local development ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker CLI was not found. Install Docker Engine/Desktop and try again."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker is not running. Start Docker Engine/Desktop, wait until it is ready, then run start.sh again."
  exit 1
fi

echo "[1/6] Starting PostgreSQL..."
docker compose up -d postgres

echo "[2/6] Waiting for PostgreSQL to accept connections..."
for attempt in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres -d mutux_db >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "[ERROR] PostgreSQL was not ready after 60 seconds."
    exit 1
  fi

  sleep 2
done

echo "[3/6] Synchronizing backend dependencies..."
pushd backend >/dev/null
npm install

echo "[4/6] Generating Prisma Client and applying migrations..."
npx prisma generate
npx prisma migrate deploy
popd >/dev/null

echo "[5/6] Synchronizing frontend dependencies..."
pushd frontend >/dev/null
npm install
popd >/dev/null

echo "[6/6] Starting NestJS and Next.js..."
(
  cd "$ROOT_DIR/backend"
  npm run start:dev
) &
BACKEND_PID=$!

(
  cd "$ROOT_DIR/frontend"
  npm run dev
) &
FRONTEND_PID=$!

echo "Backend started (PID: $BACKEND_PID)."
echo "Frontend started (PID: $FRONTEND_PID)."
echo "Use Ctrl+C in this terminal to stop both servers."

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' EXIT INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
