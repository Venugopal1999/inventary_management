@echo off
echo ====================================
echo Fixing CORS Issue
echo ====================================
echo.

echo [1/3] Clearing Laravel caches...
cd "C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend"
php artisan config:clear
php artisan cache:clear
php artisan route:clear
echo ✓ Caches cleared
echo.

echo [2/3] Restarting backend server...
echo Please manually restart your backend server:
echo 1. Press Ctrl+C in the backend terminal
echo 2. Run: php artisan serve
echo.

echo [3/3] CORS Configuration Updated!
echo ✓ Added login, register, logout to CORS paths
echo ✓ Your frontend at localhost:5173 is now allowed
echo.

echo ====================================
echo Next Steps:
echo ====================================
echo 1. Restart your backend server (Ctrl+C then php artisan serve)
echo 2. Make sure your frontend calls: http://127.0.0.1:8000/api/login
echo    (NOT http://127.0.0.1:8000/login - note the /api/ prefix!)
echo.

pause
