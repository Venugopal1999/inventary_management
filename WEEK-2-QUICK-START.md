# Week 2 Quick Start Guide

## What We Built This Week

Week 2 implemented the **Inventory Ledger & Stock on Hand (SOH)** system - the core tracking mechanism for all inventory movements.

---

## Quick Commands

### Setup Database
```bash
cd backend

# Run migrations
php artisan migrate:fresh

# Seed database with test data
php artisan db:seed

# Or do both at once
php artisan migrate:fresh --seed
```

### Start Backend API
```bash
cd backend
php artisan serve
# API available at: http://localhost:8000
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend available at: http://localhost:5173
```

---

## Test the Implementation

### 1. Login Credentials
```
Email: admin@example.com
Password: password
```

### 2. Test API Endpoints

#### Get Stock Summary
```bash
GET /api/stock/variants/1/summary
Authorization: Bearer {your_token}
```

**Response:**
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

#### Get Low Stock Products
```bash
GET /api/stock/low-stock
Authorization: Bearer {your_token}
```

#### Get Stock by Warehouse
```bash
GET /api/stock/variants/1/by-warehouse
Authorization: Bearer {your_token}
```

### 3. Test in Laravel Tinker
```bash
php artisan tinker

# Get stock service
$service = app(\App\Services\StockService::class);

# Get stock summary for variant 1
$service->getStockSummary(1);

# Get low stock products
$service->getLowStockProducts();

# Get out of stock products
$service->getOutOfStockProducts();

# Verify balance accuracy
$service->verifyBalance(1, 1);
```

---

## What's Available Now

### Database Tables
- `stock_movements` - Immutable ledger of all inventory transactions
- `stock_balances` - Current stock levels (materialized view)
- `inventory_lots` - Batch/expiry tracking

### Stock States
- ✅ **In Stock** (Green) - Good stock levels
- ⚠️ **Low Stock** (Yellow) - Below reorder threshold (20% of minimum)
- ❌ **Out of Stock** (Red) - Zero quantity
- 🔄 **On Order** (Blue) - Has incoming purchase orders
- 🔒 **Allocated** (Orange) - Reserved for sales orders

### API Endpoints
All routes are under `/api/stock/` and require authentication:

| Endpoint | Description |
|----------|-------------|
| `GET /variants/{id}/summary` | Complete stock info |
| `GET /variants/{id}/by-warehouse` | Warehouse breakdown |
| `GET /variants/{id}/on-hand` | Total stock on hand |
| `GET /variants/{id}/available` | Available (not reserved) |
| `GET /variants/{id}/state` | Stock state |
| `POST /variants/{id}/verify` | Verify accuracy |
| `GET /low-stock` | Low stock products |
| `GET /out-of-stock` | Out of stock products |

### Frontend Components
Located in `frontend/src/components/common/`:
- `Badge.jsx` - General purpose badge component
- `StockBadge.jsx` - Stock state badge with icons
- `StockBadgeExample.jsx` - Interactive demo

---

## How to Use Stock Badges in Your Code

### Basic Usage
```jsx
import StockBadge from './components/common/StockBadge';

// Display stock state
<StockBadge state="in_stock" />
<StockBadge state="low_stock" />
<StockBadge state="out_of_stock" />
<StockBadge state="on_order" />
<StockBadge state="allocated" />
```

### With Quantity
```jsx
<StockBadge state="in_stock" showQuantity quantity={150} />
// Displays: "✓ In Stock (150)"
```

### Different Sizes
```jsx
<StockBadge state="low_stock" size="sm" />
<StockBadge state="low_stock" size="md" />
<StockBadge state="low_stock" size="lg" />
```

### In a Product Table
```jsx
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
        SKU
      </th>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
        Product
      </th>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
        Status
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
    {products.map(product => (
      <tr key={product.id} className="hover:bg-gray-50 transition">
        <td className="px-6 py-4 text-sm text-gray-900">{product.sku}</td>
        <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
        <td className="px-6 py-4">
          <StockBadge state={product.stock_state} />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Example: Fetching Stock Data in React

```jsx
import { useState, useEffect } from 'react';
import StockBadge from './components/common/StockBadge';

function ProductStockInfo({ variantId }) {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stock/variants/${variantId}/summary`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setStockData(data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching stock:', error);
        setLoading(false);
      });
  }, [variantId]);

  if (loading) return <div>Loading...</div>;
  if (!stockData) return <div>No stock data</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Stock Information</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <StockBadge state={stockData.state} />
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">On Hand:</span>
          <span className="font-medium">{stockData.qty_on_hand}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Available:</span>
          <span className="font-medium">{stockData.qty_available}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Reserved:</span>
          <span className="font-medium">{stockData.qty_reserved}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Incoming:</span>
          <span className="font-medium">{stockData.qty_incoming}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Migrations run successfully
- [ ] Database seeded with test data
- [ ] Can query stock via API
- [ ] Stock states are calculated correctly
- [ ] Stock badges display properly
- [ ] Low stock detection works
- [ ] Out of stock detection works
- [ ] Balance verification passes

---

## Troubleshooting

### "php: command not found"
Make sure PHP is installed and in your PATH:
```bash
php --version
# Should show PHP 8.1 or higher
```

### "Connection refused" when calling API
Make sure the Laravel server is running:
```bash
cd backend
php artisan serve
```

### Frontend can't reach API
Update your `.env` file in frontend:
```env
VITE_API_URL=http://localhost:8000
```

### No data after seeding
Check if seeders ran:
```bash
php artisan tinker
>>> \App\Models\StockMovement::count();
>>> \App\Models\ProductVariant::count();
```

If zero, run seeders again:
```bash
php artisan db:seed --class=MasterDataSeeder
php artisan db:seed --class=StockSeeder
```

---

## What's Next? (Week 3)

Week 3 will build on this foundation with:
- **Purchase Orders (PO)** - Create orders to suppliers
- **Supplier Management** - Track supplier information
- **Approval Workflows** - Multi-level PO approval
- **PO Status Tracking** - Draft → Approved → Ordered → Received
- **PDF Generation** - Generate PO documents
- **Email Notifications** - Alert stakeholders

The stock movement system we built this week will power the Goods Receipt (GRN) process in Week 4!

---

## Support

If you encounter issues:
1. Check the full documentation in `WEEK-2-COMPLETION.md`
2. Review the 10-week plan in `10-WEEK-PLAN.md`
3. Examine example components in `frontend/src/components/common/StockBadgeExample.jsx`
4. Test API endpoints using tools like Postman or Thunder Client

**Week 2 is complete and tested!** 🎉
