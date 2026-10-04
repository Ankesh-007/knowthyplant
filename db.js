const fs = require('fs');
const path = require('path');
const { supabase, checkSupabaseStatus } = require('./supabase-client');

const DATA_DIR = path.join(__dirname, 'data');
const WORKERS_FILE = path.join(DATA_DIR, 'workers.json');
const SITES_FILE = path.join(DATA_DIR, 'sites.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const USERS_FILE = path.join(DATA_DIR, 'admin_users.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

// In-memory cache of Supabase table availability status
let supabaseReady = false;
let lastStatusCheck = 0;

// Read JSON file safely
function readJson(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
  return fallback;
}

// Write JSON file safely
function writeJson(file, data) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing to ${file}:`, e.message);
    return false;
  }
}

// Check if Supabase tables are ready (cached for 10 seconds)
async function isSupabaseAvailable() {
  const now = Date.now();
  if (now - lastStatusCheck < 10000) {
    return supabaseReady;
  }
  lastStatusCheck = now;
  try {
    const status = await checkSupabaseStatus();
    supabaseReady = status.isReady;
    return supabaseReady;
  } catch (err) {
    supabaseReady = false;
    return false;
  }
}

// ============================================================================
// Data Transformation Helpers (CamelCase <-> snake_case)
// ============================================================================
function workerToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    trade: row.trade,
    skills: Array.isArray(row.skills) ? row.skills : (typeof row.skills === 'string' ? JSON.parse(row.skills || '[]') : []),
    experience: row.experience,
    yearsExp: Number(row.years_exp ?? row.yearsExp ?? 0),
    dailyRate: Number(row.daily_rate ?? row.dailyRate ?? 0),
    age: row.age ? Number(row.age) : null,
    bloodGroup: row.blood_group ?? row.bloodGroup,
    location: row.location,
    emergencyContact: row.emergency_contact ?? row.emergencyContact,
    kycVerified: !!(row.kyc_verified ?? row.kycVerified),
    oshaCertified: !!(row.osha_certified ?? row.oshaCertified),
    medicalCleared: !!(row.medical_cleared ?? row.medicalCleared),
    rating: Number(row.rating ?? 5.0),
    status: row.status || 'Available',
    assignedSiteId: row.assigned_site_id ?? row.assignedSiteId ?? null,
    shiftTiming: row.shift_timing ?? row.shiftTiming ?? null,
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function workerToDb(worker) {
  return {
    id: worker.id,
    name: worker.name,
    phone: worker.phone || null,
    trade: worker.trade,
    skills: Array.isArray(worker.skills) ? worker.skills : [],
    experience: worker.experience || 'Journeyman',
    years_exp: Number(worker.yearsExp ?? worker.years_exp ?? 0),
    daily_rate: Number(worker.dailyRate ?? worker.daily_rate ?? 0),
    age: worker.age ? Number(worker.age) : null,
    blood_group: worker.bloodGroup || worker.blood_group || null,
    location: worker.location || null,
    emergency_contact: worker.emergencyContact || worker.emergency_contact || null,
    kyc_verified: !!(worker.kycVerified ?? worker.kyc_verified),
    osha_certified: !!(worker.oshaCertified ?? worker.osha_certified),
    medical_cleared: !!(worker.medicalCleared ?? worker.medical_cleared),
    rating: Number(worker.rating ?? 5.0),
    status: worker.status || 'Available',
    assigned_site_id: worker.assignedSiteId || worker.assigned_site_id || null,
    shift_timing: worker.shiftTiming || worker.shift_timing || null,
    avatar: worker.avatar || null,
    updated_at: new Date().toISOString()
  };
}

function siteToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    location: row.location,
    quota: Number(row.quota || 0),
    supervisor: row.supervisor,
    shiftTiming: row.shift_timing ?? row.shiftTiming
  };
}

function siteToDb(site) {
  return {
    id: site.id,
    name: site.name,
    client: site.client,
    location: site.location,
    quota: Number(site.quota || 0),
    supervisor: site.supervisor || null,
    shift_timing: site.shiftTiming || site.shift_timing || null
  };
}

function adminUserToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    status: row.status || 'Active',
    permissions: Array.isArray(row.permissions) ? row.permissions : (typeof row.permissions === 'string' ? JSON.parse(row.permissions) : ['view_roster']),
    lastLogin: row.last_login ?? row.lastLogin ?? 'Never',
    twoFactor: !!(row.two_factor ?? row.twoFactor),
    avatar: row.avatar
  };
}

function adminUserToDb(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || 'Operations',
    status: user.status || 'Active',
    permissions: Array.isArray(user.permissions) ? user.permissions : ['view_roster'],
    last_login: user.lastLogin || user.last_login || 'Never',
    two_factor: !!(user.twoFactor ?? user.two_factor),
    avatar: user.avatar || null
  };
}

// ============================================================================
// Workers API
// ============================================================================
async function getWorkers() {
  const ready = await isSupabaseAvailable();
  if (ready) {
    try {
      const { data, error } = await supabase.from('workers').select('*').order('id', { ascending: true });
      if (!error && data) {
        return data.map(workerToClient);
      }
      console.warn('[Supabase] workers fetch error:', error?.message);
    } catch (e) {
      console.warn('[Supabase] workers fetch exception:', e.message);
    }
  }
  // Local fallback
  const local = readJson(WORKERS_FILE, []);
  return local.map(workerToClient);
}

async function createWorker(workerData) {
  const ready = await isSupabaseAvailable();
  const dbData = workerToDb(workerData);

  // Always update local cache for consistency
  const localWorkers = readJson(WORKERS_FILE, []);
  localWorkers.push(workerToClient(dbData));
  writeJson(WORKERS_FILE, localWorkers);

  if (ready) {
    try {
      const { data, error } = await supabase.from('workers').insert([dbData]).select().single();
      if (!error && data) {
        return workerToClient(data);
      }
      console.error('[Supabase] createWorker error:', error?.message);
    } catch (e) {
      console.error('[Supabase] createWorker exception:', e.message);
    }
  }
  return workerToClient(dbData);
}

async function updateWorker(id, updates) {
  const ready = await isSupabaseAvailable();

  // Update local cache
  const localWorkers = readJson(WORKERS_FILE, []);
  const index = localWorkers.findIndex(w => w.id === id);
  let updatedWorker = null;

  if (index !== -1) {
    localWorkers[index] = {
      ...localWorkers[index],
      ...updates,
      id // preserve ID
    };
    writeJson(WORKERS_FILE, localWorkers);
    updatedWorker = localWorkers[index];
  }

  if (ready) {
    try {
      const dbUpdates = workerToDb({ ...(updatedWorker || {}), ...updates, id });
      const { data, error } = await supabase.from('workers').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) {
        return workerToClient(data);
      }
      console.error('[Supabase] updateWorker error:', error?.message);
    } catch (e) {
      console.error('[Supabase] updateWorker exception:', e.message);
    }
  }
  return updatedWorker ? workerToClient(updatedWorker) : null;
}

async function deleteWorker(id) {
  const ready = await isSupabaseAvailable();

  // Remove from local cache
  const localWorkers = readJson(WORKERS_FILE, []);
  const filtered = localWorkers.filter(w => w.id !== id);
  writeJson(WORKERS_FILE, filtered);

  if (ready) {
    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) console.error('[Supabase] deleteWorker error:', error.message);
    } catch (e) {
      console.error('[Supabase] deleteWorker exception:', e.message);
    }
  }
  return true;
}

// ============================================================================
// Sites API
// ============================================================================
async function getSites() {
  const ready = await isSupabaseAvailable();
  if (ready) {
    try {
      const { data, error } = await supabase.from('sites').select('*').order('id', { ascending: true });
      if (!error && data) {
        return data.map(siteToClient);
      }
    } catch (e) {
      console.warn('[Supabase] sites fetch exception:', e.message);
    }
  }
  const local = readJson(SITES_FILE, []);
  return local.map(siteToClient);
}

async function createSite(siteData) {
  const ready = await isSupabaseAvailable();
  const dbData = siteToDb(siteData);

  const localSites = readJson(SITES_FILE, []);
  localSites.push(siteToClient(dbData));
  writeJson(SITES_FILE, localSites);

  if (ready) {
    try {
      const { data, error } = await supabase.from('sites').insert([dbData]).select().single();
      if (!error && data) {
        return siteToClient(data);
      }
    } catch (e) {
      console.error('[Supabase] createSite exception:', e.message);
    }
  }
  return siteToClient(dbData);
}

async function updateSite(id, updates) {
  const ready = await isSupabaseAvailable();
  const localSites = readJson(SITES_FILE, []);
  const index = localSites.findIndex(s => s.id === id);
  let updatedSite = null;

  if (index !== -1) {
    localSites[index] = { ...localSites[index], ...updates, id };
    writeJson(SITES_FILE, localSites);
    updatedSite = localSites[index];
  }

  if (ready) {
    try {
      const dbUpdates = siteToDb({ ...(updatedSite || {}), ...updates, id });
      const { data, error } = await supabase.from('sites').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) {
        return siteToClient(data);
      }
    } catch (e) {
      console.error('[Supabase] updateSite exception:', e.message);
    }
  }
  return updatedSite ? siteToClient(updatedSite) : null;
}

async function deleteSite(id) {
  const ready = await isSupabaseAvailable();
  const localSites = readJson(SITES_FILE, []);
  const filtered = localSites.filter(s => s.id !== id);
  writeJson(SITES_FILE, filtered);

  if (ready) {
    try {
      await supabase.from('sites').delete().eq('id', id);
    } catch (e) {
      console.error('[Supabase] deleteSite exception:', e.message);
    }
  }
  return true;
}

// ============================================================================
// Attendance API
// ============================================================================
async function getAttendance(date) {
  const ready = await isSupabaseAvailable();
  if (ready && date) {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('shift_date', date);

      if (!error && data) {
        const attendanceMap = {};
        data.forEach(row => {
          attendanceMap[row.worker_id] = {
            status: row.status,
            otHours: Number(row.ot_hours || 0),
            notes: row.notes || ''
          };
        });
        return attendanceMap;
      }
    } catch (e) {
      console.warn('[Supabase] attendance fetch exception:', e.message);
    }
  }
  const allAttendance = readJson(ATTENDANCE_FILE, {});
  return (date ? allAttendance[date] : allAttendance) || {};
}

async function saveAttendance(date, recordsMap) {
  const ready = await isSupabaseAvailable();

  // Save to local cache
  const allAttendance = readJson(ATTENDANCE_FILE, {});
  allAttendance[date] = {
    ...(allAttendance[date] || {}),
    ...recordsMap
  };
  writeJson(ATTENDANCE_FILE, allAttendance);

  if (ready && recordsMap) {
    try {
      const rows = Object.entries(recordsMap).map(([workerId, rec]) => ({
        shift_date: date,
        worker_id: workerId,
        status: rec.status || 'P',
        ot_hours: Number(rec.otHours || 0),
        notes: rec.notes || ''
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from('attendance_records')
          .upsert(rows, { onConflict: 'shift_date,worker_id' });
        if (error) {
          console.error('[Supabase] saveAttendance upsert error:', error.message);
        }
      }
    } catch (e) {
      console.error('[Supabase] saveAttendance exception:', e.message);
    }
  }
  return allAttendance[date];
}

// ============================================================================
// Admin Users API
// ============================================================================
async function getAdminUsers() {
  const ready = await isSupabaseAvailable();
  if (ready) {
    try {
      const { data, error } = await supabase.from('admin_users').select('*').order('id', { ascending: true });
      if (!error && data) {
        return data.map(adminUserToClient);
      }
    } catch (e) {
      console.warn('[Supabase] admin_users fetch exception:', e.message);
    }
  }
  const local = readJson(USERS_FILE, []);
  return local.map(adminUserToClient);
}

async function createAdminUser(userData) {
  const ready = await isSupabaseAvailable();
  const dbData = adminUserToDb(userData);

  const localUsers = readJson(USERS_FILE, []);
  localUsers.push(adminUserToClient(dbData));
  writeJson(USERS_FILE, localUsers);

  if (ready) {
    try {
      const { data, error } = await supabase.from('admin_users').insert([dbData]).select().single();
      if (!error && data) {
        return adminUserToClient(data);
      }
    } catch (e) {
      console.error('[Supabase] createAdminUser exception:', e.message);
    }
  }
  return adminUserToClient(dbData);
}

async function updateAdminUser(id, updates) {
  const ready = await isSupabaseAvailable();
  const localUsers = readJson(USERS_FILE, []);
  const index = localUsers.findIndex(u => u.id === id);
  let updatedUser = null;

  if (index !== -1) {
    localUsers[index] = { ...localUsers[index], ...updates, id };
    writeJson(USERS_FILE, localUsers);
    updatedUser = localUsers[index];
  }

  if (ready) {
    try {
      const dbUpdates = adminUserToDb({ ...(updatedUser || {}), ...updates, id });
      const { data, error } = await supabase.from('admin_users').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) {
        return adminUserToClient(data);
      }
    } catch (e) {
      console.error('[Supabase] updateAdminUser exception:', e.message);
    }
  }
  return updatedUser ? adminUserToClient(updatedUser) : null;
}

async function deleteAdminUser(id) {
  const ready = await isSupabaseAvailable();
  const localUsers = readJson(USERS_FILE, []);
  const filtered = localUsers.filter(u => u.id !== id);
  writeJson(USERS_FILE, filtered);

  if (ready) {
    try {
      await supabase.from('admin_users').delete().eq('id', id);
    } catch (e) {
      console.error('[Supabase] deleteAdminUser exception:', e.message);
    }
  }
  return true;
}

// ============================================================================
// Audit Logs API
// ============================================================================
async function getAuditLogs() {
  const ready = await isSupabaseAvailable();
  if (ready) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        return data.map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          user: row.user_name || row.user,
          role: row.role,
          action: row.action,
          details: row.details,
          ip: row.ip
        }));
      }
    } catch (e) {
      console.warn('[Supabase] audit_logs fetch exception:', e.message);
    }
  }
  return readJson(AUDIT_FILE, []);
}

async function logAudit(user, role, action, details, ip = '127.0.0.1') {
  const logs = readJson(AUDIT_FILE, []);
  const newLog = {
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user || 'Super Admin',
    role: role || 'System Operator',
    action,
    details,
    ip: ip || '127.0.0.1'
  };

  logs.unshift(newLog);
  writeJson(AUDIT_FILE, logs.slice(0, 50));

  const ready = await isSupabaseAvailable();
  if (ready) {
    try {
      await supabase.from('audit_logs').insert([{
        id: newLog.id,
        timestamp: newLog.timestamp,
        user_name: newLog.user,
        role: newLog.role,
        action: newLog.action,
        details: newLog.details,
        ip: newLog.ip
      }]);
    } catch (e) {
      console.error('[Supabase] logAudit exception:', e.message);
    }
  }
  return newLog;
}

module.exports = {
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getSites,
  createSite,
  updateSite,
  deleteSite,
  getAttendance,
  saveAttendance,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAuditLogs,
  logAudit,
  isSupabaseAvailable,
  checkSupabaseStatus
};
