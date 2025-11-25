# Quick Start - Week 2 Testing

## ✅ STATUS

**Frontend**: ✅ RUNNING on http://localhost:5173
**Backend**: ⏳ YOU NEED TO START IT

---

## 🚀 START BACKEND NOW

Open a new terminal and run these commands:

```bash
cd "C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend"
php artisan serve
```

**Keep the terminal open!**

You should see:
```
Starting Laravel development server: http://127.0.0.1:8000
```

---

## 🧪 QUICK TEST

### 1. Test Backend is Running
Open browser: **http://localhost:8000/api/health**

Should see: `{"status":"ok"}`

### 2. Test Frontend is Running
Open browser: **http://localhost:5173**

Should see your React app

---

## 🔑 LOGIN CREDENTIALS

**Email**: `admin@example.com`
**Password**: `password`

---

## 📊 TEST STOCK API

### Get Login Token First

**POST** `http://localhost:8000/api/login`

Body:
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Copy the `token` from response!

### Test Stock Summary

**GET** `http://localhost:8000/api/stock/variants/1/summary`

Headers:
```
Authorization: Bearer {your_token}
```

---

## 📋 FULL TESTING GUIDE

See **WEEK-2-TESTING-GUIDE.md** for complete testing instructions!

---

## 🎯 QUICK API ENDPOINTS

All require `Authorization: Bearer {token}` header:

| Endpoint | What it does |
|----------|-------------|
| `GET /api/stock/variants/1/summary` | Get complete stock info |
| `GET /api/stock/low-stock` | List low stock products |
| `GET /api/stock/out-of-stock` | List out of stock products |
| `GET /api/stock/variants/1/by-warehouse` | Warehouse breakdown |

---

## ⚠️ IF DATABASE IS EMPTY

Run this in backend folder:
```bash
php artisan db:seed
```

Wait for green checkmarks, then test again!

---

## 🎨 VIEW STOCK BADGES

Frontend is running at: **http://localhost:5173**

Look for Stock Badge examples showing:
- ✅ In Stock (Green)
- ⚠️ Low Stock (Yellow)
- ❌ Out of Stock (Red)
- 🔄 On Order (Blue)
- 🔒 Allocated (Orange)

---

**Both servers must be running to test Week 2!**
