# Inventory Manager - Mobile App (Capacitor + Android)

Complete guide to building, signing, and publishing your app to Google Play Store.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Workflow](#development-workflow)
3. [App Icons & Splash Screens](#app-icons--splash-screens)
4. [Building for Production](#building-for-production)
5. [Creating the Keystore](#creating-the-keystore)
6. [Generating Signed AAB](#generating-signed-aab)
7. [Google Play Store Publishing](#google-play-store-publishing)
8. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
frontend/
├── capacitor.config.ts       # Capacitor configuration
├── android/                  # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/
│   │   │   │   ├── drawable/           # Splash screen
│   │   │   │   ├── mipmap-xxxhdpi/     # App icons (192x192)
│   │   │   │   ├── mipmap-xxhdpi/      # App icons (144x144)
│   │   │   │   ├── mipmap-xhdpi/       # App icons (96x96)
│   │   │   │   ├── mipmap-hdpi/        # App icons (72x72)
│   │   │   │   ├── mipmap-mdpi/        # App icons (48x48)
│   │   │   │   └── values/
│   │   │   │       ├── colors.xml
│   │   │   │       ├── strings.xml
│   │   │   │       └── styles.xml
│   │   │   └── java/.../MainActivity.java
│   │   └── build.gradle
│   ├── build.gradle
│   └── gradle.properties
├── src/
│   └── utils/
│       ├── api.js            # Platform-aware API config
│       ├── capacitor.js      # Mobile utilities
│       └── storage.js        # Cross-platform storage
└── dist/                     # Built web assets
```

---

## Development Workflow

### Daily Development Commands

```bash
# 1. Make code changes in src/

# 2. Build the web app
npm run build

# 3. Sync to Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android

# Or run directly (if Android SDK configured)
npx cap run android
```

### Live Reload Development

For live reload during development, update `capacitor.config.ts`:

```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5173',  // e.g., 192.168.1.100
  cleartext: true,
}
```

Then run:
```bash
npm run dev
npx cap run android
```

---

## App Icons & Splash Screens

### Required Icon Sizes

Create your app icon at **1024x1024 px** then resize to these dimensions:

| Folder | Size | Usage |
|--------|------|-------|
| mipmap-mdpi | 48x48 | Low density |
| mipmap-hdpi | 72x72 | Medium density |
| mipmap-xhdpi | 96x96 | High density |
| mipmap-xxhdpi | 144x144 | Extra high density |
| mipmap-xxxhdpi | 192x192 | Extra extra high density |

### File Names Required

For each mipmap folder, create:
- `ic_launcher.png` - Square icon
- `ic_launcher_round.png` - Round icon (for devices that use round icons)
- `ic_launcher_foreground.png` - Adaptive icon foreground (optional)

### Icon Location

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

### Splash Screen

Edit `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item
        android:gravity="center"
        android:drawable="@drawable/splash_logo"
        android:width="200dp"
        android:height="200dp" />
</layer-list>
```

Add your logo as `android/app/src/main/res/drawable/splash_logo.png`

### Quick Icon Generation (Online Tools)

1. **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/
2. **App Icon Generator**: https://appicon.co/
3. **Figma Plugin**: "Android Icon Maker"

---

## Building for Production

### Step 1: Update Environment

Create/update `frontend/.env.production`:

```env
VITE_API_URL=https://your-production-api.com/api
```

### Step 2: Disable Debug Mode

Edit `capacitor.config.ts`:

```typescript
android: {
  webContentsDebuggingEnabled: false,  // Change to false
  // ...
}
```

### Step 3: Build & Sync

```bash
cd frontend
npm run build
npx cap sync android
```

---

## Creating the Keystore

The keystore is your signing identity. **NEVER LOSE THIS FILE OR PASSWORD** - you cannot update your app without it.

### Generate Keystore

```bash
# Run from frontend directory
keytool -genkey -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias inventory-manager
```

You will be prompted for:
- **Keystore password**: Create a strong password (save it!)
- **Key password**: Can be same as keystore password
- **Name**: Your name or company name
- **Organization Unit**: e.g., "Development"
- **Organization**: Your company name
- **City**: Your city
- **State**: Your state
- **Country Code**: e.g., "US" or "IN"

### Store Credentials Securely

Create `frontend/android/keystore.properties` (add to .gitignore!):

```properties
storeFile=../release-keystore.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=inventory-manager
keyPassword=YOUR_KEY_PASSWORD
```

### Configure Gradle for Signing

Edit `frontend/android/app/build.gradle`, add before `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android {`, add:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

## Generating Signed AAB

### Method 1: Command Line

```bash
cd frontend/android

# Windows
gradlew.bat bundleRelease

# Mac/Linux
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Method 2: Android Studio

1. Open Android Studio: `npx cap open android`
2. Menu: **Build** → **Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Select your keystore, enter passwords
5. Choose **release** build variant
6. Click **Finish**

---

## Google Play Store Publishing

### 1. Create Developer Account

- Go to: https://play.google.com/console
- Pay one-time $25 fee
- Complete identity verification

### 2. Required Store Listing Assets

| Asset | Dimensions | Format |
|-------|------------|--------|
| App Icon | 512x512 px | PNG (32-bit, no alpha) |
| Feature Graphic | 1024x500 px | PNG or JPG |
| Phone Screenshots | min 320px, max 3840px | PNG or JPG |
| 7-inch Tablet Screenshots | 1024x768 or similar | PNG or JPG |
| 10-inch Tablet Screenshots | 2560x1600 or similar | PNG or JPG |

### Screenshot Recommendations

- At least 2 phone screenshots required
- Show key features of your app
- Use device frames for professional look
- Tools: https://screenshots.pro/ or https://mockuphone.com/

### 3. Privacy Policy (Required)

Host this on a public URL (your website, GitHub Pages, etc.):

```markdown
# Privacy Policy for Inventory Manager

Last updated: [DATE]

## Information We Collect

Inventory Manager collects the following information:
- Account information (email, name) for authentication
- Inventory data you enter (products, orders, suppliers)
- Usage analytics to improve app performance

## How We Use Information

- Provide and maintain our service
- Notify you about changes
- Provide customer support
- Monitor usage patterns

## Data Storage

Your data is stored securely on our servers. We implement industry-standard
security measures to protect your information.

## Third-Party Services

We use:
- Secure cloud hosting for data storage
- Analytics services for app improvement

## Your Rights

You can:
- Access your data
- Request data deletion
- Export your data

## Contact

For questions about this policy: [YOUR EMAIL]

## Changes

We may update this policy periodically. Check this page for updates.
```

### 4. Data Safety Form

In Play Console, complete the Data Safety section:

| Question | Answer for this app |
|----------|---------------------|
| Does your app collect user data? | Yes |
| Data types collected | Name, Email, App activity |
| Is data encrypted in transit? | Yes (HTTPS) |
| Can users request data deletion? | Yes |
| Is data shared with third parties? | No (unless you use analytics) |

### 5. App Access Instructions

Since your app requires login, provide test credentials:

```
Test Account:
Email: admin@example.com
Password: password

This account has sample inventory data for testing all features.
```

### 6. Content Rating

Complete the content rating questionnaire:
- App category: Business/Productivity
- Violence: None
- Sexuality: None
- Language: None
- Controlled substances: None

Result: Likely rated **Everyone** or **Low Maturity**

### 7. Publishing Checklist

- [ ] AAB file uploaded
- [ ] Store listing complete (description, screenshots)
- [ ] Privacy policy URL provided
- [ ] Data safety form complete
- [ ] Content rating complete
- [ ] App access instructions provided
- [ ] Target audience set (likely 18+)
- [ ] App category selected (Business)
- [ ] Contact details provided

### 8. Release Process

1. Go to **Production** → **Releases**
2. Click **Create new release**
3. Upload your AAB file
4. Add release notes
5. Click **Review release**
6. Click **Start rollout to Production**

Initial review takes 1-3 days. Updates are faster.

---

## Troubleshooting

### API Connection Issues

**Problem**: App can't connect to backend

**Solutions**:
1. Check `network_security_config.xml` allows your server
2. For local testing, use `10.0.2.2:8000` (Android emulator)
3. Ensure backend CORS allows mobile requests

### Build Failures

**Problem**: Gradle build fails

**Solutions**:
```bash
# Clean and rebuild
cd android
gradlew.bat clean
gradlew.bat bundleRelease
```

### Keystore Issues

**Problem**: "keystore was tampered with, or password was incorrect"

**Solutions**:
1. Double-check passwords in keystore.properties
2. Ensure keystore file path is correct (relative to android/ folder)

### White Screen on App Launch

**Problem**: App shows white screen

**Solutions**:
1. Check `dist/` folder exists and has content
2. Run `npx cap sync android` after every build
3. Check browser console in Android Studio for JS errors

---

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start web dev server
npm run build                  # Build for production
npx cap sync android          # Sync web to Android
npx cap open android          # Open Android Studio
npx cap run android           # Build & run on device/emulator

# Android Studio Shortcuts
# Shift+F10                   # Run app
# Ctrl+F9                     # Build project
# Ctrl+Shift+K                # Clean project

# Keystore
keytool -list -v -keystore release-keystore.jks  # View keystore details

# ADB (Android Debug Bridge)
adb devices                   # List connected devices
adb logcat                    # View device logs
adb install app.apk           # Install APK on device
```

---

## Support

- Capacitor Docs: https://capacitorjs.com/docs
- Android Docs: https://developer.android.com/docs
- Play Console Help: https://support.google.com/googleplay/android-developer
