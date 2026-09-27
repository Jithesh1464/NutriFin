# Gains Ledger - Setup Instructions

## Features Added
✅ User Authentication (Login/Register)
✅ MongoDB Integration
✅ Offline-First Architecture (Local Storage)
✅ Auto-Sync when Internet Returns
✅ Password Visibility Toggle
✅ Demo Account Support

---

## Prerequisites

1. **Node.js** (v14+) - Download from [nodejs.org](https://nodejs.org)
2. **MongoDB** - Choose one:
   - **Local MongoDB**: [Download](https://www.mongodb.com/try/download/community)
   - **MongoDB Atlas** (Cloud): [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

---

## Setup Steps

### Step 1: Install Backend Dependencies
```bash
cd C:\Users\KJ001207024\Downloads
npm install
```

### Step 2: Start MongoDB
**Option A: Local MongoDB**
```bash
# On Windows, if MongoDB is installed:
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Copy connection string
4. Update `.env` file with your connection string

### Step 3: Update .env File
Edit `.env` and set your MongoDB URI:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gains-ledger
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 4: Start the Backend Server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### Step 5: Open the HTML File
1. Open the HTML file in your browser
2. You'll see the login screen

---

## Using the Application

### Login/Register

**Demo Account** (works offline too):
- User ID: `demo`
- Password: `demo123`

**Create New Account:**
1. Click "Register"
2. Enter User ID, Email, Password
3. Click Register button
4. You'll be logged in automatically

### Offline Mode
- The app works fully offline using Local Storage
- All data is saved locally
- When internet returns, data auto-syncs to MongoDB
- See the sync status indicator in top-right corner

### Sync Status Indicator
- **🟢 Online** (Green) - Connected to internet, real-time sync active
- **🔴 Offline** (Red) - No internet connection, using Local Storage

---

## File Structure
```
C:\Users\KJ001207024\Downloads\
├── Gains Ledger — Nutrition & Finance.html  (Frontend)
├── server.js                                  (Backend)
├── package.json                               (Dependencies)
├── .env                                       (Configuration)
├── .gitignore                                 (Git ignore rules)
└── SETUP_INSTRUCTIONS.md                      (This file)
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Data Sync
- `POST /api/sync/data` - Save/Update user data
- `GET /api/sync/data/:dataType` - Fetch user data

### Exercise History
- `POST /api/exercise-history` - Save exercise entry
- `GET /api/exercise-history` - Fetch exercise history

---

## MongoDB Collections

### Users
```json
{
  "userId": "string",
  "email": "string",
  "password": "hashed",
  "createdAt": "Date"
}
```

### User Data
```json
{
  "userId": "string",
  "dataType": "expenses|savings|stocks|income",
  "data": {},
  "syncedAt": "Date"
}
```

### Exercise History
```json
{
  "userId": "string",
  "dateKey": "YYYY-MM-DD",
  "idx": "number",
  "kcal": "number",
  "p": "protein_grams",
  "c": "carbs_grams",
  "createdAt": "Date"
}
```

---

## Troubleshooting

### "Cannot reach server"
- Make sure backend is running on port 5000
- Check if MongoDB is connected
- Try offline mode with demo account

### "MONGODB_URI error"
- Check `.env` file for correct MongoDB connection string
- Make sure MongoDB service is running
- For MongoDB Atlas, check IP whitelist settings

### Data not syncing
- Check browser console for errors (F12)
- Verify internet connection
- Refresh the page
- Check sync status indicator

### Password not working
- Use demo account: `demo` / `demo123`
- Or register a new account
- Passwords are hashed with bcryptjs

---

## Security Notes

⚠️ **Important:**
- Change `JWT_SECRET` in `.env` before production
- Enable HTTPS in production
- Use strong passwords
- Keep `.env` file secret (add to `.gitignore`)
- Use MongoDB Atlas for production (cloud-hosted)

---

## Next Steps

1. ✅ Run backend server
2. ✅ Open HTML in browser
3. ✅ Login or register
4. ✅ Start tracking nutrition & finance
5. ✅ Watch data sync when online

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console (F12 → Console tab)
3. Check server logs in terminal

Enjoy tracking your gains! 💪📊
