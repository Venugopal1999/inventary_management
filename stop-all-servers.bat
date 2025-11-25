@echo off
echo ====================================
echo Stopping Inventory Management System
echo ====================================
echo.

:: Stop Backend Server (Laravel runs on port 8000)
echo [1/2] Stopping Backend Server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process on port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
echo ✓ Backend server stopped
echo.

:: Stop Frontend Server (Vite runs on port 5173)
echo [2/2] Stopping Frontend Server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo Killing process on port 5173 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
echo ✓ Frontend server stopped
echo.

echo ====================================
echo All servers stopped!
echo ====================================
echo.
echo Note: MySQL/PostgreSQL database is still running.
echo Stop it manually from XAMPP or Services if needed.
echo.
pause
