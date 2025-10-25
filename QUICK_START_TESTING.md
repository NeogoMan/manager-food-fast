# 🚀 Quick Start Testing Guide

**Updated**: October 25, 2025 - After Frontend Fixes
**Status**: ✅ Ready for Testing
**Frontend**: http://localhost:5174

---

## ✅ Recent Fixes Applied

**Issue**: Firestore permission errors on page load
**Fix**: Added authentication guards to prevent queries before auth loads
**Status**: ✅ FIXED

The frontend now properly waits for authentication before querying Firestore.

---

## 🎯 Start Testing Now (15 Minutes Quick Test)

### Step 1: Verify Login (2 minutes)

1. **Open Frontend**:
   ```
   http://localhost:5174
   ```

2. **Login**:
   - Username: `admin` (check Firebase Console if needed)
   - Password: [your existing password]

3. **Expected Result**:
   - ✅ Login successful
   - ✅ Redirected to dashboard/orders page
   - ✅ No errors in browser console (F12)

**If login fails**: Check Firebase Console > Authentication to see existing users

---

### Step 2: Check JWT Token (3 minutes)

1. **Open Browser DevTools** (F12 or Cmd+Option+I)

2. **Go to Application Tab** (Chrome) or Storage Tab (Firefox)

3. **Find Auth Token**:
   - Local Storage > http://localhost:5174
   - Look for token or user data

4. **Decode Token**:
   - Go to https://jwt.io
   - Paste token in "Encoded" field
   - Look at PAYLOAD section

5. **Verify Token Contains**:
   ```json
   {
     "role": "manager",
     "username": "admin",
     "restaurantId": "rest_default_001",  ← VERIFY THIS EXISTS
     "isSuperAdmin": false
   }
   ```

**✅ If restaurantId exists in token, authentication is working correctly!**

---

### Step 3: Test Menu Display (3 minutes)

1. **Navigate to Menu** (if not already there)

2. **Verify**:
   - ✅ Menu items are displayed
   - ✅ No errors in console
   - ✅ Can see item names, prices, categories

3. **Open Firebase Console**:
   https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore/databases/-default-/data/~2Fmenu

4. **Pick any menu item and verify**:
   - ✅ Has `restaurantId: "rest_default_001"`

---

### Step 4: Test Order Creation (5 minutes)

1. **Navigate to Orders Page**

2. **Create New Order**:
   - Click "New Order" or "+ Order"
   - Select 1-2 menu items
   - Customer name: "Quick Test"
   - Click "Create" or "Submit"

3. **Verify**:
   - ✅ Order appears in list
   - ✅ No errors in console

4. **Check in Firebase Console**:
   ```
   https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore/databases/-default-/data/~2Forders
   ```
   - Sort by `createdAt` (newest first)
   - Find "Quick Test" order
   - ✅ Verify it has `restaurantId: "rest_default_001"`

---

### Step 5: Quick Security Check (2 minutes)

1. **Go to Firebase Console > Firestore > Rules**

2. **Click "Rules Playground"**

3. **Test Query**:
   ```
   Location: /users/{any-user-id}
   Simulate: Get
   Auth: [Leave blank - unauthenticated]
   ```

4. **Click "Run"**:
   - **Expected**: ❌ DENIED (permission-denied)
   - This confirms unauthenticated users cannot read data

5. **Test with Auth**:
   ```
   Location: /users/{any-user-id}
   Simulate: Get
   Auth: [Select any user or enter UID]
   ```
   - **Expected**: ✅ ALLOW (if same restaurant)

---

## 📊 Quick Test Scorecard

| Test | Status | Pass/Fail |
|------|--------|-----------|
| Login Works | ⏳ | |
| JWT has restaurantId | ⏳ | |
| Menu Displays | ⏳ | |
| Order Creation | ⏳ | |
| Security Rules Block Unauth | ⏳ | |

**Mark each as you test. If all PASS, migration is successful!**

---

## 🐛 Known Issues & Solutions

### Issue 1: "Missing or insufficient permissions"
**Status**: ✅ FIXED in latest commit (dde17d6)
**Solution**: Authentication guards added to Orders page
**Action**: Refresh page if you see this error

### Issue 2: Can't see any data after login
**Cause**: User might not be authenticated properly
**Solution**:
1. Clear browser cache and localStorage
2. Logout and login again
3. Check Firebase Console > Authentication to verify user exists

### Issue 3: Menu items don't load
**Cause**: Menu items might not have `isAvailable: true`
**Solution**: Check Firebase Console > menu collection
- Ensure items have `isAvailable: true`

---

## 🎯 What's Working

✅ Database migration (5 users, 356 orders, 3 menu items)
✅ Default restaurant created
✅ Security rules deployed
✅ Cloud Functions deployed
✅ Frontend authentication fixed
✅ JWT tokens include restaurantId

---

## 🚀 Next Steps After Quick Test

If all 5 quick tests pass:

1. **Full Testing**: Follow `TESTING_INSTRUCTIONS.md` for comprehensive tests

2. **Phase 2**: Begin frontend updates
   - Add restaurant name to header
   - Display plan information
   - Add super admin features

3. **Phase 3**: Test Android app

4. **Merge to Main**: Once all tests pass

---

## 📁 Important Links

- **Frontend**: http://localhost:5174
- **Firebase Console**: https://console.firebase.google.com/project/fast-food-manager-b1f54
- **Firestore Data**: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore/databases/-default-/data
- **JWT Decoder**: https://jwt.io

---

## 💡 Testing Tips

1. **Keep DevTools Open**: Press F12 and watch the Console tab for errors

2. **Check Network Tab**: See if API calls are succeeding or failing

3. **Firebase Console**: Keep it open in another tab to verify data changes

4. **Clear Cache**: If something seems broken, try clearing browser cache:
   - Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   - Select "Cached images and files"
   - Select "Cookies and other site data"
   - Click "Clear data"

5. **Fresh Login**: If issues persist, logout and login again

---

## ✅ Success Criteria

**Testing is successful if:**
- [x] Migration completed (documented)
- [ ] Login works with restaurantId in JWT
- [ ] Menu displays correctly
- [ ] Orders can be created with restaurantId
- [ ] Security rules block unauthorized access
- [ ] No console errors during normal use

**Once these pass, proceed to full testing in TESTING_INSTRUCTIONS.md**

---

**Last Updated**: October 25, 2025 14:40
**Branch**: feature/multi-tenant-saas
**Commit**: dde17d6
