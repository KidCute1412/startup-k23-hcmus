@echo off
echo Starting Docker Compose services (PostgreSQL)...
docker compose up -d

echo Checking backend dependencies...
cd backend
if not exist node_modules (
    echo node_modules folder is missing in backend. Installing...
    call npm install
)

echo Generating Prisma Client...
call npx prisma generate

cd ..

echo Checking frontend dependencies...
cd frontend
if not exist node_modules (
    echo node_modules folder is missing in frontend. Installing...
    call npm install
)

cd ..

where wt >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting servers in Windows Terminal split panes...
    wt -d "%~dp0backend" cmd /k "npm run start:dev" ^; split-pane -d "%~dp0frontend" cmd /k "npm run dev"
) else (
    echo Windows Terminal not found. Starting in separate windows...
    echo Starting NestJS backend server in a new window...
    start "NestJS Backend" cmd /k "cd backend && npm run start:dev"
    echo Starting Next.js frontend server in a new window...
    start "Next.js Frontend" cmd /k "cd frontend && npm run dev"
)


