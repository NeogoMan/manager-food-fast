# 🔊 Download Notification Sound

## Current Status
The app is using a **browser-generated beep sound** as a fallback. To use a real kitchen bell sound, follow the instructions below.

## Option 1: Download Free Professional Sound (Recommended)

### From Mixkit (No account needed)
1. Go to: https://mixkit.co/free-sound-effects/notification/
2. Find "Service bell" or "Notification bell" sound
3. Click download
4. Rename file to `kitchen-bell.mp3`
5. Place it in this folder (`frontend/public/sounds/`)

**Recommended sounds:**
- "Service bell ring" - https://mixkit.co/free-sound-effects/bell/
- "Alert notification" - Professional and pleasant

### From Freesound (Free, requires account)
1. Go to: https://freesound.org
2. Search for "kitchen bell" or "service bell"
3. Download your preferred sound
4. Convert to MP3 if needed
5. Rename to `kitchen-bell.mp3`
6. Place in this folder

### From Pixabay (No account needed)
1. Go to: https://pixabay.com/sound-effects/search/bell/
2. Find a pleasant notification sound
3. Download
4. Rename to `kitchen-bell.mp3`
5. Place in this folder

## Option 2: Use Your Own Sound

If you have a sound file:
1. Make sure it's in MP3 or WAV format
2. Rename it to `kitchen-bell.mp3`
3. Place it in this folder (`frontend/public/sounds/`)
4. Restart the frontend server

**Sound recommendations:**
- Duration: 1-3 seconds
- Format: MP3 (best browser support)
- Volume: Moderate (the app sets it to 70%)
- Type: Bell, chime, or pleasant ding

## Testing the Sound

After adding the sound file:
1. Restart your frontend server (if running)
2. Open the Kitchen page: http://localhost:5173/kitchen
3. Check browser console - should see: "🔊 Audio notification system initialized"
4. Create a test order from another tab
5. You should hear the new sound!

## Current Fallback

Until you add a sound file, the app uses **Web Audio API** to generate a pleasant two-tone beep. This works immediately without any downloads!

The fallback sound is:
- ✅ Works in all modern browsers
- ✅ No download required
- ✅ Professional double-beep tone
- ❌ Less realistic than a real bell sound

## Troubleshooting

**Sound not playing?**
- Check browser console for errors
- Make sure sound is unmuted (🔊 icon in Kitchen header)
- Click anywhere on the page first (browser autoplay restrictions)
- Try a different browser (Chrome/Firefox recommended)

**Using wrong sound?**
- Make sure filename is exactly `kitchen-bell.mp3`
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser DevTools → Network tab to verify file loads
