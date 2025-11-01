# 📱 How to Find Logout & Switch Restaurant Features

## ✅ NEW APK BUILT - October 31, 22:38

**APK Location:**
```
/Users/elmehdimotaqi/Documents/Fasr food project/android/app/build/outputs/apk/debug/app-debug.apk
```

**File Size:** 45MB
**Build Time:** Just now (Oct 31, 22:38)

---

## 📲 STEP 1: Install the New APK

### Option A: Using ADB (if phone is connected)
```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project/android"
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Manual Installation
1. Copy the APK to your phone
2. Open the APK file on your phone
3. Allow "Install from unknown sources" if prompted
4. Install the app
5. **IMPORTANT:** If app is already installed, uninstall it first OR choose "Replace" when installing

---

## 🔍 STEP 2: Where to Find Profile Features

### After Opening the App:

```
┌─────────────────────────────────┐
│                                 │
│     APP MAIN SCREEN             │
│                                 │
│     (Menu content here)         │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  [Home] [Cart] [👤 Profil]  ← BOTTOM NAVIGATION
└─────────────────────────────────┘
         ↑          ↑
         |          └─── Orders/Cart Tab
         └────────────── Menu Tab
                              ↑
                              └─── **TAP HERE** - Person Icon "Profil"
```

### Bottom Navigation Tabs (in order):
1. **🏠 Menu** - Browse restaurant menu
2. **🛒 Commandes** - View orders and cart
3. **👤 Profil** ← **THIS IS WHERE THE FEATURES ARE!**

---

## 🎯 STEP 3: What You'll See in Profile Screen

When you tap the **"Profil"** tab (Person icon), you'll see:

```
┌─────────────────────────────────────┐
│         Profil                       │  ← Top bar
├─────────────────────────────────────┤
│                                     │
│         👤                          │  ← Profile icon (large)
│      [Profile Icon]                 │
│                                     │
├─────────────────────────────────────┤
│  📋 User Information Card:          │
│     • Nom: [Your Name]              │
│     • Nom d'utilisateur: [Username] │
│     • Téléphone: [Phone]            │
│     • Rôle: Client                  │
│     • Statut: Actif                 │
├─────────────────────────────────────┤
│  🏪 Restaurant Information:         │
│     • Restaurant: [Restaurant Name] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔄 Changer de restaurant    │   │  ← SWITCH RESTAURANT BUTTON
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🚪 Se déconnecter           │   │  ← LOGOUT BUTTON
│  └─────────────────────────────┘   │
│                                     │
│         Version 1.0.0               │
└─────────────────────────────────────┘
```

---

## ✅ FEATURE 1: Logout (Se déconnecter)

### How to Logout:
1. Tap **👤 Profil** tab in bottom navigation
2. Scroll down if needed
3. Tap **"Se déconnecter"** button (red outlined)
4. Confirm in dialog: **"Êtes-vous sûr de vouloir vous déconnecter?"**
5. ✅ Done! You're logged out and back to Login screen

### What Gets Cleared:
- ✅ User session (logged out)
- ✅ Cart items (all cleared)
- ✅ Restaurant code (cleared)
- ✅ All cached data

---

## ✅ FEATURE 2: Switch Restaurant (Changer de restaurant)

### How to Switch Restaurant:
1. Tap **👤 Profil** tab in bottom navigation
2. Tap **"Changer de restaurant"** button (blue outlined)
3. Read the dialog: **"Votre panier sera vidé et vous devrez entrer un nouveau code restaurant."**
4. Tap **"Confirmer"**
5. ✅ You're now at Restaurant Code screen
6. Enter a new restaurant code (e.g., MN0UTJ)
7. ✅ Done! You're now browsing the new restaurant's menu

### What Gets Cleared:
- ✅ Restaurant code (cleared)
- ✅ Cart items (cleared - items belong to old restaurant)
- ❌ User session (STAYS logged in)

### Test Codes:
- F75WJW - Test Restaurant 3
- MN0UTJ - Fast Food Manager
- U51ECQ - Test
- MLS92K - kio
- LXKHDI - test2
- 87UCQ4 - simo
- C8ER4X - 123 originale
- JR63BF - Ko

---

## 🚨 Troubleshooting

### "I don't see the Profil tab"
- ✅ **Solution:** Make sure you installed the NEW APK (Oct 31, 22:38)
- Old APK might not have this feature
- Uninstall old app first, then install new one

### "The buttons don't work"
- ✅ Check internet connection
- ✅ Make sure Firebase functions are deployed (they are!)
- ✅ Check if you're logged in first

### "I see an error when switching restaurant"
- ✅ This is normal - cart will be cleared
- ✅ Just enter a new restaurant code and continue

---

## 📸 Quick Visual Reference

### Where is the Profil Tab?
```
Bottom of screen → Rightmost icon → Person icon (👤) → Label says "Profil"
```

### Button Styles:
- **"Changer de restaurant"** = Blue outlined button with 🔄 icon
- **"Se déconnecter"** = Red outlined button with 🚪 icon

---

## 🎯 Quick Test Checklist

- [ ] Install new APK (45MB file dated Oct 31, 22:38)
- [ ] Open app and login
- [ ] Look at bottom navigation bar
- [ ] See three tabs: Menu | Commandes | Profil
- [ ] Tap "Profil" (rightmost tab with person icon)
- [ ] See profile screen with user info
- [ ] See "Changer de restaurant" button
- [ ] See "Se déconnecter" button
- [ ] Test logout → should go back to login screen
- [ ] Test switch restaurant → should ask for new code

---

## ✅ Confirmation

If you can see this screen layout after tapping the Profil tab, the features are working:

```
Profile icon (large circle)
   ↓
User info card (name, username, phone, role)
   ↓
Restaurant info card (restaurant name)
   ↓
"Changer de restaurant" button (with arrows icon)
   ↓
"Se déconnecter" button (with exit icon)
   ↓
Version 1.0.0
```

**If you DON'T see this layout**, you're likely running the old APK. Install the new one!

---

**Built:** October 31, 2025 - 22:38
**Status:** ✅ Ready to test
**Features:** Logout ✅ | Switch Restaurant ✅
