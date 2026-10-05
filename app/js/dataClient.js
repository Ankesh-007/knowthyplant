// Browser data-access layer for the dashboard — the single place that talks to
// Supabase. The UI depends on THIS abstraction (not on supabase-js or fetch),
// mirroring the method names of the former /api routes + repositories so call
// sites barely change. Field mapping lives in mappers.js; RLS (is_admin) guards
// every table server-side.
import { supabase } from '../../shared/supabaseClient.js';
import {
  workerToClient, workerToDb,
  siteToClient, siteToDb,
  adminUserToClient, adminUserToDb,
  auditLogToClient,
  attendanceRowsToMap, attendanceMapToRows
} from './mappers.js';

// Who is performing actions (set by adminGate after login) — stamped onto audit logs.
let currentActor = { name: 'System', role: 'System' };
export function setActor(actor) {
  if (actor && actor.name) currentActor = { name: actor.name, role: actor.role || 'Admin' };
}

async function writeLog(action, details) {
  try {
    await supabase.from('audit_logs').insert({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: currentActor.name,
      role: currentActor.role,
      action,
      details,
      ip: 'web'
    });
  } catch (e) {
    console.warn('[audit] log failed:', e.message);
  }
}

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export const workers = {
  async getAll() {
    const rows = unwrap(await supabase.from('workers').select('*').order('id', { ascending: true }));
    return rows.map(workerToClient);
  },
  async create(worker) {
    const row = unwrap(await supabase.from('workers').insert(workerToDb(worker)).select().single());
    const created = workerToClient(row);
    await writeLog('WORKER_REGISTERED', `Enrolled worker ${created.name} (${created.id}) - Trade: ${created.trade}`);
    return created;
  },
  async update(id, worker) {
    const row = unwrap(await supabase.from('workers').update(workerToDb(worker)).eq('id', id).select().single());
    const updated = workerToClient(row);
    await writeLog('WORKER_UPDATED', `Updated record for worker ${updated.name} (${id})`);
    return updated;
  },
  async delete(id) {
    unwrap(await supabase.from('workers').delete().eq('id', id));
    await writeLog('WORKER_DELETED', `Removed worker profile #${id}`);
    return true;
  }
};

export const sites = {
  async getAll() {
    const rows = unwrap(await supabase.from('sites').select('*').order('id', { ascending: true }));
    return rows.map(siteToClient);
  },
  async create(site) {
    const row = unwrap(await supabase.from('sites').insert(siteToDb(site)).select().single());
    const created = siteToClient(row);
    await writeLog('SITE_CREATED', `Added new project site: ${created.name} (${created.id})`);
    return created;
  },
  async delete(id) {
    unwrap(await supabase.from('sites').delete().eq('id', id));
    await writeLog('SITE_DELETED', `Removed project site #${id}`);
    return true;
  }
};

export const attendance = {
  async getByDate(date) {
    const rows = unwrap(await supabase.from('attendance_records').select('*').eq('shift_date', date));
    return attendanceRowsToMap(rows);
  },
  async save(date, recordsMap) {
    const rows = attendanceMapToRows(date, recordsMap);
    if (rows.length) {
      unwrap(await supabase.from('attendance_records').upsert(rows, { onConflict: 'shift_date,worker_id' }));
    }
    return recordsMap;
  }
};

export const adminUsers = {
  async getAll() {
    const rows = unwrap(await supabase.from('admin_users').select('*').order('id', { ascending: true }));
    return rows.map(adminUserToClient);
  },
  async create(user) {
    const row = unwrap(await supabase.from('admin_users').insert(adminUserToDb(user)).select().single());
    const created = adminUserToClient(row);
    await writeLog('USER_CREATED', `Created new backend administrator ${created.name} (${created.role})`);
    return created;
  },
  async update(id, user) {
    const row = unwrap(await supabase.from('admin_users').update(adminUserToDb(user)).eq('id', id).select().single());
    const updated = adminUserToClient(row);
    await writeLog('USER_MODIFIED', `Updated settings for backend user #${id} (${updated.name})`);
    return updated;
  },
  async delete(id) {
    unwrap(await supabase.from('admin_users').delete().eq('id', id));
    await writeLog('USER_DELETED', `Revoked credentials and deleted admin #${id}`);
    return true;
  }
};

export const auditLogs = {
  async getAll() {
    const rows = unwrap(await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50));
    return rows.map(auditLogToClient);
  },
  /** Same signature as the former server auditLogRepo.log(). */
  log(user, role, action, details) {
    const prev = currentActor;
    if (user) currentActor = { name: user, role: role || 'System' };
    const p = writeLog(action, details);
    currentActor = prev;
    return p;
  }
};

/** Lightweight connectivity probe to drive the status pill (replaces /api/supabase/status). */
export async function health() {
  try {
    const { error } = await supabase.from('workers').select('id').limit(1);
    if (error) return { connected: false, isReady: false, error: error.message };
    return { connected: true, isReady: true };
  } catch (e) {
    return { connected: false, isReady: false, error: e.message };
  }
}
