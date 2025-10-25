# Kiosk Mode Setup Guide

Complete guide for setting up the Fast Food Manager application in kiosk mode for staff devices (cashier, kitchen, manager).

## Table of Contents

1. [Overview](#overview)
2. [PWA Installation](#pwa-installation)
3. [Built-in Kiosk Features](#built-in-kiosk-features)
4. [Android Kiosk Browser Setup](#android-kiosk-browser-setup)
5. [Chrome Kiosk Mode](#chrome-kiosk-mode)
6. [Configuration Options](#configuration-options)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The application now includes **three layers of kiosk protection**:

1. **PWA (Progressive Web App)** - Installable app that runs without browser UI
2. **Application-level controls** - Keyboard shortcuts blocked, fullscreen mode, navigation prevention
3. **Device-level lockdown** - Android kiosk browser or Chrome kiosk flags (recommended)

### Features Included

- ✅ Fullscreen mode (F11 to toggle)
- ✅ Disabled right-click context menu
- ✅ Blocked dangerous keyboard shortcuts (Ctrl+W, Alt+F4, etc.)
- ✅ Prevention of accidental navigation
- ✅ Landscape orientation lock
- ✅ Installable as standalone app
- ✅ No zoom/pinch gestures

---

## PWA Installation

### Installation on Android Tablet

1. **Open Chrome browser** on your Android tablet
2. **Navigate to the app URL**: `http://localhost:5173` (or your server IP)
3. **Look for "Add to Home Screen" prompt**:
   - Chrome will automatically show an install banner
   - Or tap the menu (⋮) → "Add to Home screen" → "Install"
4. **Confirm installation**
5. **Launch the app** from your home screen

**Result:** The app will run in fullscreen mode without browser UI.

### Installation on Desktop/Laptop

1. **Open Chrome browser**
2. **Navigate to the app URL**
3. **Click the install icon** in the address bar (⊕ icon)
   - Or: Menu (⋮) → "Install Fast Food Manager..."
4. **Confirm installation**
5. **App will open** in a standalone window

**Result:** The app runs as a standalone application.

---

## Built-in Kiosk Features

The application automatically activates kiosk mode for **staff interfaces only** (cashier, kitchen, manager). The client interface has normal browser behavior.

### Keyboard Shortcuts

The following shortcuts are active:

| Shortcut | Function |
|----------|----------|
| **F11** | Toggle fullscreen mode |
| **Ctrl+W** | ❌ Blocked (close tab) |
| **Ctrl+Q** | ❌ Blocked (quit browser) |
| **Ctrl+T** | ❌ Blocked (new tab) |
| **Ctrl+N** | ❌ Blocked (new window) |
| **Alt+F4** | ❌ Blocked (close window) |
| **Right-click** | ❌ Blocked (context menu) |

**Note:** F5 (refresh) is NOT blocked to allow manual refresh if needed.

### Auto-Enter Fullscreen

To automatically enter fullscreen mode when the app loads:

1. Edit `frontend/src/App.jsx`
2. Find the `useKioskMode` hook configuration
3. Change `autoEnterFullscreen: false` to `autoEnterFullscreen: true`

```javascript
const { isFullscreen, toggleFullscreen } = useKioskMode({
  enableFullscreen: true,
  blockKeyboardShortcuts: true,
  disableContextMenu: true,
  preventNavigation: true,
  autoEnterFullscreen: true, // ← Change this to true
});
```

---

## Android Kiosk Browser Setup

For the **strongest kiosk protection**, use a dedicated Android kiosk browser app. This prevents users from exiting the app, accessing system settings, or using other apps.

### Recommended: Fully Kiosk Browser

**Fully Kiosk Browser** is a popular kiosk solution for Android.

#### Installation

1. **Install from Google Play Store**:
   - Search for "Fully Kiosk Browser"
   - Install on your Android tablet

2. **Configure Fully Kiosk Browser**:

   **a. Set your app URL:**
   - Open Fully Kiosk Browser
   - Go to Settings → Web Content Settings
   - Set "Start URL" to: `http://localhost:5173` (or your server IP)

   **b. Enable kiosk mode:**
   - Go to Settings → Kiosk Mode
   - Enable "Kiosk Mode"
   - Enable "Lock Device"
   - Enable "Hide Status Bar"
   - Enable "Hide Navigation Bar"

   **c. Disable system access:**
   - Go to Settings → Function Access
   - Disable "Allow Settings Access"
   - Disable "Allow Task Manager"
   - Disable "Allow Downloads"

   **d. Set exit password:**
   - Go to Settings → Security
   - Enable "Password Protection"
   - Set a secure password
   - **IMPORTANT:** Remember this password to exit kiosk mode later

3. **Start Kiosk Mode**:
   - Tap "Start" or "Lock Device"
   - App will lock into fullscreen mode

#### Exiting Kiosk Mode

1. **Tap 5 times** in the top-right corner rapidly
2. **Enter your password**
3. **Disable kiosk mode** or reconfigure

### Alternative: Kiosk Browser Lockdown

Another option is **Kiosk Browser Lockdown** (also on Google Play).

**Features:**
- Free and open-source
- Simpler configuration
- Good for basic kiosk needs

**Configuration:** Similar to Fully Kiosk Browser.

---

## Chrome Kiosk Mode

If you don't want to use a kiosk browser app, you can launch Chrome in kiosk mode using command-line flags.

### Android (via ADB)

If you have USB debugging enabled:

```bash
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main \
  --activity-single-top \
  --es "url" "http://localhost:5173" \
  --es "kiosk" "true"
```

### Desktop/Laptop (Windows, Mac, Linux)

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:5173" --start-fullscreen
```

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk "http://localhost:5173" --start-fullscreen
```

**Linux:**
```bash
google-chrome --kiosk "http://localhost:5173" --start-fullscreen
```

**Additional Flags (Optional):**
```bash
--noerrdialogs          # Suppress error dialogs
--disable-infobars      # Hide info bars
--disable-session-crashed-bubble  # Hide crash recovery
--disable-translate     # Disable translation prompts
```

**Full Example:**
```bash
google-chrome --kiosk "http://localhost:5173" \
  --start-fullscreen \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble
```

---

## Configuration Options

### Customize Kiosk Behavior

Edit `frontend/src/App.jsx` to customize kiosk mode:

```javascript
const { isFullscreen, toggleFullscreen } = useKioskMode({
  enableFullscreen: true,          // Enable/disable fullscreen API
  blockKeyboardShortcuts: true,    // Block dangerous shortcuts
  disableContextMenu: true,        // Disable right-click menu
  preventNavigation: true,         // Prevent back button navigation
  autoEnterFullscreen: false,      // Auto-enter fullscreen on load
});
```

### Disable Kiosk Mode Entirely

To disable kiosk mode completely:

1. Edit `frontend/src/App.jsx`
2. Comment out or remove the `useKioskMode` hook:

```javascript
// const { isFullscreen, toggleFullscreen } = useKioskMode({
//   ...
// });
```

### Change Orientation Lock

Edit `frontend/public/manifest.json`:

```json
{
  "orientation": "landscape"  // Options: "landscape", "portrait", "any"
}
```

---

## Troubleshooting

### Issue 1: Install Banner Not Showing

**Symptoms:** Chrome doesn't show "Add to Home Screen" prompt.

**Solutions:**
- Ensure you're using **HTTPS** or **localhost**
- PWA must be served over secure connection
- Check browser console for manifest errors
- Try manual installation: Menu (⋮) → "Install Fast Food Manager"

### Issue 2: Fullscreen Not Working

**Symptoms:** F11 doesn't toggle fullscreen, or fullscreen exits immediately.

**Causes:**
- Browser security restrictions
- User gesture required (can't auto-enter on some browsers)

**Solutions:**
- Manually press F11 after app loads
- Use a kiosk browser app instead
- Check browser permissions

### Issue 3: Right-Click Still Works

**Symptoms:** Right-click context menu appears despite kiosk mode.

**Causes:**
- Browser extensions overriding behavior
- Developer tools open

**Solutions:**
- Close developer tools (F12)
- Disable browser extensions
- Use kiosk browser app for stronger protection

### Issue 4: Can't Exit Fullscreen

**Symptoms:** Stuck in fullscreen mode, can't exit.

**Solutions:**
- Press **F11** to toggle fullscreen
- Press **Esc** key (browser default)
- Press **Alt+Tab** (Windows/Linux) or **Cmd+Tab** (Mac) to switch windows
- Restart browser if necessary

### Issue 5: App Doesn't Look Like PWA

**Symptoms:** Still see browser UI after installation.

**Solutions:**
- Make sure you installed from "Add to Home Screen" / "Install" option
- Check that `manifest.json` has `display: "fullscreen"`
- Reinstall the PWA (uninstall first, then reinstall)
- Clear browser cache and try again

### Issue 6: Keyboard Shortcuts Still Work

**Symptoms:** Ctrl+W, Ctrl+T, etc. still work despite kiosk mode.

**Causes:**
- Browser-level shortcuts override JavaScript
- Operating system shortcuts

**Solutions:**
- Use kiosk browser app (Fully Kiosk Browser)
- Use Chrome kiosk mode with command-line flags
- Configure OS-level kiosk mode (Android Enterprise, Windows Kiosk Mode)

---

## Advanced: Android Enterprise Kiosk

For enterprise deployments, use **Android Enterprise** (formerly Android for Work):

1. **Enroll device** in Android Enterprise
2. **Create kiosk policy** in your MDM (Mobile Device Management)
3. **Lock to single app** (Chrome or your kiosk browser)
4. **Disable system settings** and app switching
5. **Deploy to devices**

**Benefits:**
- Strongest protection
- Centralized management
- Automatic updates
- Remote control

**Tools:**
- Google Workspace (formerly G Suite)
- Microsoft Intune
- VMware Workspace ONE
- MobileIron

---

## Summary

**For Basic Kiosk Mode:**
1. ✅ PWA installation (already works out of the box)
2. ✅ Built-in fullscreen mode (F11 to toggle)
3. ✅ Blocked keyboard shortcuts and right-click

**For Strong Kiosk Mode:**
1. ✅ Install **Fully Kiosk Browser** on Android tablet
2. ✅ Configure kiosk settings and password
3. ✅ Lock device into app

**For Enterprise Deployments:**
1. ✅ Use Android Enterprise with MDM
2. ✅ Deploy kiosk policy to all devices
3. ✅ Centralized management and updates

---

## Quick Start Checklist

- [ ] Open app in Chrome browser
- [ ] Install PWA ("Add to Home Screen")
- [ ] Launch app from home screen
- [ ] Press F11 to enter fullscreen
- [ ] Verify keyboard shortcuts are blocked
- [ ] (Optional) Install Fully Kiosk Browser for stronger protection
- [ ] (Optional) Set autoEnterFullscreen to true in App.jsx

**You're all set! The app is now running in kiosk mode.**
