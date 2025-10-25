# Notification Permission - Smart Logic Documentation

## Overview
The app uses an intelligent, user-friendly approach to requesting notification permissions that respects user choices while giving reasonable opportunities to reconsider.

---

## User Experience Flow

### First Login
```
User logs in → Bottom sheet appears → User sees benefits → User makes choice
```

### User Actions & Responses

| User Action | What Happens | Will Show Again? |
|------------|--------------|------------------|
| **Clicks "Activer les notifications"** | System permission dialog appears (Android 13+)<br>Preference saved: won't show again | ❌ No (permission granted or user made final choice) |
| **Clicks "Peut-être plus tard"** | Sheet closes<br>Counter incremented<br>Navigate to app | ✅ Yes (up to 3 more times) |
| **Dismisses sheet (back/outside tap)** | Sheet closes<br>Counter incremented<br>Navigate to app | ✅ Yes (up to 2 more times) |

---

## Smart Logic Rules

### ✅ **Show the Bottom Sheet When:**
1. **First time user** (never seen the sheet before)
2. **User dismissed** 1-2 times (giving them another chance)
3. **User clicked "Maybe Later"** 1-3 times (periodic reminder)
4. **Permission not granted** yet

### ❌ **DON'T Show the Bottom Sheet When:**
1. **Permission already granted** (no need to ask again)
2. **User dismissed 3+ times** (respecting their clear "no")
3. **User clicked "Maybe Later" 4+ times** (they're not interested)

---

## Tracking & Counters

### What We Track
- `isNotificationPermissionGranted` - Boolean (true if permission granted)
- `permissionDismissedCount` - Int (how many times dismissed via back/outside tap)
- `permissionMaybeLaterCount` - Int (how many times clicked "Maybe Later")
- `notificationPermissionRequested` - Boolean (true if user accepted and system dialog shown)

### Counter Limits
| Counter | Limit | What Happens at Limit |
|---------|-------|----------------------|
| Dismissed Count | 3 | Stop showing bottom sheet permanently |
| "Maybe Later" Count | 4 | Stop showing bottom sheet permanently |

---

## User Scenarios

### Scenario 1: User Immediately Accepts
```
Login 1: Shows sheet → User clicks "Activer" → Permission granted
Login 2+: Sheet never shows again ✅
```

### Scenario 2: User Needs Reminding
```
Login 1: Shows sheet → User clicks "Maybe Later"
Login 2: Shows sheet → User clicks "Maybe Later"
Login 3: Shows sheet → User clicks "Activer" → Permission granted
Login 4+: Sheet never shows again ✅
```

### Scenario 3: User Keeps Dismissing
```
Login 1: Shows sheet → User dismisses (back button)
Login 2: Shows sheet → User dismisses
Login 3: Shows sheet → User dismisses
Login 4+: Sheet stops showing (respecting user choice) ❌
```

### Scenario 4: User is Undecided
```
Login 1: Shows sheet → User clicks "Maybe Later" (count: 1)
Login 2: Shows sheet → User clicks "Maybe Later" (count: 2)
Login 3: Shows sheet → User clicks "Maybe Later" (count: 3)
Login 4: Shows sheet → User clicks "Maybe Later" (count: 4)
Login 5+: Sheet stops showing (user had enough chances) ❌
```

### Scenario 5: Mixed Actions
```
Login 1: Shows sheet → User dismisses (dismissed: 1)
Login 2: Shows sheet → User clicks "Maybe Later" (maybeLater: 1)
Login 3: Shows sheet → User dismisses (dismissed: 2)
Login 4: Shows sheet → User clicks "Maybe Later" (maybeLater: 2)
Login 5: Shows sheet → User dismisses (dismissed: 3) → LIMIT REACHED
Login 6+: Sheet stops showing ❌
```

---

## Implementation Details

### When Bottom Sheet is Checked
The bottom sheet display logic is evaluated in `LoginViewModel.checkAndShowNotificationPermission()` which runs:
- **After successful login**
- **Before navigating** to the main screen
- **Every login** (but respects the smart logic rules)

### Code Flow
```kotlin
Login Success
    ↓
checkAndShowNotificationPermission()
    ↓
Check: isGranted? → Yes → Don't show
    ↓ No
Check: dismissedCount >= 3? → Yes → Don't show
    ↓ No
Check: maybeLaterCount >= 4? → Yes → Don't show
    ↓ No
Show bottom sheet!
```

### User Interaction Handlers

**1. User Accepts ("Activer les notifications")**
```kotlin
onNotificationPermissionAccepted()
    → setNotificationPermissionRequested()
    → Show system permission dialog (Android 13+)
    → Navigate to main screen
```

**2. User Clicks "Maybe Later"**
```kotlin
onNotificationPermissionMaybeLater()
    → incrementMaybeLaterCount()
    → Close sheet
    → Navigate to main screen
```

**3. User Dismisses (Back/Outside Tap)**
```kotlin
onDismissNotificationPermission()
    → incrementDismissedCount()
    → Close sheet
    → Navigate to main screen
```

---

## Debug & Testing

### View Current State
Check Logcat for:
```
LoginViewModel: isGranted: false, dismissedCount: 2, maybeLaterCount: 1
```

### Reset Counters for Testing
```bash
# Clear all app data
adb shell pm clear com.fast.manger.food

# Or in code (not recommended for production)
preferencesManager.clearPreferences()
```

### Force Show Bottom Sheet
Temporarily modify `checkAndShowNotificationPermission()`:
```kotlin
private fun checkAndShowNotificationPermission() {
    viewModelScope.launch {
        // DEBUG: Always show for testing
        _uiState.update { it.copy(showNotificationPermissionSheet = true) }
    }
}
```

---

## Benefits of This Approach

### ✅ User-Friendly
- Not aggressive or spammy
- Gives users multiple chances to reconsider
- Respects clear "no" signals

### ✅ Conversion-Optimized
- Shows beautiful UI with clear benefits
- Multiple opportunities increase conversion rate
- Smart timing (after successful login)

### ✅ Privacy-Respecting
- Tracks minimal data (just counters)
- Respects user decisions
- No dark patterns or manipulation

### ✅ Maintainable
- Clear, documented logic
- Easy to adjust limits
- Comprehensive debug logging

---

## Configuration

### Adjusting Limits
To change when the sheet stops showing, modify these values in `LoginViewModel.kt`:

```kotlin
// Current: Stop after 3 dismissals
if (dismissedCount >= 3) { ... }

// Change to 5 dismissals:
if (dismissedCount >= 5) { ... }

// Current: Stop after 4 "Maybe Later" clicks
if (maybeLaterCount >= 4) { ... }

// Change to 6:
if (maybeLaterCount >= 6) { ... }
```

### Recommended Limits
Based on UX best practices:
- **Dismissals:** 2-3 (user clearly doesn't want it if they keep dismissing)
- **"Maybe Later":** 3-5 (user is considering but needs time)

---

## Analytics Recommendations

Consider tracking these metrics:
- **Acceptance Rate** = (Users who granted permission) / (Total users shown sheet)
- **Average Attempts** = Average number of times sheet shown before decision
- **Conversion Path** = Most common sequence leading to acceptance
- **Abandonment Rate** = Users who hit the limit without accepting

---

## Future Enhancements

### Potential Improvements
1. **Time-based Delays**
   - Don't show on consecutive logins
   - Wait 24-48 hours between asks

2. **Contextual Triggers**
   - Show after user places first order
   - Show when order status changes

3. **In-App Settings**
   - Add "Enable Notifications" in Settings screen
   - Allow users to opt-in anytime

4. **A/B Testing**
   - Test different limit values
   - Test different messaging
   - Test timing of requests

---

## Best Practices Followed

✅ **Transparency** - Clear explanation of what notifications will show
✅ **User Control** - Easy to decline or postpone
✅ **Respect** - Stop asking after reasonable attempts
✅ **Value Proposition** - Show clear benefits before asking
✅ **Timing** - Ask at appropriate moment (after login)
✅ **Non-Blocking** - Doesn't prevent app usage
✅ **Reversible** - User can enable later in settings (future)

---

**Last Updated:** 2025-01-24
**Version:** 1.0
**Author:** Development Team
