# Week 2 Testing Guide - Step by Step

## Status

✅ **Frontend Server**: Running on http://localhost:5173
⏳ **Backend Server**: You need to start this manually (instructions below)

---

## Step 1: Start Backend Server (Laravel)

Open a **new terminal/command prompt** and run:

```bash
cd backend
php artisan serve
```

You should see:
```
Starting Laravel development server: http://127.0.0.1:8000
```

**Keep this terminal open!**

---

## Step 2: Verify Servers Are Running

### Check Frontend
Open browser: http://localhost:5173
You should see your React app

### Check Backend
Open browser: http://localhost:8000/api/health
You should see: `{"status":"ok"}`

---

## Step 3: Create Test Account & Login

### Option A: Using the pre-seeded admin account

**Email**: `admin@example.com`
**Password**: `password`

### Option B: If database is empty, seed it first

Open a new terminal and run:
```bash
cd backend
php artisan db:seed
```

Wait for it to complete (you'll see green checkmarks).

---

## Step 4: Test API Endpoints

I've prepared several tests for you. You can use:
- **Browser** (for GET requests)
- **Postman**
- **Thunder Client** (VS Code extension)
- **cURL** (command line)

### Test 1: Health Check (No Auth Required)

```bash
# Browser or cURL
http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

✅ **Pass**: Backend is running correctly

---

### Test 2: Login & Get Token

**Method**: POST
**URL**: `http://localhost:8000/api/login`
**Body** (JSON):
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "token": "1|abc123def456..."
  }
}
```

**IMPORTANT**: Copy the `token` value - you'll need it for all other API tests!

✅ **Pass**: Authentication is working

---

### Test 3: Get Stock Summary for a Product Variant

**Method**: GET
**URL**: `http://localhost:8000/api/stock/variants/1/summary`
**Headers**:
```
Authorization: Bearer {your_token_here}
Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "product_variant_id": 1,
    "warehouse_id": null,
    "qty_on_hand": 150.0000,
    "qty_available": 120.0000,
    "qty_reserved": 30.0000,
    "qty_incoming": 0.0000,
    "state": "in_stock",
    "reorder_min": 50.0000
  }
}
```

✅ **Pass**: Stock service is calculating correctly

---

### Test 4: Get Low Stock Products

**Method**: GET
**URL**: `http://localhost:8000/api/stock/low-stock`
**Headers**:
```
Authorization: Bearer {your_token_here}
```

**Expected**: List of products with stock below reorder threshold

✅ **Pass**: Low stock detection works

---

### Test 5: Get Out of Stock Products

**Method**: GET
**URL**: `http://localhost:8000/api/stock/out-of-stock`
**Headers**:
```
Authorization: Bearer {your_token_here}
```

**Expected**: List of products with zero stock

✅ **Pass**: Out of stock detection works

---

### Test 6: Get Stock Breakdown by Warehouse

**Method**: GET
**URL**: `http://localhost:8000/api/stock/variants/1/by-warehouse`
**Headers**:
```
Authorization: Bearer {your_token_here}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "warehouse_id": 1,
      "warehouse_name": "Main Warehouse",
      "qty_on_hand": 150.0000,
      "qty_available": 120.0000,
      "qty_reserved": 30.0000,
      "locations": [
        {
          "location_id": 1,
          "location_code": "A-01",
          "qty_on_hand": 150.0000,
          "qty_available": 120.0000,
          "qty_reserved": 30.0000
        }
      ]
    }
  ]
}
```

✅ **Pass**: Multi-warehouse tracking works

---

### Test 7: Verify Stock Balance Accuracy

**Method**: POST
**URL**: `http://localhost:8000/api/stock/variants/1/verify`
**Headers**:
```
Authorization: Bearer {your_token_here}
Content-Type: application/json
```
**Body**:
```json
{
  "warehouse_id": 1,
  "location_id": null
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "product_variant_id": 1,
    "warehouse_id": 1,
    "location_id": null,
    "balance": 150.0000,
    "movements_sum": 150.0000,
    "variance": 0.0000,
    "is_accurate": true
  }
}
```

✅ **Pass**: Balance verification works (movements sum matches balance)

---

## Step 5: Test Frontend Components

### View Stock Badge Examples

1. Navigate to: http://localhost:5173
2. If there's a navigation menu, look for "Stock Badges" or "Components"
3. You should see examples of all stock state badges:
   - ✓ In Stock (Green)
   - ⚠ Low Stock (Yellow)
   - ✕ Out of Stock (Red)
   - ↻ On Order (Blue)
   - 🔒 Allocated (Orange)

### Integration Test

If you have a product list page:
1. Navigate to the products page
2. Each product should show a stock badge
3. Badges should automatically update based on stock levels

---

## Step 6: Database Verification

Open a terminal and run:

```bash
cd backend
php artisan tinker
```

Then run these commands:

### Check Data Counts
```php
echo "Products: " . \App\Models\Product::count() . PHP_EOL;
echo "Product Variants: " . \App\Models\ProductVariant::count() . PHP_EOL;
echo "Stock Movements: " . \App\Models\StockMovement::count() . PHP_EOL;
echo "Stock Balances: " . \App\Models\StockBalance::count() . PHP_EOL;
echo "Inventory Lots: " . \App\Models\InventoryLot::count() . PHP_EOL;
```

**Expected**: Each should show a number greater than 0

### Test Stock Service Directly

```php
$service = app(\App\Services\StockService::class);

// Get stock summary
$summary = $service->getStockSummary(1);
print_r($summary);

// Get low stock products
$lowStock = $service->getLowStockProducts();
echo "Low stock products: " . $lowStock->count() . PHP_EOL;

// Get out of stock products
$outOfStock = $service->getOutOfStockProducts();
echo "Out of stock products: " . $outOfStock->count() . PHP_EOL;
```

Type `exit` to leave tinker.

✅ **Pass**: All services work in Laravel

---

## Testing Checklist

Use this checklist to verify everything works:

### Backend Tests
- [ ] Backend server starts on port 8000
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Can login and receive JWT token
- [ ] Stock summary endpoint returns data
- [ ] Low stock endpoint returns products
- [ ] Out of stock endpoint returns products
- [ ] Warehouse breakdown endpoint works
- [ ] Balance verification shows accurate data
- [ ] All API responses include stock states

### Frontend Tests
- [ ] Frontend server runs on port 5173
- [ ] Can view stock badge examples
- [ ] Badges show correct colors
- [ ] Badges show correct icons
- [ ] Different sizes display correctly
- [ ] Quantity display works with `showQuantity` prop

### Database Tests
- [ ] Products table has data
- [ ] Product variants table has data
- [ ] Stock movements table has data (audit trail)
- [ ] Stock balances table has current stock
- [ ] Inventory lots table has batch data
- [ ] Balance verification passes (variance = 0)

### Integration Tests
- [ ] Can fetch product with stock data from API
- [ ] Stock badge displays in product list
- [ ] Badge color matches stock state
- [ ] Stock states calculated correctly:
  - `in_stock` for good levels
  - `low_stock` when below threshold
  - `out_of_stock` when zero
  - `on_order` when has incoming POs
  - `allocated` when fully reserved

---

## Common Issues & Solutions

### Issue: "Connection refused" when calling API
**Solution**: Make sure backend server is running
```bash
cd backend
php artisan serve
```

### Issue: "Unauthenticated" error
**Solution**: Include the Bearer token in Authorization header
```
Authorization: Bearer {your_token}
```

### Issue: "No data" in responses
**Solution**: Seed the database
```bash
cd backend
php artisan db:seed
```

### Issue: Frontend shows blank page
**Solution**: Check browser console for errors. Make sure:
1. Frontend server is running
2. `.env` file has correct API URL: `VITE_API_URL=http://localhost:8000/api`

### Issue: CORS errors
**Solution**: Laravel is configured for CORS. If still seeing errors, check `config/cors.php`

---

## What to Look For (Expected Behavior)

### Stock State Logic

1. **In Stock (Green)**
   - Quantity on hand > 0
   - Available quantity > reorder minimum

2. **Low Stock (Yellow)**
   - Quantity on hand > 0
   - Available ≤ 20% of reorder minimum
   - Example: If reorder min = 50, low stock triggers when available ≤ 10

3. **Out of Stock (Red)**
   - Quantity on hand = 0
   - No incoming purchase orders

4. **On Order (Blue)**
   - Quantity on hand = 0
   - Has incoming purchase orders (qty_incoming > 0)

5. **Allocated (Orange)**
   - Quantity on hand > 0
   - Available = 0 (all stock is reserved)
   - Reserved quantity > 0

### Stock Calculations

- **On Hand** = Total physical stock in warehouse
- **Reserved** = Stock allocated to sales orders
- **Available** = On Hand - Reserved (what can be sold)
- **Incoming** = Stock on purchase orders not yet received

---

## Screenshots to Take (For Your Records)

1. Backend API health check response
2. Login successful with token
3. Stock summary API response
4. Low stock products list
5. Stock badge examples page (all 5 states)
6. Product list with stock badges
7. Tinker output showing data counts
8. Balance verification showing `is_accurate: true`

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Week 2 as complete
2. 📋 Review the Week 2 completion report (`WEEK-2-COMPLETION.md`)
3. 🎯 Ready to proceed to **Week 3: Purchasing (PO)**

Week 3 will add:
- Purchase orders
- Supplier management
- PO approval workflows
- Integration with the stock system we just built

---

## Need Help?

If you encounter any issues:

1. Check the main documentation: `WEEK-2-COMPLETION.md`
2. Review the quick start guide: `WEEK-2-QUICK-START.md`
3. Examine API routes: `backend/routes/api.php`
4. Review service logic: `backend/app/Services/StockService.php`
5. Check component examples: `frontend/src/components/common/StockBadgeExample.jsx`

**Happy Testing!** 🎉
