# WDLink USB Printer Setup Guide for Android Tablet

Complete guide for setting up the WDLink thermal printer with Web USB API on Android tablet.

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Software Requirements](#software-requirements)
3. [Finding USB Vendor and Product IDs](#finding-usb-vendor-and-product-ids)
4. [Updating Configuration](#updating-configuration)
5. [First-Time Setup](#first-time-setup)
6. [Using the Printer](#using-the-printer)
7. [Troubleshooting](#troubleshooting)

---

## Hardware Requirements

### Essential:
- ✅ **Android Tablet** running Android 6.0 (Marshmallow) or higher
- ✅ **WDLink USB Thermal Printer** (80mm paper, ESC/POS compatible)
- ✅ **USB OTG Cable** (if tablet doesn't have full USB port)
- ✅ **Thermal Paper Roll** (80mm width)
- ✅ **Power supply** for printer

### Checking USB OTG Support:

1. Check your tablet specifications online for "USB OTG" or "USB Host" support
2. Most modern Android tablets support USB OTG
3. Test by connecting a USB flash drive - if it mounts, OTG works

---

## Software Requirements

### Browser:
- **Google Chrome** (latest version) - REQUIRED
- Web USB API is NOT supported on:
  - ❌ Firefox
  - ❌ Samsung Internet
  - ❌ Other Android browsers

### Network:
- Application must be served over **HTTPS** in production
- OR accessed via **localhost** for testing
- Web USB API will NOT work over plain HTTP (except localhost)

### Install Chrome:
```
1. Open Google Play Store
2. Search for "Chrome"
3. Install or Update Chrome browser
4. Make Chrome your default browser (optional)
```

---

## Finding USB Vendor and Product IDs

You have three methods to find your WDLink printer's USB IDs:

### Method 1: Using the Browser Console (Easiest)

This is the recommended method since you'll be using the tablet anyway.

**Steps:**

1. **Connect the WDLink printer** to your Android tablet via USB OTG cable
2. **Power on the printer**
3. **Open the application** in Chrome browser on the tablet
4. **Open Chrome Developer Tools**:
   - Type in URL bar: `chrome://inspect`
   - Or enable USB debugging and connect to desktop Chrome
5. **Open Console tab**
6. **Run this command** in console:
   ```javascript
   navigator.usb.getDevices().then(devices => {
     console.log('Authorized devices:', devices);
   });

   navigator.usb.requestDevice({ filters: [] }).then(device => {
     console.log('Selected device:');
     console.log('Vendor ID:', '0x' + device.vendorId.toString(16).padStart(4, '0'));
     console.log('Product ID:', '0x' + device.productId.toString(16).padStart(4, '0'));
     console.log('Product Name:', device.productName);
     console.log('Manufacturer:', device.manufacturerName);
   }).catch(err => console.error(err));
   ```
7. **Browser shows USB device picker** - select your WDLink printer
8. **Note the IDs** displayed in console:
   ```
   Vendor ID: 0x1234  (example)
   Product ID: 0x5678  (example)
   ```

### Method 2: Connect to Desktop Computer First

If you have access to a Mac or Windows PC:

**On macOS:**
1. Connect printer to Mac via USB
2. Power on printer
3. Apple menu () → "About This Mac" → "System Report"
4. Navigate to "Hardware" → "USB"
5. Find WDLink printer in the list
6. Note "Vendor ID" and "Product ID" (shown as hex: 0x1234)

**On Windows:**
1. Connect printer to Windows PC via USB
2. Power on printer
3. Open Device Manager (Win + X → Device Manager)
4. Expand "Universal Serial Bus devices" or "Printers"
5. Right-click WDLink printer → Properties
6. Details tab → Hardware Ids
7. Look for: `USB\VID_1234&PID_5678`
   - VID_1234 → Vendor ID: 0x1234
   - PID_5678 → Product ID: 0x5678

### Method 3: Using ADB (Advanced)

If you have Android debugging enabled:

```bash
# Connect tablet to computer via USB
# Enable USB debugging on tablet (Settings → Developer Options)

# List USB devices
adb shell lsusb

# Example output:
# Bus 001 Device 004: ID 1234:5678 WDLink Thermal Printer
#                         ^^^^ ^^^^
#                      Vendor  Product
# Convert to hex: 0x1234, 0x5678
```

---

## Updating Configuration

Once you have the Vendor ID and Product ID:

### Step 1: Open Config File

Navigate to:
```
frontend/src/config/printerConfig.js
```

### Step 2: Update USB IDs

Find this section (around line 12-15):

**BEFORE:**
```javascript
usb: {
  vendorId: 0x0000,  // TODO: Update with actual vendor ID
  productId: 0x0000, // TODO: Update with actual product ID
```

**AFTER** (example with IDs 0x1234 and 0x5678):
```javascript
usb: {
  vendorId: 0x1234,  // ✓ Updated with actual WDLink vendor ID
  productId: 0x5678, // ✓ Updated with actual WDLink product ID
```

**Important:** Keep the `0x` prefix! These are hexadecimal numbers.

### Step 3: Update Restaurant Info (Optional but Recommended)

In the same file, update your restaurant details (around line 30-38):

```javascript
restaurant: {
  name: 'VOTRE NOM DE RESTAURANT',
  address: 'Votre adresse complète',
  phone: '+212 XXX-XXXXXX',
  taxRate: 0.20, // 20% TVA (modify if different)
},
```

### Step 4: Save and Rebuild

```bash
# Stop the development server if running (Ctrl+C)
# Restart:
cd frontend
npm run dev
```

---

## First-Time Setup

### Physical Connection:

1. **Connect USB OTG cable** to Android tablet
2. **Connect WDLink printer** to USB OTG cable
3. **Power on the printer**
4. **Verify printer is on** (power LED lit, ready status)

### Software Connection:

1. **Open Chrome browser** on the tablet
2. **Navigate to your application** (ensure HTTPS or localhost)
3. **Log in as Manager or Cashier**
4. **Go to Orders/Commandes page**

### Connect the Printer:

1. **Look at the top-right** of the Orders page
2. **You should see**: "Imprimante non connectée" with a "Connecter l'imprimante" button
3. **Click "Connecter l'imprimante"**
4. **Chrome shows USB device picker dialog**
5. **Select your WDLink printer** from the list
6. **Click "Connect"** in the dialog
7. **Status should change** to "Connecté: WDLink Printer" (green dot)

### Test the Printer:

1. **"Test d'impression" button** should now appear
2. **Click it** to print a test receipt
3. **Verify the printout**:
   - ✅ Text is readable
   - ✅ Format looks correct (48 chars wide)
   - ✅ French characters (é, è, à, ç) display properly
   - ✅ Currency shows as "DH"
   - ✅ Paper cuts automatically (if printer supports it)

**If test print successful:** You're ready to use the printer! ✓

**If test print fails:** See [Troubleshooting](#troubleshooting) section below.

---

## Using the Printer

### Auto-Reconnection:

After the first successful connection, the printer will automatically reconnect when you:

1. **Open the app** - Printer reconnects automatically (2-3 seconds)
2. **Status shows** "Vérification..." then "Connecté" - appears automatic!

### Automatic Printing:

**When an order is approved:**

1. Client places order → Approval notification appears
2. Cashier clicks "✓ Accepter" (Approve)
3. **Order is approved** in the system
4. **Ticket prints automatically** to the printer
5. Cashier sees: "✓ Commande approuvée et ticket imprimé avec succès!"

**The order ticket includes:**
- Restaurant name and info
- Order number
- Client name
- Cashier name
- All items with quantities and prices
- Subtotal, tax, and total in MAD
- Thank you message
- Timestamp

### If Printer Disconnected:

**Scenario:** Cable gets unplugged during the day

1. **Status changes** to "Déconnecté (WDLink Printer)"
2. **"Reconnecter" button** appears
3. **Replug the cable**
4. **Click "Reconnecter"**
5. **Connected again** in 1-2 seconds - back to work!

**Orders approved while disconnected:**
- ✓ Order still gets approved (not blocked)
- ⚠️ Warning shown: "Imprimante non connectée - Ticket non imprimé"
- Reconnect and continue with next orders

---

## Troubleshooting

### Problem: "Web USB non supporté" Error

**Cause:** Using wrong browser or old Android version

**Solutions:**
1. ✅ Make sure you're using **Chrome browser** (not Firefox, not Samsung Internet)
2. ✅ Update Chrome to the latest version from Play Store
3. ✅ Check Android version: Settings → About tablet → Android version
   - Must be Android 6.0 or higher
4. ✅ Make sure app is accessed via HTTPS (or localhost for testing)

---

### Problem: Printer Not Appearing in Device Picker

**Cause:** Printer not recognized, wrong IDs, or USB issue

**Solutions:**

1. **Check physical connection:**
   - USB OTG cable firmly connected to tablet
   - Printer USB cable firmly connected to OTG
   - Printer powered on (power LED lit)

2. **Verify printer is detected by Android:**
   - Disconnect and reconnect printer
   - Some tablets show a notification when USB device connects
   - Try a different USB cable
   - Try a different USB OTG adapter

3. **Try generic USB filter:**
   - If your USB IDs are correct but printer still doesn't show
   - Temporarily set IDs to 0x0000 in config:
     ```javascript
     vendorId: 0x0000,
     productId: 0x0000,
     ```
   - This will show ALL USB devices
   - Reconnect and see if WDLink appears
   - If it appears, note the actual IDs from console log

4. **Check USB OTG compatibility:**
   - Test with a USB flash drive first
   - If flash drive doesn't work either, tablet may not support USB OTG
   - Check tablet specifications

---

### Problem: Auto-Reconnect Not Working

**Cause:** Permission cleared or device unplugged too long

**Solutions:**

1. **Quick fix:** Just click "Reconnecter" button
   - One tap reconnects instantly
   - Saves new permission

2. **Check localStorage:**
   - Open Chrome console (chrome://inspect)
   - Run: `localStorage.getItem('wdlink_last_printer')`
   - Should show printer info
   - If null, need to connect manually once

3. **Clear and reconnect:**
   - Click "Oublier" button (if visible)
   - Click "Connecter l'imprimante" again
   - Select printer from picker
   - Auto-reconnect should work next time

---

### Problem: French Characters Not Printing Correctly

**Cause:** Character encoding issue

**Symptoms:**
- é → e or ?
- à → a or ?
- ç → c or ?

**Solutions:**

1. **Try different codepage** in `printerService.js` (line 118):

   **Current:**
   ```javascript
   commands.push(...PrinterService.Commands.SELECT_CODEPAGE(0));
   ```

   **Try codepage 2 (PC850 - Western European):**
   ```javascript
   commands.push(...PrinterService.Commands.SELECT_CODEPAGE(2));
   ```

   **Or try codepage 16 (Windows-1252):**
   ```javascript
   commands.push(...PrinterService.Commands.SELECT_CODEPAGE(16));
   ```

2. **Check printer manual** for supported codepages

3. **Test with simple characters first:**
   - Run test print
   - Check if English text prints correctly
   - Then test French

---

### Problem: "Imprimante déconnectée" During Print

**Cause:** Connection lost mid-operation

**Solutions:**

1. **Check USB power:**
   - Printer may be drawing too much power
   - Use powered USB hub if possible
   - Connect printer to external power source

2. **Disable tablet USB power saving:**
   - Settings → Battery → Battery optimization
   - Find Chrome → Don't optimize
   - OR Settings → Developer options → Stay awake when charging

3. **Check printer status:**
   - Is printer still powered on?
   - Is there paper in the printer?
   - Is printer cover closed?

4. **Reconnect and retry:**
   - Click "Reconnecter"
   - Approve next order to test again

---

### Problem: Ticket Format Looks Wrong

**Symptoms:**
- Text cut off on right side
- Lines wrap incorrectly
- Alignment off

**Solutions:**

1. **Verify paper width** in config (printerConfig.js):
   ```javascript
   paper: {
     width: 48, // For 80mm paper
     // Try 32 if you have 58mm paper instead
   }
   ```

2. **Match separator length** to paper width:
   ```javascript
   ticket: {
     separatorLength: 48, // Must match paper.width
   }
   ```

3. **Test with different widths:**
   - If text is cut off: decrease width
   - If too much space: increase width
   - Adjust in increments of 2-4 characters

---

### Problem: Paper Not Cutting Automatically

**Cause:** Printer doesn't support auto-cut or different cut command

**Solutions:**

1. **Disable auto-cut** in config (printerConfig.js):
   ```javascript
   ticket: {
     autocut: false, // Disable auto-cut
   }
   ```

2. **Manual cutting:** Tear paper manually after each print

3. **Try different cut command** in printerService.js (line 129):

   **Current:**
   ```javascript
   commands.push(...PrinterService.Commands.CUT_PARTIAL);
   ```

   **Try full cut instead:**
   ```javascript
   commands.push(...PrinterService.Commands.CUT_FULL);
   ```

---

### Problem: Very Slow Printing

**Cause:** Large data transfer, slow USB, or tablet performance

**Solutions:**

1. **Simplify ticket format:**
   - Reduce number of separator lines
   - Shorten thank you message
   - Remove optional fields

2. **Check tablet performance:**
   - Close other apps
   - Clear Chrome cache
   - Restart tablet

3. **Check USB connection:**
   - Try different USB cable (higher quality)
   - Try different USB OTG adapter

---

## Advanced Configuration

### Customizing Ticket Content

Edit `printerConfig.js` to customize what appears on tickets:

```javascript
ticket: {
  printCashierName: true,     // Show/hide cashier name
  printOrderNotes: true,      // Show/hide special notes
  showTax: true,              // Show/hide tax line
  thankYouMessage: [
    'Merci de votre visite!', // Customize message
    'À bientôt!',
  ],
}
```

### Adjusting Connection Monitoring

```javascript
usb: {
  connectionCheckInterval: 30000, // Check every 30 seconds
  // Increase if printer disconnects falsely
  // Decrease for faster disconnect detection
}
```

---

## Testing Checklist

Before going live:

- [ ] Printer connects successfully via USB OTG
- [ ] Auto-reconnect works on app reload
- [ ] Test print produces readable receipt
- [ ] French characters print correctly
- [ ] Order approval triggers automatic print
- [ ] Ticket format is clean and professional
- [ ] Paper cuts automatically (if supported)
- [ ] Reconnect works after cable unplug/replug
- [ ] Error messages are clear when printer disconnected
- [ ] Orders can still be approved if printer fails
- [ ] Multiple successive prints work without issues
- [ ] Printer survives tablet sleep/wake cycle

---

## Summary

### First-Time Setup Steps:
1. ✅ Find USB Vendor/Product ID
2. ✅ Update `printerConfig.js` with IDs
3. ✅ Update restaurant info
4. ✅ Connect printer physically (USB OTG)
5. ✅ Connect via browser (click button)
6. ✅ Test print
7. ✅ Approve an order to test auto-print

### Daily Usage:
1. ✅ Turn on printer
2. ✅ Open app in Chrome
3. ✅ Printer reconnects automatically (appears automatic!)
4. ✅ Approve orders → tickets print automatically
5. ✅ If disconnected, one-tap to reconnect

### Support:
- Check browser console (chrome://inspect) for detailed error logs
- All print data is logged to console for debugging
- Ticket format preview shown in console before printing

**Your WDLink printer is now ready for production use on Android tablet!** 🎉
