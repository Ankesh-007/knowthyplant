const { sendJson, parseRequestBody, getClientIp } = require('../httpUtils');

function registerAdminRoutes(router, adminUserRepo, workerRepo, siteRepo, auditLogRepo) {
  router.get('/api/admin/users', async (req, res) => {
    const users = await adminUserRepo.getAll();
    sendJson(res, 200, { success: true, data: users });
  });

  router.post('/api/admin/users', async (req, res) => {
    const payload = await parseRequestBody(req);
    if (!payload.name || !payload.email || !payload.role) {
      return sendJson(res, 400, { success: false, error: 'Name, email, and role are required.' });
    }

    const users = await adminUserRepo.getAll();
    if (users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
      return sendJson(res, 409, { success: false, error: 'A backend user with this email already exists.' });
    }

    const maxNum = users.reduce((acc, u) => {
      const m = (u.id || '').match(/\d+/);
      return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
    }, 0);

    const newUser = await adminUserRepo.create({
      id: `ADM-${String(maxNum + 1).padStart(3, '0')}`,
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

    const ip = getClientIp(req);
    await auditLogRepo.log('Super Admin', 'Executive Operations', 'USER_CREATED',
      `Created new backend administrator ${newUser.name} (${newUser.role})`, ip);
    sendJson(res, 201, { success: true, message: 'Backend user created successfully', data: newUser });
  });

  const updateAdminUser = async (req, res, params) => {
    const payload = await parseRequestBody(req);
    const updated = await adminUserRepo.update(params.id, payload);
    if (!updated) {
      return sendJson(res, 404, { success: false, error: 'Backend user not found' });
    }
    const ip = getClientIp(req);
    await auditLogRepo.log('Super Admin', 'Executive Operations', 'USER_MODIFIED',
      `Updated settings for backend user #${params.id} (${updated.name})`, ip);
    sendJson(res, 200, { success: true, message: 'User updated successfully', data: updated });
  };

  router.put('/api/admin/users/:id', updateAdminUser);
  router.patch('/api/admin/users/:id', updateAdminUser);

  router.delete('/api/admin/users/:id', async (req, res, params) => {
    await adminUserRepo.delete(params.id);
    const ip = getClientIp(req);
    await auditLogRepo.log('Super Admin', 'Executive Operations', 'USER_DELETED',
      `Revoked credentials and deleted admin #${params.id}`, ip);
    sendJson(res, 200, { success: true, message: `User #${params.id} deleted.` });
  });

  router.get('/api/admin/audit-logs', async (req, res) => {
    const logs = await auditLogRepo.getAll();
    sendJson(res, 200, { success: true, data: logs });
  });

  router.get('/api/admin/stats', async (req, res) => {
    const [users, workers, sites] = await Promise.all([
      adminUserRepo.getAll(),
      workerRepo.getAll(),
      siteRepo.getAll()
    ]);
    const activeCount = users.filter(u => u.status === 'Active').length;
    const rolesSet = new Set(users.map(u => u.role));
    const twoFaCount = users.filter(u => u.twoFactor).length;

    sendJson(res, 200, {
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
  });
}

module.exports = registerAdminRoutes;
