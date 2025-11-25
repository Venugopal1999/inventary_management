# 🚀 Quick Start - Inventory Management System

## ⚡ Fastest Way to Start (Just 1 Click!)

**Double-click this file:**
```
📄 start-all-servers.bat
```

That's it! Your app will open automatically at http://localhost:5173

---

## 🛑 Stop Everything

**Double-click this file:**
```
📄 stop-all-servers.bat
```

---

## ✅ Check If Servers Are Running

**Double-click this file:**
```
📄 check-status.bat
```

This shows you which servers are running and which are stopped.

---

## 📖 Need More Help?

Read the complete guide:
```
📄 SERVER-GUIDE.md
```

---

## 🧪 Testing Week 3 Features

Once servers are running:

### 1. Login
```
URL: http://127.0.0.1:8000/api/login
Email: admin@example.com
Password: password
```

### 2. View Suppliers
```
http://127.0.0.1:8000/api/suppliers
```

### 3. View Purchase Orders
```
http://127.0.0.1:8000/api/purchase-orders
```

### 4. View a PO as PDF
```
http://127.0.0.1:8000/api/purchase-orders/1/pdf
```

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `start-all-servers.bat` | ▶️ Start everything |
| `stop-all-servers.bat` | ⏹️ Stop everything |
| `check-status.bat` | ℹ️ Check server status |
| `SERVER-GUIDE.md` | 📖 Complete documentation |
| `WEEK-3-COMPLETION.md` | ✅ Week 3 features & testing |

---

## 🌐 Server URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React app (what you see) |
| Backend | http://127.0.0.1:8000 | Laravel API (handles data) |
| Database | localhost:5433 | PostgreSQL (stores everything) |

---

## ⚠️ First Time Setup?

If this is your first time:

1. ✅ **PostgreSQL must be installed and running**
2. ✅ **Run migrations** (creates database tables):
   ```cmd
   cd backend
   php artisan migrate:fresh
   ```

3. ✅ **Add test data** (creates sample suppliers & POs):
   ```cmd
   php artisan db:seed
   ```

4. ✅ **Install frontend packages** (only once):
   ```cmd
   cd frontend
   npm install
   ```

5. ✅ **Now start servers**:
   ```cmd
   start-all-servers.bat
   ```

---

## 🎯 What We Built (Week 3)

✅ **Supplier Management**
- Add, edit, delete suppliers
- Track payment terms, credit limits
- View supplier statistics

✅ **Purchase Orders**
- Create purchase orders with multiple items
- Submit for approval workflow
- Approve, order, receive tracking
- Generate PDF documents
- Email notifications

✅ **Status Workflow**
```
Draft → Submitted → Approved → Ordered → Partial → Received
```

---

## 🆘 Problems?

### Nothing works?
```cmd
check-status.bat
```
This will tell you what's wrong.

### Database connection error?
Make sure PostgreSQL is running:
```cmd
net start postgresql-x64-14
```

### Backend won't start?
Check if port 8000 is free:
```cmd
netstat -ano | findstr "8000"
```

### Frontend won't start?
Check if port 5173 is free:
```cmd
netstat -ano | findstr "5173"
```

---

## 🔄 Daily Workflow

**Morning (Start Work):**
```
Double-click: start-all-servers.bat
```

**Evening (Finish Work):**
```
Double-click: stop-all-servers.bat
```

**That's all you need!** 🎉

---

## 📞 Get Help

1. **Read:** `SERVER-GUIDE.md` for detailed instructions
2. **Read:** `WEEK-3-COMPLETION.md` for testing guide
3. **Check:** `check-status.bat` to see what's running

---

**Ready?** → Double-click `start-all-servers.bat` to begin! 🚀
