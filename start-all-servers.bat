@echo off
echo ====================================
echo Starting Inventory Management System
echo ====================================
echo.

:: Check if MySQL is running
echo [1/3] Checking MySQL...
sc query MySQL80 | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✓ MySQL is already running
) else (
    echo Starting MySQL...
    net start MySQL80
    if %errorlevel% == 0 (
        echo ✓ MySQL started successfully
    ) else (
        echo ✗ MySQL failed to start. Please start it manually from XAMPP.
    )
)
echo.

:: Start Backend Server in new window
echo [2/3] Starting Backend Server (Laravel)...
start "Backend Server" cmd /k "cd /d C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend && php artisan serve"
timeout /t 3 >nul
echo ✓ Backend server starting at http://127.0.0.1:8000
echo.

:: Start Frontend Server in new window
echo [3/3] Starting Frontend Server (Vite)...
start "Frontend Server" cmd /k "cd /d C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\frontend && npm run dev"
timeout /t 3 >nul
echo ✓ Frontend server starting at http://localhost:5173
echo.

echo ====================================
echo All servers are starting!
echo ====================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:5173

echo.
echo To stop servers: Close the terminal windows or press Ctrl+C in each
echo.
pause
