@echo off
cls
echo ====================================
echo Week 3 Database Tables Checker
echo ====================================
echo.

cd "C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend"

echo Checking if Week 3 tables exist...
echo.

php artisan tinker --execute="
try {
    echo '----------------------------------------' . PHP_EOL;
    echo 'WEEK 3 TABLES CHECK' . PHP_EOL;
    echo '----------------------------------------' . PHP_EOL . PHP_EOL;

    // Check suppliers table
    try {
        \$count = \App\Models\Supplier::count();
        echo '✓ suppliers table EXISTS' . PHP_EOL;
        echo '  Records: ' . \$count . ' suppliers' . PHP_EOL;
        if (\$count > 0) {
            \$first = \App\Models\Supplier::first();
            echo '  Sample: ' . \$first->name . ' (' . \$first->code . ')' . PHP_EOL;
        }
    } catch (\Exception \$e) {
        echo '✗ suppliers table DOES NOT EXIST' . PHP_EOL;
        echo '  Error: ' . \$e->getMessage() . PHP_EOL;
    }
    echo PHP_EOL;

    // Check purchase_orders table
    try {
        \$count = \App\Models\PurchaseOrder::count();
        echo '✓ purchase_orders table EXISTS' . PHP_EOL;
        echo '  Records: ' . \$count . ' purchase orders' . PHP_EOL;
        if (\$count > 0) {
            \$first = \App\Models\PurchaseOrder::first();
            echo '  Sample: ' . \$first->po_number . ' (Status: ' . \$first->status . ')' . PHP_EOL;
        }
    } catch (\Exception \$e) {
        echo '✗ purchase_orders table DOES NOT EXIST' . PHP_EOL;
        echo '  Error: ' . \$e->getMessage() . PHP_EOL;
    }
    echo PHP_EOL;

    // Check po_items table
    try {
        \$count = \App\Models\POItem::count();
        echo '✓ po_items table EXISTS' . PHP_EOL;
        echo '  Records: ' . \$count . ' PO line items' . PHP_EOL;
    } catch (\Exception \$e) {
        echo '✗ po_items table DOES NOT EXIST' . PHP_EOL;
        echo '  Error: ' . \$e->getMessage() . PHP_EOL;
    }
    echo PHP_EOL;

    echo '----------------------------------------' . PHP_EOL;
    echo 'ALL OTHER TABLES' . PHP_EOL;
    echo '----------------------------------------' . PHP_EOL;

    // List all tables
    \$tables = \DB::select('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name');
    \$week3Tables = ['suppliers', 'purchase_orders', 'po_items'];

    echo PHP_EOL . 'Week 3 Tables:' . PHP_EOL;
    foreach (\$tables as \$table) {
        if (in_array(\$table->table_name, \$week3Tables)) {
            echo '  ✓ ' . \$table->table_name . PHP_EOL;
        }
    }

    echo PHP_EOL . 'Other Tables:' . PHP_EOL;
    foreach (\$tables as \$table) {
        if (!in_array(\$table->table_name, \$week3Tables)) {
            echo '  - ' . \$table->table_name . PHP_EOL;
        }
    }

} catch (\Exception \$e) {
    echo 'ERROR: ' . \$e->getMessage() . PHP_EOL;
}
"

echo.
echo ====================================
echo.

set /p SETUP="Do you want to create Week 3 tables now? (Y/N): "
if /i "%SETUP%"=="Y" (
    echo.
    echo Running database setup...
    call setup-database.bat
)

echo.
pause
