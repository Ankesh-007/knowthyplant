class AuditLogRepository {
  constructor(supabaseStorage, jsonFileStorage, availabilityChecker) {
    this.supabase = supabaseStorage;
    this.localStore = jsonFileStorage;
    this.checkAvailability = availabilityChecker;
  }

  async getAll() {
    if (await this.checkAvailability()) {
      try {
        const data = await this.supabase.findAll({
          orderBy: 'created_at',
          ascending: false,
          limit: 50
        });
        return data.map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          user: row.user_name || row.user,
          role: row.role,
          action: row.action,
          details: row.details,
          ip: row.ip
        }));
      } catch (e) {
        console.warn('[AuditLogRepository] Supabase read failed:', e.message);
      }
    }
    return this.localStore.readAll([]);
  }

  async log(user, role, action, details, ip = '127.0.0.1') {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: user || 'Super Admin',
      role: role || 'System Operator',
      action,
      details,
      ip: ip || '127.0.0.1'
    };

    const logs = this.localStore.readAll([]);
    logs.unshift(newLog);
    this.localStore.writeAll(logs.slice(0, 50));

    if (await this.checkAvailability()) {
      try {
        await this.supabase.insert({
          id: newLog.id,
          timestamp: newLog.timestamp,
          user_name: newLog.user,
          role: newLog.role,
          action: newLog.action,
          details: newLog.details,
          ip: newLog.ip
        });
      } catch (e) {
        console.error('[AuditLogRepository] Supabase log failed:', e.message);
      }
    }
    return newLog;
  }
}

module.exports = AuditLogRepository;
