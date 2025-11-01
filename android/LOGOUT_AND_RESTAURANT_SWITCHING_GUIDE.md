# Logout and Restaurant Switching Guide

## Features Location

Both **Logout** and **Restaurant Switching** features are fully implemented and accessible through the **Profile screen**.

### How to Access

1. **Open the app** and log in with valid credentials
2. **Navigate to Profile tab** in the bottom navigation bar (Person icon - rightmost tab)
3. You'll see two buttons:
   - **"Se déconnecter"** (Logout) - Red outlined button
   - **"Changer de restaurant"** (Switch Restaurant) - Blue outlined button

## Feature Details

### 1. Logout Feature ✅

**What it does:**
- Shows confirmation dialog before logging out
- Clears all user data:
  - Firebase authentication session
  - Cart items
  - User profile from local database
  - Restaurant code and details
  - All DataStore preferences
- Navigates back to Login screen
- User must log in again to access the app

**Files involved:**
- `ProfileScreen.kt` (lines 287-297, 112-139)
- `ProfileViewModel.kt` (lines 94-121)
- `LogoutUseCase.kt`
- `AuthRepositoryImpl.kt` (logout method)

### 2. Switch Restaurant Feature ✅ (Enhanced)

**What it does:**
- Shows confirmation dialog explaining that cart will be cleared
- Clears cart items (items are restaurant-specific)
- Clears restaurant code, ID, and name
- **User stays logged in** (no need to re-authenticate)
- Navigates to Restaurant Code Screen to enter new code
- After entering new code, user can browse the new restaurant's menu

**Enhancement Added:**
- ✅ Cart is now cleared when switching restaurants
- ✅ Dialog text updated to inform users about cart clearing

**Files modified:**
- `ProfileViewModel.kt` (lines 142-161) - Added cart clearing
- `ProfileScreen.kt` (line 152) - Updated dialog text

**Files involved:**
- `ClearCartUseCase.kt`
- `ClearRestaurantUseCase.kt`
- `CartRepository.kt`
- `RestaurantRepository.kt`

## Navigation Flow

```
Login Screen
    ↓
Main Screen (Menu)
    ↓
[Bottom Navigation: Menu | Orders | Profile]
    ↓
Profile Screen
    ├── Logout Button → Login Screen
    └── Switch Restaurant Button → Restaurant Code Screen → Menu Screen (new restaurant)
```

## Bottom Navigation Tabs

1. **Menu** (Home icon) - Browse restaurant menu
2. **Commandes** (Shopping Cart icon) - View orders and cart
3. **Profil** (Person icon) - User profile, logout, switch restaurant

## Testing Guide

### Test Logout:
1. Log in with test credentials
2. Add some items to cart
3. Navigate to Profile tab
4. Click "Se déconnecter" button
5. Confirm in dialog
6. ✅ You should be logged out and redirected to Login screen
7. ✅ All data should be cleared (cart, user session, restaurant code)

### Test Switch Restaurant:
1. Log in with test credentials
2. Add some items to cart (e.g., from restaurant F75WJW)
3. Navigate to Profile tab
4. Click "Changer de restaurant" button
5. Read dialog: "Votre panier sera vidé..." (Your cart will be cleared)
6. Confirm in dialog
7. ✅ You should see Restaurant Code Screen
8. ✅ Cart should be empty
9. ✅ Enter new restaurant code (e.g., MN0UTJ)
10. ✅ You should see the new restaurant's menu
11. ✅ User remains logged in

## Restaurant Test Codes

Use these codes to test restaurant switching:

1. **F75WJW** - Test Restaurant 3 (ID: 6b1v3lvcf5y9xTKccaUo)
2. **MN0UTJ** - Fast Food Manager (ID: rest_default_001)
3. **U51ECQ** - Test (ID: N0M0IxhCXCVpdFIwG6Io)
4. **MLS92K** - kio (ID: SfZSSdBsb8BBviLyvoW2)
5. **LXKHDI** - test2 (ID: WncruzPs93NmCIPFOD6l)
6. **87UCQ4** - simo (ID: XGumODUEUdHkHHfUiwDZ)
7. **C8ER4X** - 123 originale (ID: caZkMwEyyACmW6cl28q5)
8. **JR63BF** - Ko (ID: p4YnqdIvFKDNnqRxTna8)

## Confirmation Dialogs

### Logout Dialog (French):
- **Title:** "Déconnexion"
- **Message:** "Êtes-vous sûr de vouloir vous déconnecter?"
- **Buttons:** "Confirmer" | "Annuler"

### Switch Restaurant Dialog (French):
- **Title:** "Changer de restaurant"
- **Message:** "Voulez-vous changer de restaurant? Votre panier sera vidé et vous devrez entrer un nouveau code restaurant."
- **Buttons:** "Confirmer" | "Annuler"

## Data Clearing Behavior

| Feature | Firebase Auth | Cart Items | User Profile | Restaurant Code | DataStore |
|---------|---------------|------------|--------------|-----------------|-----------|
| **Logout** | ✅ Clears | ✅ Clears | ✅ Clears | ✅ Clears | ✅ Clears All |
| **Switch Restaurant** | ❌ Keeps | ✅ Clears | ❌ Keeps | ✅ Clears | ⚠️ Partial Clear |

## Why Cart is Cleared When Switching Restaurants

Cart items belong to a specific restaurant:
- Menu items have restaurant-specific IDs
- Prices may differ between restaurants
- Menu availability varies by restaurant
- Order placement requires matching restaurant context

Therefore, when switching from Restaurant A to Restaurant B, the cart must be cleared to avoid:
- Ordering items from wrong restaurant
- Price mismatches
- Inventory conflicts
- Order placement failures

## Build Status

✅ Android app builds successfully
✅ All dependencies injected correctly
✅ DataStore singleton issue resolved
✅ Firebase Cloud Functions deployed

## Summary

**Both features you requested already existed** and are working correctly in the Profile screen. I added an enhancement to clear the cart when switching restaurants, which is the expected behavior since cart items are restaurant-specific.

**You can now:**
1. ✅ Logout from the Profile screen (clears all data)
2. ✅ Switch restaurants from the Profile screen (clears cart & restaurant code, keeps user logged in)
3. ✅ Test with the 8 restaurant codes provided above

The app is ready to test!
