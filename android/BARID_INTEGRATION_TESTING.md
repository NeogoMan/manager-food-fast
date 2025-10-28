# Barid SDK Integration Testing Guide

## ✅ Integration Complete!

The Barid SDK has been successfully integrated into your Fast Food Manager Android app on the `feature/barid-sdk-integration` branch.

## 📁 What Was Added

### New Files:
- `app/src/main/java/com/barid/sdk/BaridSDK.kt` - Main SDK file
- `app/src/main/java/com/barid/sdk/BaridMessagingService.kt` - FCM messaging service

### Modified Files:
- `app/src/main/AndroidManifest.xml` - Added Barid messaging service
- `app/src/main/java/com/fast/manger/food/FastFoodApp.kt` - Added SDK initialization
- `app/src/main/java/com/fast/manger/food/MainActivity.kt` - Added FCM token logging and campaign handling

## 🎯 How It Works

### Two Notification Channels:
1. **Existing FCMService**: Handles order status notifications (unchanged)
2. **BaridMessagingService**: Handles marketing campaigns from Barid dashboard

Both services can coexist and work independently!

---

## 📱 Step-by-Step Testing Guide

### **Step 1: Build and Run the App** (2 minutes)

1. **Open the project in Android Studio**:
   ```bash
   open -a "Android Studio" "/Users/elmehdimotaqi/Documents/Fasr food project/android"
   ```

2. **Make sure you're on the correct branch**:
   - Branch: `feature/barid-sdk-integration`

3. **Sync Gradle** (if prompted)

4. **Run the app** on your Android device or emulator:
   - Click the "Run" button (green play icon)
   - Or press `Ctrl+R`

---

### **Step 2: Get Your FCM Token** (1 minute)

1. **Open Logcat** in Android Studio:
   - View → Tool Windows → Logcat

2. **Filter for "MainActivity"**:
   - In the search box, type: `MainActivity`

3. **Look for the FCM Token**:
   You should see output like this:
   ```
   ========================================
   FCM Token for Barid Testing:
   dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
   ========================================
   Copy this token to use in Barid dashboard
   ```

4. **Copy the entire token** (the long string starting with `d` or `c`)

---

### **Step 3: Add Test User in Barid Dashboard** (2 minutes)

1. **Open the Barid dashboard**:
   - Go to: http://localhost:3000/dashboard/users

2. **Click "+ Add Test User"** (or similar button)

3. **Fill in the form**:
   - **User ID**: `test_manager_001` (or any unique ID)
   - **Email**: `test@restaurant.com`
   - **Name**: `Test Manager`
   - **Platform**: `Android`
   - **FCM Token**: *Paste the token from Step 2*

4. **Click "Add User"** or "Save"

---

### **Step 4: Create a Test Segment** (1 minute)

1. **Go to Segments**:
   - Navigate to: http://localhost:3000/dashboard/segments

2. **Create a new segment**:
   - Click "+ New Segment"
   - **Name**: `All Managers`
   - **Description**: `All restaurant managers`
   - **Conditions**: Leave empty (matches all users)
   - Click "Create Segment"

---

### **Step 5: Create a Push Notification Message** (1 minute)

1. **Go to Messages**:
   - Navigate to: http://localhost:3000/dashboard/messages

2. **Create a new message**:
   - Click "+ New Message"
   - **Name**: `Test Push`
   - **Type**: `Push Notification`
   - **Title**: `Hello from Barid! 👋`
   - **Body**: `This is a test notification from your Barid dashboard`
   - Click "Create Message"

---

### **Step 6: Create and Send Campaign** (2 minutes)

1. **Go to Campaigns**:
   - Navigate to: http://localhost:3000/dashboard/campaigns

2. **Create a new campaign**:
   - Click "+ New Campaign"

3. **Fill in campaign details**:
   - **Step 1 - Basic Info**:
     - **Name**: `Test Campaign 1`
     - **Type**: `Push`
     - Click "Next"

   - **Step 2 - Target Audience**:
     - Select: `All Managers`
     - Click "Next"

   - **Step 3 - Message**:
     - Select: `Test Push`
     - Click "Next"

   - **Step 4 - Schedule**:
     - Choose: `Send Immediately`
     - Click "Create Campaign"

---

### **Step 7: Check Your Device!** (30 seconds)

1. **Pull down the notification drawer** on your Android device

2. **You should see the notification**:
   - Title: "Hello from Barid! 👋"
   - Body: "This is a test notification from your Barid dashboard"

3. **Tap the notification**:
   - The app should open
   - Check Logcat for: `"Opened from Barid campaign: [campaign_id]"`

---

## ✅ Success Checklist

- [ ] App builds and runs successfully
- [ ] FCM token appears in Logcat
- [ ] Test user created in Barid dashboard
- [ ] Segment created
- [ ] Message created
- [ ] Campaign created and executed
- [ ] Notification received on device
- [ ] Notification tap opens the app

---

## 🔍 Troubleshooting

### **No FCM Token in Logcat?**
- Make sure the app is running
- Check Logcat filter is set to "MainActivity"
- Restart the app if needed

### **No Notification Received?**
1. **Check FCM token**:
   - Make sure you copied the complete token (no spaces)
   - Token should be 150+ characters long

2. **Check notification permission**:
   - Settings → Apps → Fast Food Manager → Notifications
   - Make sure notifications are enabled

3. **Check Firebase project**:
   - Verify `google-services.json` is correct
   - Make sure it matches your Barid Firebase project

4. **Check Barid dashboard**:
   - Go to the campaign details
   - Check if it shows "Sent" status
   - Check for any errors

### **Notification Received but App Doesn't Open?**
- Check AndroidManifest.xml has both services declared
- Rebuild the app: Build → Clean Project → Build Project

---

## 🎨 Customization Options

### **Change User ID** (Use Real Manager ID)

In `FastFoodApp.kt`, replace the device ID with actual manager ID:

```kotlin
private fun initializeBaridSDK() {
    // Get manager ID from your auth system
    val userId = getCurrentManagerId() // Your auth method

    BaridSDK.getInstance().initialize(this, userId)

    // Add more user attributes
    BaridSDK.getInstance().setAttributes(mapOf(
        "platform" to "android",
        "appType" to "restaurant_manager",
        "appVersion" to BuildConfig.VERSION_NAME,
        "restaurantId" to getRestaurantId(), // Add restaurant context
        "managerRole" to getManagerRole() // e.g., "owner", "admin"
    ))
}
```

### **Add User Attributes for Targeting**

You can add any custom attributes for campaign targeting:

```kotlin
BaridSDK.getInstance().setAttributes(mapOf(
    "subscriptionPlan" to "premium",
    "restaurantType" to "fastfood",
    "city" to "Casablanca",
    "country" to "Morocco"
))
```

Then create segments based on these attributes in the Barid dashboard!

---

## 📊 Next Steps

### **1. Test Different Notification Types**

Try creating notifications with:
- Images (add `imageUrl` in message creation)
- Deep links (navigate to specific screens)
- Different priorities

### **2. Test User Segmentation**

Create segments like:
- "Premium Managers" (subscriptionPlan = premium)
- "Casablanca Restaurants" (city = Casablanca)
- Active managers (lastActive within 7 days)

### **3. Test Scheduling**

Try scheduling campaigns for:
- Specific date/time
- Recurring (daily, weekly)

### **4. Monitor Analytics**

Check the Barid dashboard analytics:
- Delivery rate
- Open rate
- Click rate

---

## 🚀 Production Deployment

When ready for production:

1. **Update User ID Logic**:
   - Use real manager IDs from authentication
   - Add proper error handling

2. **Remove Test Logs**:
   - Remove or disable FCM token logging in MainActivity
   - Keep only necessary production logs

3. **Update Firebase Config**:
   - Use production `google-services.json`
   - Update Barid dashboard environment variables

4. **Test on Multiple Devices**:
   - Test on different Android versions
   - Test with different notification settings

---

## 📖 Documentation Links

- [FCM HTTP v1 API Setup](../../barid-platform/docs/FCM_V1_SETUP.md)
- [Barid Platform README](../../barid-platform/README.md)
- [Full Testing Guide](../../barid-platform/docs/TESTING_GUIDE.md)

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the Barid platform documentation
3. Check Firebase Console for FCM delivery logs
4. Verify Firestore security rules allow SDK access

---

**Happy Testing! 🎉**
