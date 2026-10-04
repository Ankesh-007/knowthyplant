const { sendJson } = require('../httpUtils');

function registerStatusRoutes(router, checkSupabaseStatus) {
  const handler = async (req, res) => {
    const status = await checkSupabaseStatus();
    sendJson(res, 200, {
      success: true,
      ...status,
      migrationFile: '/supabase/schema.sql',
      timestamp: new Date().toISOString()
    });
  };

  router.get('/api/supabase/status', handler);
  router.get('/api/status', handler);
}

module.exports = registerStatusRoutes;
