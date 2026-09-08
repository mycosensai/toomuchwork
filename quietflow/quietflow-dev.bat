@echo off
title QuietFlow (Dev Mode) — http://localhost:3456
cd /d "%~dp0"

echo [QuietFlow Dev] Starting development server...
echo [QuietFlow Dev] Open http://localhost:3456 in your browser once it loads.
echo.

:: Kill anything on port 3456 first
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3456 " ^| findstr "LISTENING"') do taskkill /f /pid %%p >nul 2>&1

:: Start dev server
pnpm next dev -p 3456

pause
