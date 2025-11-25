@echo off
echo ====================================
echo Database Setup - Week 3
echo ====================================
echo.

cd "C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend"

echo [1/4] Testing database connection...
php artisan db:show
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Cannot connect to database!
    echo.
    echo Please check:
    echo 1. PostgreSQL is running (port 5433)
    echo 2. Database "inventory_management" exists
    echo 3. Username: postgres, Password: Amma@143
    echo.
    pause
    exit /b 1
)
echo ✓ Database connection successful!
echo.

echo [2/4] Creating all database tables (fresh migration)...
echo This will DROP all existing tables and recreate them.
echo.
set /p CONFIRM="Are you sure you want to continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Setup cancelled.
    pause
    exit /b 0
)
echo.

php artisan migrate:fresh
if %errorlevel% neq 0 (
    echo.
    echo ❌ Migration failed!
    echo Check the error above for details.
    pause
    exit /b 1
)
echo ✓ All tables created successfully!
echo.

echo [3/4] Adding test data (seeding)...
php artisan db:seed
if %errorlevel% neq 0 (
    echo.
    echo ❌ Seeding failed!
    pause
    exit /b 1
)
echo ✓ Test data added successfully!
echo.

echo [4/4] Verifying table creation...
php artisan tinker --execute="echo 'Suppliers: ' . \App\Models\Supplier::count() . PHP_EOL; echo 'Purchase Orders: ' . \App\Models\PurchaseOrder::count() . PHP_EOL; echo 'PO Items: ' . \App\Models\POItem::count() . PHP_EOL;"
echo.

echo ====================================
echo ✅ Database Setup Complete!
echo ====================================
echo.
echo Tables Created:
echo ✓ suppliers
echo ✓ purchase_orders
echo ✓ po_items
echo ✓ users (admin user)
echo ✓ products, warehouses, stock tables (from Week 1 & 2)
echo.
echo Default Login:
echo Email: admin@example.com
echo Password: password
echo.
echo Next: Start your servers with start-all-servers.bat
echo.
pause
