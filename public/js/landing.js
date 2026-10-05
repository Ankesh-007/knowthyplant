// Landing page: mounts shared chrome, renders data-driven sections, wires CTAs.
import {
  serviceCategories, howItWorksCustomer, howItWorksWorker, trustPrinciples, icon
} from './data.js';
import { mountNavbar, mountFooter, wireActions } from './components.js';
import { mountAuthModal, openAuthModal } from './authModal.js';

function renderHeroVisual() {
  const host = document.getElementById('hero-visual');
  const picks = ['plumbing', 'electrical', 'cook', 'driver'];
  host.innerHTML = picks
    .map((slug) => serviceCategories.find((s) => s.slug === slug))
    .filter(Boolean)
    .map((s) => `<div class="hero__tile">${icon(s.icon, 26)}<span>${s.name}</span></div>`)
    .join('');
}

function renderServices() {
  const grid = document.getElementById('service-grid');
  grid.innerHTML = serviceCategories
    .map((s) => `
      <a class="service-card" href="/find-workers?category=${s.slug}">
        <span class="service-card__icon">${icon(s.icon, 26)}</span>
        <span class="service-card__name">${s.name}</span>
      </a>`)
    .join('');
}

function renderTrack(hostId, title, badge, steps) {
  const host = document.getElementById(hostId);
  host.innerHTML = `
    <h3 class="track__title">${title} <span class="badge">${badge}</span></h3>
    <div class="steps">
      ${steps.map((st, i) => `
        <div class="step">
          <div class="step__num">${i + 1}</div>
          <div>
            <div class="step__icon">${icon(st.icon, 22)}</div>
            <div class="step__title">${st.title}</div>
            <div class="step__text">${st.text}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderTrust() {
  const grid = document.getElementById('trust-grid');
  grid.innerHTML = trustPrinciples
    .map((t) => `
      <div class="trust-card">
        <div class="trust-card__icon">${icon(t.icon, 24)}</div>
        <div class="trust-card__title">${t.title}</div>
        <div class="trust-card__text">${t.text}</div>
      </div>`)
    .join('');
}

function init() {
  mountNavbar({ active: '' });
  mountFooter();
  mountAuthModal();

  renderHeroVisual();
  renderServices();
  renderTrack('how-customer', 'For customers', 'Hire', howItWorksCustomer);
  renderTrack('how-worker', 'For workers', 'Work', howItWorksWorker);
  renderTrust();

  wireActions(document.querySelector('main'));

  // Deep link: /?auth=login or /?auth=signup opens the modal (used by guards).
  const auth = new URLSearchParams(location.search).get('auth');
  if (auth) openAuthModal({ mode: auth === 'login' ? 'login' : 'signup' });
}

document.addEventListener('DOMContentLoaded', init);
