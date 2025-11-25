# 📊 Database Setup Guide - Create Week 3 Tables

## 🎯 Quick Setup (Easiest Method)

**Just double-click this file:**
```
setup-database.bat
```

This will:
1. ✅ Check database connection
2. ✅ Create all tables (including Week 3: suppliers, purchase_orders, po_items)
3. ✅ Add test data (7 suppliers, 15+ purchase orders)
4. ✅ Verify everything works

---

## 📝 Manual Setup (Step by Step)

If the batch file doesn't work, follow these steps:

### Step 1: Make Sure PostgreSQL is Running

**Check if it's running:**
```cmd
sc query postgresql-x64-14
```

**If not running, start it:**
```cmd
net start postgresql-x64-14
```

---

### Step 2: Check Database Connection

```cmd
cd C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend

php artisan db:show
```

**You should see:**
```
PostgreSQL ..................... 14.x
Database ....................... inventory_management
Host ........................... 127.0.0.1
Port ........................... 5433
Username ....................... postgres
```

**If you see an error**, check your `.env` file:
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=inventory_management
DB_USERNAME=postgres
DB_PASSWORD=Amma@143
```

---

### Step 3: Create All Database Tables

**This will create tables for Week 1, 2, AND 3:**

```cmd
php artisan migrate:fresh
```

**Expected Output:**
```
Dropped all tables successfully.
Migration table created successfully.

Migrating: 2024_01_01_000001_create_warehouses_table
Migrated:  2024_01_01_000001_create_warehouses_table (50.23ms)

Migrating: 2024_01_01_000002_create_locations_table
Migrated:  2024_01_01_000002_create_locations_table (45.67ms)

...

Migrating: 2025_11_08_000001_create_suppliers_table
Migrated:  2025_11_08_000001_create_suppliers_table (35.89ms)

Migrating: 2025_11_08_000002_create_purchase_orders_table
Migrated:  2025_11_08_000002_create_purchase_orders_table (42.15ms)

Migrating: 2025_11_08_000003_create_po_items_table
Migrated:  2025_11_08_000003_create_po_items_table (38.45ms)
```

✅ **Week 3 tables created:**
- suppliers
- purchase_orders
- po_items

---

### Step 4: Add Test Data (Seeding)

**This adds sample data to all tables:**

```cmd
php artisan db:seed
```

**Expected Output:**
```
🌱 Starting database seeding...
📋 Seeding roles and permissions...
📏 Seeding units of measure...
📦 Seeding master data (warehouses, products, etc.)...
👤 Admin user created: admin@example.com (password: password)
📊 Seeding inventory data (lots, movements, balances)...
🏢 Seeding suppliers...
✓ Created 7 suppliers
📝 Seeding purchase orders...
✓ Created 18 purchase orders with line items

📊 Purchase Orders Summary:
┌───────────┬───────┬──────────────┐
│ Status    │ Count │ Total Value  │
├───────────┼───────┼──────────────┤
│ Draft     │ 3     │ $1,234.56    │
│ Submitted │ 3     │ $2,345.67    │
│ Approved  │ 3     │ $3,456.78    │
│ Ordered   │ 3     │ $4,567.89    │
│ Partial   │ 3     │ $5,678.90    │
│ Received  │ 3     │ $6,789.01    │
└───────────┴───────┴──────────────┘
✅ Database seeding completed successfully!
```

---

### Step 5: Verify Tables Were Created

```cmd
php artisan tinker
```

**Then run these commands:**

```php
// Check suppliers
\App\Models\Supplier::count();
// Expected: 7

// Check purchase orders
\App\Models\PurchaseOrder::count();
// Expected: 15-20

// Check PO items
\App\Models\POItem::count();
// Expected: 40-80

// View first supplier
$supplier = \App\Models\Supplier::first();
$supplier->name;
// Expected: "TechGear Wholesale Inc."

// View first purchase order
$po = \App\Models\PurchaseOrder::first();
$po->po_number;
// Expected: "PO-2025-000001"

// Exit tinker
exit
```

---

## ✅ Success Checklist

After running the setup, you should have:

- [ ] PostgreSQL running on port 5433
- [ ] Database "inventory_management" exists
- [ ] **7 suppliers** created
- [ ] **15-20 purchase orders** created
- [ ] **40-80 PO line items** created
- [ ] **1 admin user** (admin@example.com / password)
- [ ] Products, warehouses, stock data from Week 1 & 2

---

## 🗄️ Week 3 Tables Explained

### 1. `suppliers` table
Stores supplier information:
- Supplier code (SUP-000001)
- Name, email, phone
- Contact address (JSON)
- Payment terms
- Credit limit
- Rating

### 2. `purchase_orders` table
Stores purchase orders:
- PO number (PO-2025-000001)
- Supplier relationship
- Warehouse destination
- Status (draft, submitted, approved, etc.)
- Dates (order, expected, approved)
- Totals (subtotal, tax, shipping)
- Approval tracking

### 3. `po_items` table
Stores PO line items:
- Purchase order relationship
- Product variant
- Quantities (ordered, received)
- Pricing (unit cost, discount, tax)
- Line totals

---

## 🔍 View Tables in pgAdmin

1. **Open pgAdmin**
2. **Connect to your server:**
   - Host: localhost
   - Port: 5433
   - Database: inventory_management
   - Username: postgres
   - Password: Amma@143

3. **Navigate to:**
   ```
   Servers → PostgreSQL → Databases → inventory_management
   → Schemas → public → Tables
   ```

4. **You should see:**
   - suppliers ✅
   - purchase_orders ✅
   - po_items ✅
   - users
   - products
   - warehouses
   - stock_movements
   - stock_balances
   - ... and more

5. **Right-click any table → View/Edit Data → All Rows** to see the data

---

## 🧪 Test Your Setup

### Test 1: Login via API

```cmd
curl -X POST http://127.0.0.1:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
```

**Expected:** JSON with token and user info

### Test 2: View Suppliers

Open browser:
```
http://127.0.0.1:8000/api/suppliers
```

**Expected:** List of 7 suppliers

### Test 3: View Purchase Orders

```
http://127.0.0.1:8000/api/purchase-orders
```

**Expected:** List of purchase orders

### Test 4: View PO as PDF

```
http://127.0.0.1:8000/api/purchase-orders/1/pdf
```

**Expected:** Professional PDF-style document

---

## ⚠️ Common Issues

### Issue 1: "SQLSTATE[08006] Connection refused"

**Problem:** Can't connect to PostgreSQL

**Solution:**
```cmd
# Check if PostgreSQL is running
sc query postgresql-x64-14

# Start it if not running
net start postgresql-x64-14
```

---

### Issue 2: "Database not found"

**Problem:** Database "inventory_management" doesn't exist

**Solution:**

1. **Open pgAdmin**
2. **Right-click on "Databases"**
3. **Create → Database**
4. **Name:** inventory_management
5. **Owner:** postgres
6. **Click Save**

Or via command line:
```cmd
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE inventory_management;"
```

---

### Issue 3: "Class Supplier not found"

**Problem:** Laravel can't find the models

**Solution:**
```cmd
cd backend
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

---

### Issue 4: Migration fails midway

**Problem:** Some tables created, some failed

**Solution:**
```cmd
# Start fresh
php artisan migrate:reset
php artisan migrate:fresh
php artisan db:seed
```

---

## 🔄 Reset Everything (Nuclear Option)

If everything is broken:

```cmd
cd backend

# Drop all tables
php artisan migrate:reset

# Recreate all tables
php artisan migrate

# Add test data
php artisan db:seed

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

---

## 📊 What Data Gets Created?

### Users
- 1 admin user (admin@example.com / password)

### Suppliers (7 total)
- TechGear Wholesale Inc. (5-star)
- Global Electronics Supply Co. (4-star)
- Premium Peripherals Ltd. (5-star)
- BudgetTech Distributors (3-star)
- International Tech Imports (4-star)
- QuickShip Electronics (5-star)
- Legacy Computer Parts Co. (inactive)

### Purchase Orders (15-20 total)
- Mix of all statuses (draft, submitted, approved, ordered, partial, received)
- 2-5 line items per PO
- Realistic pricing and quantities
- Linked to suppliers and warehouses

### Plus Week 1 & 2 Data
- Warehouses and locations
- Product categories
- Products and variants
- Inventory lots
- Stock movements
- Stock balances

---

## ✅ You're Ready!

After running the setup:

1. **Start servers:** `start-all-servers.bat`
2. **Open frontend:** http://localhost:5173
3. **Login with:**
   - Email: admin@example.com
   - Password: password

4. **Test Week 3 features:**
   - View suppliers
   - Create purchase orders
   - Approve POs
   - Generate PDF documents

---

**Need help?** Check `WEEK-3-COMPLETION.md` for detailed testing guide!
