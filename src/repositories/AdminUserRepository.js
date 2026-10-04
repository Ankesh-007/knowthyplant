const BaseRepository = require('./BaseRepository');

class AdminUserRepository extends BaseRepository {
  toClientFormat(row) {
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

  toDbFormat(user) {
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
}

module.exports = AdminUserRepository;
