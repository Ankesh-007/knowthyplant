const BaseRepository = require('./BaseRepository');

class WorkerRepository extends BaseRepository {
  toClientFormat(row) {
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

  toDbFormat(worker) {
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
}

module.exports = WorkerRepository;
