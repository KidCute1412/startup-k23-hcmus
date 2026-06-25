@echo off
echo Starting Docker Compose services (PostgreSQL)...
docker compose up -d

cd backend

if not exist node_modules (
    echo node_modules folder is missing. Installing dependencies...
    call npm install
)

echo Starting NestJS backend server in a new window...
start "NestJS Backend" npm run start:dev
