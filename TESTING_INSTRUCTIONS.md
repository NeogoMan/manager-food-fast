# 🧪 Multi-Tenant Testing Instructions

**Status**: Ready for Manual Testing
**Frontend URL**: http://localhost:5174
**Firebase Console**: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore

---

## ✅ Automated Setup Complete

The following has been successfully completed:

- ✅ Migration: 5 users, 356 orders, 3 menu items, 116 notifications
- ✅ Default restaurant created: `rest_default_001` (Fast Food Manager)
- ✅ Firestore indexes deployed
- ✅ Security rules deployed (multi-tenant isolation active)
- ✅ Cloud Functions deployed (9 functions updated)
- ✅ Frontend server running on port 5174

---

## 📋 Manual Testing Checklist

### Test 1: Verify Data Migration (5 minutes)

**Open Firebase Console:**
https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore/databases/-default-/data

**Verify the following:**

1. **Restaurants Collection**
   - [ ] Click on `restaurants` collection
   - [ ] Document `rest_default_001` exists
   - [ ] Fields visible:
     ```
     name: "Fast Food Manager"
     email: "admin@fastfoodmanager.com"
     phone: "+212-600-000-000"
     plan: "basic"
     status: "active"
     restaurantId: "rest_default_001"
     ```

2. **Users Collection** (sample 2-3 documents)
   - [ ] Click on `users` collection
   - [ ] Open any user document
   - [ ] Verify it has `restaurantId: "rest_default_001"`
   - [ ] Verify it has `isSuperAdmin: false`
   - [ ] Check username field exists (should be like "admin", "cashier", etc.)

3. **Orders Collection** (sample 5-10 documents)
   - [ ] Click on `orders` collection
   - [ ] Open any order document
   - [ ] Verify it has `restaurantId: "rest_default_001"`
   - [ ] Verify order data is intact (items, status, customer info)

4. **Menu Collection**
   - [ ] Click on `menu` collection
   - [ ] Should see 3 items
   - [ ] Each item has `restaurantId: "rest_default_001"`

**✅ If all checks pass, migration is verified successfully**

---

### Test 2: User Authentication with RestaurantId (10 minutes)

**Prerequisites:**
- Frontend running on http://localhost:5174
- Browser DevTools open (F12 or Cmd+Option+I on Mac)

**Steps:**

1. **Open the Application**
   - [ ] Go to: http://localhost:5174
   - [ ] You should see the login page

2. **Login with Manager Account**
   - [ ] Use credentials:
     - Username: `admin` (or check Firebase Console for actual username)
     - Password: (check your existing password)
   - [ ] Click "Login"

3. **Verify Login Success**
   - [ ] You're redirected to dashboard/main page
   - [ ] No errors in browser console

4. **Check JWT Token**
   - [ ] Open DevTools > Application tab (Chrome) or Storage tab (Firefox)
   - [ ] Go to Local Storage > http://localhost:5174
   - [ ] Find the auth token key (might be named `authToken`, `user`, or similar)
   - [ ] Copy the token value

5. **Decode JWT Token**
   - [ ] Go to https://jwt.io
   - [ ] Paste token in the "Encoded" field
   - [ ] Look at "Decoded" PAYLOAD section
   - [ ] Verify it contains:
     ```json
     {
       "role": "manager",
       "username": "admin",
       "restaurantId": "rest_default_001",
       "isSuperAdmin": false,
       "name": "...",
       "phone": "..."
     }
     ```

6. **Check User Object in Console**
   - [ ] In browser console, type: `localStorage`
   - [ ] Check if user data includes `restaurantId`

**✅ If token contains restaurantId, authentication test PASSED**

---

### Test 3: Menu Management (15 minutes)

**Prerequisites:** Logged in as manager

1. **Navigate to Menu Page**
   - [ ] Click on "Menu" in navigation
   - [ ] You should see existing menu items (3 items)

2. **Create New Menu Item**
   - [ ] Click "Add Menu Item" or "+" button
   - [ ] Fill in the form:
     ```
     Name: Test Multi-Tenant Burger
     Description: Testing multi-tenancy feature
     Price: 12.99
     Category: Burgers
     Available: Yes/Checked
     ```
   - [ ] Click "Save" or "Add Item"
   - [ ] Item appears in the menu list immediately

3. **Verify in Firestore**
   - [ ] Go to Firebase Console > `menu` collection
   - [ ] Find the item with name "Test Multi-Tenant Burger"
   - [ ] Verify it has `restaurantId: "rest_default_001"`
   - [ ] Verify price is `12.99`

4. **Edit Menu Item**
   - [ ] Click "Edit" on the test item
   - [ ] Change price to `13.99`
   - [ ] Change description to "Updated description"
   - [ ] Save changes
   - [ ] Verify changes appear immediately

5. **Verify Edit in Firestore**
   - [ ] Refresh Firestore console
   - [ ] Verify price updated to `13.99`
   - [ ] Verify description updated

6. **Delete Menu Item**
   - [ ] Click "Delete" on the test item
   - [ ] Confirm deletion
   - [ ] Item disappears from list

7. **Verify Deletion in Firestore**
   - [ ] Refresh Firestore console
   - [ ] Test item should be gone

**✅ If all CRUD operations work and new items have restaurantId, test PASSED**

---

### Test 4: Order Management (20 minutes)

**Prerequisites:** Logged in as manager

1. **Navigate to Orders Page**
   - [ ] Click on "Orders" in navigation
   - [ ] You should see existing orders (356 orders from migration)

2. **Create New Order**
   - [ ] Click "New Order" or "+" button
   - [ ] Select 2-3 menu items from the list
   - [ ] Enter customer name: "Test Customer Multi-Tenant"
   - [ ] Add optional notes: "Testing order creation"
   - [ ] Click "Create Order" or "Submit"
   - [ ] Order appears in the orders list

3. **Verify Order in Firestore**
   - [ ] Go to Firebase Console > `orders` collection
   - [ ] Sort by `createdAt` (descending) to find newest order
   - [ ] Verify the new order has:
     ```
     restaurantId: "rest_default_001"
     customerName: "Test Customer Multi-Tenant"
     status: "pending" (or "awaiting_approval")
     items: [array of selected items]
     total: [calculated total]
     ```

4. **Update Order Status**
   - [ ] Find the test order in the orders list
   - [ ] Click to view details (if needed)
   - [ ] Change status to "Preparing"
   - [ ] Verify status updates in UI
   - [ ] Change status to "Ready"
   - [ ] Change status to "Completed"

5. **Verify Status in Firestore**
   - [ ] Refresh Firestore console
   - [ ] Verify order status is "completed"
   - [ ] Verify `updatedAt` timestamp changed

**✅ If order creation and status updates work with restaurantId, test PASSED**

---

### Test 5: Kitchen Display & Real-Time Updates (15 minutes)

**Prerequisites:** Logged in as manager

1. **Open Kitchen Display**
   - [ ] Open a new browser tab
   - [ ] Navigate to: http://localhost:5174/kitchen
   - [ ] You should see the Kanban board with columns:
     - Pending
     - Preparing
     - Ready

2. **Verify Existing Orders Display**
   - [ ] Orders should be organized by status in columns
   - [ ] Each order card shows order number, customer, items

3. **Test Real-Time Updates (Two Tabs)**
   - **Tab 1:** Keep Kitchen display open
   - **Tab 2:** Open Orders page (http://localhost:5174/orders)

4. **Create Order in Tab 2**
   - [ ] Create a new order with:
     ```
     Customer: Real-Time Test
     Items: 1-2 menu items
     ```
   - [ ] Submit the order

5. **Watch Tab 1 (Kitchen Display)**
   - [ ] New order should appear automatically (no refresh!)
   - [ ] Order appears in "Pending" column
   - [ ] Audio notification may play (if enabled)

6. **Update Status in Kitchen Tab**
   - [ ] Click "Start Preparing" on the new order
   - [ ] Order moves to "Preparing" column
   - [ ] Click "Mark as Ready"
   - [ ] Order moves to "Ready" column
   - [ ] Click "Complete Order"
   - [ ] Order disappears from board

7. **Verify in Orders Tab**
   - [ ] Switch to Tab 2 (Orders page)
   - [ ] Refresh if needed
   - [ ] Find the "Real-Time Test" order
   - [ ] Status should be "Completed"

**✅ If real-time updates work across tabs, test PASSED**

---

### Test 6: User Management (20 minutes)

**Prerequisites:** Logged in as manager

1. **Navigate to Users Page**
   - [ ] Click on "Users" in navigation
   - [ ] You should see 5 existing users

2. **Create New User**
   - [ ] Click "Add User" or "Create User"
   - [ ] Fill in the form:
     ```
     Username: test_multi_tenant_cashier
     Name: Test Multi Cashier
     Role: Cashier
     Phone: +212-600-111-222 (optional)
     Password: TestPass123!
     ```
   - [ ] Click "Create" or "Save"
   - [ ] Success message appears
   - [ ] New user appears in the list

3. **Verify in Firestore**
   - [ ] Go to Firebase Console > `users` collection
   - [ ] Find user with username "test_multi_tenant_cashier"
   - [ ] Verify it has:
     ```
     restaurantId: "rest_default_001"
     isSuperAdmin: false
     role: "cashier"
     username: "test_multi_tenant_cashier"
     passwordHash: [hashed value]
     ```

4. **Test New User Login**
   - [ ] Logout from current session
   - [ ] Login with new user:
     ```
     Username: test_multi_tenant_cashier
     Password: TestPass123!
     ```
   - [ ] Login should succeed
   - [ ] User has appropriate role-based access (cashier permissions)

5. **Check Token for New User**
   - [ ] Open DevTools > Application > Local Storage
   - [ ] Decode JWT token at jwt.io
   - [ ] Verify token contains:
     ```json
     {
       "role": "cashier",
       "username": "test_multi_tenant_cashier",
       "restaurantId": "rest_default_001",
       "isSuperAdmin": false
     }
     ```

6. **Cleanup (Login as Manager)**
   - [ ] Logout from cashier account
   - [ ] Login as manager
   - [ ] Go to Users page
   - [ ] Delete "test_multi_tenant_cashier" user

**✅ If new users are created with correct restaurantId, test PASSED**

---

### Test 7: Security & Data Isolation (15 minutes)

**Testing Cross-Restaurant Data Access**

1. **Create Second Test Restaurant** (Manual in Firestore)
   - [ ] Go to Firebase Console > `restaurants` collection
   - [ ] Click "Add Document"
   - [ ] Document ID: `rest_test_002`
   - [ ] Add fields (copy structure from `rest_default_001`):
     ```
     name: "Test Restaurant 2"
     restaurantId: "rest_test_002"
     email: "test2@example.com"
     plan: "basic"
     status: "active"
     ... (copy other fields)
     ```
   - [ ] Save document

2. **Create Test User for Restaurant 2** (Manual in Firestore)
   - [ ] Go to `users` collection
   - [ ] Click "Add Document"
   - [ ] Document ID: Auto-ID
   - [ ] Add fields:
     ```
     username: "test_restaurant2_manager"
     passwordHash: [copy from another user, won't work for login but structure is valid]
     restaurantId: "rest_test_002"  <- DIFFERENT RESTAURANT
     role: "manager"
     name: "Restaurant 2 Manager"
     isSuperAdmin: false
     status: "active"
     ```

3. **Test Security Rules (Firestore Rules Playground)**
   - [ ] Go to Firebase Console > Firestore > Rules tab
   - [ ] Click "Rules Playground"

4. **Test 1: User from Restaurant 1 reading Restaurant 2 data**
   ```
   Location: /users/{userId from rest_test_002}
   Auth: Simulate a user from rest_default_001
   Operation: Get
   Expected: DENIED ❌
   ```

5. **Test 2: Manager creating user in different restaurant**
   ```
   Location: /users/new_user_id
   Auth: Manager from rest_default_001
   Data: { restaurantId: "rest_test_002", ... }
   Operation: Create
   Expected: DENIED ❌
   ```

6. **Test 3: Reading orders from different restaurant**
   ```
   Location: /orders
   Auth: User from rest_default_001
   Filter: where restaurantId == "rest_test_002"
   Operation: List
   Expected: DENIED or EMPTY ❌
   ```

7. **Verify No Cross-Restaurant Access in App**
   - [ ] Login as user from `rest_default_001`
   - [ ] Try to view users list
   - [ ] Should only see users from `rest_default_001`
   - [ ] Try to view orders
   - [ ] Should only see orders from `rest_default_001`

**✅ If users cannot access other restaurant's data, security test PASSED**

---

### Test 8: Cloud Functions Verification (10 minutes)

1. **Check Function Logs**
   ```bash
   cd /Users/elmehdimotaqi/Documents/Fasr\ food\ project
   firebase functions:log
   ```

2. **Look for Errors**
   - [ ] No errors in `authenticateUser` function
   - [ ] No "restaurantId is null" or "undefined" errors
   - [ ] No permission denied errors
   - [ ] All function executions successful

3. **Test Authentication Function**
   - [ ] Login through the app
   - [ ] Check logs for `authenticateUser` execution
   - [ ] Should log successful authentication
   - [ ] restaurantId should be present in logs

4. **Test Create User Function**
   - [ ] Create a user through the app
   - [ ] Check logs for `createUser` execution
   - [ ] Should log successful user creation
   - [ ] restaurantId should be assigned

**✅ If no errors in Cloud Functions logs, test PASSED**

---

## 📊 Testing Scorecard

Mark each test as you complete it:

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Data Migration Verification | ⏳ Pending | |
| 2 | User Authentication | ⏳ Pending | |
| 3 | Menu Management | ⏳ Pending | |
| 4 | Order Management | ⏳ Pending | |
| 5 | Kitchen Display & Real-Time | ⏳ Pending | |
| 6 | User Management | ⏳ Pending | |
| 7 | Security & Data Isolation | ⏳ Pending | |
| 8 | Cloud Functions Verification | ⏳ Pending | |

**Legend:**
- ⏳ Pending - Not started
- 🔄 In Progress - Currently testing
- ✅ PASSED - All checks successful
- ❌ FAILED - Issues found (document in notes)
- ⚠️ PARTIAL - Some issues, but mostly working

---

## 🐛 Issues Found

Document any issues you find during testing:

### Issue #1
**Test:** _____
**Description:** _____
**Steps to Reproduce:** _____
**Expected:** _____
**Actual:** _____
**Priority:** (High/Medium/Low)

### Issue #2
(Add more as needed)

---

## ✅ Final Sign-Off

Once all tests are complete:

- [ ] All 8 tests marked as PASSED or documented as PARTIAL
- [ ] No critical issues found (or issues documented and acceptable)
- [ ] Cloud Functions logs clean
- [ ] Data integrity verified in Firestore
- [ ] Multi-tenant isolation working correctly

**Tested By:** _____________
**Date:** _____________
**Overall Status:** (PASS / PASS WITH ISSUES / FAIL)

**Notes:**

---

## 🚀 Next Steps After Testing

Once testing is complete and all tests pass:

1. **Commit Testing Results**
   ```bash
   # Update TESTING_RESULTS.md with your scorecard results
   git add TESTING_RESULTS.md TESTING_INSTRUCTIONS.md
   git commit -m "test: complete manual testing verification"
   git push
   ```

2. **Merge to Main** (if all tests pass)
   ```bash
   git checkout main
   git merge feature/multi-tenant-saas
   git push
   ```

3. **Begin Phase 2: Frontend Updates**
   - Update auth context to display restaurant name
   - Add restaurant info to UI header
   - Implement super admin features

4. **Begin Phase 3: Android App Updates**
   - Update models with restaurantId
   - Test Android app with multi-tenancy

5. **Plan Phase 4: Super Admin Dashboard**
   - Design admin UI wireframes
   - Plan restaurant management features

---

**Frontend Server:** http://localhost:5174
**Firebase Console:** https://console.firebase.google.com/project/fast-food-manager-b1f54
**Documentation:** See `SAAS_IMPLEMENTATION_PROGRESS.md` for full roadmap
