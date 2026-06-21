@echo off
REM Mason Hub launcher (Windows). Double-click this or the desktop shortcut.
cd /d "%~dp0.."

REM Clear the Next.js cache (avoids OneDrive readlink crashes).
if exist ".next" rmdir /s /q ".next" 2>nul

REM Install deps on first run.
if not exist "node_modules" (
  echo Installing dependencies, one moment...
  call npm install
)

echo Starting Mason Hub...
start "MasonHub" cmd /c "npm run dev"

REM Give the server a few seconds, then open the browser.
timeout /t 7 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo Mason Hub is running at http://localhost:3000
echo Keep the "MasonHub" window open while you use it. Close it to stop.
