# Mobile App Quick Start

Your Inventory Manager app is now configured for Android. Follow these steps to build and publish.

---

## Prerequisites

1. **Android Studio** - Download: https://developer.android.com/studio
2. **JDK 17+** - Usually bundled with Android Studio
3. **Set JAVA_HOME** environment variable

---

## Step-by-Step Build Process

### 1. Create App Icons

Create your icon at 1024x1024px, then generate all sizes using:
- https://romannurik.github.io/AndroidAssetStudio/
- Or https://appicon.co/

Place icons in:
```
frontend/android/app/src/main/res/mipmap-*/
```

### 2. Create Keystore (One Time Only)

```bash
cd frontend
keytool -genkey -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias inventory-manager
```

**SAVE THE PASSWORD! You cannot update your app without it.**

### 3. Configure Signing

Copy and edit keystore config:
```bash
cd frontend/android
copy keystore.properties.example keystore.properties
```

Edit `keystore.properties` with your passwords.

### 4. Build the AAB

**Option A: Using batch file**
```bash
cd frontend
build-android.bat
```

**Option B: Using npm**
```bash
cd frontend
npm run android:release
```

**Option C: Manual**
```bash
cd frontend
npm run build
npx cap sync android
cd android
gradlew.bat bundleRelease
```

### 5. Find Your AAB

```
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

---

## Publish to Play Store

### 1. Create Developer Account
- https://play.google.com/console
- Pay $25 one-time fee

### 2. Create New App
- App name: "Inventory Manager"
- Default language: English
- App type: App
- Category: Business

### 3. Store Listing (Required)

| Item | Details |
|------|---------|
| Short description | Max 80 characters |
| Full description | Max 4000 characters |
| App icon | 512x512 PNG |
| Feature graphic | 1024x500 PNG |
| Phone screenshots | At least 2, 16:9 aspect |

### 4. Required Sections

- [ ] **Privacy Policy**: Host PRIVACY-POLICY.md as webpage, add URL
- [ ] **Data Safety**: Complete questionnaire about data collection
- [ ] **Content Rating**: Complete questionnaire (will be rated "Everyone")
- [ ] **Target Audience**: Select 18+ (business app)
- [ ] **App Access**: Provide test login credentials

### 5. Upload & Release

1. Go to: Production → Releases → Create new release
2. Upload your AAB file
3. Add release notes: "Initial release"
4. Review and roll out

---

## Test Login for Play Store

```
Email: admin@example.com
Password: password
```

---

## Files Created

| File | Purpose |
|------|---------|
| `frontend/capacitor.config.ts` | Capacitor configuration |
| `frontend/src/utils/capacitor.js` | Mobile utilities |
| `frontend/src/utils/storage.js` | Cross-platform storage |
| `frontend/build-android.bat` | Build script |
| `frontend/android/` | Android project |
| `MOBILE-APP-GUIDE.md` | Detailed documentation |
| `PRIVACY-POLICY.md` | Privacy policy template |

---

## Common Commands

```bash
# Development
npm run dev                 # Web dev server
npm run build              # Build web
npm run cap:sync           # Sync to Android
npm run cap:android        # Open Android Studio
npm run cap:run            # Run on device/emulator

# Production
npm run android:build      # Build + sync
npm run android:release    # Build + sync + AAB
```

---

## Need Help?

- Full guide: `MOBILE-APP-GUIDE.md`
- Privacy policy: `PRIVACY-POLICY.md`
- Capacitor docs: https://capacitorjs.com/docs
