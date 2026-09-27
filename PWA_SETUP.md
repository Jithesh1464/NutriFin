# Gains Ledger - Progressive Web App Setup

## What is a PWA?
A Progressive Web App (PWA) is a web application that works offline, can be installed on your home screen, and behaves like a native app.

## Features
✅ **Works Offline** - All data synced locally, access anytime
✅ **Push Notifications** - Get meal reminders even when app is closed
✅ **Text-to-Speech** - Hear meal details spoken aloud
✅ **Home Screen** - Install as an app on iOS/Android
✅ **Fast Loading** - Service worker caches everything
✅ **Responsive Design** - Works on all screen sizes

---

## Installation Guide

### iOS (iPhone/iPad)

1. **Open in Safari**
   - Open Safari browser
   - Go to: `https://your-domain.com/Gains%20Ledger%20—%20Nutrition%20&%20Finance.html`

2. **Add to Home Screen**
   - Tap the **Share** button (square with arrow)
   - Scroll down and tap **"Add to Home Screen"**
   - Give it a name (e.g., "Gains Ledger")
   - Tap **"Add"**

3. **Allow Permissions**
   - When prompted, allow:
     - ✅ Notifications (for meal reminders)
     - ✅ Microphone (for text-to-speech)

4. **Use as App**
   - Tap the app from home screen
   - It will open in fullscreen mode (no Safari UI)
   - Works like a native app!

### Android (Chrome/Firefox)

1. **Open in Chrome or Firefox**
   - Open browser
   - Go to: `https://your-domain.com/Gains%20Ledger%20—%20Nutrition%20&%20Finance.html`

2. **Install App**
   - Tap the **menu** (three dots)
   - Tap **"Install app"** or **"Add to home screen"**
   - Confirm the installation

3. **Allow Permissions**
   - When prompted, allow:
     - ✅ Notifications
     - ✅ Microphone access

4. **Use as App**
   - Tap the app icon from home screen
   - Opens in fullscreen app mode

---

## How Offline Works

✅ **First Load**: Downloads app and all HTML/CSS/JS
✅ **Service Worker**: Installed automatically
✅ **Local Storage**: All your data stored on device
✅ **Offline Access**: Works without internet
✅ **Auto Sync**: When online, data syncs automatically

---

## Features Explained

### 🔔 Notifications
- **When?** 1 hour before each scheduled meal
- **How?** Tap "🔔" bell icon → enable meals
- **Offline?** ✅ Yes, works offline
- **Customizable?** Yes - toggle meals on/off

### 🔊 Text-to-Speech
- **When?** Click "🔊 Speak" on meal notification
- **Message:** "Hey [name], today's [meal] is..."
- **Offline?** ✅ Yes, works offline
- **Languages?** Uses device language

### 💾 Data Storage
- All your data stored **locally** on device
- Never uploaded unless you choose
- Works offline, syncs when online
- Unique per user account

---

## Troubleshooting

### Notifications Not Working
1. Check iOS Settings → Safari → Notifications (enabled?)
2. Check app Settings → Allow Notifications
3. Try reopening the app
4. Check browser console (F12) for errors

### Text-to-Speech Not Working
1. Check device volume is not muted
2. Check Settings → Accessibility → Speech
3. Try in different browser
4. Check browser console for errors

### App Not Installing
1. Make sure using HTTPS (not HTTP)
2. Try in latest browser version
3. Check manifest.json is accessible
4. Clear browser cache and try again

### Offline Not Working
1. Check service worker (F12 → Application → Service Workers)
2. Make sure device has internet first time
3. Data stored in localStorage - check Storage tab
4. Try hard refresh (Ctrl+Shift+R)

---

## Performance Tips

🚀 **Faster Loading**
- App caches everything after first load
- Subsequent loads are instant
- Works offline completely

📱 **Battery Friendly**
- Runs locally, not cloud-dependent
- Service worker is very efficient
- Notifications don't drain battery

🔒 **Secure**
- All data stays on your device
- No cloud storage required
- Login credentials stored locally

---

## Browser Support

| Browser | iOS | Android | Offline | Notifications |
|---------|-----|---------|---------|--------------|
| Safari | ✅ | ❌ | ✅ | ✅ |
| Chrome | ❌ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |

---

## File Structure

```
.
├── Gains Ledger — Nutrition & Finance.html   (Main app)
├── manifest.json                              (App metadata)
├── sw.js                                      (Service worker - offline)
└── PWA_SETUP.md                               (This file)
```

---

## Important Notes

⚠️ **First Launch**
- Must have internet connection
- App downloads and installs service worker
- Takes ~5-10 seconds

✅ **After Installation**
- Works completely offline
- All data stored locally
- No data sent anywhere

🔄 **Updates**
- App checks for updates when online
- Auto-updates service worker
- New features available immediately

---

## Support

If notifications or speech don't work:
1. Check browser console (F12)
2. Verify permissions are granted
3. Try clearing app cache
4. Reinstall app if needed

---

**Enjoy using Gains Ledger as a native app! 🚀**
