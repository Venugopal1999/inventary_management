# Week 4 - Goods Receipt (GRN) & Putaway - COMPLETION GUIDE

## Overview

Week 4 implements the complete Goods Receiving workflow including:
- ✅ Goods Receipt creation from Purchase Orders
- ✅ Multi-step receiving wizard (5 steps)
- ✅ Inventory lot creation and tracking
- ✅ Putaway to warehouse locations
- ✅ Stock movement creation
- ✅ Stock balance updates
- ✅ Partial receipt handling
- ✅ FIFO/FEFO support

---

## 🚀 Quick Start

### Step 1: Run Migrations

```bash
cd backend
php artisan migrate
```

This will create the following new tables:
- `goods_receipts` - Main GRN header table
- `grn_items` - GRN line items with warehouse and location assignments

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
3. Navigate to **Goods Receipts** from the sidebar

---

## 📋 What Was Built

### Backend Components

#### 1. Database Migrations

**File**: `backend/database/migrations/2025_11_08_000004_create_goods_receipts_table.php`
- Tracks goods receipt header information
- Links to purchase orders
- Records received date and user
- Status tracking (draft, partial, completed, cancelled)

**File**: `backend/database/migrations/2025_11_08_000005_create_grn_items_table.php`
- Individual line items for each receipt
- Links to PO items and product variants
- Warehouse and location assignment
- Inventory lot tracking
- Received quantities and costs

#### 2. Models

**Files**:
- `backend/app/Models/GoodsReceipt.php` - Already existed, updated fillable fields
- `backend/app/Models/GRNItem.php` - Added warehouse_id, location_id, and relationships
- `backend/app/Models/InventoryLot.php` - Already existed from Week 2
- `backend/app/Models/StockBalance.php` - Already existed from Week 2

#### 3. Service Layer

**File**: `backend/app/Services/GoodsReceiptService.php`

Key methods:
- `createGoodsReceipt()` - Initialize GRN from PO
- `receiveItems()` - Process received items
- `postGoodsReceipt()` - Create stock movements and update balances
- `createStockMovement()` - Record inventory transactions
- `updateStockBalance()` - Update warehouse balances
- `createOrUpdateInventoryLot()` - Manage lot numbers
- `updatePurchaseOrderStatus()` - Update PO status based on receipts
- `getPurchaseOrderForReceiving()` - Get PO details formatted for receiving

#### 4. Controller

**File**: `backend/app/Http/Controllers/Api/GoodsReceiptController.php`

Endpoints:
- `GET /api/goods-receipts` - List all GRNs with filters
- `POST /api/goods-receipts` - Create new GRN
- `GET /api/goods-receipts/{id}` - Get GRN details
- `POST /api/goods-receipts/{id}/receive-items` - Receive items
- `POST /api/goods-receipts/{id}/post` - Post GRN (finalize)
- `POST /api/goods-receipts/{id}/cancel` - Cancel GRN
- `GET /api/warehouses/{id}/locations` - Get warehouse locations
- `GET /api/purchase-orders/{id}/for-receiving` - Get PO for receiving

#### 5. Routes

**File**: `backend/routes/api.php`
- Added complete GRN API routes under `/api/goods-receipts` prefix
- Added helper endpoints for wizard

---

### Frontend Components

#### 1. Wizard Components

**File**: `frontend/src/components/wizard/WizardStepper.jsx`
- Reusable stepper component with progress visualization
- Shows completed, active, and upcoming steps
- Amazon-style design with orange highlight

**File**: `frontend/src/pages/purchasing/GRNWizard.jsx`
- Main wizard container managing state across all steps
- Coordinates between 5 sub-steps
- Handles navigation and cancellation

#### 2. Wizard Steps

**Step 1**: `frontend/src/pages/purchasing/grn/SelectPOStep.jsx`
- Lists available purchase orders (approved, ordered, partial status)
- Shows PO details: supplier, dates, items count
- Creates initial GRN draft
- Fetches PO details for receiving

**Step 2**: `frontend/src/pages/purchasing/grn/ReceiveItemsStep.jsx`
- Scan barcode or enter SKU functionality
- Shows ordered vs received vs remaining quantities
- Input received quantities with validation
- Prevents over-receiving
- Real-time summary display

**Step 3**: `frontend/src/pages/purchasing/grn/InventoryLotsStep.jsx`
- Create lot numbers for batch tracking
- Enter manufacturing and expiry dates
- Optional step (can be skipped)
- Important for FEFO picking

**Step 4**: `frontend/src/pages/purchasing/grn/PutawayStep.jsx`
- Assign warehouse (required) for each item
- Assign bin location (optional)
- Fetches available locations per warehouse
- Supports bulk storage (no specific location)

**Step 5**: `frontend/src/pages/purchasing/grn/ReviewStep.jsx`
- Review all entered information
- Shows complete summary
- Posts GRN (creates movements, updates balances)
- Handles errors gracefully
- Confirmation dialog before posting

#### 3. List and Navigation

**File**: `frontend/src/pages/purchasing/GRNList.jsx`
- Lists all goods receipts
- Filter by status, date range
- Shows GRN number, PO, supplier, status, item count
- Links to create new GRN

**File**: `frontend/src/components/purchasing/GRNStatusBadge.jsx`
- Visual status indicators
- Color-coded: draft (gray), partial (yellow), completed (green), cancelled (red)

#### 4. Routing and Navigation

**File**: `frontend/src/App.jsx`
- Added routes: `/goods-receipts` and `/goods-receipts/new`

**File**: `frontend/src/components/layout/Sidebar.jsx`
- Added "Goods Receipts" navigation link with 📥 icon

---

## 🔄 GRN Workflow

### Complete Flow

```
1. User selects approved PO
   ↓
2. System creates draft GRN
   ↓
3. User scans/enters received quantities
   ↓
4. User creates lot numbers (optional)
   ↓
5. User assigns warehouses and locations
   ↓
6. User reviews and posts
   ↓
7. System creates:
   - Stock movements (+qty)
   - Updates stock balances
   - Updates/creates inventory lots
   - Updates PO status
   ↓
8. Stock is now available in inventory
```

### Status Transitions

**Goods Receipt**:
- `draft` → Created but no items received yet
- `partial` → Some items received but not posted
- `completed` → Posted, stock updated
- `cancelled` → Cancelled before completion

**Purchase Order** (updated by GRN):
- `approved` → `partial` (some items received)
- `partial` → `received` (all items received)

---

## 🧪 Testing Guide

### Test Case 1: Basic Receiving

**Scenario**: Receive all items from a PO

1. Navigate to **Purchase Orders**
2. Create a new PO with 2-3 items
3. Submit and approve the PO
4. Navigate to **Goods Receipts**
5. Click "New Goods Receipt"
6. Select the PO you just created
7. **Step 2**: Enter received quantities (equal to ordered)
8. **Step 3**: Skip lot numbers
9. **Step 4**: Select warehouse (first one)
10. **Step 5**: Review and click "Post Goods Receipt"
11. ✅ Check that:
    - GRN status is "Completed"
    - PO status changed to "Received"
    - Stock balance increased

### Test Case 2: Partial Receipt

**Scenario**: Receive only some items from a PO

1. Create PO with 3 items, 10 qty each
2. Create GRN
3. **Step 2**: Receive only 5 units of first item, 10 of second, 0 of third
4. Complete wizard
5. ✅ Check that:
    - PO status is "Partial"
    - Can create another GRN for same PO
    - Remaining quantities are correct

### Test Case 3: Lot Tracking

**Scenario**: Receive items with lot numbers and expiry dates

1. Create PO
2. Create GRN
3. **Step 2**: Receive items
4. **Step 3**: Enter lot numbers and expiry dates
   - Lot: `LOT-2024-001`
   - Mfg Date: Today
   - Exp Date: 6 months from now
5. Complete wizard
6. ✅ Check that:
    - Inventory lots created
    - Lot quantity matches received quantity

### Test Case 4: Multiple Warehouses

**Scenario**: Receive items into different warehouses

1. Ensure you have 2+ warehouses
2. Create PO with 2+ items
3. Create GRN
4. **Step 4**: Assign different warehouses to different items
5. Complete wizard
6. ✅ Check that:
    - Stock balances updated in respective warehouses
    - Stock movements reference correct warehouses

### Test Case 5: Location Assignment

**Scenario**: Putaway to specific bin locations

1. Ensure warehouses have locations configured
2. Create GRN
3. **Step 4**:
   - Select warehouse
   - Select specific location (e.g., "A-01-01")
4. Complete wizard
5. ✅ Check that:
    - Stock balance shows correct location
    - Stock movement references location

### Test Case 6: Barcode Scanning

**Scenario**: Use scan functionality in Step 2

1. Create GRN
2. **Step 2**: Click on scan input field
3. Type a SKU and press Enter
4. ✅ Check that:
    - Quantity input for that SKU is focused
    - Can quickly enter received quantity
    - Input clears after scan

### Test Case 7: Validation

**Scenario**: Test error handling

1. Create GRN
2. **Step 2**: Try to receive MORE than ordered quantity
3. ✅ Check that: Alert shows "Cannot receive more than ordered"
4. Try to proceed to Step 3 without receiving any items
5. ✅ Check that: Alert shows "Please receive at least one item"
6. **Step 4**: Try to proceed without selecting warehouse
7. ✅ Check that: Alert shows "Please assign a warehouse for all items"

### Test Case 8: Stock Movement Verification

**Scenario**: Verify stock movements are created correctly

1. Complete a GRN
2. Check database table `stock_movements`:
   ```sql
   SELECT * FROM stock_movements
   WHERE ref_type = 'GRN'
   ORDER BY id DESC LIMIT 5;
   ```
3. ✅ Verify:
   - `qty_delta` is positive (receiving increases stock)
   - `unit_cost` matches PO item cost
   - `warehouse_id`, `location_id`, `lot_id` are correct
   - `ref_id` matches GRN id

### Test Case 9: Stock Balance Updates

**Scenario**: Verify stock balances update correctly

1. Before receiving, check stock balance:
   ```sql
   SELECT * FROM stock_balances
   WHERE product_variant_id = X AND warehouse_id = Y;
   ```
2. Complete GRN receiving 10 units
3. Check stock balance again
4. ✅ Verify:
   - `qty_on_hand` increased by 10
   - `qty_available` = `qty_on_hand` - `qty_reserved`

### Test Case 10: FIFO Layer Creation

**Scenario**: Verify inventory lots create FIFO layers

1. Receive items with lot data
2. Check `inventory_lots` table:
   ```sql
   SELECT * FROM inventory_lots
   WHERE product_variant_id = X
   ORDER BY exp_date ASC;
   ```
3. ✅ Verify:
   - Lot created with correct dates
   - `qty_on_hand` matches received quantity
   - Multiple receipts create multiple lots

---

## 📊 Database Changes

### New Tables

```sql
-- Goods Receipts
CREATE TABLE goods_receipts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id BIGINT,
    received_at TIMESTAMP,
    received_by BIGINT,
    status ENUM('draft', 'partial', 'completed', 'cancelled'),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- GRN Items
CREATE TABLE grn_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    goods_receipt_id BIGINT,
    po_item_id BIGINT,
    product_variant_id BIGINT,
    warehouse_id BIGINT,
    location_id BIGINT NULL,
    lot_id BIGINT NULL,
    received_qty DECIMAL(15,4),
    unit_cost DECIMAL(15,4),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id),
    FOREIGN KEY (po_item_id) REFERENCES po_items(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (lot_id) REFERENCES inventory_lots(id)
);
```

### Updated Tables

- `po_items.received_qty` - Incremented when items are received
- `purchase_orders.status` - Updated to 'partial' or 'received'
- `stock_balances.qty_on_hand` - Increased by received quantities
- `inventory_lots.qty_on_hand` - Increased when lots are used

---

## 🔍 Key Features Implemented

### 1. Multi-Step Wizard
- Clean, intuitive 5-step process
- Visual progress indicator
- Back/forward navigation
- Cancel at any point (with confirmation)

### 2. Flexible Receiving
- Partial receipts supported
- Over-receiving prevented
- Barcode scanning ready
- Real-time quantity validation

### 3. Lot Management
- Optional lot number creation
- Manufacturing and expiry date tracking
- Supports FEFO (First Expiry First Out)
- Automatic lot-to-receipt linking

### 4. Warehouse & Location Support
- Multi-warehouse receiving
- Optional bin location assignment
- Bulk storage option (no specific location)
- Dynamic location loading per warehouse

### 5. Stock Movement Tracking
- Immutable audit trail
- Links to GRN reference
- Tracks user, timestamp, cost
- Supports warehouse and location

### 6. Stock Balance Updates
- Real-time balance updates
- Separate tracking of on-hand, reserved, available
- Per warehouse and location
- Foundation for ATP (Available to Promise)

### 7. Business Logic
- PO status auto-updates
- Partial receipt handling
- Backorder detection
- Received quantity validation

---

## 🎯 Week 4 Deliverables ✅

As per the 10-Week Plan:

- ✅ **goods_receipts, grn_items CRUD** - Complete
- ✅ **Scan receiving** - Barcode scan input implemented
- ✅ **Create inventory_lots & stock_movements(+qty) with unit_cost** - Complete
- ✅ **Putaway to bins/locations** - Warehouse and location assignment
- ✅ **stock_balances update** - Real-time balance updates
- ✅ **Handle partial receipts & backorder** - Fully supported

**Deliverable**: Receive goods, see SOH rise and FIFO layers populated ✅

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

### Issue 2: Warehouses Not Loading

**Error**: Empty warehouse dropdown in Step 4

**Solution**:
- Ensure warehouses exist in database
- Check API endpoint: `GET /api/warehouses`
- Verify authentication token is valid

### Issue 3: Locations Not Loading

**Error**: Location dropdown stays empty

**Solution**:
- Check warehouse has locations configured
- Verify API endpoint: `GET /api/warehouses/{id}/locations`
- Ensure locations have `is_active = true` and `is_pickable = true`

### Issue 4: Stock Balances Not Updating

**Error**: GRN posted but stock didn't increase

**Solution**:
- Check if GRN status is actually 'completed'
- Verify stock_movements were created:
  ```sql
  SELECT * FROM stock_movements WHERE ref_type = 'GRN' AND ref_id = X;
  ```
- Check for errors in Laravel logs: `storage/logs/laravel.log`

### Issue 5: Cannot Create GRN

**Error**: No purchase orders available

**Solution**:
- PO must be in status: 'approved', 'ordered', or 'partial'
- Create and approve at least one PO first
- Check PO status: `SELECT id, status FROM purchase_orders;`

---

## 📈 Next Steps (Week 5)

Week 5 will implement:
- Sales Orders & Reservations
- Stock reservation system
- FEFO/FIFO allocation logic
- Available to Promise (ATP) calculations
- Price lists and taxes

The GRN system built in Week 4 provides the foundation for:
- Accurate inventory levels
- Lot tracking for FEFO
- Cost tracking for FIFO valuation
- Multi-warehouse support

---

## 🎓 Learning Points

### Architecture Patterns Used

1. **Service Layer Pattern**: Business logic separated from controllers
2. **Repository Pattern**: Models handle data access
3. **Wizard Pattern**: Complex multi-step UI broken into manageable steps
4. **State Management**: React state lifted to parent wizard component
5. **API Resource Pattern**: Consistent JSON responses

### React Patterns

- Component composition (wizard + steps)
- Props drilling for wizard state
- Conditional rendering based on step
- Form validation before navigation
- Loading states and error handling

### Laravel Patterns

- Database transactions for data consistency
- Model relationships (hasMany, belongsTo)
- Service methods for reusable logic
- Request validation
- API resource controllers

---

## 📚 API Documentation

### List Goods Receipts

```
GET /api/goods-receipts
```

**Query Parameters**:
- `status` - Filter by status
- `from_date` - Filter by date range
- `to_date` - Filter by date range
- `purchase_order_id` - Filter by PO

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "purchase_order_id": 5,
      "received_at": "2024-11-11T10:30:00Z",
      "received_by": 1,
      "status": "completed",
      "items": [ ... ]
    }
  ]
}
```

### Create Goods Receipt

```
POST /api/goods-receipts
```

**Body**:
```json
{
  "purchase_order_id": 5,
  "received_at": "2024-11-11T10:30:00Z",
  "notes": "Received in good condition"
}
```

### Receive Items

```
POST /api/goods-receipts/{id}/receive-items
```

**Body**:
```json
{
  "items": [
    {
      "po_item_id": 10,
      "received_qty": 50,
      "warehouse_id": 1,
      "location_id": 3,
      "lot_data": {
        "lot_no": "LOT-2024-001",
        "mfg_date": "2024-11-01",
        "exp_date": "2025-05-01"
      }
    }
  ]
}
```

### Post Goods Receipt

```
POST /api/goods-receipts/{id}/post
```

Creates stock movements and updates balances.

### Get Purchase Order for Receiving

```
GET /api/purchase-orders/{id}/for-receiving
```

Returns PO with remaining quantities to receive.

### Get Warehouse Locations

```
GET /api/warehouses/{id}/locations
```

Returns pickable locations for putaway.

---

## ✨ Congratulations!

Week 4 is complete! You now have a fully functional Goods Receiving system with:
- Professional multi-step wizard UI
- Complete backend business logic
- Stock movement tracking
- Lot management
- Multi-warehouse support
- Partial receipt handling

The system is ready for Week 5: Sales Orders & Reservations!

---

**Need Help?** Check the troubleshooting section or review the test cases to verify your implementation.
