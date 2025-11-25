# Week 2 Completion Report - Inventory Ledger & Stock on Hand

## Overview
Week 2 focused on building the **core inventory tracking system** with stock movements, balances, and Stock on Hand (SOH) calculations. All deliverables have been completed successfully.

---

## Deliverables Completed

### 1. Database Layer

#### Stock Movements Table
- **Model**: `App\Models\StockMovement`
- **Migration**: `2025_11_05_180027_create_stock_movements_table.php`
- **Purpose**: Immutable ledger of all inventory transactions
- **Features**:
  - Tracks product variant movements across warehouses and locations
  - Records quantity delta (positive for receipts, negative for shipments)
  - Links to reference documents (PO, GRN, SO, SHIPMENT, ADJUSTMENT, TRANSFER, COUNT)
  - Captures unit cost for FIFO/FEFO valuation
  - Includes lot tracking for batch/expiry management
  - Audit trail with user and timestamp

#### Stock Balances Table
- **Model**: `App\Models\StockBalance`
- **Migration**: `2025_11_05_180341_create_stock_balances_table.php`
- **Purpose**: Materialized view of current stock levels
- **Features**:
  - Stores current quantities: on_hand, reserved, available, incoming
  - Indexed by product_variant_id, warehouse_id, location_id
  - Helper methods for stock operations (add, remove, reserve, release)
  - Automatic recalculation of available stock
  - Query scopes for filtering (inStock, available, forProduct, forWarehouse)

#### Inventory Lots Table
- **Model**: `App\Models\InventoryLot`
- **Migration**: `2025_11_05_180000_create_inventory_lots_table.php`
- **Purpose**: Track batches with manufacturing and expiry dates
- **Features**:
  - Lot number tracking
  - Manufacturing and expiry date management
  - FEFO (First Expiry First Out) ordering
  - Expiry alerts (expiringSoon, expired scopes)
  - Quantity on hand per lot
  - Helper methods to check expiry status

---

### 2. Business Logic Layer

#### StockService
- **File**: `backend/app/Services/StockService.php`
- **Purpose**: Core service for stock queries and calculations
- **Key Methods**:
  - `getStockOnHand()` - Get total stock for a product/warehouse/location
  - `getAvailableStock()` - Get available stock (on hand minus reserved)
  - `getReservedStock()` - Get reserved quantities
  - `getIncomingStock()` - Get stock on order
  - `getStockState()` - Determine stock state (in_stock, low_stock, out_of_stock, on_order, allocated)
  - `getStockSummary()` - Comprehensive stock information
  - `getStockByWarehouse()` - Breakdown by warehouse and location
  - `verifyBalance()` - Reconciliation between balances and movements
  - `getLowStockProducts()` - Products below reorder threshold
  - `getOutOfStockProducts()` - Products with zero stock

**Stock States**:
- `in_stock` - Good stock levels
- `low_stock` - Below 20% of reorder minimum
- `out_of_stock` - Zero quantity on hand
- `on_order` - Out of stock but has incoming POs
- `allocated` - Stock reserved for sales orders

#### StockMovementService
- **File**: `backend/app/Services/StockMovementService.php`
- **Purpose**: Handle stock movement creation and balance updates
- **Key Methods**:
  - `receiveStock()` - Record goods receipt (GRN)
  - `shipStock()` - Record shipment (outbound)
  - `adjustStock()` - Manual adjustments (damage, found, writeoff)
  - `transferStock()` - Inter-warehouse transfers
  - Automatic stock balance projection after each movement

---

### 3. Data Layer - Seeders

#### StockSeeder
- **File**: `backend/database/seeders/StockSeeder.php`
- **Purpose**: Generate test data for inventory lots and movements
- **What It Creates**:
  - 2-3 inventory lots per product variant
  - Initial stock receipts (GRN) with random quantities (50-200 units)
  - Multiple shipments (1-3 per variant) reducing stock
  - Random adjustments (positive/negative)
  - Realistic movement history for testing

#### DatabaseSeeder Updates
- **File**: `backend/database/seeders/DatabaseSeeder.php`
- **Changes**: Integrated Week 2 seeders in proper order
  1. RoleSeeder (roles & permissions)
  2. UomSeeder (units of measure)
  3. MasterDataSeeder (warehouses, products, variants)
  4. StockSeeder (lots, movements, balances)

---

### 4. API Layer

#### StockController
- **File**: `backend/app/Http/Controllers/Api/StockController.php`
- **Routes File**: `backend/routes/api-stock.php`
- **Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock/variants/{id}/summary` | Stock summary with all quantities and state |
| GET | `/api/stock/variants/{id}/by-warehouse` | Breakdown by warehouse/location |
| GET | `/api/stock/variants/{id}/on-hand` | Total stock on hand |
| GET | `/api/stock/variants/{id}/available` | Available stock (on hand - reserved) |
| GET | `/api/stock/variants/{id}/state` | Stock state (in_stock, low_stock, etc.) |
| POST | `/api/stock/variants/{id}/verify` | Verify balance accuracy |
| GET | `/api/stock/low-stock` | List products with low stock |
| GET | `/api/stock/out-of-stock` | List out-of-stock products |

**Example API Response** (`/api/stock/variants/1/summary`):
```json
{
  "success": true,
  "data": {
    "product_variant_id": 1,
    "warehouse_id": 1,
    "qty_on_hand": 150.00,
    "qty_available": 120.00,
    "qty_reserved": 30.00,
    "qty_incoming": 200.00,
    "state": "in_stock",
    "reorder_min": 50.00
  }
}
```

---

### 5. Frontend UI Components

#### Badge Component
- **File**: `frontend/src/components/common/Badge.jsx`
- **Purpose**: Reusable badge component for status labels
- **Variants**: success, warning, error, info, neutral, orange
- **Sizes**: sm, md, lg
- **Styling**: Amazon Seller Central inspired with Tailwind CSS

#### StockBadge Component
- **File**: `frontend/src/components/common/StockBadge.jsx`
- **Purpose**: Stock-specific badge showing inventory state
- **Features**:
  - Maps stock states to colors and icons
  - Optional quantity display
  - Responsive sizes
  - Clean, professional appearance

**Stock Badge Mapping**:
- `in_stock` → Green with checkmark (✓)
- `low_stock` → Yellow with warning (⚠)
- `out_of_stock` → Red with X (✕)
- `on_order` → Blue with refresh (↻)
- `allocated` → Orange with lock (🔒)

#### StockBadgeExample Component
- **File**: `frontend/src/components/common/StockBadgeExample.jsx`
- **Purpose**: Interactive demo of badge usage
- **Includes**:
  - All stock state examples
  - Size variations
  - Product table demo
  - Usage code snippets

---

## Testing Instructions

### 1. Run Migrations
```bash
cd backend
php artisan migrate:fresh
```

### 2. Seed Database
```bash
php artisan db:seed
# This will seed:
# - Roles & Permissions
# - Units of Measure
# - Warehouses, Locations, Categories
# - Products & Variants
# - Inventory Lots, Stock Movements, Stock Balances
```

### 3. Verify Data
```bash
# Check stock movements
php artisan tinker
>>> \App\Models\StockMovement::count();
>>> \App\Models\StockBalance::count();
>>> \App\Models\InventoryLot::count();

# Test stock service
>>> $service = app(\App\Services\StockService::class);
>>> $service->getStockSummary(1);
>>> $service->getLowStockProducts();
```

### 4. Test API Endpoints
```bash
# Login first to get token
POST /api/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Then test stock endpoints
GET /api/stock/variants/1/summary
GET /api/stock/low-stock
GET /api/stock/out-of-stock
```

### 5. View Frontend Components
```bash
cd frontend
npm install
npm run dev

# Navigate to StockBadgeExample component in your browser
# Add to your routes: /stock-badges
```

---

## Key Features Implemented

### Accurate SOH Calculations
- Real-time stock balances updated via event listeners
- Fallback verification against movement sum
- Multi-warehouse and location support
- Separate tracking for on_hand, reserved, available, incoming

### FEFO/FIFO Support
- Lot-based inventory tracking
- Expiry date management
- Automatic lot selection for shipments
- Ageing and expiry alerts

### Stock State Logic
- Intelligent state determination based on multiple factors
- Low stock threshold (20% of reorder minimum)
- On order detection (incoming stock)
- Allocation tracking (reserved quantities)

### Data Integrity
- Immutable stock movements (append-only ledger)
- Balance verification utility
- Foreign key constraints
- Indexed queries for performance

---

## Design Principles Applied

### Amazon Seller Central Inspiration
- Clean, data-dense UI
- Professional color palette
- Minimal orange highlights for primary actions
- Badge system matching Amazon's style

### Performance Optimization
- Materialized stock balances for fast queries
- Composite indexes on critical columns
- Lazy loading relationships
- Query scopes for common filters

### Security & Audit
- User tracking on all movements
- Immutable movement records
- API authentication required
- Role-based access control ready

---


The stock movement and balance system built in Week 2 will power the goods receipt (GRN) process in Week 4.

---

## File Structure Summary

```
backend/
├── app/
│   ├── Models/
│   │   ├── StockMovement.php ✅
│   │   ├── StockBalance.php ✅
│   │   └── InventoryLot.php ✅
│   ├── Services/
│   │   ├── StockService.php ✅
│   │   └── StockMovementService.php ✅
│   └── Http/Controllers/Api/
│       └── StockController.php ✅
├── database/
│   ├── migrations/
│   │   ├── 2025_11_05_180000_create_inventory_lots_table.php ✅
│   │   ├── 2025_11_05_180027_create_stock_movements_table.php ✅
│   │   └── 2025_11_05_180341_create_stock_balances_table.php ✅
│   └── seeders/
│       ├── StockSeeder.php ✅
│       └── DatabaseSeeder.php ✅ (updated)
└── routes/
    └── api-stock.php ✅

frontend/
└── src/
    └── components/
        └── common/
            ├── Badge.jsx ✅
            ├── StockBadge.jsx ✅
            └── StockBadgeExample.jsx ✅
```

---

## Summary

**Week 2 Status**: ✅ **COMPLETE**

All deliverables have been implemented:
- ✅ Stock movements, balances, and lots (models + migrations)
- ✅ SOH service with accurate calculations
- ✅ Stock state badges (in-stock, low, out, on order, allocated)
- ✅ Comprehensive seeder with test data
- ✅ API endpoints for stock queries
- ✅ Frontend UI components with examples


