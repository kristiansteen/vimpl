@echo off
echo ========================================
echo   Starting vimpl Full Stack
echo ========================================
echo.
echo This will start:
echo   1. Backend server (port 3001)
echo   2. Frontend server (port 8000)
echo.
echo Two terminal windows will open.
echo Close them to stop the servers.
echo.
pause

echo Starting backend...
start "vimpl Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 3 >nul

echo Starting frontend...
start "vimpl Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001/health
echo Frontend: http://localhost:8000
echo Test API: http://localhost:8000/test-api-simple.html
echo.
echo Two windows opened:
echo   - vimpl Backend (keep open)
echo   - vimpl Frontend (keep open)
echo.
echo You can close this window now.
echo ========================================
echo.

timeout /t 5
exit
