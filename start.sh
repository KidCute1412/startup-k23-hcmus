#!/bin/bash

echo "Starting Docker Compose services (PostgreSQL)..."
docker compose up -d

echo "Checking backend dependencies..."
cd backend || exit 1

if [ ! -d "node_modules" ]; then
    echo "node_modules folder is missing in backend. Installing..."
    npm install
fi

echo "Starting NestJS backend server..."
gnome-terminal -- bash -c "npm run start:dev; exec bash" 2>/dev/null || \
x-terminal-emulator -e "bash -c 'npm run start:dev; exec bash'" 2>/dev/null || \
npm run start:dev &

echo "Checking frontend dependencies..."
cd ../frontend || exit 1

if [ ! -d "node_modules" ]; then
    echo "node_modules folder is missing in frontend. Installing..."
    npm install
fi

echo "Starting Next.js frontend server..."
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
x-terminal-emulator -e "bash -c 'npm run dev; exec bash'" 2>/dev/null || \
npm run dev &

cd ..