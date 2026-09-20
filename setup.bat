@echo off
title Gujarat Rain Alert System — Setup & Install
color 0A
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║     GUJARAT RAIN ALERT SYSTEM — AUTOMATED SETUP         ║
echo  ║     Powered by IBM Granite LLM + IMD Data                ║
echo  ║     Built with IBM Bob — Agentic AI SDLC                 ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM ─── Check Node.js ───────────────────────────────────────────
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js not found. Please install from: https://nodejs.org
    echo      Download LTS version ^(v18 or higher^)
    start https://nodejs.org/en/download
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo  [OK] Node.js %%i found
)

REM ─── Check npm ───────────────────────────────────────────────
echo.
echo [2/6] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo  [OK] npm v%%i found

REM ─── Check MySQL ─────────────────────────────────────────────
echo.
echo [3/6] Checking MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARN] MySQL not found in PATH.
    echo  Please install MySQL 8.0 from: https://dev.mysql.com/downloads/mysql/
    echo  Or use XAMPP/WampServer which includes MySQL.
    echo.
    echo  After installing MySQL:
    echo  1. Start MySQL service
    echo  2. Create database: CREATE DATABASE gujarat_rain_db;
    echo  3. Update backend\.env with your MySQL password
    echo.
    set /p SKIP_MYSQL=Press ENTER to skip MySQL check and continue (app will run in demo mode)...
) else (
    for /f "tokens=*" %%i in ('mysql --version') do echo  [OK] MySQL %%i found
)

REM ─── Backend dependencies ────────────────────────────────────
echo.
echo [4/6] Installing backend dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo  [!] Backend install failed. Trying again...
    call npm install
)
echo  [OK] Backend packages installed
cd ..

REM ─── Frontend dependencies ───────────────────────────────────
echo.
echo [5/6] Installing frontend dependencies...
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo  [!] Frontend install failed. Trying again...
    call npm install
)
echo  [OK] Frontend packages installed
cd ..

REM ─── Create .env from example ────────────────────────────────
echo.
echo [6/6] Setting up environment configuration...
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo  [OK] Created backend\.env from template
    echo.
    echo  ══════════════════════════════════════════════════
    echo   IMPORTANT — Configure your API keys:
    echo  ══════════════════════════════════════════════════
    echo.
    echo   1. Open: backend\.env
    echo.
    echo   2. Set MySQL password:
    echo      DB_PASSWORD=your_mysql_root_password
    echo.
    echo   3. Get FREE OpenWeatherMap API key:
    echo      https://openweathermap.org/api
    echo      Set: OPENWEATHER_API_KEY=your_key
    echo.
    echo   4. Get IBM watsonx.ai API key:
    echo      https://dataplatform.cloud.ibm.com
    echo      Set: IBM_WATSON_API_KEY=your_key
    echo      Set: IBM_WATSON_PROJECT_ID=your_project_id
    echo.
    echo   NOTE: App works in DEMO MODE without API keys
    echo   (uses simulated Gujarat weather data)
    echo  ══════════════════════════════════════════════════
) else (
    echo  [OK] backend\.env already exists
)

REM ─── MySQL Database Setup ────────────────────────────────────
echo.
echo  Do you want to create the MySQL database now?
set /p CREATE_DB=Enter your MySQL root password (or press ENTER to skip): 
if not "%CREATE_DB%"=="" (
    echo  Creating database gujarat_rain_db...
    mysql -u root -p%CREATE_DB% -e "CREATE DATABASE IF NOT EXISTS gujarat_rain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo  [OK] Database 'gujarat_rain_db' created successfully
        REM Update .env with the provided password
        powershell -Command "(Get-Content backend\.env) -replace 'your_mysql_password', '%CREATE_DB%' | Set-Content backend\.env"
        echo  [OK] MySQL password updated in backend\.env
    ) else (
        echo  [WARN] Could not create database. Please create it manually:
        echo  mysql -u root -p -e "CREATE DATABASE gujarat_rain_db;"
    )
)

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  SETUP COMPLETE!                                         ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║  Next steps:                                             ║
echo  ║  1. Edit backend\.env with your API keys                 ║
echo  ║  2. Run: start.bat  to launch the application            ║
echo  ║  3. Open: http://localhost:3000                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
