class AttendanceRepository {
  constructor(supabaseStorage, jsonFileStorage, availabilityChecker) {
    this.supabase = supabaseStorage;
    this.localStore = jsonFileStorage;
    this.checkAvailability = availabilityChecker;
  }

  async getByDate(date) {
    if (await this.checkAvailability() && date) {
      try {
        const data = await this.supabase.findByField('shift_date', date);
        const attendanceMap = {};
        data.forEach(row => {
          attendanceMap[row.worker_id] = {
            status: row.status,
            otHours: Number(row.ot_hours || 0),
            notes: row.notes || ''
          };
        });
        return attendanceMap;
      } catch (e) {
        console.warn('[AttendanceRepository] Supabase read failed:', e.message);
      }
    }
    const allAttendance = this.localStore.readAll({});
    return (date ? allAttendance[date] : allAttendance) || {};
  }

  async save(date, recordsMap) {
    const allAttendance = this.localStore.readAll({});
    allAttendance[date] = { ...(allAttendance[date] || {}), ...recordsMap };
    this.localStore.writeAll(allAttendance);

    if (await this.checkAvailability() && recordsMap) {
      try {
        const rows = Object.entries(recordsMap).map(([workerId, rec]) => ({
          shift_date: date,
          worker_id: workerId,
          status: rec.status || 'P',
          ot_hours: Number(rec.otHours || 0),
          notes: rec.notes || ''
        }));
        if (rows.length > 0) {
          await this.supabase.upsert(rows, 'shift_date,worker_id');
        }
      } catch (e) {
        console.error('[AttendanceRepository] Supabase save failed:', e.message);
      }
    }
    return allAttendance[date];
  }
}

module.exports = AttendanceRepository;
