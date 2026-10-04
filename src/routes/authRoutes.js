const { sendJson, parseRequestBody, getClientIp } = require('../httpUtils');

function registerAuthRoutes(router, adminUserRepo, auditLogRepo) {
  router.post('/api/auth/login', async (req, res) => {
    const payload = await parseRequestBody(req);
    const { email } = payload;

    if (!email) {
      return sendJson(res, 400, { success: false, error: 'Email is required' });
    }

    const users = await adminUserRepo.getAll();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return sendJson(res, 401, { success: false, error: 'Invalid credentials or user does not exist.' });
    }

    if (foundUser.status === 'Suspended') {
      return sendJson(res, 403, { success: false, error: 'This administrator account is suspended. Contact your super admin.' });
    }

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
    await adminUserRepo.update(foundUser.id, { lastLogin: nowFormatted });

    const ip = getClientIp(req);
    await auditLogRepo.log(foundUser.name, foundUser.role, 'ADMIN_LOGIN',
      `Admin session started for ${foundUser.email}`, ip);

    sendJson(res, 200, {
      success: true,
      message: 'Authentication successful',
      user: { ...foundUser, lastLogin: nowFormatted },
      token: `session_${Buffer.from(foundUser.email + ':' + Date.now()).toString('base64')}`
    });
  });
}

module.exports = registerAuthRoutes;
