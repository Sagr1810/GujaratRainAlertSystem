@echo off
setlocal EnableDelayedExpansion
title Gujarat Rain Alert System

REM ── Get the folder where this .bat lives (always correct, no matter where you double-click from)
set "ROOT=%~dp0"
REM Remove trailing backslash
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "BACKEND=%ROOT%\backend"
set "FRONTEND_BUILD=%ROOT%\frontend\build"

cls
color 0B
echo.
echo  =====================================================
echo   GUJARAT RAIN ALERT SYSTEM  ^|  Starting...
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo  =====================================================
echo.

REM ── 1. Check Node.js ──────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Node.js not found!
    echo  Please install from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found

REM ── 2. Install backend dependencies if missing ─────────
if not exist "%BACKEND%\node_modules" (
    echo  [INSTALL] Installing backend dependencies...
    cd /d "%BACKEND%"
    call npm install --silent
    if errorlevel 1 (
        echo  [ERROR] Backend npm install failed!
        pause
        exit /b 1
    )
    echo  [OK] Backend dependencies installed
)

REM ── 3. Create .env if missing ──────────────────────────
if not exist "%BACKEND%\.env" (
    if exist "%BACKEND%\.env.example" (
        copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
        echo  [OK] Created backend\.env from template
    )
)

REM ── 4. Build frontend if build folder missing ──────────
if not exist "%FRONTEND_BUILD%\index.html" (
    echo  [BUILD] Building frontend... (takes ~60 seconds)
    cd /d "%ROOT%\frontend"
    call npm install --silent
    call npm run build
    if errorlevel 1 (
        echo  [ERROR] Frontend build failed!
        pause
        exit /b 1
    )
    echo  [OK] Frontend built
) else (
    echo  [OK] Frontend build found - using cached build
)

REM ── 5. Kill any old processes on 5000 / 3000 ──────────
echo  [CLEANUP] Clearing old processes on ports 5000 and 3000...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":5000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM ── 6. Start Backend ───────────────────────────────────
echo  [1/2] Starting backend on port 5000...
start "Gujarat Rain - BACKEND (port 5000)" cmd /k "title Backend-5000 && cd /d "%BACKEND%" && echo [Backend] Starting... && node src/server.js"
timeout /t 5 /nobreak >nul

REM ── 7. Start Frontend (serve pre-built, instant) ───────
echo  [2/2] Starting frontend on port 3000...
start "Gujarat Rain - FRONTEND (port 3000)" cmd /k "title Frontend-3000 && cd /d "%ROOT%\frontend" && echo [Frontend] Serving build on http://localhost:3000 ... && serve -s build -l 3000"
timeout /t 5 /nobreak >nul

REM ── 8. Open browser ────────────────────────────────────
echo  [BROWSER] Opening http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo  =====================================================
echo   GUJARAT RAIN ALERT SYSTEM IS RUNNING!
echo  -----------------------------------------------------
echo   Frontend  : http://localhost:3000
echo   Backend   : http://localhost:5000/api/health
echo   Dashboard : http://localhost:3000
echo   Regions   : http://localhost:3000/regions
echo   AI Agent  : http://localhost:3000/agent
echo   History   : http://localhost:3000/history
echo   Reservoirs: http://localhost:3000/reservoirs
echo  -----------------------------------------------------
echo   Two windows opened:
echo     - Gujarat Rain - BACKEND  (keep open)
echo     - Gujarat Rain - FRONTEND (keep open)
echo   Close those windows to stop the system.
echo  =====================================================
echo.
pause
