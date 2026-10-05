// Customer-facing worker browse: list worker profiles, search + filter by category.
import { getSupabase } from './supabaseClient.js';
import { mountNavbar, mountFooter } from './components.js';
import { mountAuthModal } from './authModal.js';
import { serviceCategories, icon } from './data.js';
import { escapeHtml, initials } from './ui.js';

let allWorkers = [];
let activeCategory = 'all';
let searchText = '';

const grid = () => document.getElementById('worker-grid');
const statusEl = () => document.getElementById('browse-status');

function renderFilters() {
  const row = document.getElementById('filter-row');
  const pills = [{ slug: 'all', name: 'All' }, ...serviceCategories];
  row.innerHTML = pills
    .map((c) => `<button class="filter-pill${c.slug === activeCategory ? ' is-active' : ''}" type="button" data-slug="${c.slug}">${c.name}</button>`)
    .join('');
  row.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-slug]');
    if (!pill) return;
    activeCategory = pill.dataset.slug;
    row.querySelectorAll('.filter-pill').forEach((p) => p.classList.toggle('is-active', p === pill));
    render();
  });
}

function workerTile(w) {
  const photo = w.photo_url
    ? `<img class="worker-tile__photo" src="${escapeHtml(w.photo_url)}" alt="${escapeHtml(w.full_name || 'Worker')}" loading="lazy">`
    : `<div class="worker-tile__avatar">${escapeHtml(initials(w.full_name))}</div>`;
  const skills = Array.isArray(w.skills) ? w.skills.slice(0, 4) : [];
  return `
    <article class="worker-tile">
      <div class="worker-tile__head">
        ${photo}
        <div>
          <div class="worker-tile__name">${escapeHtml(w.full_name || 'Unnamed worker')}</div>
          ${w.trade ? `<div class="worker-tile__trade">${escapeHtml(w.trade)}</div>` : ''}
        </div>
      </div>
      ${w.location ? `<div class="worker-tile__meta">${icon('mapPin', 16)} ${escapeHtml(w.location)}</div>` : ''}
      ${w.bio ? `<p class="worker-tile__text">${escapeHtml(w.bio)}</p>` : ''}
      ${skills.length ? `<div class="worker-tile__skills">${skills.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
    </article>`;
}

function matchesCategory(w) {
  if (activeCategory === 'all') return true;
  const cat = serviceCategories.find((c) => c.slug === activeCategory);
  if (!cat) return true;
  return String(w.trade || '').toLowerCase().includes(cat.name.toLowerCase());
}

function matchesSearch(w) {
  if (!searchText) return true;
  const hay = [w.full_name, w.trade, w.location, w.bio, ...(w.skills || [])]
    .join(' ').toLowerCase();
  return hay.includes(searchText);
}

function render() {
  const list = allWorkers.filter((w) => matchesCategory(w) && matchesSearch(w));
  grid().innerHTML = list.map(workerTile).join('');
  statusEl().innerHTML = list.length
    ? ''
    : `<div class="empty-state">
         ${icon('needWorker', 40)}
         <p>No workers found yet. Try another category or check back soon.</p>
       </div>`;
}

async function load() {
  statusEl().innerHTML = `<div class="empty-state">Loading workers…</div>`;
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, trade, location, skills, bio, photo_url, daily_rate')
      .eq('role', 'worker')
      .order('created_at', { ascending: false });
    if (error) throw error;
    allWorkers = data || [];
    render();
  } catch (err) {
    grid().innerHTML = '';
    statusEl().innerHTML = `<div class="empty-state"><p>We couldn't load workers right now.<br><small>${escapeHtml(err.message || '')}</small></p></div>`;
  }
}

function init() {
  mountNavbar({ active: 'find-worker' });
  mountFooter();
  mountAuthModal();

  activeCategory = new URLSearchParams(location.search).get('category') || 'all';
  renderFilters();

  const search = document.getElementById('search');
  search.addEventListener('input', () => { searchText = search.value.trim().toLowerCase(); render(); });

  load();
}

document.addEventListener('DOMContentLoaded', init);
