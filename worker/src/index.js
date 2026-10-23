/* ================= PRODUCTION CLOUDFLARE WORKER + D1 ================= */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const JWT_SECRET = 'gains-ledger-secret-key-2024'; // Use env.SECRET in production
const DEMO_USER = { userId: 'demo1', password: '12345678' };

const getDb = (env) => env.DB || env.gains_ledger_db;

/* ================= DATABASE AUTO-MIGRATION & SCHEMA ================= */
let schemaEnsured = false;

async function ensureSchema(db) {
  if (schemaEnsured || !db) return;

  try {
    // 1. Ensure core tables exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        data_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS exercise_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date_key TEXT NOT NULL,
        idx INTEGER NOT NULL,
        kcal REAL NOT NULL,
        p REAL NOT NULL,
        c REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_data_user_type ON user_data (user_id, data_type);
      CREATE INDEX IF NOT EXISTS idx_exercise_history_user_date ON exercise_history (user_id, date_key);
    `);
  } catch (e) {
    console.warn('ensureSchema base create warning:', e.message);
  }

  // 2. Safe migrations for existing SQLite databases created with older schema
  try {
    await db.exec('ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;');
  } catch (e) {
    // Column already exists or error ignored
  }

  try {
    await db.exec('ALTER TABLE user_data ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;');
  } catch (e) {
    // Column already exists or error ignored
  }

  try {
    await db.exec('ALTER TABLE user_data ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;');
  } catch (e) {
    // Column already exists or error ignored
  }

  schemaEnsured = true;
}

/* ================= MAIN ROUTER ================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Root
    if (path === '/' || path === '') {
      return json({
        status: 'ok',
        message: 'Gains Ledger API v1.2 (Production)',
        routes: {
          auth: ['/api/auth/login', '/api/auth/register'],
          user: ['/api/user/profile (GET, PUT)', '/api/user/email (PUT)', '/api/user/report-delivery (POST)'],
          sync: ['/sync (POST)', '/sync/:type (GET)', '/sync/:type (DELETE)'],
          data: ['/api/data (GET)'],
          exercise: ['/api/exercise-history (GET, POST)']
        },
      });
    }

    // Auth routes
    if (path === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    // Profile routes (Feature 1: Edit Profile)
    if (path === '/api/user/profile' && request.method === 'GET') {
      return handleGetProfile(request, env);
    }
    if ((path === '/api/user/profile' || path === '/api/profile') && (request.method === 'PUT' || request.method === 'POST')) {
      return handleUpdateProfile(request, env);
    }

    // Email routes (Feature 2: Change Email)
    if ((path === '/api/user/email' || path === '/api/user/change-email' || path === '/api/auth/change-email') && (request.method === 'PUT' || request.method === 'POST')) {
      return handleChangeEmail(request, env);
    }

    // Report delivery routes (Feature 3: Report Delivery)
    if ((path === '/api/user/report-delivery' || path === '/api/report-delivery') && (request.method === 'POST' || request.method === 'PUT')) {
      return handleReportDelivery(request, env);
    }

    // Sync routes (POST, GET, DELETE)
    if (path === '/sync' && request.method === 'POST') {
      return handleSync(request, env);
    }

    if (path.startsWith('/sync/') && request.method === 'GET') {
      return handleFetchData(request, env);
    }

    if (path.startsWith('/sync/') && request.method === 'DELETE') {
      return handleDeleteData(request, env);
    }

    // Data routes (Fetch all data in one request)
    if (path === '/api/data' && request.method === 'GET') {
      return handleFetchAllData(request, env);
    }

    // Exercise History routes
    if ((path === '/api/exercise-history' || path === '/exercise-history') && request.method === 'POST') {
      return handleExerciseSave(request, env);
    }
    if ((path === '/api/exercise-history' || path === '/exercise-history') && request.method === 'GET') {
      return handleExerciseFetch(request, env);
    }

    // Legacy compat routes
    if ((path === '/api/sync/data' || path === '/sync/data') && request.method === 'POST') {
      return handleSync(request, env);
    }

    if ((path.startsWith('/api/sync/data/') || path.startsWith('/sync/data/')) && request.method === 'GET') {
      return handleFetchData(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

/* ================= AUTH HANDLERS ================= */

async function handleRegister(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  try {
    const body = await request.json();
    const { userId, email, password } = body;

    if (!userId || !email || !password) {
      return json({ error: 'userId, email, password required' }, 400);
    }

    if (password.length < 6) {
      return json({ error: 'Password minimum 6 characters' }, 400);
    }

    const existing = await db
      .prepare('SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1')
      .bind(userId, email)
      .first();

    if (existing) {
      return json({ error: 'User or email already exists' }, 409);
    }

    const hash = await hashPassword(password);
    try {
      await db
        .prepare('INSERT INTO users (id, email, password, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind(userId, email, hash)
        .run();
    } catch (e) {
      await db
        .prepare('INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
        .bind(userId, email, hash)
        .run();
    }

    const token = makeToken(userId);
    return json({ success: true, message: 'Registered', token, userId, email }, 201);
  } catch (e) {
    console.error('Register error:', e);
    return json({ error: 'Registration failed: ' + e.message }, 500);
  }
}

async function handleLogin(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return json({ error: 'userId and password required' }, 400);
    }

    // Demo user backdoor
    if (userId === DEMO_USER.userId && password === DEMO_USER.password) {
      const token = makeToken(userId);
      return json({
        success: true,
        message: 'Demo login',
        token,
        userId,
        email: 'jithu@gmail.com',
        name: 'Jithu',
        plan: 'Pro Plan'
      }, 200);
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(userId).first();

    if (!user) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    const hash = await hashPassword(password);
    if (user.password !== hash) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    // Check if there is an existing profile saved for name/plan
    let profileData = {};
    try {
      const pRow = await db.prepare('SELECT data FROM user_data WHERE user_id = ? AND data_type = "profile" LIMIT 1').bind(userId).first();
      if (pRow && pRow.data) profileData = JSON.parse(pRow.data);
    } catch(err) {}

    const token = makeToken(userId);
    return json({
      success: true,
      message: 'Login successful',
      token,
      userId,
      email: user.email,
      name: profileData.name || (userId === 'jithu' ? 'Jithu' : userId),
      plan: profileData.plan || 'Pro Plan'
    }, 200);
  } catch (e) {
    console.error('Login error:', e);
    return json({ error: 'Login failed: ' + e.message }, 500);
  }
}

/* ================= USER MANAGEMENT HANDLERS ================= */

// Feature 1: Get Profile
async function handleGetProfile(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const user = await db.prepare('SELECT id, email, created_at FROM users WHERE id = ? LIMIT 1').bind(userId).first();
    const profileRow = await db.prepare('SELECT data FROM user_data WHERE user_id = ? AND data_type = "profile" LIMIT 1').bind(userId).first();
    
    let profileData = {};
    if (profileRow && profileRow.data) {
      try { profileData = JSON.parse(profileRow.data); } catch(e) {}
    }

    return json({
      success: true,
      profile: {
        userId,
        email: user?.email || (userId === DEMO_USER.userId ? 'jithu@gmail.com' : `${userId}@gmail.com`),
        name: profileData.name || (userId === 'jithu' ? 'Jithu' : userId),
        plan: profileData.plan || 'Pro Plan',
        avatar: profileData.avatar || (userId.charAt(0).toUpperCase()),
        created_at: user?.created_at || null
      }
    }, 200);
  } catch (e) {
    console.error('Get profile error:', e);
    return json({ error: 'Failed to fetch profile: ' + e.message }, 500);
  }
}

// Feature 1: Update Profile (Name, Plan, Avatar)
async function handleUpdateProfile(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { name, plan, avatar } = body;

    const profileRow = await db.prepare('SELECT data FROM user_data WHERE user_id = ? AND data_type = "profile" LIMIT 1').bind(userId).first();
    let currentData = {};
    if (profileRow && profileRow.data) {
      try { currentData = JSON.parse(profileRow.data); } catch(e) {}
    }

    const updatedProfile = {
      ...currentData,
      name: name !== undefined ? String(name).trim() : (currentData.name || userId),
      plan: plan !== undefined ? String(plan).trim() : (currentData.plan || 'Pro Plan'),
      avatar: avatar !== undefined ? String(avatar).trim() : (currentData.avatar || userId.charAt(0).toUpperCase()),
      updated_at: new Date().toISOString()
    };

    const dataStr = JSON.stringify(updatedProfile);

    if (profileRow) {
      try {
        await db
          .prepare('UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND data_type = "profile"')
          .bind(dataStr, userId)
          .run();
      } catch (err) {
        await db
          .prepare('UPDATE user_data SET data = ? WHERE user_id = ? AND data_type = "profile"')
          .bind(dataStr, userId)
          .run();
      }
    } else {
      try {
        await db
          .prepare('INSERT INTO user_data (user_id, data_type, data, created_at, updated_at) VALUES (?, "profile", ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .bind(userId, dataStr)
          .run();
      } catch (insertErr) {
        try {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data, updated_at) VALUES (?, "profile", ?, CURRENT_TIMESTAMP)')
            .bind(userId, dataStr)
            .run();
        } catch (insertErr2) {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data) VALUES (?, "profile", ?)')
            .bind(userId, dataStr)
            .run();
        }
      }
    }

    return json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    }, 200);
  } catch (e) {
    console.error('Update profile error:', e);
    return json({ error: 'Update profile failed: ' + e.message }, 500);
  }
}

// Feature 2: Change Email
async function handleChangeEmail(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const newEmail = (body.newEmail || body.email || '').trim().toLowerCase();

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return json({ error: 'Please enter a valid email address' }, 400);
    }

    // Check if email already taken by someone else
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1')
      .bind(newEmail, userId)
      .first();

    if (existing) {
      return json({ error: 'This email address is already in use by another account' }, 409);
    }

    // Update in users table
    try {
      await db
        .prepare('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newEmail, userId)
        .run();
    } catch (e) {
      await db
        .prepare('UPDATE users SET email = ? WHERE id = ?')
        .bind(newEmail, userId)
        .run();
    }

    return json({
      success: true,
      message: 'Email updated successfully',
      email: newEmail,
      userId
    }, 200);
  } catch (e) {
    console.error('Change email error:', e);
    return json({ error: 'Change email failed: ' + e.message }, 500);
  }
}

// Feature 3: Report Delivery Frequency
async function handleReportDelivery(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const frequency = (body.frequency || body.reportFrequency || '').trim().toLowerCase();
    const validFrequencies = ['weekly', 'monthly', 'yearly', 'never'];

    if (!validFrequencies.includes(frequency)) {
      return json({ error: 'Invalid frequency. Allowed: weekly, monthly, yearly, never' }, 400);
    }

    // Fetch existing settings
    const settingsRow = await db
      .prepare('SELECT data FROM user_data WHERE user_id = ? AND data_type = "settings" LIMIT 1')
      .bind(userId)
      .first();

    let settings = {};
    if (settingsRow && settingsRow.data) {
      try { settings = JSON.parse(settingsRow.data); } catch(e) {}
    }

    settings.reportFrequency = frequency;
    settings.reportDeliveryUpdated = new Date().toISOString();
    const dataStr = JSON.stringify(settings);

    if (settingsRow) {
      try {
        await db
          .prepare('UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND data_type = "settings"')
          .bind(dataStr, userId)
          .run();
      } catch (err) {
        await db
          .prepare('UPDATE user_data SET data = ? WHERE user_id = ? AND data_type = "settings"')
          .bind(dataStr, userId)
          .run();
      }
    } else {
      try {
        await db
          .prepare('INSERT INTO user_data (user_id, data_type, data, created_at, updated_at) VALUES (?, "settings", ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .bind(userId, dataStr)
          .run();
      } catch (insertErr) {
        try {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data, updated_at) VALUES (?, "settings", ?, CURRENT_TIMESTAMP)')
            .bind(userId, dataStr)
            .run();
        } catch (insertErr2) {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data) VALUES (?, "settings", ?)')
            .bind(userId, dataStr)
            .run();
        }
      }
    }

    return json({
      success: true,
      message: `Report delivery frequency set to ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`,
      frequency
    }, 200);
  } catch (e) {
    console.error('Report delivery error:', e);
    return json({ error: 'Failed to update report delivery: ' + e.message }, 500);
  }
}

/* ================= SYNC & DATA HANDLERS ================= */

async function handleSync(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { dataType, data } = body;

    if (!dataType || data === undefined || data === null) {
      return json({ error: 'dataType and data required' }, 400);
    }

    const validTypes = ['expenses', 'income', 'savings', 'stocks', 'settings', 'notifications', 'budgets', 'recurring', 'goals', 'goalContributions', 'profile'];
    if (!validTypes.includes(dataType)) {
      return json({ error: 'Invalid dataType' }, 400);
    }

    const dataStr = JSON.stringify(data);

    const existing = await db
      .prepare('SELECT id FROM user_data WHERE user_id = ? AND data_type = ? LIMIT 1')
      .bind(userId, dataType)
      .first();

    if (existing) {
      try {
        await db
          .prepare('UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND data_type = ?')
          .bind(dataStr, userId, dataType)
          .run();
      } catch (err) {
        await db
          .prepare('UPDATE user_data SET data = ? WHERE user_id = ? AND data_type = ?')
          .bind(dataStr, userId, dataType)
          .run();
      }
    } else {
      try {
        await db
          .prepare('INSERT INTO user_data (user_id, data_type, data, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .bind(userId, dataType, dataStr)
          .run();
      } catch (insertErr) {
        try {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
            .bind(userId, dataType, dataStr)
            .run();
        } catch (insertErr2) {
          await db
            .prepare('INSERT INTO user_data (user_id, data_type, data) VALUES (?, ?, ?)')
            .bind(userId, dataType, dataStr)
            .run();
        }
      }
    }

    return json({ success: true, message: 'Data synced', dataType }, 200);
  } catch (e) {
    console.error('Sync error:', e);
    return json({ error: 'Sync failed: ' + e.message }, 500);
  }
}

async function handleFetchData(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const dataType = url.pathname.split('/').pop();

    if (!dataType) {
      return json({ error: 'dataType required' }, 400);
    }

    const row = await db
      .prepare('SELECT data FROM user_data WHERE user_id = ? AND data_type = ? LIMIT 1')
      .bind(userId, dataType)
      .first();

    if (!row) {
      return json({ data: null, message: 'No data found' }, 200);
    }

    let data = null;
    try {
      data = JSON.parse(row.data);
    } catch(err) {
      data = row.data;
    }

    return json({ success: true, data, dataType }, 200);
  } catch (e) {
    console.error('Fetch error:', e);
    return json({ error: 'Fetch failed: ' + e.message }, 500);
  }
}

async function handleFetchAllData(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const rows = await db
      .prepare('SELECT data_type, data FROM user_data WHERE user_id = ?')
      .bind(userId)
      .all();

    const allData = {};
    rows.results?.forEach((row) => {
      try {
        allData[row.data_type] = JSON.parse(row.data);
      } catch (e) {
        allData[row.data_type] = row.data;
      }
    });

    return json({ success: true, data: allData }, 200);
  } catch (e) {
    console.error('Fetch all error:', e);
    return json({ error: 'Fetch failed: ' + e.message }, 500);
  }
}

async function handleDeleteData(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const dataType = url.pathname.split('/').pop();

    if (!dataType) {
      return json({ error: 'dataType required' }, 400);
    }

    await db.prepare('DELETE FROM user_data WHERE user_id = ? AND data_type = ?').bind(userId, dataType).run();

    return json({ success: true, message: 'Data deleted', dataType }, 200);
  } catch (e) {
    console.error('Delete error:', e);
    return json({ error: 'Delete failed: ' + e.message }, 500);
  }
}

async function handleExerciseSave(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json().catch(() => ({}));
    const { dateKey, idx, kcal, p, c } = body;

    if (!dateKey || idx === undefined || kcal === undefined || p === undefined || c === undefined) {
      return json({ error: 'Exercise fields required' }, 400);
    }

    await db.prepare(
      'INSERT INTO exercise_history (user_id, date_key, idx, kcal, p, c, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(userId, dateKey, idx, kcal, p, c).run();

    return json({ success: true, message: 'Exercise history saved' }, 200);
  } catch (e) {
    console.error('Exercise save error:', e);
    return json({ error: 'Exercise save failed: ' + e.message }, 500);
  }
}

async function handleExerciseFetch(request, env) {
  const db = getDb(env);
  if (!db) return json({ error: 'Database not configured' }, 500);
  await ensureSchema(db);

  const userId = getUserIdFromAuth(request);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const rows = await db.prepare(
      'SELECT * FROM exercise_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 60'
    ).bind(userId).all();

    return json({ success: true, history: rows.results || [] }, 200);
  } catch (e) {
    console.error('Exercise fetch error:', e);
    return json({ error: 'Exercise fetch failed: ' + e.message }, 500);
  }
}

/* ================= HELPER FUNCTIONS ================= */

function getUserIdFromAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  
  try {
    if (!token || typeof token !== 'string') return null;
    
    // Check standard 3-part JWT
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || null;
    }

    // Check legacy base64 token (userId:timestamp)
    const decoded = atob(token);
    if (decoded.includes(':')) {
      return decoded.split(':')[0] || null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function makeToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ userId, iat: Date.now() }));
  return `${header}.${payload}.signature`;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
