# Deployment Guide - Gains Ledger PWA

## Files Created for PWA Support

### 1. **manifest.json** - App Metadata
- Defines app name, icons, colors, and shortcuts
- Used by iOS/Android to recognize as installable app
- Includes light/dark theme support
- Pre-defined shortcuts for quick actions

### 2. **sw.js** - Service Worker
- Enables offline functionality
- Caches all assets for offline access
- Handles push notifications
- Auto-updates when app changes

### 3. **index.html** - Entry Point
- Redirects to main app
- Needed for PWA manifest compatibility
- Lightweight redirect file

### 4. **PWA_SETUP.md** - User Guide
- Step-by-step iOS installation
- Step-by-step Android installation
- Troubleshooting guide
- Browser compatibility matrix

---

## Hosting Requirements

### Prerequisites
✅ HTTPS (Required for PWA/Notifications)
✅ Valid domain name
✅ Web server (Apache, Nginx, etc.)

### File Uploads
Upload to web server root:
```
/index.html
/Gains Ledger — Nutrition & Finance.html
/manifest.json
/sw.js
/PWA_SETUP.md
/DEPLOYMENT.md
```

### Server Configuration

**For Apache (.htaccess)**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    # Redirect root to index.html
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Cache manifest and service worker
<FilesMatch "^(manifest|sw)\.(json|js)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

# Cache app assets
<FilesMatch "\.(html|css|js)$">
    Header set Cache-Control "public, max-age=86400"
</FilesMatch>
```

**For Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        root /path/to/app;
        try_files $uri $uri/ /index.html;
    }

    # Don't cache manifest and service worker
    location ~ ^/(manifest|sw)\.(json|js)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Cache app assets
    location ~ \.(html|css|js)$ {
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

---

## Testing Before Deployment

### Local Testing (with HTTPS)
```bash
# Option 1: Using Python
python -m http.server 8000

# Then access: https://localhost:8000/
# (Need to bypass SSL warnings for testing)

# Option 2: Using Node.js http-server with SSL
npm install -g http-server
http-server -p 8000 --ssl --cert cert.pem --key key.pem

# Option 3: Using Docker
docker run -p 443:443 -v $(pwd):/www \
  nginx:latest
```

### Check PWA Installation
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** - should show app metadata
4. Check **Service Workers** - should show "sw.js"
5. Check **Storage** → **Local Storage** - should show user data

### Test Offline
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Navigate around app - should still work

### Test Notifications
1. Click 🔔 bell icon
2. Enable notifications
3. Allow permission when prompted
4. Wait for next meal time or manually test

---

## iOS Deployment Checklist

- [ ] Upload all files to HTTPS server
- [ ] Test in Safari browser
- [ ] Verify HTTPS certificate is valid
- [ ] Check manifest.json loads correctly
- [ ] Test "Add to Home Screen" workflow
- [ ] Verify app opens fullscreen
- [ ] Test notifications on home screen
- [ ] Test offline functionality
- [ ] Test text-to-speech functionality

---

## Android Deployment Checklist

- [ ] Upload all files to HTTPS server
- [ ] Test in Chrome browser
- [ ] Test in Firefox browser
- [ ] Verify manifest.json loads correctly
- [ ] Test install prompt
- [ ] Verify app opens fullscreen
- [ ] Test notifications on home screen
- [ ] Test offline functionality
- [ ] Test text-to-speech functionality

---

## Production Optimizations

### Performance
```javascript
// Service worker handles caching
// App loads instantly after first visit
// Offline mode requires no network
```

### Security
```
✅ HTTPS enforced
✅ All data stored locally
✅ No sensitive data in URLs
✅ Service worker scope limited
✅ Content Security Policy recommended
```

### Analytics (Optional)
Add to track app usage:
```javascript
// Google Analytics or similar
// Track installation events
// Track feature usage
// Track errors/crashes
```

---

## SSL Certificate Setup

### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Using Cloudflare (Free)
1. Add domain to Cloudflare
2. Use Cloudflare's SSL (Flexible, Full, or Full Strict)
3. Enable "Always Use HTTPS"
4. All traffic encrypted automatically

---

## Monitoring

### Check Service Worker Status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(regs => {
    regs.forEach(reg => console.log('SW:', reg));
  });
```

### Check App Performance
```javascript
// In browser console
performance.timing
// Check loading times
```

### Monitor User Sessions
- Check browser console for errors
- Monitor localStorage usage (max ~5-10MB)
- Track notification interactions
- Monitor offline usage patterns

---

## Troubleshooting Deployment

### Issue: Manifest not found
**Solution:**
- Verify manifest.json in root directory
- Check file permissions (644)
- Ensure HTTPS is working

### Issue: Service Worker not installing
**Solution:**
- Check browser console for errors
- Verify sw.js file exists
- Check HTTPS certificate
- Clear service worker cache

### Issue: Notifications not working
**Solution:**
- Verify HTTPS is working
- Check notification permissions granted
- Test on actual device (not simulator)
- Check service worker status

### Issue: App not installing on home screen
**Solution:**
- Verify manifest.json is valid JSON
- Check app icons are accessible
- Ensure HTTPS with valid certificate
- Wait 30+ seconds for PWA detection

---

## Security Considerations

### Before Going Live
✅ Enable HTTPS with valid certificate
✅ Set proper Cache-Control headers
✅ Add Content-Security-Policy header
✅ Test data encryption (if needed)
✅ Review localStorage security
✅ Test on real devices
✅ Monitor for errors in production

### Recommended Headers
```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(), payment=()
```

---

## Support & Troubleshooting

### Common Issues
1. **App not installing** → Check HTTPS, manifest.json
2. **Notifications not working** → Check permissions, HTTPS
3. **Offline not working** → Check service worker, cache
4. **Speech not working** → Check microphone permission
5. **Data not saving** → Check localStorage, permissions

### Debug Mode
Open browser console (F12) to see:
- Service worker status
- Cache storage
- Notification permissions
- Error messages
- Performance metrics

---

## What Users Will See

### iOS
1. Open Safari → https://your-domain.com
2. Tap Share → "Add to Home Screen"
3. App installed on home screen
4. Taps open fullscreen app
5. Works offline automatically

### Android
1. Open Chrome → https://your-domain.com
2. App shows "Install" prompt
3. Tap "Install"
4. App installed on home screen
5. Works offline automatically

---

## Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies (if using any)
- Test functionality monthly
- Verify HTTPS certificate renewal
- Clean up old cache if needed

### Updates
- Service worker auto-updates when files change
- Users get latest version within 24 hours
- No manual app store updates needed
- Real-time feature availability

---

**Your PWA is now ready for production deployment! 🚀**
