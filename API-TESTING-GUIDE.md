# API Testing Guide - Quick Reference

## ✅ FIXED: Authentication Error

I've fixed the "Route [login] not defined" error. The API will now return proper JSON responses.

---

## 🔑 STEP 1: Get Your Authentication Token

You **must** login first to get a token for all other API calls.

### Login Request

**Method**: `POST`
**URL**: `http://localhost:8000/api/login`
**Headers**:
```
Content-Type: application/json
```
**Body** (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Expected Response:
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

**COPY THE TOKEN!** You'll need it for all other requests.

---

## 🧪 STEP 2: Test Stock Endpoints

For all requests below, add this header:
```
Authorization: Bearer {paste_your_token_here}
```

### Test 1: Get Stock Summary

**Method**: `GET`
**URL**: `http://localhost:8000/api/stock/variants/1/summary`
**Headers**:
```
Authorization: Bearer 1|abc123...
Accept: application/json
```

**Expected Response**:
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

---

### Test 2: Get Low Stock Products

**Method**: `GET`
**URL**: `http://localhost:8000/api/stock/low-stock`
**Headers**:
```
Authorization: Bearer {your_token}
Accept: application/json
```

---

### Test 3: Get Out of Stock Products

**Method**: `GET`
**URL**: `http://localhost:8000/api/stock/out-of-stock`
**Headers**:
```
Authorization: Bearer {your_token}
Accept: application/json
```

---

### Test 4: Get Stock by Warehouse

**Method**: `GET`
**URL**: `http://localhost:8000/api/stock/variants/1/by-warehouse`
**Headers**:
```
Authorization: Bearer {your_token}
Accept: application/json
```

---

### Test 5: Verify Balance

**Method**: `POST`
**URL**: `http://localhost:8000/api/stock/variants/1/verify`
**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
Accept: application/json
```
**Body**:
```json
{
  "warehouse_id": 1
}
```

---

## 📱 Using Postman

1. **Create a new Collection** called "Inventory Management"

2. **Add Environment Variables**:
   - `base_url`: `http://localhost:8000/api`
   - `token`: (leave empty for now)

3. **Login Request**:
   - Method: POST
   - URL: `{{base_url}}/login`
   - Body → raw → JSON:
     ```json
     {
       "email": "admin@example.com",
       "password": "password"
     }
     ```
   - In Tests tab, add this script to auto-save token:
     ```javascript
     pm.environment.set("token", pm.response.json().data.token);
     ```

4. **Stock Summary Request**:
   - Method: GET
   - URL: `{{base_url}}/stock/variants/1/summary`
   - Authorization → Type: Bearer Token → Token: `{{token}}`

---

## 🌐 Using Browser (for GET requests only)

Since GET requests need headers, you'll need a browser extension like:
- **ModHeader** (Chrome/Edge)
- **Simple Modify Headers** (Firefox)

1. Install the extension
2. Add header: `Authorization: Bearer {your_token}`
3. Visit: `http://localhost:8000/api/stock/variants/1/summary`

---

## 💻 Using cURL (Command Line)

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
```

### Get Stock Summary (replace TOKEN with your actual token)
```bash
curl -X GET http://localhost:8000/api/stock/variants/1/summary \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json"
```

---

## ⚠️ Common Errors & Solutions

### Error: "Unauthenticated"
**Response**:
```json
{
  "message": "Unauthenticated."
}
```
**Solution**:
1. Make sure you logged in and got a token
2. Include the token in Authorization header
3. Use format: `Authorization: Bearer {token}` (note the space after "Bearer")

---

### Error: "Route [login] not defined"
**Solution**: This should be fixed now! If you still see it:
1. Make sure you restarted the backend server after my fixes
2. Stop the server (Ctrl+C) and run `php artisan serve` again

---

### Error: "Connection refused"
**Solution**: Backend server is not running
```bash
cd backend
php artisan serve
```

---

### Error: No data returned
**Solution**: Seed the database
```bash
cd backend
php artisan db:seed
```

---

## 🎯 Expected Stock States

When testing, you should see these states:

| State | Color | When It Appears |
|-------|-------|----------------|
| `in_stock` | 🟢 Green | Good stock levels (available > reorder min) |
| `low_stock` | 🟡 Yellow | Available ≤ 20% of reorder minimum |
| `out_of_stock` | 🔴 Red | Quantity on hand = 0, no incoming |
| `on_order` | 🔵 Blue | Quantity = 0, but has incoming POs |
| `allocated` | 🟠 Orange | Stock exists but all reserved |

---

## 🔍 Testing Workflow

1. ✅ Start backend server: `php artisan serve`
2. ✅ Test health check: `http://localhost:8000/api/health`
3. ✅ Login to get token
4. ✅ Test stock summary
5. ✅ Test low stock
6. ✅ Test out of stock
7. ✅ Test warehouse breakdown
8. ✅ Test balance verification

---

## 📝 Test Results Template

Copy this and fill in as you test:

```
✅ Health Check: http://localhost:8000/api/health
   Response: {"status":"ok"}

✅ Login: POST /api/login
   Token received: 1|abc123...

✅ Stock Summary: GET /api/stock/variants/1/summary
   On Hand: 150
   Available: 120
   State: in_stock

✅ Low Stock: GET /api/stock/low-stock
   Count: X products

✅ Out of Stock: GET /api/stock/out-of-stock
   Count: Y products

✅ Warehouse Breakdown: GET /api/stock/variants/1/by-warehouse
   Warehouses: Z

✅ Verify Balance: POST /api/stock/variants/1/verify
   Variance: 0.0000
   Accurate: true
```

---

## 🎉 All Tests Pass?

If all tests return proper JSON with expected data:
- ✅ Week 2 Stock API is working correctly!
- ✅ Authentication is working
- ✅ Stock calculations are accurate
- ✅ Ready to test frontend components

Next: Test the frontend Stock Badge components at http://localhost:5173

---

**Need help?** Check WEEK-2-TESTING-GUIDE.md for more detailed instructions!
