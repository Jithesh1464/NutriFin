const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const getDb = (env) => env.DB || env.gains_ledger_db;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (path === '/' || path === '') {
      return json({
        message: 'Gains Ledger Worker API is running',
        status: 'ok',
        routes: [
          '/api/auth/login',
          '/api/auth/register',
          '/api/sync/data',
          '/api/sync/data/:dataType',
          '/api/exercise-history'
        ]
      }, 200);
    }

    if ((path === '/api/auth/register' || path === '/auth/register') && request.method === 'POST') {
      return handleRegister(request, env);
    }

    if ((path === '/api/auth/login' || path === '/auth/login') && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if ((path === '/api/sync/data' || path === '/sync/data') && request.method === 'POST') {
      return handleSyncData(request, env);
    }

    if ((path.startsWith('/api/sync/data/') || path.startsWith('/sync/data/')) && request.method === 'GET') {
      return handleFetchData(request, env);
    }

    if ((path === '/api/exercise-history' || path === '/exercise-history') && request.method === 'POST') {
      return handleExerciseSave(request, env);
    }

    if ((path === '/api/exercise-history' || path === '/exercise-history') && request.method === 'GET') {
      return handleExerciseFetch(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

async function handleRegister(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const { userId, email, password } = body;

  if (!userId || !email || !password) {
    return json({ error: 'All fields required' }, 400);
  }

  if (String(password).length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, 400);
  }

  const existing = await db.prepare(
    'SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1'
  ).bind(userId, email).first();

  if (existing) {
    return json({ error: 'User ID or Email already exists' }, 400);
  }

  const hash = await hashPassword(password);
  await db.prepare(
    'INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
  ).bind(userId, email, hash).run();

  const token = makeToken(userId);

  return json({ message: 'User registered successfully', token, userId }, 200);
}

async function handleLogin(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const { userId, password } = body;

  if (!userId || !password) {
    return json({ error: 'User ID and password required' }, 400);
  }

  const user = await db.prepare(
    'SELECT * FROM users WHERE id = ? LIMIT 1'
  ).bind(userId).first();

  if (!user) {
    return json({ error: 'Invalid credentials' }, 400);
  }

  const hash = await hashPassword(password);

  if (user.password !== hash) {
    return json({ error: 'Invalid credentials' }, 400);
  }

  const token = makeToken(userId);

  return json({ message: 'Login successful', token, userId }, 200);
}

async function handleSyncData(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const userId = getUserIdFromAuth(request);

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const { dataType, data } = body;

  if (!dataType || data === undefined) {
    return json({ error: 'Data type and data required' }, 400);
  }

  const existing = await db.prepare(
    'SELECT id FROM user_data WHERE user_id = ? AND data_type = ? ORDER BY updated_at DESC LIMIT 1'
  ).bind(userId, dataType).first();

  if (existing) {
    await db.prepare(
      'UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(JSON.stringify(data), existing.id).run();
  } else {
    await db.prepare(
      'INSERT INTO user_data (user_id, data_type, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(userId, dataType, JSON.stringify(data)).run();
  }

  return json({ message: 'Data synced successfully', data }, 200);
}

async function handleFetchData(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const userId = getUserIdFromAuth(request);

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const dataType = request.url.split('/').pop();
  const row = await db.prepare(
    'SELECT data FROM user_data WHERE user_id = ? AND data_type = ? ORDER BY updated_at DESC LIMIT 1'
  ).bind(userId, dataType).first();

  return json({ data: row ? JSON.parse(row.data) : null }, 200);
}

async function handleExerciseSave(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const userId = getUserIdFromAuth(request);

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const { dateKey, idx, kcal, p, c } = body;

  if (!dateKey || idx === undefined || kcal === undefined || p === undefined || c === undefined) {
    return json({ error: 'Exercise fields required' }, 400);
  }

  await db.prepare(
    'INSERT INTO exercise_history (user_id, date_key, idx, kcal, p, c, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
  ).bind(userId, dateKey, idx, kcal, p, c).run();

  return json({ message: 'Exercise history saved' }, 200);
}

async function handleExerciseFetch(request, env) {
  const db = getDb(env);
  if (!db) {
    return json({ error: 'Database binding not configured' }, 500);
  }

  const userId = getUserIdFromAuth(request);

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const rows = await db.prepare(
    'SELECT * FROM exercise_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 60'
  ).bind(userId).all();

  return json({ history: rows.results || [] }, 200);
}

function getUserIdFromAuth(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return null;
  }

  try {
    const decoded = atob(token);
    return decoded.split(':')[0] || null;
  } catch {
    return null;
  }
}

function makeToken(userId) {
  return btoa(`${userId}:${Date.now()}`);
}

async function hashPassword(password) {
  const pw = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', pw);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
