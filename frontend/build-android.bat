@echo off
echo ========================================
echo  Inventory Manager - Android Build
echo ========================================
echo.

echo [1/4] Building web assets...
call npm run build
if errorlevel 1 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing to Android project...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building Android AAB...
cd android
call gradlew.bat bundleRelease
if errorlevel 1 (
    echo ERROR: Android build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your signed AAB is at:
echo android\app\build\outputs\bundle\release\app-release.aab
echo.
echo Upload this file to Google Play Console.
echo.
pause
