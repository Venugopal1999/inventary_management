# Complete Deployment Guide

This guide covers deploying your Inventory Manager application:
- **Backend + Database**: Render (Laravel + PostgreSQL)
- **Frontend**: Vercel (React/Vite)
- **Mobile App**: Google Play Store (Android)

---

## Part 1: Deploy PostgreSQL Database on Render

### Step 1.1: Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email

### Step 1.2: Create PostgreSQL Database
1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `inventory-db`
   - **Database**: `inventory_manager`
   - **User**: `inventory_user` (auto-generated)
   - **Region**: Choose closest to your users (e.g., Oregon for US West)
   - **Plan**: Free (for testing) or Starter ($7/month for production)
3. Click **"Create Database"**
4. Wait for database to be ready (1-2 minutes)

### Step 1.3: Save Database Credentials
After creation, go to your database and copy these from the **"Info"** tab:
```
Internal Database URL: (use this for backend on Render)
External Database URL: (use this for local development)
PSQL Command: (for direct database access)
```

**Important values to note:**
- Hostname
- Port (usually 5432)
- Database name
- Username
- Password

---

## Part 2: Deploy Laravel Backend on Render

### Step 2.1: Prepare Backend for Production

First, update your backend configuration files locally.

#### Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: inventory-api
    env: php
    buildCommand: |
      composer install --no-dev --optimize-autoloader
      php artisan config:cache
      php artisan route:cache
      php artisan view:cache
      php artisan migrate --force
    startCommand: php artisan serve --host=0.0.0.0 --port=$PORT
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: false
      - key: APP_KEY
        generateValue: true
      - key: DB_CONNECTION
        value: pgsql
      - key: DATABASE_URL
        fromDatabase:
          name: inventory-db
          property: connectionString
```

#### Update `backend/.env.example`:
```env
APP_NAME="Inventory Manager"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.onrender.com

DB_CONNECTION=pgsql
DATABASE_URL=

LOG_CHANNEL=stderr
```

#### Update `backend/config/database.php`:
Add this at the top of the `pgsql` connection array to support DATABASE_URL:
```php
'pgsql' => [
    'driver' => 'pgsql',
    'url' => env('DATABASE_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'prefix' => '',
    'prefix_indexes' => true,
    'search_path' => 'public',
    'sslmode' => 'require',
],
```

### Step 2.2: Deploy Backend to Render

#### Option A: Deploy via GitHub (Recommended)
1. Push your code to GitHub (already done)
2. In Render Dashboard, click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `inventory-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `PHP`
   - **Build Command**:
     ```
     composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache && php artisan migrate --force
     ```
   - **Start Command**:
     ```
     php artisan serve --host=0.0.0.0 --port=$PORT
     ```
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | APP_ENV | production |
   | APP_DEBUG | false |
   | APP_KEY | (click Generate) base64:... |
   | APP_URL | https://inventory-api.onrender.com |
   | DB_CONNECTION | pgsql |
   | DATABASE_URL | (paste Internal Database URL from Step 1.3) |
   | SANCTUM_STATEFUL_DOMAINS | your-frontend.vercel.app |
   | SESSION_DOMAIN | .onrender.com |

6. Click **"Create Web Service"**

### Step 2.3: Generate APP_KEY
If you need to generate APP_KEY manually:
```bash
cd backend
php artisan key:generate --show
```
Copy the output (starts with `base64:`) to Render environment variables.

### Step 2.4: Verify Backend Deployment
1. Wait for deployment (5-10 minutes first time)
2. Visit: `https://your-app.onrender.com/api/health` or similar endpoint
3. Check Render logs for any errors

---

## Part 3: Deploy Frontend on Vercel

### Step 3.1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 3.2: Prepare Frontend for Production

#### Update `frontend/src/utils/api.js`:
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
```

#### Create `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Step 3.3: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `Immersive-Engineer/inventary_management`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | VITE_API_URL | https://inventory-api.onrender.com/api |
6. Click **"Deploy"**

### Step 3.4: Configure Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Step 3.5: Update CORS on Backend
After getting your Vercel URL, update backend CORS settings:

In Render, add/update environment variable:
```
FRONTEND_URL=https://your-app.vercel.app
```

Update `backend/config/cors.php`:
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
],
```

---

## Part 4: Publish Android App to Google Play Store

### Step 4.1: Update API URL for Production

#### Update `frontend/src/utils/api.js`:
Make sure it uses the production API URL:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://inventory-api.onrender.com/api';
```

#### Update `frontend/capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventorymanager.app',
  appName: 'Inventory Manager',
  webDir: 'dist',
  server: {
    // Remove localhost for production
    // Use this only if you want to load from web URL:
    // url: 'https://your-app.vercel.app',
    // cleartext: true
  }
};

export default config;
```

### Step 4.2: Create App Icons

1. Create a 1024x1024 PNG icon for your app
2. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
3. Upload your icon
4. Download the ZIP file
5. Extract and copy to `frontend/android/app/src/main/res/mipmap-*/`

### Step 4.3: Build Release AAB

```bash
cd frontend

# Build the web app
npm run build

# Sync with Android
npx cap sync android

# Build release bundle
cd android
.\gradlew.bat bundleRelease
```

Find your AAB at:
```
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

### Step 4.4: Create Google Play Developer Account

1. Go to: https://play.google.com/console
2. Sign in with Google account
3. Pay **$25 one-time** registration fee
4. Complete account details:
   - Developer name
   - Contact email
   - Contact phone

### Step 4.5: Create App in Play Console

1. Click **"Create app"**
2. Fill in details:
   - **App name**: Inventory Manager
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept declarations and click **"Create app"**

### Step 4.6: Complete Store Listing

Navigate to **"Grow"** → **"Store presence"** → **"Main store listing"**

#### App Details:
| Field | Value |
|-------|-------|
| App name | Inventory Manager |
| Short description | Manage inventory, track stock, and process orders efficiently. (max 80 chars) |
| Full description | (See below) |

**Full Description (example):**
```
Inventory Manager is a comprehensive inventory management solution designed for small to medium businesses.

KEY FEATURES:
• Product Management - Add, edit, and organize your products with ease
• Stock Tracking - Monitor stock levels in real-time
• Purchase Orders - Create and manage purchase orders
• Sales Orders - Process sales and track fulfillment
• Reports & Analytics - Get insights into your inventory performance
• Low Stock Alerts - Never run out of stock with automatic alerts
• Multi-warehouse Support - Manage inventory across locations

Perfect for retail stores, warehouses, and e-commerce businesses looking for a simple yet powerful inventory solution.
```

#### Graphics Required:
| Asset | Size | Description |
|-------|------|-------------|
| App icon | 512x512 PNG | High-res icon (32-bit PNG, no alpha) |
| Feature graphic | 1024x500 PNG | Banner displayed on Play Store |
| Phone screenshots | 16:9 or 9:16 | At least 2, up to 8 screenshots |
| Tablet screenshots | Optional | 7-inch and 10-inch tablets |

**Creating Screenshots:**
1. Run your app on emulator or device
2. Take screenshots of key features:
   - Dashboard
   - Product list
   - Add product form
   - Purchase orders
   - Reports
3. Use tools like Figma or Canva to add device frames

### Step 4.7: Complete App Content Section

Navigate to **"Policy"** → **"App content"**

#### Privacy Policy:
1. Host your `PRIVACY-POLICY.md` as a webpage:
   - Option A: GitHub Pages
   - Option B: Create a simple HTML page on Vercel
   - Option C: Use a service like Notion (make page public)
2. Enter the URL in Play Console

#### Data Safety:
Answer questions about:
- Data collection (email, name for account)
- Data sharing (none if self-hosted)
- Security practices (encrypted transmission)

#### Ads Declaration:
- Select "No" if your app has no ads

#### Content Rating:
1. Click "Start questionnaire"
2. Answer questions honestly
3. Get your rating (likely "Everyone")

#### Target Audience:
- Select appropriate age groups
- If app is for businesses, select 18+

### Step 4.8: Set Up App Releases

Navigate to **"Release"** → **"Production"**

#### Create New Release:
1. Click **"Create new release"**
2. Upload your AAB file (`app-release.aab`)
3. Release name: `1.0.0`
4. Release notes:
   ```
   Initial release of Inventory Manager

   Features:
   - Product management
   - Stock tracking
   - Purchase orders
   - Sales orders
   - Reports and analytics
   ```
5. Click **"Save"**
6. Click **"Review release"**

### Step 4.9: App Signing

Google Play will manage app signing. On first upload:
1. Accept Google Play App Signing terms
2. Upload your AAB (signed with upload key)
3. Google re-signs with a secure key

### Step 4.10: Submit for Review

1. Complete all required sections (check dashboard for warnings)
2. Go to **"Publishing overview"**
3. Click **"Send for review"**
4. Review typically takes 1-3 days (can be up to 7 days for new developers)

### Step 4.11: After Approval

Once approved:
1. Your app will be live on Play Store
2. Search for "Inventory Manager" + your developer name
3. Share the Play Store link with users

---

## Part 5: Post-Deployment Checklist

### Backend (Render):
- [ ] Database migrations completed
- [ ] APP_KEY is set
- [ ] CORS allows frontend domain
- [ ] HTTPS is working
- [ ] API endpoints responding

### Frontend (Vercel):
- [ ] Environment variables set
- [ ] Build successful
- [ ] Routing working (refresh doesn't 404)
- [ ] API calls working
- [ ] Login/logout working

### Mobile App (Play Store):
- [ ] App icon uploaded
- [ ] Screenshots uploaded
- [ ] Privacy policy linked
- [ ] Data safety completed
- [ ] Content rating completed
- [ ] AAB uploaded
- [ ] Release notes added
- [ ] Submitted for review

---

## Part 6: Maintenance & Updates

### Updating Backend:
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Check logs for migration success

### Updating Frontend:
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Check preview deployment first

### Updating Mobile App:
1. Update version in `frontend/android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.1.0"
   ```
2. Build new AAB
3. Upload to Play Console
4. Submit for review (usually faster for updates)

---

## Troubleshooting

### Render Issues:
- **Build fails**: Check build logs, ensure composer.json is valid
- **500 errors**: Check APP_KEY, database connection
- **Slow startup**: Free tier sleeps after 15 mins of inactivity

### Vercel Issues:
- **404 on refresh**: Add vercel.json with rewrites
- **API errors**: Check VITE_API_URL environment variable
- **CORS errors**: Update backend CORS config

### Play Store Issues:
- **Rejected**: Read rejection reason, fix, resubmit
- **Signing error**: Ensure you're using the same keystore
- **Crashes**: Test thoroughly on multiple devices before release

---

## Cost Summary

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| Render PostgreSQL | 90 days free | $7/month Starter |
| Render Web Service | Free (sleeps) | $7/month Starter |
| Vercel | Free for personal | $20/month Pro |
| Google Play | - | $25 one-time |

**Minimum cost to go live**: $25 (Play Store fee only, using free tiers)

---

## Quick Reference URLs

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Play Console: https://play.google.com/console
- Your GitHub Repo: https://github.com/Immersive-Engineer/inventary_management
