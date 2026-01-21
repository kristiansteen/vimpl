@echo off
echo ========================================
echo   Starting vimpl Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

echo Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found!
echo.
echo Starting backend server on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev

pause
