const BaseRepository = require('./BaseRepository');

class SiteRepository extends BaseRepository {
  toClientFormat(row) {
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

  toDbFormat(site) {
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
}

module.exports = SiteRepository;
