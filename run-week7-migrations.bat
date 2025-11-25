@echo off
echo ========================================
echo Running Week 7 Migrations
echo ========================================
echo.

cd backend

echo Running migrations...
php artisan migrate --force

echo.
echo ========================================
echo Migrations Complete!
echo ========================================
echo.
echo You can now use Week 7 features:
echo - Stock Adjustments
echo - Inter-Warehouse Transfers
echo - Stock Counts (Cycle & Full)
echo.

pause
