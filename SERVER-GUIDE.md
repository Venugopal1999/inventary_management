# Server Management Guide

## 🚀 Quick Start (Easiest Method)

### Option 1: Use the Startup Script

**Double-click this file:**
```
start-all-servers.bat
```

This will automatically:
1. ✅ Check and start MySQL/PostgreSQL
2. ✅ Start Backend server (Laravel) at http://127.0.0.1:8000
3. ✅ Start Frontend server (React) at http://localhost:5173
4. ✅ Open the app in your browser

---

## 🛑 Stop All Servers

**Double-click this file:**
```
stop-all-servers.bat
```

This will stop both frontend and backend servers.

---

## 📋 Manual Server Startup (3 Terminals)

If the batch script doesn't work, start servers manually:

### Terminal 1: Database (PostgreSQL)

Your database is configured to use **PostgreSQL on port 5433**.

**Start PostgreSQL:**

**Method 1: Using Services**
1. Press `Windows + R`
2. Type `services.msc` and press Enter
3. Find "postgresql-x64-14" (or your version)
4. Right-click → Start

**Method 2: Using Command Prompt (as Administrator)**
```cmd
net start postgresql-x64-14
```

**Method 3: Using pgAdmin**
- Open pgAdmin
- The server will start automatically

---

### Terminal 2: Backend (Laravel - Port 8000)

**Open Command Prompt or PowerShell:**

```cmd
cd C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\backend
php artisan serve
```

**You should see:**
```
INFO  Server running on [http://127.0.0.1:8000].
Press Ctrl+C to stop the server
```

**✅ Keep this window open!**

**Test Backend:**
- Open browser → http://127.0.0.1:8000/api/health
- Should show: `{"status":"ok"}`

---

### Terminal 3: Frontend (React/Vite - Port 5173)

**Open a NEW Command Prompt or PowerShell:**

```cmd
cd C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\frontend
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**✅ Keep this window open too!**

**Test Frontend:**
- Open browser → http://localhost:5173
- Should show your React app

---

## 🔍 Check Server Status

Run this to check which servers are running:

```cmd
netstat -ano | findstr "8000 5173 5433"
```

**Expected Output:**
```
TCP    127.0.0.1:8000    0.0.0.0:0    LISTENING    12345  (Backend)
TCP    127.0.0.1:5173    0.0.0.0:0    LISTENING    67890  (Frontend)
TCP    127.0.0.1:5433    0.0.0.0:0    LISTENING    11111  (PostgreSQL)
```

---

## 🌐 Access Your Application

Once all servers are running:

| Service | URL | What is it? |
|---------|-----|-------------|
| **Frontend (User Interface)** | http://localhost:5173 | The app you see and click |
| **Backend API** | http://127.0.0.1:8000 | Server that handles data |
| **API Test** | http://127.0.0.1:8000/api/health | Check if backend works |
| **Suppliers API** | http://127.0.0.1:8000/api/suppliers | Week 3 - Suppliers |
| **Purchase Orders** | http://127.0.0.1:8000/api/purchase-orders | Week 3 - POs |
| **Database** | localhost:5433 | PostgreSQL (use pgAdmin) |

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Port 8000 is already in use"

**Problem:** Backend can't start because port 8000 is busy

**Solution:**
```cmd
:: Find what's using port 8000
netstat -ano | findstr "8000"

:: Kill the process (replace XXXX with PID from above)
taskkill /F /PID XXXX

:: Now start backend again
php artisan serve
```

---

### Issue 2: "Port 5173 is already in use"

**Problem:** Frontend can't start because port 5173 is busy

**Solution:**
```cmd
:: Find what's using port 5173
netstat -ano | findstr "5173"

:: Kill the process
taskkill /F /PID XXXX

:: Now start frontend again
npm run dev
```

---

### Issue 3: "SQLSTATE[08006] Connection refused"

**Problem:** Backend can't connect to database

**Solution:**

1. **Check if PostgreSQL is running:**
   ```cmd
   sc query postgresql-x64-14
   ```

2. **If not running, start it:**
   ```cmd
   net start postgresql-x64-14
   ```

3. **Check your database credentials in backend/.env:**
   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5433
   DB_DATABASE=inventory_management
   DB_USERNAME=postgres
   DB_PASSWORD=Amma@143
   ```

4. **Test database connection:**
   ```cmd
   cd backend
   php artisan tinker
   >>> DB::connection()->getPdo();
   ```

---

### Issue 4: Frontend can't connect to Backend

**Problem:** API calls from frontend fail

**Solution:**

1. **Check backend is running:**
   - Open http://127.0.0.1:8000/api/health
   - Should show `{"status":"ok"}`

2. **Check frontend .env file:**
   ```
   frontend/.env should have:
   VITE_API_URL=http://127.0.0.1:8000
   ```

3. **Restart frontend after changing .env:**
   ```cmd
   Ctrl+C in frontend terminal
   npm run dev
   ```

---

### Issue 5: "php is not recognized"

**Problem:** PHP is not installed or not in PATH

**Solution:**

1. **Check if PHP is installed:**
   ```cmd
   php --version
   ```

2. **If not installed:**
   - Download from https://windows.php.net/download/
   - Or install XAMPP (includes PHP)
   - Add PHP to your PATH environment variable

---

### Issue 6: "npm is not recognized"

**Problem:** Node.js/npm is not installed or not in PATH

**Solution:**

1. **Download Node.js from:**
   https://nodejs.org/ (LTS version)

2. **Install and restart your terminal**

3. **Verify:**
   ```cmd
   node --version
   npm --version
   ```

---

## 🔄 Restart All Servers

If something goes wrong, restart everything:

```cmd
:: 1. Stop all servers
stop-all-servers.bat

:: 2. Wait 5 seconds

:: 3. Start all servers
start-all-servers.bat
```

---

## 📊 Database Management

### Using pgAdmin (GUI)

1. **Open pgAdmin**
2. **Connect to Server:**
   - Host: localhost
   - Port: 5433
   - Database: inventory_management
   - Username: postgres
   - Password: Amma@143

3. **Browse your tables:**
   - Servers → PostgreSQL → Databases → inventory_management → Schemas → public → Tables

### Using Command Line (psql)

```cmd
:: Connect to database
psql -h localhost -p 5433 -U postgres -d inventory_management

:: List tables
\dt

:: Query suppliers
SELECT * FROM suppliers;

:: Exit
\q
```

---

## 🧪 First Time Setup Checklist

Before starting servers for the first time:

- [ ] PostgreSQL installed and running
- [ ] PHP installed (check: `php --version`)
- [ ] Node.js installed (check: `node --version`)
- [ ] Composer installed (check: `composer --version`)
- [ ] Backend dependencies installed (`cd backend && composer install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Database created in PostgreSQL
- [ ] Environment files configured (.env in backend and frontend)
- [ ] Migrations run (`php artisan migrate:fresh`)
- [ ] Database seeded (`php artisan db:seed`)

---

## 🎯 Development Workflow

**Typical daily workflow:**

1. **Start servers:**
   ```cmd
   start-all-servers.bat
   ```

2. **Open browser:**
   - Frontend: http://localhost:5173

3. **Make changes to code**
   - Frontend changes auto-reload (hot reload)
   - Backend changes require server restart

4. **Stop servers when done:**
   ```cmd
   stop-all-servers.bat
   ```

---

## 📝 Useful Commands

### Backend (Laravel)

```cmd
cd backend

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Run migrations
php artisan migrate
php artisan migrate:fresh
php artisan migrate:fresh --seed

# Seed database
php artisan db:seed

# Run Tinker (interactive console)
php artisan tinker

# Check routes
php artisan route:list

# Generate API documentation
php artisan route:list --path=api
```

### Frontend (React)

```cmd
cd frontend

# Install packages
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

### Database

```cmd
# Backup database
pg_dump -h localhost -p 5433 -U postgres inventory_management > backup.sql

# Restore database
psql -h localhost -p 5433 -U postgres inventory_management < backup.sql
```

---

## 🆘 Emergency Reset

If everything is broken:

```cmd
:: 1. Stop all servers
stop-all-servers.bat

:: 2. Reset backend
cd backend
php artisan cache:clear
php artisan config:clear
php artisan migrate:fresh --seed

:: 3. Reset frontend
cd ..\frontend
rmdir /s /q node_modules
rmdir /s /q dist
npm install

:: 4. Start everything again
cd ..
start-all-servers.bat
```

---

## 📚 Resources

- **Laravel Documentation:** https://laravel.com/docs
- **React Documentation:** https://react.dev
- **Vite Documentation:** https://vitejs.dev
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Need Help?** Check the Week 3 Completion Report: `WEEK-3-COMPLETION.md`
