// Shared navbar + footer. Rendered once per page (DRY).
import { icon, BRAND, footerColumns } from './data.js';
import { escapeHtml } from './ui.js';
import { openAuthModal } from './authModal.js';
import { getSession, getProfile, signOut, roleHome } from './auth.js';

const NAV_LINKS = [
  { key: 'find-worker', label: 'Find a Worker', href: '/find-workers' },
  { key: 'find-work', label: 'Find Work', href: '#', action: 'findwork' },
  { key: 'how', label: 'How It Works', href: '/#how-it-works' },
  { key: 'trust', label: 'Trust & Safety', href: '/#trust' }
];

function navLinksHtml(active) {
  return NAV_LINKS.map((l) => {
    const attrs = l.action ? ` data-action="${l.action}"` : '';
    const cur = l.key === active ? ' aria-current="page"' : '';
    return `<li><a class="site-nav__link" href="${l.href}"${attrs}${cur}>${l.label}</a></li>`;
  }).join('');
}

const loggedOutActions = `
  <button class="cta cta--ghost" type="button" data-action="login">Login</button>
  <button class="cta cta--primary" type="button" data-action="getstarted">Get Started</button>`;

function loggedInActions(name, home) {
  return `
  <a class="site-nav__user" href="${home}">${escapeHtml(name)}</a>
  <button class="cta cta--ghost" type="button" data-action="signout">${icon('logout', 18)}<span>Sign out</span></button>`;
}

/** Render the top navigation. Checks the session in the background. */
export function mountNavbar({ active = '' } = {}) {
  const host = document.getElementById('site-nav');
  if (!host) return;

  host.innerHTML = `
    <nav class="site-nav" aria-label="Primary">
      <div class="site-nav__inner container">
        <a class="site-nav__logo" href="/">
          <span class="site-nav__logo-mark">${icon('construction', 20)}</span>${BRAND}
        </a>
        <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav-menu" aria-label="Open menu">
          ${icon('menu', 24)}
        </button>
        <div class="site-nav__menu" id="site-nav-menu">
          <ul class="site-nav__links">${navLinksHtml(active)}</ul>
          <div class="site-nav__actions" data-nav-actions>${loggedOutActions}</div>
        </div>
      </div>
    </nav>`;

  const nav = host.querySelector('.site-nav');
  const toggle = host.querySelector('.site-nav__toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // close the mobile menu after tapping a link
  host.querySelectorAll('.site-nav__link').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  wireActions(host);
  refreshSession(host);
}

/** Attach the shared [data-action] click handler to any container. */
export function wireActions(host) {
  if (host) host.addEventListener('click', onActionClick);
}

async function refreshSession(host) {
  try {
    const session = await getSession();
    if (!session) return;
    const profile = await getProfile();
    const name = profile?.full_name || session.user?.email || 'My account';
    const actions = host.querySelector('[data-nav-actions]');
    actions.innerHTML = loggedInActions(name, roleHome(profile?.role || 'customer'));
  } catch {
    /* Supabase not configured / offline — keep the logged-out nav. */
  }
}

async function onActionClick(e) {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;
  if (action === 'findwork') { e.preventDefault(); openAuthModal({ role: 'worker' }); }
  else if (action === 'login') { e.preventDefault(); openAuthModal({ mode: 'login' }); }
  else if (action === 'getstarted') { e.preventDefault(); openAuthModal({ mode: 'signup' }); }
  else if (action === 'signout') {
    e.preventDefault();
    try { await signOut(); } catch { /* ignore */ }
    window.location.href = '/';
  }
}

/** Render the footer. */
export function mountFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;

  const cols = footerColumns.map((col) => `
    <div class="site-footer__col">
      <h3 class="site-footer__title">${col.title}</h3>
      <ul>${col.links.map((l) => {
        const attrs = l.action ? ` data-action="${l.action}"` : '';
        return `<li><a class="site-footer__link" href="${l.href}"${attrs}>${l.label}</a></li>`;
      }).join('')}</ul>
    </div>`).join('');

  host.innerHTML = `
    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div class="site-footer__brand">
          <a class="site-nav__logo" href="/"><span class="site-nav__logo-mark">${icon('construction', 20)}</span>${BRAND}</a>
          <p>Trusted local people for the work you need.</p>
        </div>
        ${cols}
      </div>
      <div class="container site-footer__bottom">
        <span>&copy; ${new Date().getFullYear()} ${BRAND}. A trusted local workforce marketplace.</span>
      </div>
    </footer>`;

  wireActions(host);
}
