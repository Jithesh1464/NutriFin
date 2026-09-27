# Gains Ledger - Quick Reference Card

## 🚀 Quick Start (2 Minutes)

```bash
# 1. Navigate to Downloads folder
cd C:\Users\KJ001207024\Downloads

# 2. Install dependencies (first time only)
npm install

# 3. Start MongoDB (in another terminal)
mongod

# 4. Start backend server
npm start
# Output: ✅ MongoDB connected
#         🚀 Server running on http://localhost:5000

# 5. Open HTML in browser
# Double-click: Gains Ledger — Nutrition & Finance.html
```

---

## 🔑 Demo Account

**No setup needed, works offline:**
- User ID: `demo`
- Password: `demo123`

---

## 📱 Login Page Features

| Feature | Details |
|---------|---------|
| **Login** | Enter User ID + Password |
| **Register** | Create new account with email |
| **Show Password** | Click 👁️ icon to toggle visibility |
| **Remember Me** | Auto-login on page reload |
| **Offline Mode** | Demo account works offline |

---

## 🌐 Connection Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Online | Connected to MongoDB | Auto-sync enabled |
| 🔴 Offline | Using Local Storage | Data queued for sync |
| ⏳ Syncing | Uploading data | Wait for completion |

---

## 💾 Data Storage

| Mode | Storage | Speed | Reliability |
|------|---------|-------|-------------|
| Online | MongoDB + Local | Slower | Most secure |
| Offline | Local Storage | Fast | Queued for sync |
| Hybrid | Both | Auto | Best of both |

---

## 🔐 Security

✅ Passwords encrypted with bcryptjs
✅ JWT tokens valid for 7 days
✅ User data isolated (can't see others' data)
✅ No passwords stored in Local Storage
✅ HTTPS ready for production

---

## 🎯 Main Features

### Nutrition Tracking
- 14-day meal rotation
- Macro calculation (Protein, Carbs, Fats)
- Editable meals
- Smart gym recommendations

### Finance Tracking
- Expense categories
- Savings & investments
- Stock portfolio
- Income tracking
- Donut charts & bar graphs

### Offline-First
- Works without internet
- Auto-sync when online
- No data loss
- Seamless experience

---

## ⚙️ Configuration

### Change MongoDB URI
Edit `.env`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gains-ledger
```

### Change JWT Secret
Edit `.env`:
```
JWT_SECRET=your-new-secret-key-here-change-in-production
```

### Change Server Port
Edit `.env`:
```
PORT=3000
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot reach server" | Start backend with `npm start` |
| "MONGODB_URI error" | Check MongoDB is running, verify `.env` |
| "Login fails" | Use demo account or register new |
| "Data not syncing" | Check online status (top-right corner) |
| "Lost local data" | Check Local Storage in DevTools |

---

## 🔍 Developer Tips

### Open Developer Tools
```
Windows/Linux: F12 or Ctrl+Shift+I
Mac: Cmd+Option+I
```

### Check Local Storage
```
DevTools → Application → Local Storage → Your URL
```

### Monitor Network Requests
```
DevTools → Network tab → See API calls
```

### Check Console Logs
```
DevTools → Console tab → See errors/messages
```

---

## 📋 File Checklist

Required files:
- ✅ Gains Ledger — Nutrition & Finance.html
- ✅ server.js
- ✅ package.json
- ✅ .env
- ✅ node_modules/ (after `npm install`)

Optional:
- 📄 SETUP_INSTRUCTIONS.md (detailed setup)
- 📄 IMPLEMENTATION_SUMMARY.md (how it works)
- 📄 start-server.bat (Windows quick start)

---

## 🔄 Workflow

```
1. Open HTML in browser
   ↓
2. Login / Register / Use Demo
   ↓
3. Add nutrition data (meals)
   ↓
4. Add finance data (expenses, savings)
   ↓
5. View charts and analytics
   ↓
6. Data saved to Local Storage
   ↓
7. If online → Synced to MongoDB
   ↓
8. If offline → Queued (syncs when online)
```

---

## 🎨 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Developer Tools | F12 |
| Refresh Page | F5 or Ctrl+R |
| Hard Refresh | Ctrl+Shift+R |
| Select All | Ctrl+A |
| Copy | Ctrl+C |
| Paste | Ctrl+V |

---

## 📊 API Endpoints

```
Backend URL: http://localhost:5000

Auth:
  POST /api/auth/login
  POST /api/auth/register

Data:
  POST /api/sync/data
  GET /api/sync/data/:dataType

Exercise:
  POST /api/exercise-history
  GET /api/exercise-history
```

---

## ✨ Key Features

🎯 **Smart Exercise Selection**
- Based on daily nutrition intake
- Prevents muscle overuse injury
- Balances body parts
- Tracks workout history

📊 **Financial Dashboard**
- 2x3 grid layout for clarity
- Donut charts for category breakdown
- Bar graphs for trends
- Real-time calculations

🍽️ **Nutrition Planner**
- 14-day meal rotation
- Macro-nutrient tracking
- Digestive load management
- Body part health optimization

---

## 🚨 Before Going Live

1. ✅ Change JWT_SECRET in .env
2. ✅ Set MONGODB_URI to production DB
3. ✅ Enable HTTPS
4. ✅ Update API_URL in HTML for production
5. ✅ Test with real MongoDB Atlas
6. ✅ Set up proper error logging
7. ✅ Configure CORS properly
8. ✅ Rate limit API endpoints

---

## 📞 Support

**Quick Fixes:**
1. Check internet connection
2. Restart backend server
3. Clear browser Local Storage
4. Hard refresh page (Ctrl+Shift+R)
5. Check browser console (F12)

**Advanced:**
- Check server logs for errors
- Verify MongoDB connection
- Test API endpoints with curl/Postman
- Review .env configuration

---

## 💡 Tips & Tricks

**Offline Testing:**
1. Close backend server
2. Login with demo account
3. Add data (works offline)
4. Restart backend
5. See auto-sync magic

**Multiple Users:**
1. Register different accounts
2. Each user has isolated data
3. Data synced separately
4. No cross-contamination

**Data Export:**
1. Check Local Storage (DevTools)
2. Export nutrition history
3. Export financial data
4. Analyze trends

---

## 🎓 Learning Path

1. **Understand the app** → Read IMPLEMENTATION_SUMMARY.md
2. **Set up locally** → Follow SETUP_INSTRUCTIONS.md
3. **Start using** → Login with demo account
4. **Add your data** → Track nutrition & finance
5. **Experiment** → Try offline mode, see sync
6. **Customize** → Edit .env, change settings
7. **Deploy** → Follow "Before Going Live" checklist

---

## 🏆 You're All Set!

Your Gains Ledger is ready to:
✅ Track nutrition with AI-powered meal planning
✅ Track finances with visual analytics
✅ Work offline with automatic sync
✅ Store data securely in MongoDB
✅ Support multiple users
✅ Scale to production

**Start your fitness journey today! 💪**

---

Last Updated: 2026-09-27
Version: 1.0.0
