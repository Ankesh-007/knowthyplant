// Dashboard access gate. Boots the dashboard only once the visitor is signed in
// AND listed in admin_users with status 'Active'. Renders a minimal, on-theme
// login overlay otherwise. All data access is also enforced by is_admin() RLS —
// this gate is the UX layer on top of that.
import { supabase } from '../../shared/supabaseClient.js';
import { setActor } from './dataClient.js';

const OVERLAY_ID = 'admin-auth-gate';

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Returns the active admin_users row for the current session, or null. */
async function lookupAdmin(session) {
  if (!session) return null;
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, name, role, status')
    .ilike('email', session.user.email)
    .eq('status', 'Active')
    .maybeSingle();
  if (error) {
    console.warn('[adminGate] lookup failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Resolves with the admin record once access is granted. If the visitor is not
 * an active admin, shows the login overlay and only resolves after a successful
 * admin sign-in (so the dashboard never boots unauthorized).
 */
export function requireAdmin() {
  return new Promise((resolve) => {
    const grant = (admin) => {
      setActor({ name: admin.name, role: admin.role });
      removeOverlay();
      resolve(admin);
    };
    const tryGrant = async () => {
      const admin = await lookupAdmin(await getSession());
      if (admin) { grant(admin); return true; }
      return false;
    };
    tryGrant().then((ok) => { if (!ok) showOverlay(tryGrant); });
  });
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
  window.location.reload();
}

// --- Overlay UI -------------------------------------------------------------
function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
}

async function showOverlay(tryGrant) {
  removeOverlay();
  const session = await getSession();
  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  el.innerHTML = `
    <div style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
                background:rgba(10,12,16,0.82);backdrop-filter:blur(6px);padding:1rem;">
      <div style="width:100%;max-width:400px;background:var(--bg-card,#171a21);border:1px solid var(--border-medium,#2b3240);
                  border-radius:var(--radius-lg,16px);padding:1.75rem;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="font-weight:800;font-size:1.15rem;color:var(--text-primary,#f3f4f6);">BuildVantage — Secure Access</div>
        <p style="margin:.35rem 0 1.25rem;font-size:.84rem;color:var(--text-muted,#9aa4b2);">
          Administrator sign-in required for the workforce control plane.</p>
        <div id="gate-signedin" style="display:${session ? 'block' : 'none'};"></div>
        <form id="gate-form" style="display:${session ? 'none' : 'block'};">
          <label style="display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted,#9aa4b2);margin-bottom:.3rem;">Email</label>
          <input id="gate-email" type="email" required autocomplete="username"
                 style="width:100%;padding:.6rem .75rem;margin-bottom:.9rem;border-radius:var(--radius-sm,8px);
                        border:1px solid var(--border-medium,#2b3240);background:var(--bg-input,#0f1217);color:var(--text-primary,#f3f4f6);">
          <label style="display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted,#9aa4b2);margin-bottom:.3rem;">Password</label>
          <input id="gate-pass" type="password" required autocomplete="current-password"
                 style="width:100%;padding:.6rem .75rem;margin-bottom:1rem;border-radius:var(--radius-sm,8px);
                        border:1px solid var(--border-medium,#2b3240);background:var(--bg-input,#0f1217);color:var(--text-primary,#f3f4f6);">
          <button type="submit" id="gate-submit" class="btn btn-primary"
                  style="width:100%;justify-content:center;">Sign In</button>
        </form>
        <div id="gate-error" style="display:none;margin-top:.85rem;font-size:.82rem;color:var(--accent-rose,#f43f5e);"></div>
        <a href="/" style="display:inline-block;margin-top:1rem;font-size:.78rem;color:var(--text-muted,#9aa4b2);">← Back to LocalHands</a>
      </div>
    </div>`;
  document.body.appendChild(el);

  const errBox = el.querySelector('#gate-error');
  const showError = (msg) => { errBox.textContent = msg; errBox.style.display = 'block'; };

  // Already signed in but not an active admin.
  if (session) {
    el.querySelector('#gate-signedin').innerHTML = `
      <p style="font-size:.86rem;color:var(--text-secondary,#cbd5e1);">
        Signed in as <strong>${session.user.email}</strong>, but this account is not an active administrator.</p>
      <button type="button" id="gate-switch" class="btn btn-outline" style="width:100%;justify-content:center;margin-top:.75rem;">
        Sign out &amp; use another account</button>`;
    el.querySelector('#gate-switch').addEventListener('click', signOutAdmin);
    return;
  }

  el.querySelector('#gate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = el.querySelector('#gate-submit');
    errBox.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Signing in…';
    const email = el.querySelector('#gate-email').value.trim();
    const password = el.querySelector('#gate-pass').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showError(error.message || 'Sign-in failed.');
      btn.disabled = false; btn.textContent = 'Sign In';
      return;
    }
    const ok = await tryGrant();
    if (!ok) {
      // Authenticated but not an admin — re-render in the signed-in/not-authorized state.
      showOverlay(tryGrant);
    }
  });
}
