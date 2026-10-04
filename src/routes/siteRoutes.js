const { sendJson, parseRequestBody, getClientIp } = require('../httpUtils');

function registerSiteRoutes(router, siteRepo, auditLogRepo) {
  router.get('/api/sites', async (req, res) => {
    const sites = await siteRepo.getAll();
    sendJson(res, 200, { success: true, data: sites });
  });

  router.post('/api/sites', async (req, res) => {
    const payload = await parseRequestBody(req);
    if (!payload.name || !payload.client) {
      return sendJson(res, 400, { success: false, error: 'Site name and client are required.' });
    }
    if (!payload.id) {
      const sites = await siteRepo.getAll();
      const maxNum = sites.reduce((acc, s) => {
        const m = (s.id || '').match(/\d+/);
        return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
      }, 0);
      payload.id = `SITE-${String(maxNum + 1).padStart(2, '0')}`;
    }
    const newSite = await siteRepo.create(payload);
    const ip = getClientIp(req);
    await auditLogRepo.log('Super Admin', 'Executive Operations', 'SITE_CREATED',
      `Added new project site: ${newSite.name} (${newSite.id})`, ip);
    sendJson(res, 201, { success: true, message: 'Site created successfully', data: newSite });
  });

  const updateSite = async (req, res, params) => {
    const payload = await parseRequestBody(req);
    const updated = await siteRepo.update(params.id, payload);
    if (!updated) {
      return sendJson(res, 404, { success: false, error: 'Site not found' });
    }
    sendJson(res, 200, { success: true, message: 'Site updated successfully', data: updated });
  };

  router.put('/api/sites/:id', updateSite);
  router.patch('/api/sites/:id', updateSite);

  router.delete('/api/sites/:id', async (req, res, params) => {
    await siteRepo.delete(params.id);
    sendJson(res, 200, { success: true, message: `Site #${params.id} removed.` });
  });
}

module.exports = registerSiteRoutes;
