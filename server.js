const http = require('http');
const path = require('path');
const { supabase, checkSupabaseStatus } = require('./supabase-client');
const { sendJson, CORS_HEADERS } = require('./src/httpUtils');
const Router = require('./src/router');
const StaticServer = require('./src/staticServer');
const JsonFileStorage = require('./src/storage/JsonFileStorage');
const SupabaseStorage = require('./src/storage/SupabaseStorage');
const WorkerRepository = require('./src/repositories/WorkerRepository');
const SiteRepository = require('./src/repositories/SiteRepository');
const AttendanceRepository = require('./src/repositories/AttendanceRepository');
const AdminUserRepository = require('./src/repositories/AdminUserRepository');
const AuditLogRepository = require('./src/repositories/AuditLogRepository');
const registerWorkerRoutes = require('./src/routes/workerRoutes');
const registerSiteRoutes = require('./src/routes/siteRoutes');
const registerAttendanceRoutes = require('./src/routes/attendanceRoutes');
const registerAdminRoutes = require('./src/routes/adminRoutes');
const registerAuthRoutes = require('./src/routes/authRoutes');
const registerStatusRoutes = require('./src/routes/statusRoutes');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');

// --- Storage Layer (DIP: concrete adapters injected into repositories) ---
const jsonStorages = {
  workers: new JsonFileStorage(path.join(DATA_DIR, 'workers.json')),
  sites: new JsonFileStorage(path.join(DATA_DIR, 'sites.json')),
  attendance: new JsonFileStorage(path.join(DATA_DIR, 'attendance.json')),
  adminUsers: new JsonFileStorage(path.join(DATA_DIR, 'admin_users.json')),
  auditLogs: new JsonFileStorage(path.join(DATA_DIR, 'audit_logs.json'))
};

const supabaseStorages = {
  workers: new SupabaseStorage(supabase, 'workers'),
  sites: new SupabaseStorage(supabase, 'sites'),
  attendance: new SupabaseStorage(supabase, 'attendance_records'),
  adminUsers: new SupabaseStorage(supabase, 'admin_users'),
  auditLogs: new SupabaseStorage(supabase, 'audit_logs')
};

// --- Supabase Availability (cached 10s) ---
let supabaseReady = false;
let lastStatusCheck = 0;

async function isSupabaseAvailable() {
  const now = Date.now();
  if (now - lastStatusCheck < 10000) return supabaseReady;
  lastStatusCheck = now;
  try {
    const status = await checkSupabaseStatus();
    supabaseReady = status.isReady;
    return supabaseReady;
  } catch {
    supabaseReady = false;
    return false;
  }
}

// --- Repositories (SRP: one entity per class, OCP: extend via subclasses) ---
const workerRepo = new WorkerRepository(supabaseStorages.workers, jsonStorages.workers, isSupabaseAvailable);
const siteRepo = new SiteRepository(supabaseStorages.sites, jsonStorages.sites, isSupabaseAvailable);
const attendanceRepo = new AttendanceRepository(supabaseStorages.attendance, jsonStorages.attendance, isSupabaseAvailable);
const adminUserRepo = new AdminUserRepository(supabaseStorages.adminUsers, jsonStorages.adminUsers, isSupabaseAvailable);
const auditLogRepo = new AuditLogRepository(supabaseStorages.auditLogs, jsonStorages.auditLogs, isSupabaseAvailable);

// --- Router (OCP: register routes without modifying server logic) ---
const router = new Router();
registerStatusRoutes(router, checkSupabaseStatus);
registerWorkerRoutes(router, workerRepo, auditLogRepo);
registerSiteRoutes(router, siteRepo, auditLogRepo);
registerAttendanceRoutes(router, attendanceRepo);
registerAdminRoutes(router, adminUserRepo, workerRepo, siteRepo, auditLogRepo);
registerAuthRoutes(router, adminUserRepo, auditLogRepo);

// --- Static File Server ---
const staticServer = new StaticServer(ROOT_DIR);

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = parsedUrl.pathname;

  if (reqPath === '/backend-admin' || reqPath === '/backend-admin/') {
    reqPath = '/admin.html';
  } else if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  if (reqPath.startsWith('/api/')) {
    const match = router.match(req.method, reqPath);
    if (match) {
      try {
        await match.handler(req, res, match.params);
      } catch (err) {
        console.error('[API Error]:', err);
        sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
      }
    } else {
      sendJson(res, 404, { success: false, error: `API endpoint not found: ${reqPath}` });
    }
    return;
  }

  staticServer.serve(req, res, reqPath);
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
