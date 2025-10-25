# Testing Firebase Authentication

## Step 1: Create Admin User

Run the helper script to create an admin user:

```bash
# Install bcrypt if needed
npm install bcrypt

# Run the script
node create-admin.js
```

This will create an admin user with:
- **Username:** `admin`
- **Password:** `Admin123!`
- **Role:** `manager`

---

## Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

The app should start at: http://localhost:5173

---

## Step 3: Test Login

1. Open http://localhost:5173 in your browser
2. Login with:
   - **Username:** `admin`
   - **Password:** `Admin123!`

---

## Expected Result

### ✅ Success
If login works, you should:
1. See a success message
2. Be redirected to the dashboard/home page
3. See your name and role in the UI
4. Be able to access manager features

### ❌ If Login Fails

**Check Browser Console** (F12 → Console tab) for errors:

1. **"Firebase config error"**
   - Check `frontend/src/config/firebase.js` has correct values

2. **"Function not found"**
   - Cloud Functions not deployed
   - Run: `firebase deploy --only functions`

3. **"Permission denied"**
   - Firestore rules not deployed
   - Run: `firebase deploy --only firestore:rules`

4. **"Invalid username or password"**
   - User not created properly
   - Check Firestore Console: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore
   - Look for `users` collection

**Check Cloud Functions Logs:**

```bash
firebase functions:log
```

---

## Step 4: Verify User in Firestore Console

1. Go to: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore
2. You should see:
   - Collection: `users`
   - Document with fields: username, passwordHash, role, name, etc.

---

## Step 5: Test User Management (If Login Works)

Once logged in as manager/admin:

1. **Create a new user:**
   - Go to Users page
   - Click "Add User"
   - Fill in details
   - Submit

2. **This tests:**
   - Cloud Function `createUser`
   - Firestore write permissions
   - User role authorization

---

## Troubleshooting

### Login Button Does Nothing

**Check 1: Network Tab**
- Open DevTools (F12) → Network tab
- Try logging in
- Look for requests to Cloud Functions
- Check for errors (red requests)

**Check 2: Console Errors**
- Look for JavaScript errors in Console tab
- Common errors:
  - "Firebase not initialized"
  - "auth is not defined"
  - "functions is not defined"

**Fix:**
- Make sure `frontend/src/config/firebase.js` is correct
- Check imports in `AuthContext.jsx`

### "Invalid username or password" (but credentials are correct)

**Possible causes:**
1. User not created in Firestore
2. Password hash incorrect
3. Username case mismatch

**Check Firestore:**
- Go to Firestore Console
- Check `users` collection
- Verify document exists with username "admin"

### "Cloud Function returned error"

**Check logs:**
```bash
firebase functions:log --only authenticateUser
```

**Common errors:**
- "User not found" - Run `create-admin.js` again
- "Permission denied" - Check Firestore rules deployed
- "Invalid token" - Firebase Admin not initialized properly

---

## Success Checklist

- [ ] Admin user created in Firestore
- [ ] Frontend running at http://localhost:5173
- [ ] Login page loads
- [ ] Login with admin/Admin123! succeeds
- [ ] Redirected to dashboard/home
- [ ] User info displayed (name, role)
- [ ] Can access manager features
- [ ] No console errors

---

## Next Steps (After Successful Login)

1. ✅ Authentication working!
2. Update frontend components to use Firestore
3. Test menu management
4. Test order management
5. Test real-time updates

---

## Quick Reference

### Credentials
- Username: `admin`
- Password: `Admin123!`
- Role: `manager`

### URLs
- Frontend: http://localhost:5173
- Firebase Console: https://console.firebase.google.com/project/fast-food-manager-b1f54
- Firestore: https://console.firebase.google.com/project/fast-food-manager-b1f54/firestore

### Commands
```bash
# Create admin
node create-admin.js

# Start frontend
cd frontend && npm run dev

# Check function logs
firebase functions:log

# Redeploy functions
firebase deploy --only functions

# Redeploy rules
firebase deploy --only firestore:rules
```

---

**Ready to test!** Run `node create-admin.js` first, then start the frontend and try logging in! 🚀
