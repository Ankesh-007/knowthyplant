// Tiny shared UI helpers. No dependencies, no framework.

/** Escape untrusted text before putting it in innerHTML. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Show a transient toast. Creates its own stack on first use. */
export function toast(message, type = 'info') {
  let stack = document.querySelector('.lh-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'lh-toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `lh-toast lh-toast--${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 3600);
}

/** Initials fallback for a missing photo, e.g. "Asha Rai" -> "AR". */
export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';
}
