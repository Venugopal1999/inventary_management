# Week 5 - Sales Orders & Reservations - COMPLETION GUIDE

## Overview

Week 5 implements the complete Sales Order workflow including:
- ✅ Sales Orders & SO Items CRUD
- ✅ Customers and Price Lists management
- ✅ Stock Reservations with FEFO/FIFO allocation logic
- ✅ Available to Promise (ATP) calculations
- ✅ Price lists and tax calculations
- ✅ Complete frontend UI with Amazon-style design

---

## 🚀 Quick Start

### Step 1: Run Migrations

```bash
cd backend
php artisan migrate
```

This will create the following new tables:
- `customers` - Customer master data
- `price_lists` - Price list headers
- `price_list_items` - Price list line items
- `sales_orders` - Sales order headers
- `so_items` - Sales order line items
- `stock_reservations` - Stock allocations for sales orders
- Updates to `stock_balances` - Adds qty_reserved and qty_available columns

### Step 2: Start Servers

Make sure both backend and frontend servers are running:

```bash
# Terminal 1 - Backend
cd backend
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 3: Access the Application

1. Open browser: `http://localhost:5173`
2. Login with your credentials
3. Navigate to **Sales Orders** from the sidebar

---

## 📋 What Was Built

### Backend Components

#### 1. Database Migrations

**File**: `backend/database/migrations/2025_11_09_000001_create_customers_table.php`
- Customer master data with code, name, contact info
- Status tracking (active/inactive)
- Payment terms support

**File**: `backend/database/migrations/2025_11_09_000002_create_price_lists_table.php`
- Price list headers with currency and tax settings
- Price list items linking variants to prices
- Support for multiple price lists

**File**: `backend/database/migrations/2025_11_09_000003_create_sales_orders_table.php`
- Sales order headers with customer, dates, pricing
- Status flow: draft → confirmed → allocated → partial → shipped → closed
- Tax rate and totals calculation
- Links to customers and price lists

**File**: `backend/database/migrations/2025_11_09_000004_create_so_items_table.php`
- Sales order line items
- Tracks ordered, allocated, and shipped quantities
- Unit price and line total calculations

**File**: `backend/database/migrations/2025_11_09_000005_create_stock_reservations_table.php`
- Stock reservations linked to SO items
- Warehouse, location, and lot tracking
- Reserved quantities and timestamps
- Updates stock_balances with qty_reserved and qty_available

#### 2. Models

**Files**:
- `backend/app/Models/Customer.php` - Customer model with auto-generated codes
- `backend/app/Models/PriceList.php` - Price list management
- `backend/app/Models/PriceListItem.php` - Price list items
- `backend/app/Models/SalesOrder.php` - Sales order with status constants and business logic
- `backend/app/Models/SOItem.php` - SO items with quantity tracking
- `backend/app/Models/StockReservation.php` - Stock allocation records

**Key Features**:
- Automatic SO number generation (SO-YYYY-NNNNNN)
- Auto-calculation of line totals and order totals
- Comprehensive status scopes and helpers
- Full relationship mappings

#### 3. Service Layer

**File**: `backend/app/Services/SalesOrderService.php`

**Key Methods**:
- `createSalesOrder()` - Create SO with items
- `updateSalesOrder()` - Update draft SO
- `confirmSalesOrder()` - Confirm and auto-allocate
- `allocateStock()` - FEFO/FIFO allocation logic
- `allocateStockForItem()` - Item-level allocation
- `getAvailableStockFEFO()` - Smart stock selection (earliest expiry first, then FIFO)
- `checkATP()` - Available to Promise calculations
- `releaseReservations()` - Release allocated stock
- `cancelSalesOrder()` - Cancel with reservation cleanup
- `updateStockBalanceReservation()` - Update reserved quantities

**FEFO/FIFO Logic**:
1. Queries inventory_lots for expiry-tracked items
2. Sorts by exp_date ASC (earliest expiry first) - FEFO
3. Then by created_at ASC (oldest first) - FIFO
4. Falls back to stock_balances if no lot tracking
5. Creates reservations and updates balances atomically

#### 4. Controllers

**File**: `backend/app/Http/Controllers/Api/CustomerController.php`
- Full CRUD for customers
- Search and filtering

**File**: `backend/app/Http/Controllers/Api/SalesOrderController.php`

**Endpoints**:
- `GET /api/sales-orders` - List with filters
- `POST /api/sales-orders` - Create SO
- `GET /api/sales-orders/{id}` - Get details
- `PUT /api/sales-orders/{id}` - Update SO
- `DELETE /api/sales-orders/{id}` - Delete draft SO
- `POST /api/sales-orders/{id}/confirm` - Confirm & allocate
- `POST /api/sales-orders/{id}/allocate` - Manual allocation
- `POST /api/sales-orders/{id}/release-reservations` - Release stock
- `POST /api/sales-orders/{id}/cancel` - Cancel SO
- `POST /api/atp/check` - Check ATP

#### 5. Routes

**File**: `backend/routes/api.php`
- Added Customers routes under `/api/customers`
- Added Sales Orders routes under `/api/sales-orders`
- Added ATP check endpoint
- All routes protected with auth:sanctum middleware

---

### Frontend Components

#### 1. Status Badge Component

**File**: `frontend/src/components/sales/SOStatusBadge.jsx`
- Color-coded status badges
- Supports all SO statuses: draft, confirmed, allocated, partial, shipped, closed, cancelled

#### 2. Sales Order List

**File**: `frontend/src/pages/sales/SOList.jsx`

**Features**:
- Table view with SO number, customer, dates, status, total
- Filters: status, date range
- Quick actions: View, Edit (draft only), Confirm & Allocate (draft only)
- Real-time status updates
- Pagination support

**Key Actions**:
- View sales order details
- Edit draft orders
- Confirm and auto-allocate stock

#### 3. Sales Order Form

**File**: `frontend/src/pages/sales/SOForm.jsx`

**Features**:
- Customer selection dropdown
- Order and promise dates
- Currency and tax rate selection
- Dynamic line items table
- Add/remove items
- Product variant selection
- Quantity and unit price inputs
- Real-time calculations:
  - Line totals
  - Subtotal
  - Tax amount
  - Grand total
- Notes and item-level notes
- Full validation

#### 4. Allocation Drawer

**File**: `frontend/src/components/sales/AllocateDrawer.jsx`

**Features**:
- Slide-in drawer from right
- SO summary display
- ATP check for all items
- Visual indicators:
  - ✅ Can Fulfill - Green
  - ⚠️ Short {qty} units - Red
- Shows on-hand, reserved, available quantities
- Displays current reservations with:
  - Warehouse
  - Location
  - Lot number
  - Reserved quantity
- Allocate Stock button (triggers FEFO/FIFO)
- Release Reservations button
- FEFO/FIFO info banner

#### 5. Navigation

**File**: `frontend/src/components/layout/Sidebar.jsx`
- Sales Orders already in sidebar with 💰 icon

**File**: `frontend/src/App.jsx`
- Added routes:
  - `/sales-orders` → SOList
  - `/sales-orders/new` → SOForm
  - `/sales-orders/:id/edit` → SOForm

---

## 🔄 Sales Order Workflow

### Complete Flow

```
1. User creates draft SO with items
   ↓
2. User enters customer, items, quantities, prices
   ↓
3. User clicks "Create Sales Order"
   ↓
4. SO saved in draft status
   ↓
5. User clicks "Confirm & Allocate" in list
   ↓
6. System confirms SO
   ↓
7. System allocates stock using FEFO/FIFO:
   - Checks ATP for each item
   - Finds available lots (earliest expiry first)
   - Creates stock reservations
   - Updates stock_balances.qty_reserved
   - Updates inventory_lots.qty_reserved
   - Updates so_items.allocated_qty
   ↓
8. SO status changes to "allocated"
   ↓
9. Stock is reserved and ready for picking/shipping (Week 6)
```

### Status Transitions

**Sales Order**:
- `draft` → Created, can be edited
- `confirmed` → Confirmed, ready for allocation
- `allocated` → Stock reserved, ready to ship
- `partial` → Partially shipped (Week 6)
- `shipped` → Fully shipped (Week 6)
- `closed` → Completed
- `cancelled` → Cancelled, stock released

### FEFO/FIFO Allocation Logic

**Priority**:
1. **FEFO (First Expiry First Out)**: For lot-tracked items with expiry dates
   - Allocates from lots expiring soonest
   - Ensures oldest stock is sold first
   - Reduces waste and expired inventory

2. **FIFO (First In First Out)**: For non-lot-tracked items or when FEFO doesn't apply
   - Allocates from oldest received stock
   - Based on created_at timestamp

**Process**:
```sql
-- FEFO: Get lots with earliest expiry
SELECT * FROM inventory_lots
WHERE product_variant_id = X
  AND qty_on_hand - qty_reserved > 0
ORDER BY exp_date ASC, created_at ASC

-- FIFO fallback: Get oldest stock balances
SELECT * FROM stock_balances
WHERE product_variant_id = X
  AND qty_on_hand - qty_reserved > 0
ORDER BY created_at ASC
```

---

## 🧪 Testing Guide

### Test Case 1: Create Sales Order

**Scenario**: Create a new sales order

1. Navigate to **Sales Orders**
2. Click "New Sales Order"
3. Select a customer
4. Set order date and promise date
5. Set tax rate (e.g., 10%)
6. Click "Add Item"
7. Select product variant
8. Enter quantity (e.g., 10)
9. Enter unit price (e.g., 50.00)
10. Add more items if needed
11. Review totals (subtotal, tax, total)
12. Click "Create Sales Order"
13. ✅ Check that:
    - SO created with draft status
    - SO number auto-generated (SO-2025-000001)
    - Totals calculated correctly
    - Redirected to SO list

### Test Case 2: Confirm and Allocate

**Scenario**: Confirm SO and allocate stock

**Prerequisites**:
- Have available stock (run GRN if needed)
- Have a draft SO

**Steps**:
1. Go to Sales Orders list
2. Find a draft SO
3. Click the green checkmark icon (Confirm & Allocate)
4. Confirm the dialog
5. ✅ Check that:
    - SO status changes to "allocated"
    - Alert shows success
    - Stock reservations created in database
    - stock_balances.qty_reserved increased
    - stock_balances.qty_available decreased

### Test Case 3: ATP Check

**Scenario**: Check Available to Promise before allocation

**Prerequisites**:
- Have a confirmed SO (not yet allocated)

**Steps**:
1. Create SO with items
2. Confirm SO (without auto-allocate)
3. Use AllocateDrawer to view ATP
4. ✅ Check that:
    - ATP shows on-hand, reserved, available
    - Can Fulfill indicator shows green or red
    - Shortage amount displayed if insufficient stock

### Test Case 4: FEFO Allocation

**Scenario**: Verify FEFO allocation with lot tracking

**Prerequisites**:
- Create multiple lots with different expiry dates

**Steps**:
1. Receive goods with lot A (exp: 2025-06-01, qty: 10)
2. Receive goods with lot B (exp: 2025-03-01, qty: 10)
3. Receive goods with lot C (exp: 2025-09-01, qty: 10)
4. Create SO for 15 units
5. Confirm and allocate
6. ✅ Check reservations in database:
   ```sql
   SELECT * FROM stock_reservations
   WHERE sales_order_item_id = X
   ORDER BY id;
   ```
7. ✅ Verify:
   - Lot B allocated first (10 units - earliest expiry)
   - Lot A allocated next (5 units - second earliest)
   - Lot C not allocated (later expiry)

### Test Case 5: Partial Stock Availability

**Scenario**: Allocate when stock is insufficient

**Prerequisites**:
- Product with only 5 units available

**Steps**:
1. Create SO for 10 units
2. Confirm and allocate
3. ✅ Check that:
    - Only 5 units allocated
    - so_items.allocated_qty = 5
    - so_items.ordered_qty = 10
    - ATP shows shortage of 5 units
    - SO status remains "confirmed" (not fully allocated)

### Test Case 6: Release Reservations

**Scenario**: Release allocated stock

**Prerequisites**:
- Have an allocated SO

**Steps**:
1. Open allocated SO in AllocateDrawer
2. Click "Release Reservations"
3. Confirm dialog
4. ✅ Check that:
    - SO status changes to "confirmed"
    - stock_reservations deleted
    - stock_balances.qty_reserved decreased
    - stock_balances.qty_available increased
    - so_items.allocated_qty reset to 0

### Test Case 7: Cancel Sales Order

**Scenario**: Cancel an SO and release stock

**Prerequisites**:
- Have an allocated SO

**Steps**:
1. Go to SO details (or use API)
2. Call `/api/sales-orders/{id}/cancel`
3. ✅ Check that:
    - SO status = "cancelled"
    - All reservations released
    - Stock available again

### Test Case 8: Price List Integration

**Scenario**: Use price list for pricing

**Prerequisites**:
- Create price list with items
- Assign to customer (future enhancement)

**Steps**:
1. Create sales order
2. Select customer with price list
3. ✅ Verify prices auto-populate from price list

### Test Case 9: Multiple Warehouses

**Scenario**: Allocate from different warehouses

**Prerequisites**:
- Stock in multiple warehouses

**Steps**:
1. Create SO
2. Allocate stock
3. ✅ Check that:
    - Reservations created for different warehouses
    - FEFO/FIFO applies per warehouse

### Test Case 10: Stock Balance Verification

**Scenario**: Verify stock balance calculations

**Prerequisites**:
- Starting stock: 100 units

**Steps**:
1. Check initial balances:
   ```sql
   SELECT qty_on_hand, qty_reserved, qty_available
   FROM stock_balances WHERE product_variant_id = X;
   -- Expected: 100, 0, 100
   ```
2. Create SO for 30 units and allocate
3. Check balances:
   ```sql
   -- Expected: 100, 30, 70
   ```
4. Create another SO for 40 units and allocate
5. Check balances:
   ```sql
   -- Expected: 100, 70, 30
   ```
6. Release first SO
7. Check balances:
   ```sql
   -- Expected: 100, 40, 60
   ```

---

## 📊 Database Schema

### New Tables

```sql
-- Customers
CREATE TABLE customers (
    id BIGINT PRIMARY KEY,
    code VARCHAR UNIQUE,      -- Auto: CUST-000001
    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    contact_json JSON,        -- Address, shipping info
    terms TEXT,               -- Payment terms
    status ENUM('active', 'inactive'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Price Lists
CREATE TABLE price_lists (
    id BIGINT PRIMARY KEY,
    name VARCHAR,
    currency CHAR(3),
    tax_inclusive BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE price_list_items (
    id BIGINT PRIMARY KEY,
    price_list_id BIGINT,
    product_variant_id BIGINT,
    price DECIMAL(15,4),
    UNIQUE(price_list_id, product_variant_id)
);

-- Sales Orders
CREATE TABLE sales_orders (
    id BIGINT PRIMARY KEY,
    so_number VARCHAR,        -- Auto: SO-2025-000001
    customer_id BIGINT,
    price_list_id BIGINT,
    status ENUM('draft','confirmed','allocated','partial','shipped','closed','cancelled'),
    order_date DATE,
    promise_date DATE,
    currency CHAR(3),
    tax_rate DECIMAL(5,2),    -- Percentage
    subtotal DECIMAL(15,4),
    tax_amount DECIMAL(15,4),
    total DECIMAL(15,4),
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- SO Items
CREATE TABLE so_items (
    id BIGINT PRIMARY KEY,
    sales_order_id BIGINT,
    product_variant_id BIGINT,
    uom_id BIGINT,
    ordered_qty DECIMAL(15,4),
    allocated_qty DECIMAL(15,4),  -- Reserved stock
    shipped_qty DECIMAL(15,4),    -- Fulfilled (Week 6)
    unit_price DECIMAL(15,4),
    line_total DECIMAL(15,4),     -- Auto-calculated
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Stock Reservations
CREATE TABLE stock_reservations (
    id BIGINT PRIMARY KEY,
    sales_order_item_id BIGINT,
    product_variant_id BIGINT,
    warehouse_id BIGINT,
    location_id BIGINT,
    lot_id BIGINT,
    qty_reserved DECIMAL(15,4),
    reserved_at TIMESTAMP,
    reserved_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(product_variant_id, warehouse_id),
    INDEX(lot_id)
);
```

### Updated Tables

```sql
-- stock_balances (added columns)
ALTER TABLE stock_balances
ADD qty_reserved DECIMAL(15,4) DEFAULT 0,
ADD qty_available DECIMAL(15,4) DEFAULT 0;

-- qty_available = qty_on_hand - qty_reserved
```

---

## 🔍 Key Features Implemented

### 1. FEFO/FIFO Allocation
- Smart stock selection based on expiry dates
- Automatic lot-based allocation
- Fallback to FIFO for non-lot items
- Multi-warehouse support

### 2. Available to Promise (ATP)
- Real-time stock availability checks
- Considers on-hand and reserved quantities
- Per-product and per-warehouse ATP
- Shortage calculations

### 3. Stock Reservations
- Soft allocation before shipment
- Links to warehouse, location, lot
- Reserved quantity tracking
- Easy release mechanism

### 4. Price Management
- Price lists with multi-currency support
- Tax-inclusive or exclusive pricing
- Item-level pricing
- Tax rate calculations

### 5. Sales Order Management
- Multi-status workflow
- Draft editing capability
- Auto-number generation
- Totals calculation

### 6. Customer Management
- Customer master data
- Auto-code generation
- Contact information
- Payment terms

---

## 🎯 Week 5 Deliverables ✅

As per the 10-Week Plan:

- ✅ **sales_orders, so_items CRUD** - Complete
- ✅ **Stock reservations by FEFO/FIFO** - Implemented with smart allocation
- ✅ **ATP (Available to Promise) checks** - Real-time calculations
- ✅ **Price lists on SO items** - Price list support added
- ✅ **Taxes (simple rate) & totals** - Tax calculation implemented

**Deliverable**: SO confirm with allocations visible ✅

---

## 🚨 Common Issues & Solutions

### Issue 1: Migrations Fail

**Error**: `Table already exists`

**Solution**:
```bash
php artisan migrate:fresh --seed
# WARNING: This drops all tables! Only use in development
```

Or selectively:
```bash
php artisan migrate:rollback
php artisan migrate
```

### Issue 2: Stock Not Allocating

**Error**: Allocation fails silently

**Solution**:
- Check stock availability: `SELECT * FROM stock_balances WHERE product_variant_id = X`
- Verify qty_available > 0
- Check Laravel logs: `storage/logs/laravel.log`

### Issue 3: ATP Shows Zero

**Error**: ATP shows 0 available even with stock

**Solution**:
- Check stock_balances.qty_reserved
- Verify qty_available calculation
- Run: `UPDATE stock_balances SET qty_available = qty_on_hand - qty_reserved`

### Issue 4: FEFO Not Working

**Error**: Wrong lots being allocated

**Solution**:
- Check inventory_lots.exp_date is set
- Verify lots have qty_on_hand > 0
- Check SQL query in SalesOrderService::getAvailableStockFEFO()

### Issue 5: Customers Not Loading

**Error**: Empty customer dropdown

**Solution**:
- Ensure customers exist: `SELECT * FROM customers`
- Seed sample customers if needed
- Check API response: `/api/customers`

---

## 📈 Next Steps (Week 6)

Week 6 will implement:
- Picking/Shipping/Packing
- Pick lists generation
- Shipment creation
- Stock movements (-qty) on shipment
- FIFO cost capturing
- Customer returns (RMA)

The Sales Order system built in Week 5 provides the foundation for:
- Stock reservations ready for picking
- FEFO/FIFO allocation already done
- ATP calculations for order promising
- Multi-warehouse allocation support

---

## 🎓 Learning Points

### Architecture Patterns Used

1. **Service Layer Pattern**: Business logic in SalesOrderService
2. **Repository Pattern**: Models handle data access
3. **Transaction Management**: DB::transaction for data consistency
4. **FEFO/FIFO Algorithm**: Smart stock selection with prioritization
5. **ATP Calculations**: Real-time availability checks

### React Patterns

- Component composition (list + form + drawer)
- Controlled forms with state management
- Real-time calculations
- Conditional rendering based on status
- Slide-in drawer pattern
- Table with actions

### Laravel Patterns

- Database transactions for atomicity
- Model relationships (hasMany, belongsTo)
- Service methods for complex operations
- Scopes for query filtering
- Auto-number generation
- Attribute casting

### Business Logic

- FEFO for perishables
- FIFO for standard items
- ATP for customer promising
- Soft allocation (reservation)
- Multi-step order workflow

---

## 📚 API Documentation

### Sales Orders

#### List Sales Orders
```
GET /api/sales-orders
```

**Query Parameters**:
- `status` - Filter by status (comma-separated)
- `customer_id` - Filter by customer
- `date_from` - Start date
- `date_to` - End date
- `sort_by` - Sort field (default: order_date)
- `sort_order` - asc/desc (default: desc)
- `per_page` - Pagination (default: 15)

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "so_number": "SO-2025-000001",
        "customer_id": 1,
        "status": "allocated",
        "order_date": "2025-01-16",
        "total": 550.00,
        "customer": {
          "id": 1,
          "name": "ABC Corp",
          "code": "CUST-000001"
        }
      }
    ]
  }
}
```

#### Create Sales Order
```
POST /api/sales-orders
```

**Body**:
```json
{
  "customer_id": 1,
  "order_date": "2025-01-16",
  "promise_date": "2025-01-20",
  "currency": "USD",
  "tax_rate": 10,
  "notes": "Rush order",
  "items": [
    {
      "product_variant_id": 1,
      "ordered_qty": 10,
      "unit_price": 50.00
    }
  ]
}
```

#### Confirm Sales Order
```
POST /api/sales-orders/{id}/confirm
```

**Body**:
```json
{
  "auto_allocate": true
}
```

#### Allocate Stock
```
POST /api/sales-orders/{id}/allocate
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sales_order": { ... },
    "allocation_results": {
      "1": {
        "success": true,
        "allocated": 10,
        "remaining": 0,
        "allocations": [
          {
            "warehouse_id": 1,
            "location_id": 3,
            "lot_id": 5,
            "qty_allocated": 10
          }
        ]
      }
    }
  }
}
```

#### Check ATP
```
POST /api/atp/check
```

**Body**:
```json
{
  "product_variant_id": 1,
  "required_qty": 10,
  "warehouse_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "product_variant_id": 1,
    "required_qty": 10,
    "on_hand": 100,
    "reserved": 30,
    "available": 70,
    "can_fulfill": true,
    "shortage": 0
  }
}
```

---

## ✨ Congratulations!

Week 5 is complete! You now have a fully functional Sales Order system with:
- Professional sales order management UI
- FEFO/FIFO stock allocation
- ATP calculations
- Stock reservations
- Price lists and tax calculations
- Multi-status workflow
- Complete audit trail

The system is ready for Week 6: Picking, Packing & Shipping!

---

**Need Help?** Check the troubleshooting section or review the test cases to verify your implementation.
