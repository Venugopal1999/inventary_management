@echo off
cls
echo ====================================
echo Server Status Check
echo ====================================
echo.

:: Check PostgreSQL (Port 5433)
echo [1/3] PostgreSQL Database (Port 5433)
netstat -ano | findstr ":5433" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✓ RUNNING - PostgreSQL is active
) else (
    echo ✗ STOPPED - PostgreSQL is not running
    echo   Fix: Run "net start postgresql-x64-14" or start from Services
)
echo.

:: Check Backend Laravel Server (Port 8000)
echo [2/3] Backend Server (Port 8000)
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✓ RUNNING - Backend server is active
    echo   URL: http://127.0.0.1:8000
) else (
    echo ✗ STOPPED - Backend server is not running
    echo   Fix: cd backend ^&^& php artisan serve
)
echo.

:: Check Frontend Vite Server (Port 5173)
echo [3/3] Frontend Server (Port 5173)
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✓ RUNNING - Frontend server is active
    echo   URL: http://localhost:5173
) else (
    echo ✗ STOPPED - Frontend server is not running
    echo   Fix: cd frontend ^&^& npm run dev
)
echo.

echo ====================================
echo Detailed Port Information:
echo ====================================
netstat -ano | findstr "5433 8000 5173" | findstr "LISTENING"
echo.

echo ====================================
echo Quick Actions:
echo ====================================
echo 1. Start all servers: start-all-servers.bat
echo 2. Stop all servers:  stop-all-servers.bat
echo 3. View guide:        SERVER-GUIDE.md
echo.

pause
