@echo off
title Gujarat Rain Alert System - Stopping
color 0C
echo.
echo  =====================================================
echo   GUJARAT RAIN ALERT SYSTEM  ^|  Stopping...
echo  =====================================================
echo.

echo  [1/2] Stopping backend on port 5000...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":5000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo  [2/2] Stopping frontend on port 3000...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo  [OK] All Gujarat Rain Alert System processes stopped.
echo.
timeout /t 3 /nobreak >nul
