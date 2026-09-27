const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gains-ledger';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// User Data Schema (for storing expenses, savings, stocks, etc.)
const userDataSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dataType: { type: String, required: true }, // 'expenses', 'savings', 'stocks', 'income'
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  syncedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Exercise History Schema
const exerciseHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dateKey: { type: String, required: true },
  idx: { type: Number, required: true },
  kcal: { type: Number, required: true },
  p: { type: Number, required: true },
  c: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const UserData = mongoose.model('UserData', userDataSchema);
const ExerciseHistory = mongoose.model('ExerciseHistory', exerciseHistorySchema);

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
}

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { userId, email, password } = req.body;

    if (!userId || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User ID or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ userId, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'User registered successfully', token, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password required' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync Data Route (stores or updates user data)
app.post('/api/sync/data', verifyToken, async (req, res) => {
  try {
    const { dataType, data } = req.body;
    const userId = req.userId;

    if (!dataType || !data) {
      return res.status(400).json({ error: 'Data type and data required' });
    }

    // Find existing record and update or create new
    const existing = await UserData.findOne({ userId, dataType });
    if (existing) {
      existing.data = data;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      const newData = new UserData({ userId, dataType, data });
      await newData.save();
    }

    res.json({ message: 'Data synced successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Data Route
app.get('/api/sync/data/:dataType', verifyToken, async (req, res) => {
  try {
    const { dataType } = req.params;
    const userId = req.userId;

    const userDataRecord = await UserData.findOne({ userId, dataType });
    if (!userDataRecord) {
      return res.json({ data: null, message: 'No data found' });
    }

    res.json({ data: userDataRecord.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Exercise History Route
app.post('/api/exercise-history', verifyToken, async (req, res) => {
  try {
    const { dateKey, idx, kcal, p, c } = req.body;
    const userId = req.userId;

    const history = new ExerciseHistory({ userId, dateKey, idx, kcal, p, c });
    await history.save();

    res.json({ message: 'Exercise history saved', history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Exercise History Route
app.get('/api/exercise-history', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const history = await ExerciseHistory.find({ userId }).sort({ createdAt: -1 }).limit(60);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
