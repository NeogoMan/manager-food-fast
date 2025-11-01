# 🎉 Client Signup Implementation Progress

**Status**: 52% Complete (13/25 tasks)
**Last Updated**: 2025-01-31

---

## ✅ COMPLETED (13/25)

### Backend - 100% Complete ✨

#### 1. Cloud Functions (`functions/index.js`)
- ✅ **`validateRestaurantCode`** - Validates restaurant short codes
  - Input: `{code: string}`
  - Output: `{success: boolean, restaurant: {...}}`
  - Queries Firestore by `shortCode` field

- ✅ **`signUpClient`** - Creates new client accounts
  - Input: `{restaurantId, name, phone, password}`
  - Auto-generates username: `client_[phone_last4]_[random3]`
  - Returns custom auth token for auto-login

- ✅ **`authenticateUser`** - Updated to support phone login
  - Now accepts username OR phone number
  - Queries both fields in Firestore

#### 2. Firestore Indexes (`firestore.indexes.json`)
```json
// Restaurant code lookup
{
  "collectionGroup": "restaurants",
  "fields": [
    {"fieldPath": "shortCode", "order": "ASCENDING"},
    {"fieldPath": "status", "order": "ASCENDING"}
  ]
}

// Phone number + restaurant lookup
{
  "collectionGroup": "users",
  "fields": [
    {"fieldPath": "phone", "order": "ASCENDING"},
    {"fieldPath": "restaurantId", "order": "ASCENDING"}
  ]
}
```

#### 3. Scripts
- ✅ **`scripts/generate-restaurant-codes.cjs`**
  - Generates unique 6-character codes
  - Updates existing restaurants
  - Run with: `node scripts/generate-restaurant-codes.cjs`

---

### Android - Data & Domain Layers - 100% Complete ✨

#### 4. Dependencies (`app/build.gradle.kts`)
```kotlin
// CameraX for QR Scanning
implementation("androidx.camera:camera-camera2:1.3.1")
implementation("androidx.camera:camera-lifecycle:1.3.1")
implementation("androidx.camera:camera-view:1.3.1")

// ML Kit for Barcode Scanning
implementation("com.google.mlkit:barcode-scanning:17.2.0")
```

#### 5. Domain Models
- ✅ `domain/model/Restaurant.kt`

#### 6. DTOs
- ✅ `data/remote/dto/RestaurantDto.kt`
- ✅ `data/remote/dto/SignUpRequestDto.kt`
- ✅ `data/remote/dto/SignUpResponseDto.kt`

#### 7. Repositories
- ✅ **RestaurantRepository** (interface + implementation)
  - `validateRestaurantCode(code: String)`
  - `saveRestaurantCode(code, id, name)`
  - `getSavedRestaurantCode/Id/Name()`
  - `clearRestaurantData()`
  - `hasRestaurantCode()`

- ✅ **AuthRepository** (updated)
  - Added: `loginWithIdentifier(identifier, password)`
  - Added: `signUpClient(restaurantId, name, phone, password)`

#### 8. Services
- ✅ **FirebaseAuthService** (updated)
  - Added: `signUpClient()` method

- ✅ **PreferencesManager**
  - Manages restaurant code/ID/name with DataStore
  - Supports restaurant switching

#### 9. Use Cases
**Restaurant Use Cases:**
- ✅ `ValidateRestaurantCodeUseCase` - Validates code format + calls backend
- ✅ `GetSavedRestaurantUseCase` - Retrieves saved restaurant
- ✅ `SaveRestaurantUseCase` - Saves restaurant locally
- ✅ `ClearRestaurantUseCase` - Clears for switching

**Auth Use Cases:**
- ✅ `SignUpClientUseCase` - Full signup validation + FCM registration
- ✅ `LoginWithIdentifierUseCase` - Login with username/phone + FCM

#### 10. Navigation
- ✅ **Screen.kt** - Added 3 new routes:
  - `RestaurantCode`
  - `QRScanner`
  - `SignUp`

---

## 🔨 REMAINING TASKS (12/25)

### Presentation Layer (UI)

#### Priority 1: Core Screens
- [ ] **RestaurantCodeScreen + ViewModel**
  - Text field for manual code entry
  - "Scan QR Code" button → navigate to QRScanner
  - "Continue" button → validate code
  - Loading/error states

- [ ] **SignUpScreen + ViewModel**
  - Form: Name, Phone, Password, Confirm Password
  - All fields required
  - Password validation (min 6 chars, match)
  - Phone formatting
  - "Sign Up" button → create account + auto-login

- [ ] **QRScannerScreen**
  - CameraX preview
  - ML Kit barcode detection
  - Auto-navigate on QR detection
  - Manual entry fallback button

#### Priority 2: Updates to Existing Screens
- [ ] **LoginScreen** (update label)
  - Change "Username" to "Username or Phone"
  - Use `LoginWithIdentifierUseCase`

- [ ] **ProfileScreen** (add switcher)
  - Display current restaurant name
  - "Switch Restaurant" button → clear data → RestaurantCode

#### Priority 3: Navigation & Integration
- [ ] **NavGraph** - Wire up new screens
  - Add RestaurantCodeScreen composable
  - Add SignUpScreen composable
  - Add QRScannerScreen composable

- [ ] **MainScreen** - Update start destination logic
  ```kotlin
  val startDestination = when {
      !hasRestaurantCode -> Screen.RestaurantCode.route
      !isAuthenticated -> Screen.Login.route
      else -> Screen.Menu.route
  }
  ```

- [ ] **CartEntity** - Add `restaurantId` field
  - Migrate database schema
  - Link cart to specific restaurant

- [ ] **CartViewModel** - Update checkout
  - Check authentication before checkout
  - If not authenticated → navigate to SignUp with restaurantId

- [ ] **AndroidManifest.xml** - Add permissions
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-feature android:name="android.hardware.camera" />
  ```

#### Priority 4: Testing
- [ ] End-to-end testing

---

## 📂 NEW FILES CREATED (17)

### Backend (1)
1. `scripts/generate-restaurant-codes.cjs`

### Android - Domain (5)
2. `domain/model/Restaurant.kt`
3. `domain/repository/RestaurantRepository.kt`
4. `domain/usecase/restaurant/ValidateRestaurantCodeUseCase.kt`
5. `domain/usecase/restaurant/GetSavedRestaurantUseCase.kt`
6. `domain/usecase/restaurant/SaveRestaurantUseCase.kt`
7. `domain/usecase/restaurant/ClearRestaurantUseCase.kt`

### Android - Data (4)
8. `data/remote/dto/RestaurantDto.kt`
9. `data/remote/dto/SignUpRequestDto.kt`
10. `data/local/PreferencesManager.kt`
11. `data/repository/RestaurantRepositoryImpl.kt`

### Android - Auth Use Cases (2)
12. `domain/usecase/auth/SignUpClientUseCase.kt`
13. `domain/usecase/auth/LoginWithIdentifierUseCase.kt`

---

## 📝 MODIFIED FILES (6)

### Backend
1. `functions/index.js` - Added 2 new functions, updated 1
2. `firestore.indexes.json` - Added 2 composite indexes

### Android
3. `app/build.gradle.kts` - Added CameraX & ML Kit dependencies
4. `domain/repository/AuthRepository.kt` - Added 2 methods
5. `data/repository/AuthRepositoryImpl.kt` - Implemented 2 methods
6. `data/remote/api/FirebaseAuthService.kt` - Added signUpClient method
7. `presentation/navigation/Screen.kt` - Added 3 new routes

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Backend (Do This First!)

1. **Generate Restaurant Codes** (one-time)
```bash
cd "/Users/elmehdimotaqi/Documents/Fasr food project"
node scripts/generate-restaurant-codes.cjs
```

2. **Deploy Cloud Functions**
```bash
firebase deploy --only functions
```

3. **Deploy Firestore Indexes**
```bash
firebase deploy --only firestore:indexes
```

4. **Verify Deployment**
```bash
firebase functions:list
# Should show: validateRestaurantCode, signUpClient, authenticateUser

firebase firestore:indexes
# Check that restaurant shortCode index is "ENABLED"
```

---

## 🧪 TESTING GUIDE

### Test Backend Functions

#### 1. Test `validateRestaurantCode`
```bash
# After generating codes, check Firestore for a code
# Then test the function
```

#### 2. Test `signUpClient`
Use Postman or curl to test the Cloud Function endpoint.

#### 3. Test `authenticateUser` with phone
Login with a phone number instead of username.

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                   USER FLOW                             │
└─────────────────────────────────────────────────────────┘

1. App Launch
   ↓
2. Check Saved Restaurant Code (DataStore)
   ↓
   ┌────────────────────┬─────────────────────┐
   │ No Code Saved      │ Code Exists         │
   ↓                    ↓
3. RestaurantCodeScreen   Check Authentication
   │                      ↓
   ├─ Manual Entry    ┌────────┬──────────┐
   ├─ QR Scan         │ Logged │ Not Auth │
   │                  ↓        ↓
   └→ Validate  →  Menu     LoginScreen
                    ↓           ↓
              Browse Menu   Enter Creds
                    ↓           ↓
              Add to Cart   Login Success
                    ↓           ↓
              Checkout    Menu Screen
                    ↓
           ┌────────┴────────┐
           │ Authenticated?  │
           ↓                 ↓
       Place Order      SignUpScreen
                            ↓
                        Fill Form
                            ↓
                        Submit
                            ↓
                        Auto Login
                            ↓
                        Place Order
```

---

## 🎯 NEXT STEPS TO COMPLETE

### Immediate (Complete UI)
1. Create `RestaurantCodeScreen.kt` + `RestaurantCodeViewModel.kt`
2. Create `SignUpScreen.kt` + `SignUpViewModel.kt`
3. Create `QRScannerScreen.kt`
4. Update `LoginScreen.kt` (change label, use new use case)
5. Update `ProfileScreen.kt` (add restaurant switcher)
6. Update `NavGraph.kt` (wire all screens)
7. Update `MainScreen.kt` (start destination logic)

### Integration
8. Update `CartEntity.kt` (add restaurantId field)
9. Update `CartViewModel.kt` (checkout flow)
10. Update `AndroidManifest.xml` (camera permission)

### Testing
11. Generate restaurant codes
12. Deploy backend
13. Test complete flow on Android
14. Fix any bugs

---

## ⚠️ IMPORTANT NOTES

### Restaurant Code Format
- **Length**: 6-8 characters
- **Format**: Uppercase alphanumeric (e.g., `BURGER01`, `CAFE2024`)
- **Uniqueness**: Enforced at Cloud Function level

### Username Generation
- **Pattern**: `client_[phone_last4]_[random3]`
- **Example**: `client_1234_a7f` (for phone ending in 1234)
- **Collision**: Auto-retries up to 5 times

### Phone Number Format
- **Validation**: E.164 format (10-15 digits)
- **Examples**: `+212612345678`, `0612345678`
- **Adjust**: Regex in `SignUpClientUseCase` for your country

### QR Code Format
QR codes should contain JSON:
```json
{"restaurantCode": "BURGER01"}
```

Or just the plain code:
```
BURGER01
```

---

## 📞 SUPPORT

If you encounter issues:
1. Check Firebase Console → Functions → Logs
2. Check Android Logcat for errors
3. Verify Firestore indexes are built (can take a few minutes)
4. Ensure restaurant codes exist in database

---

**Implementation Status**: Backend Complete | Data Layer Complete | Domain Layer Complete | UI Layer 0% (Next!)

