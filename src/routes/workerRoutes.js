const { sendJson, parseRequestBody, getClientIp } = require('../httpUtils');

function registerWorkerRoutes(router, workerRepo, auditLogRepo) {
  router.get('/api/workers', async (req, res) => {
    const workers = await workerRepo.getAll();
    sendJson(res, 200, { success: true, data: workers });
  });

  router.post('/api/workers', async (req, res) => {
    const payload = await parseRequestBody(req);
    if (!payload.name || !payload.trade) {
      return sendJson(res, 400, { success: false, error: 'Name and trade are required.' });
    }

    if (!payload.id) {
      const workers = await workerRepo.getAll();
      const maxNum = workers.reduce((acc, w) => {
        const m = (w.id || '').match(/\d+/);
        return m ? Math.max(acc, parseInt(m[0], 10)) : acc;
      }, 800);
      payload.id = `LAB-${maxNum + 1}`;
    }

    const newWorker = await workerRepo.create(payload);
    const ip = getClientIp(req);
    await auditLogRepo.log('Admin Dispatcher', 'Field Allocations', 'WORKER_REGISTERED',
      `Enrolled worker ${newWorker.name} (${newWorker.id}) - Trade: ${newWorker.trade}`, ip);
    sendJson(res, 201, { success: true, message: 'Worker registered successfully', data: newWorker });
  });

  const updateWorker = async (req, res, params) => {
    const payload = await parseRequestBody(req);
    const updated = await workerRepo.update(params.id, payload);
    if (!updated) {
      return sendJson(res, 404, { success: false, error: 'Worker not found' });
    }
    const ip = getClientIp(req);
    await auditLogRepo.log('Admin Dispatcher', 'Field Allocations', 'WORKER_UPDATED',
      `Updated record for worker ${updated.name} (${params.id})`, ip);
    sendJson(res, 200, { success: true, message: 'Worker updated successfully', data: updated });
  };

  router.put('/api/workers/:id', updateWorker);
  router.patch('/api/workers/:id', updateWorker);

  router.delete('/api/workers/:id', async (req, res, params) => {
    await workerRepo.delete(params.id);
    const ip = getClientIp(req);
    await auditLogRepo.log('Admin Dispatcher', 'Field Allocations', 'WORKER_DELETED',
      `Removed worker profile #${params.id}`, ip);
    sendJson(res, 200, { success: true, message: `Worker #${params.id} removed.` });
  });
}

module.exports = registerWorkerRoutes;
