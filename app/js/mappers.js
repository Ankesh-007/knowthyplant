// Field mappers between the dashboard's camelCase client shape and Supabase's
// snake_case columns. Ported verbatim from the former server repositories
// (src/repositories/*) so the proven conversion logic is reused, not rewritten.
//
// Rule: always map FULL objects for create/update (like the server did by
// merging onto the stored record first), so toDb*() never clobbers unspecified
// columns with defaults.

// ---- Workers ---------------------------------------------------------------
export function workerToClient(row) {
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

export function workerToDb(worker) {
  const db = {
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
  // Only send id when the caller supplied one; otherwise the DB trigger assigns it.
  if (worker.id) db.id = worker.id;
  return db;
}

// ---- Sites -----------------------------------------------------------------
export function siteToClient(row) {
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

export function siteToDb(site) {
  const db = {
    name: site.name,
    client: site.client,
    location: site.location,
    quota: Number(site.quota || 0),
    supervisor: site.supervisor || null,
    shift_timing: site.shiftTiming || site.shift_timing || null
  };
  if (site.id) db.id = site.id;
  return db;
}

// ---- Admin users -----------------------------------------------------------
export function adminUserToClient(row) {
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

export function adminUserToDb(user) {
  const db = {
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
  if (user.id) db.id = user.id;
  return db;
}

// ---- Audit logs ------------------------------------------------------------
export function auditLogToClient(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    user: row.user_name || row.user,
    role: row.role,
    action: row.action,
    details: row.details,
    ip: row.ip
  };
}

// ---- Attendance (object <-> rows) ------------------------------------------
/** Supabase rows -> { workerId: { status, otHours, notes } } (ported from getByDate). */
export function attendanceRowsToMap(rows) {
  const map = {};
  (rows || []).forEach(row => {
    map[row.worker_id] = {
      status: row.status,
      otHours: Number(row.ot_hours || 0),
      notes: row.notes || ''
    };
  });
  return map;
}

/** { workerId: {...} } -> upsertable rows for a given shift date (ported from save). */
export function attendanceMapToRows(date, recordsMap) {
  return Object.entries(recordsMap || {}).map(([workerId, rec]) => ({
    shift_date: date,
    worker_id: workerId,
    status: rec.status || 'P',
    ot_hours: Number(rec.otHours || 0),
    notes: rec.notes || ''
  }));
}
