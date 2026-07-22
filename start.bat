@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo === Mutux local development ===

where docker >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Docker CLI was not found. Install Docker Desktop and try again.
  goto :error
)

docker info >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Docker Desktop is not running. Start Docker Desktop, wait until it is ready, then run start.bat again.
  goto :error
)

echo [1/6] Starting PostgreSQL...
docker compose up -d postgres
if errorlevel 1 goto :error

echo [2/6] Waiting for PostgreSQL to accept connections...
set /a ATTEMPT=0
:wait_for_postgres
set /a ATTEMPT+=1
docker compose exec -T postgres pg_isready -U postgres -d mutux_db >nul 2>nul
if not errorlevel 1 goto :postgres_ready
if %ATTEMPT% GEQ 30 (
  echo [ERROR] PostgreSQL was not ready after 60 seconds.
  goto :error
)
timeout /t 2 /nobreak >nul
goto :wait_for_postgres

:postgres_ready
echo [3/6] Synchronizing backend dependencies...
pushd backend
call npm.cmd install
if errorlevel 1 (
  popd
  goto :error
)

echo [4/6] Generating Prisma Client and applying migrations...
call npx.cmd prisma generate
if errorlevel 1 (
  popd
  goto :error
)
call npx.cmd prisma migrate deploy
if errorlevel 1 (
  popd
  goto :error
)
popd

echo [5/6] Synchronizing frontend dependencies...
pushd frontend
call npm.cmd install
if errorlevel 1 (
  popd
  goto :error
)
popd

echo [6/6] Starting NestJS and Next.js...
where wt >nul 2>nul
if not errorlevel 1 (
  wt -d "%ROOT_DIR%backend" cmd /k "npm.cmd run start:dev" ^; split-pane -d "%ROOT_DIR%frontend" cmd /k "npm.cmd run dev"
  goto :success
)

echo Windows Terminal was not found. Starting servers in separate windows...
start "NestJS Backend" /D "%ROOT_DIR%backend" cmd /k npm.cmd run start:dev
start "Next.js Frontend" /D "%ROOT_DIR%frontend" cmd /k npm.cmd run dev

:success
echo Development servers have been started.
exit /b 0

:error
echo.
echo Startup stopped. Fix the error above, then run start.bat again.
exit /b 1
