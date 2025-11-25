@echo off
cls
color 0A
echo.
echo ========================================
echo   CREATING WEEK 3 TABLES
echo ========================================
echo.
echo This will:
echo 1. Create all database tables
echo 2. Add 7 suppliers
echo 3. Add 15-20 purchase orders
echo 4. Add test data
echo.
echo Press any key to start...
pause >nul

cd "C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend"

echo.
echo ========================================
echo Step 1/2: Creating Tables...
echo ========================================
echo.

php artisan migrate:fresh --force

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR: Failed to create tables!
    echo.
    echo Possible reasons:
    echo - PostgreSQL is not running
    echo - Database connection error
    echo - PHP is not installed
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Tables created successfully!
echo.
echo ========================================
echo Step 2/2: Adding Test Data...
echo ========================================
echo.

php artisan db:seed

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR: Failed to add test data!
    echo.
    pause
    exit /b 1
)

color 0A
echo.
echo ========================================
echo   ✅ SUCCESS!
echo ========================================
echo.
echo Week 3 tables created:
echo   ✓ suppliers (7 records)
echo   ✓ purchase_orders (15-20 records)
echo   ✓ po_items (40-80 records)
echo.
echo Default login credentials:
echo   Email: admin@example.com
echo   Password: password
echo.
echo ========================================
echo.
echo Now check pgAdmin4:
echo 1. Go to: Tables (refresh if needed)
echo 2. You should see: suppliers, purchase_orders, po_items
echo 3. Right-click any table → View/Edit Data → All Rows
echo.
echo Press any key to exit...
pause >nul
