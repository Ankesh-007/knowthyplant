const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { checkSupabaseStatus } = require('./supabase-client');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Parse JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { // 2MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = parsedUrl.pathname;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // -------------------------------------------------------------
  // Route Navigation Aliases
  // -------------------------------------------------------------
  if (reqPath === '/backend-admin' || reqPath === '/backend-admin/') {
    reqPath = '/admin.html';
  } else if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // -------------------------------------------------------------
  // API Routes: /api/...
  // -------------------------------------------------------------
  if (reqPath.startsWith('/api/')) {
    try {
      // 1. Supabase Status & Health Check
      if (reqPath === '/api/supabase/status' || reqPath === '/api/status') {
        const status = await checkSupabaseStatus();
        return sendJson(res, 200, {
          success: true,
          ...status,
          migrationFile: '/supabase/schema.sql',
          timestamp: new Date().toISOString()
        });
      }

      // 2. WORKERS API
      // GET /api/workers
      if (req.method === 'GET' && reqPath === '/api/workers') {
        const workers = await db.getWorkers();
        return sendJson(res, 200, { success: true, data: workers });
      }

      // POST /api/workers
      if (req.method === 'POST' && reqPath === '/api/workers') {
        const payload = await parseRequestBody(req);
        if (!payload.name || !payload.trade) {
          return sendJson(res, 400, { success: false, error: 'Name and trade are required.' });
        }

        // Generate ID if missing
        if (!payload.id) {
          const workers = await db.getWorkers();
          const maxNum = workers.reduce((acc, w) => {
            const m = (w.id || '').match(/\d+/);
            return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
          }, 800);
          payload.id = `LAB-${maxNum + 1}`;
        }

        const newWorker = await db.createWorker(payload);
        await db.logAudit('Admin Dispatcher', 'Field Allocations', 'WORKER_REGISTERED', `Enrolled worker ${newWorker.name} (${newWorker.id}) - Trade: ${newWorker.trade}`, clientIp);
        return sendJson(res, 201, { success: true, message: 'Worker registered successfully', data: newWorker });
      }

      // PUT/PATCH /api/workers/:id
      const workerMatch = reqPath.match(/^\/api\/workers\/([A-Za-z0-9-_]+)$/);
      if ((req.method === 'PUT' || req.method === 'PATCH') && workerMatch) {
        const workerId = workerMatch[1];
        const payload = await parseRequestBody(req);
        const updated = await db.updateWorker(workerId, payload);
        if (!updated) {
          return sendJson(res, 404, { success: false, error: 'Worker not found' });
        }
        await db.logAudit('Admin Dispatcher', 'Field Allocations', 'WORKER_UPDATED', `Updated record for worker ${updated.name} (${workerId})`, clientIp);
        return sendJson(res, 200, { success: true, message: 'Worker updated successfully', data: updated });
      }

      // DELETE /api/workers/:id
      if (req.method === 'DELETE' && workerMatch) {
        const workerId = workerMatch[1];
        await db.deleteWorker(workerId);
        await db.logAudit('Admin Dispatcher', 'Field Allocations', 'WORKER_DELETED', `Removed worker profile #${workerId}`, clientIp);
        return sendJson(res, 200, { success: true, message: `Worker #${workerId} removed.` });
      }

      // 3. SITES API
      // GET /api/sites
      if (req.method === 'GET' && reqPath === '/api/sites') {
        const sites = await db.getSites();
        return sendJson(res, 200, { success: true, data: sites });
      }

      // POST /api/sites
      if (req.method === 'POST' && reqPath === '/api/sites') {
        const payload = await parseRequestBody(req);
        if (!payload.name || !payload.client) {
          return sendJson(res, 400, { success: false, error: 'Site name and client are required.' });
        }
        if (!payload.id) {
          const sites = await db.getSites();
          const maxNum = sites.reduce((acc, s) => {
            const m = (s.id || '').match(/\d+/);
            return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
          }, 0);
          payload.id = `SITE-${String(maxNum + 1).padStart(2, '0')}`;
        }
        const newSite = await db.createSite(payload);
        await db.logAudit('Super Admin', 'Executive Operations', 'SITE_CREATED', `Added new project site: ${newSite.name} (${newSite.id})`, clientIp);
        return sendJson(res, 201, { success: true, message: 'Site created successfully', data: newSite });
      }

      // PUT/PATCH /api/sites/:id
      const siteMatch = reqPath.match(/^\/api\/sites\/([A-Za-z0-9-_]+)$/);
      if ((req.method === 'PUT' || req.method === 'PATCH') && siteMatch) {
        const siteId = siteMatch[1];
        const payload = await parseRequestBody(req);
        const updated = await db.updateSite(siteId, payload);
        if (!updated) {
          return sendJson(res, 404, { success: false, error: 'Site not found' });
        }
        return sendJson(res, 200, { success: true, message: 'Site updated successfully', data: updated });
      }

      // DELETE /api/sites/:id
      if (req.method === 'DELETE' && siteMatch) {
        const siteId = siteMatch[1];
        await db.deleteSite(siteId);
        return sendJson(res, 200, { success: true, message: `Site #${siteId} removed.` });
      }

      // 4. ATTENDANCE API
      // GET /api/attendance?date=YYYY-MM-DD
      if (req.method === 'GET' && reqPath === '/api/attendance') {
        const date = parsedUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const attendance = await db.getAttendance(date);
        return sendJson(res, 200, { success: true, date, data: attendance });
      }

      // POST /api/attendance
      if (req.method === 'POST' && reqPath === '/api/attendance') {
        const payload = await parseRequestBody(req);
        const date = payload.date || new Date().toISOString().split('T')[0];
        const records = payload.attendance || payload.records || {};
        const saved = await db.saveAttendance(date, records);
        return sendJson(res, 200, { success: true, message: 'Attendance records saved', date, data: saved });
      }

      // 5. ADMIN USERS API
      // GET /api/admin/users
      if (req.method === 'GET' && reqPath === '/api/admin/users') {
        const users = await db.getAdminUsers();
        return sendJson(res, 200, { success: true, data: users });
      }

      // POST /api/admin/users
      if (req.method === 'POST' && reqPath === '/api/admin/users') {
        const payload = await parseRequestBody(req);
        if (!payload.name || !payload.email || !payload.role) {
          return sendJson(res, 400, { success: false, error: 'Name, email, and role are required.' });
        }

        const users = await db.getAdminUsers();
        if (users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
          return sendJson(res, 409, { success: false, error: 'A backend user with this email already exists.' });
        }

        const maxNum = users.reduce((acc, u) => {
          const m = (u.id || '').match(/\d+/);
          return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
        }, 0);
        const newId = `ADM-${String(maxNum + 1).padStart(3, '0')}`;

        const newUser = await db.createAdminUser({
          id: newId,
          name: payload.name.trim(),
          email: payload.email.trim(),
          role: payload.role,
          department: payload.department || 'Operations',
          status: payload.status || 'Active',
          permissions: payload.permissions || ['view_roster'],
          lastLogin: 'Never',
          twoFactor: !!payload.twoFactor,
          avatar: payload.avatar || null
        });

        await db.logAudit('Super Admin', 'Executive Operations', 'USER_CREATED', `Created new backend administrator ${newUser.name} (${newUser.role})`, clientIp);
        return sendJson(res, 201, { success: true, message: 'Backend user created successfully', data: newUser });
      }

      // PUT/PATCH /api/admin/users/:id
      const adminUserMatch = reqPath.match(/^\/api\/admin\/users\/([A-Za-z0-9-_]+)$/);
      if ((req.method === 'PUT' || req.method === 'PATCH') && adminUserMatch) {
        const userId = adminUserMatch[1];
        const payload = await parseRequestBody(req);
        const updated = await db.updateAdminUser(userId, payload);
        if (!updated) {
          return sendJson(res, 404, { success: false, error: 'Backend user not found' });
        }
        await db.logAudit('Super Admin', 'Executive Operations', 'USER_MODIFIED', `Updated settings for backend user #${userId} (${updated.name})`, clientIp);
        return sendJson(res, 200, { success: true, message: 'User updated successfully', data: updated });
      }

      // DELETE /api/admin/users/:id
      if (req.method === 'DELETE' && adminUserMatch) {
        const userId = adminUserMatch[1];
        await db.deleteAdminUser(userId);
        await db.logAudit('Super Admin', 'Executive Operations', 'USER_DELETED', `Revoked credentials and deleted admin #${userId}`, clientIp);
        return sendJson(res, 200, { success: true, message: `User #${userId} deleted.` });
      }

      // 6. AUDIT LOGS API
      // GET /api/admin/audit-logs
      if (req.method === 'GET' && reqPath === '/api/admin/audit-logs') {
        const logs = await db.getAuditLogs();
        return sendJson(res, 200, { success: true, data: logs });
      }

      // 7. STATS API
      // GET /api/admin/stats
      if (req.method === 'GET' && reqPath === '/api/admin/stats') {
        const [users, workers, sites] = await Promise.all([
          db.getAdminUsers(),
          db.getWorkers(),
          db.getSites()
        ]);
        const activeCount = users.filter(u => u.status === 'Active').length;
        const rolesSet = new Set(users.map(u => u.role));
        const twoFaCount = users.filter(u => u.twoFactor).length;

        return sendJson(res, 200, {
          success: true,
          data: {
            totalUsers: users.length,
            activeUsers: activeCount,
            suspendedUsers: users.length - activeCount,
            rolesCount: rolesSet.size,
            twoFaCompliance: users.length > 0 ? Math.round((twoFaCount / users.length) * 100) : 0,
            totalWorkers: workers.length,
            deployedWorkers: workers.filter(w => w.status === 'Deployed').length,
            totalSites: sites.length
          }
        });
      }

      // 8. AUTH API (/api/auth/login)
      if (req.method === 'POST' && reqPath === '/api/auth/login') {
        const payload = await parseRequestBody(req);
        const { email, password } = payload;

        if (!email) {
          return sendJson(res, 400, { success: false, error: 'Email is required' });
        }

        // Verify against admin users
        const users = await db.getAdminUsers();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!foundUser) {
          return sendJson(res, 401, { success: false, error: 'Invalid credentials or user does not exist.' });
        }

        if (foundUser.status === 'Suspended') {
          return sendJson(res, 403, { success: false, error: 'This administrator account is suspended. Contact your super admin.' });
        }

        // Update last login
        const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
        await db.updateAdminUser(foundUser.id, { lastLogin: nowFormatted });
        await db.logAudit(foundUser.name, foundUser.role, 'ADMIN_LOGIN', `Admin session started for ${foundUser.email}`, clientIp);

        return sendJson(res, 200, {
          success: true,
          message: 'Authentication successful',
          user: {
            ...foundUser,
            lastLogin: nowFormatted
          },
          token: `session_${Buffer.from(foundUser.email + ':' + Date.now()).toString('base64')}`
        });
      }

      // 404 for unknown API routes
      return sendJson(res, 404, { success: false, error: `API endpoint not found: ${reqPath}` });
    } catch (apiError) {
      console.error('[API Error]:', apiError);
      return sendJson(res, 500, { success: false, error: apiError.message || 'Internal Server Error' });
    }
  }

  // -------------------------------------------------------------
  // Route 3: Static Asset Serving (HTML, CSS, JS, Images, etc.)
  // -------------------------------------------------------------
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  // Security check: ensure filePath is inside ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>404 Not Found</h2><p>Cannot find path: ${escapeHtml(reqPath)}</p><p><a href="/">Return to Registry</a> | <a href="/backend-admin">Go to Backend Admin</a></p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n=================================================`);
    console.log(`  BUILDVANTAGE Labour Supply Registry Running`);
    console.log(`  Main App:       http://localhost:${port}`);
    console.log(`  Backend Admin:  http://localhost:${port}/backend-admin`);
    console.log(`  Supabase API:   http://localhost:${port}/api/supabase/status`);
    console.log(`=================================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`[WARN] Port ${PORT} is already in use. Trying port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
