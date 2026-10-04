const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[WARN] SUPABASE_URL or SUPABASE_ANON_KEY missing in .env file!');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Checks connection to Supabase and verifies whether the required tables exist.
 * @returns {Promise<{connected: boolean, tablesFound: string[], missingTables: string[], error: string|null}>}
 */
async function checkSupabaseStatus() {
  const tables = ['workers', 'sites', 'attendance_records', 'admin_users', 'audit_logs'];
  const tablesFound = [];
  const missingTables = [];
  let connectionError = null;

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
          missingTables.push(table);
        } else {
          missingTables.push(table);
          if (!connectionError) connectionError = error.message;
        }
      } else {
        tablesFound.push(table);
      }
    } catch (err) {
      missingTables.push(table);
      if (!connectionError) connectionError = err.message;
    }
  }

  return {
    connected: !connectionError,
    supabaseUrl,
    tablesFound,
    missingTables,
    isReady: missingTables.length === 0,
    error: connectionError
  };
}

module.exports = {
  supabase,
  checkSupabaseStatus,
  supabaseUrl,
  supabaseAnonKey
};
