@echo off
title QuietFlow — Live Traffic Intelligence
cd /d "%~dp0"
setlocal enabledelayedexpansion

set LOG=%~dp0quietflow-log.txt
set PORT=3456

echo [%date% %time%] Starting QuietFlow... > "%LOG%"

:: 1) Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org >> "%LOG%"
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do echo [OK] Node.js %%i >> "%LOG%"

:: 2) Check Next.js
set NEXT_DIST=%~dp0node_modules\next\dist\bin\next
if not exist "%NEXT_DIST%" (
    echo [ERROR] Next.js not found. Run: pnpm install in %~dp0 >> "%LOG%"
    echo [ERROR] Next.js missing. See log.
    pause
    exit /b 1
)
echo [OK] Next.js found >> "%LOG%"

:: 3) Free port %PORT% if occupied
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Killing process on port %PORT% (PID: %%p) >> "%LOG%"
    taskkill /f /pid %%p >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: 4) Build if needed
if not exist "%~dp0.next\BUILD_ID" (
    echo [INFO] Building QuietFlow (first run)...
    echo [INFO] Running: pnpm next build >> "%LOG%"
    call pnpm next build >> "%LOG%" 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Build failed. Check %LOG% for details.
        pause
        exit /b 1
    )
    echo [OK] Build complete >> "%LOG%"
)

:: 5) Start server
echo [INFO] Starting server on http://localhost:%PORT% ... >> "%LOG%"
start "QuietFlow Server" /MIN cmd /c "node "%NEXT_DIST%" start -p %PORT% >> "%LOG%" 2>&1"

:: 6) Wait for server (up to 60s)
echo [QuietFlow] Waiting for server...
set WAIT=0
:waitloop
timeout /t 2 /nobreak >nul
set /a WAIT+=1
if %WAIT% gtr 30 (
    echo [WARN] Server not ready after 60s, launching browser anyway... >> "%LOG%"
    goto launch
)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:%PORT%' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
if %ERRORLEVEL% neq 0 goto waitloop
echo [OK] Server ready >> "%LOG%"

:launch
:: 7) Open browser
set EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if exist "%EDGE%" (
    start "" "%EDGE%" --app=http://localhost:%PORT% --window-size=1280,860
    echo [OK] Edge app window opened >> "%LOG%"
) else (
    start http://localhost:%PORT%
    echo [INFO] Default browser opened >> "%LOG%"
)

echo.
echo  QuietFlow is running at http://localhost:%PORT%
echo  A desktop window should open automatically.
echo  Close this window to stop the server.
echo  Log: %LOG%

:: 8) Hold until user closes
pause >nul

:: Cleanup
echo [INFO] Shutting down... >> "%LOG%"
taskkill /f /fi "WINDOWTITLE eq QuietFlow Server" >nul 2>&1
echo [%date% %time%] Stopped >> "%LOG%"
