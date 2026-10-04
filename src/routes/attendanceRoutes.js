const { sendJson, parseRequestBody } = require('../httpUtils');

function registerAttendanceRoutes(router, attendanceRepo) {
  router.get('/api/attendance', async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const attendance = await attendanceRepo.getByDate(date);
    sendJson(res, 200, { success: true, date, data: attendance });
  });

  router.post('/api/attendance', async (req, res) => {
    const payload = await parseRequestBody(req);
    const date = payload.date || new Date().toISOString().split('T')[0];
    const records = payload.attendance || payload.records || {};
    const saved = await attendanceRepo.save(date, records);
    sendJson(res, 200, { success: true, message: 'Attendance records saved', date, data: saved });
  });
}

module.exports = registerAttendanceRoutes;
