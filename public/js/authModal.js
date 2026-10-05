// Role-selection + login/signup modal. Reused across every page.
import { icon } from './data.js';
import { toast } from './ui.js';
import { signUp, signIn, getProfile, roleHome } from './auth.js';

let root = null;
let state = { role: null, mode: 'signup' }; // mode: 'signup' | 'login'

const ROLE_LABELS = {
  worker: { title: 'I Need Work', hint: 'Find jobs that match your skills.', icon: 'findWork' },
  customer: { title: 'I Need a Worker', hint: 'Hire trusted local help.', icon: 'needWorker' }
};

function template() {
  return `
    <div class="auth-modal__overlay" data-close></div>
    <div class="auth-modal__box" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="auth-modal__close" type="button" data-close aria-label="Close">${icon('close', 20)}</button>

      <section data-step="role">
        <h2 class="auth-modal__title" id="auth-title">What are you here to do?</h2>
        <p class="auth-modal__lead">Choose how you want to use ${'LocalHands'}.</p>
        <div class="role-grid">
          <button class="role-card" type="button" data-role="customer">
            <span class="role-card__icon">${icon('needWorker', 28)}</span>
            <span class="role-card__title">I Need a Worker</span>
            <span class="role-card__hint">Hire trusted local help for everyday jobs.</span>
          </button>
          <button class="role-card" type="button" data-role="worker">
            <span class="role-card__icon">${icon('findWork', 28)}</span>
            <span class="role-card__title">I Need Work</span>
            <span class="role-card__hint">Create a profile and find work nearby.</span>
          </button>
        </div>
      </section>

      <section data-step="form" hidden>
        <button class="auth-modal__back" type="button" data-back>&larr; Change choice</button>
        <h2 class="auth-modal__title" data-form-title>Create your account</h2>
        <p class="auth-modal__lead" data-form-role></p>
        <form class="auth-form" data-auth-form novalidate>
          <label class="field" data-name-field>
            <span class="field__label">Full name</span>
            <input class="field__input" name="fullName" type="text" autocomplete="name" placeholder="Your name">
          </label>
          <label class="field">
            <span class="field__label">Email</span>
            <input class="field__input" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
          </label>
          <label class="field">
            <span class="field__label">Password</span>
            <input class="field__input" name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="At least 6 characters">
          </label>
          <button class="cta cta--primary cta--block" type="submit" data-submit>Create account</button>
        </form>
        <p class="auth-switch">
          <span data-switch-text>Already have an account?</span>
          <button type="button" class="auth-switch__btn" data-toggle-mode>Log in</button>
        </p>
      </section>
    </div>`;
}

function render() {
  const roleStep = root.querySelector('[data-step="role"]');
  const formStep = root.querySelector('[data-step="form"]');
  const isForm = !!state.role;
  roleStep.hidden = isForm;
  formStep.hidden = !isForm;
  if (!isForm) return;

  const isSignup = state.mode === 'signup';
  const label = ROLE_LABELS[state.role];
  root.querySelector('[data-form-title]').textContent = isSignup ? 'Create your account' : 'Welcome back';
  root.querySelector('[data-form-role]').textContent = `${label.title} · ${label.hint}`;
  root.querySelector('[data-name-field]').hidden = !isSignup;
  root.querySelector('[data-submit]').textContent = isSignup ? 'Create account' : 'Log in';
  root.querySelector('[data-switch-text]').textContent = isSignup ? 'Already have an account?' : 'New here?';
  root.querySelector('[data-toggle-mode]').textContent = isSignup ? 'Log in' : 'Create one';
  const pwd = root.querySelector('input[name="password"]');
  pwd.setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = form.querySelector('[data-submit]');
  const fd = new FormData(form);
  const email = String(fd.get('email') || '').trim();
  const password = String(fd.get('password') || '');
  const fullName = String(fd.get('fullName') || '').trim();

  if (!email || password.length < 6) {
    toast('Enter a valid email and a password of at least 6 characters.', 'error');
    return;
  }

  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Please wait…';
  try {
    if (state.mode === 'signup') {
      const { data, error } = await signUp({ email, password, role: state.role, fullName });
      if (error) throw error;
      if (data.session) {
        toast('Account created!', 'success');
        window.location.href = roleHome(state.role);
      } else {
        toast('Check your email to confirm your account, then log in.', 'info');
        state.mode = 'login';
        render();
      }
    } else {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      const profile = await getProfile();
      toast('Logged in!', 'success');
      window.location.href = roleHome(profile?.role || state.role);
    }
  } catch (err) {
    toast(err.message || 'Something went wrong. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = original;
  }
}

/** Create the modal in the DOM once. Safe to call repeatedly. */
export function mountAuthModal() {
  if (root) return;
  root = document.createElement('div');
  root.className = 'auth-modal';
  root.hidden = true;
  root.innerHTML = template();
  document.body.appendChild(root);

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeAuthModal();
    const roleBtn = e.target.closest('[data-role]');
    if (roleBtn) { state.role = roleBtn.dataset.role; render(); focusFirst(); }
    if (e.target.closest('[data-back]')) { state.role = null; render(); }
    if (e.target.closest('[data-toggle-mode]')) { state.mode = state.mode === 'signup' ? 'login' : 'signup'; render(); }
  });
  root.querySelector('[data-auth-form]').addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) closeAuthModal(); });
}

function focusFirst() {
  const input = root.querySelector('[data-step="form"]:not([hidden]) input');
  if (input) setTimeout(() => input.focus(), 40);
}

/** Open the modal. opts: { role?, mode? }  */
export function openAuthModal(opts = {}) {
  mountAuthModal();
  state.role = opts.role || null;
  state.mode = opts.mode || 'signup';
  render();
  root.hidden = false;
  document.body.classList.add('is-modal-open');
  if (state.role) focusFirst();
}

export function closeAuthModal() {
  if (!root) return;
  root.hidden = true;
  document.body.classList.remove('is-modal-open');
}
