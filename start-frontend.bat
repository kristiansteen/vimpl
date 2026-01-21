@echo off
echo ========================================
echo   Starting vimpl Frontend Server
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Python not found, trying python3...
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python is not installed
        echo Please install Python from https://www.python.org
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

echo Python found!
echo.
echo Starting frontend server on http://localhost:8000
echo.
echo Open in browser:
echo   - Test API: http://localhost:8000/test-api-simple.html
echo   - Landing:  http://localhost:8000/index.html
echo   - Board:    http://localhost:8000/board.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

%PYTHON_CMD% -m http.server 8000

pause
