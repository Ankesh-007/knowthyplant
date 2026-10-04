/**
 * BUILDVANTAGE - Backend Administrator Portal Logic
 * Controls backend users, roles matrix, audit trails, and REST API communications
 */

(function () {
  'use strict';

  // State store
  const state = {
    users: [],
    auditLogs: [],
    searchQuery: '',
    filterRole: 'ALL',
    filterStatus: 'ALL',
    viewMode: 'grid', // 'grid' | 'table'
    activeTab: 'panel-admin-users'
  };

  // Safe Avatar Generator
  function getUserAvatar(user) {
    if (user.avatar && user.avatar.startsWith('http')) {
      return user.avatar;
    }
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
    const charCode = user.name.charCodeAt(0) + (user.name.charCodeAt(1) || 0);
    const color = colors[charCode % colors.length];
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${encodeURIComponent(color)}"/><text x="50%" y="54%" font-family="system-ui, sans-serif" font-weight="bold" font-size="38" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`;
  }

  // Toast Notifications
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Supabase Diagnostics & Health Check
  // =========================================================================
  let supabaseStatus = {
    connected: false,
    isReady: false,
    tablesFound: [],
    missingTables: []
  };

  async function checkSupabaseHealth() {
    const pill = document.getElementById('db-status-pill');
    const text = document.getElementById('db-status-text');

    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        supabaseStatus = data;

        if (pill && text) {
          pill.className = 'status-pill-live';
          if (data.isReady) {
            pill.classList.add('status-live');
            pill.setAttribute('title', 'Supabase Cloud Database connected and operational.');
            text.textContent = 'SUPABASE CLOUD LIVE';
          } else if (data.connected) {
            pill.classList.add('status-pending');
            pill.setAttribute('title', 'Supabase connected! Tables setup required in SQL Editor.');
            text.textContent = 'SUPABASE: SCHEMA PENDING';
          } else {
            pill.classList.add('status-offline');
            pill.setAttribute('title', 'Local flat-file cache active.');
            text.textContent = 'LOCAL REGISTRY ACTIVE';
          }
        }
        return data;
      }
    } catch (e) {
      if (pill && text) {
        pill.className = 'status-pill-live status-offline';
        text.textContent = 'LOCAL STORAGE ONLY';
      }
    }
  }

  function renderSupabaseModal() {
    const container = document.getElementById('supabase-modal-content');
    if (!container) return;

    const isReady = supabaseStatus.isReady;
    const isConn = supabaseStatus.connected;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding: 1rem; border-radius: var(--radius-md); background: ${isReady ? 'rgba(16, 185, 129, 0.12)' : isConn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isReady ? 'rgba(16, 185, 129, 0.3)' : isConn ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
        <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isReady ? '#10b981' : isConn ? '#f59e0b' : '#ef4444'}; color: #fff; font-size: 1.2rem; flex-shrink: 0;">
          ${isReady ? '✓' : isConn ? '⚡' : '!'}
        </div>
        <div>
          <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">
            ${isReady ? 'Supabase PostgreSQL Database Connected & Active' : isConn ? 'Supabase Connected - Table Migration Pending' : 'Supabase Disconnected'}
          </h4>
          <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${supabaseStatus.supabaseUrl || 'https://thtqzhpvjlxiwsjsmfoc.supabase.co'}
          </p>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h5 style="margin: 0 0 0.5rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Database Tables Status</h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.82rem;">
          ${['workers', 'sites', 'attendance_records', 'admin_users', 'audit_logs'].map(tbl => {
            const found = (supabaseStatus.tablesFound || []).includes(tbl);
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); background: var(--bg-input); border: 1px solid var(--border-subtle);">
                <span style="font-family: var(--font-mono);">${tbl}</span>
                <span style="font-size: 0.75rem; font-weight: 600; color: ${found ? '#10b981' : '#f59e0b'};">
                  ${found ? '● Live' : '○ Not Created'}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${!isReady ? `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 1rem; font-size: 0.82rem; line-height: 1.5;">
          <strong style="color: var(--accent-gold); display: block; margin-bottom: 0.4rem;">
            📌 How to initialize your Supabase tables (One-time setup):
          </strong>
          <ol style="margin: 0; padding-left: 1.2rem; color: var(--text-secondary);">
            <li>Open the Supabase Dashboard: <a href="https://supabase.com/dashboard/project/thtqzhpvjlxiwsjsmfoc/sql" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: underline;">Supabase SQL Editor</a></li>
            <li>Click <strong>New query</strong></li>
            <li>Copy & paste the contents of <code style="font-family: var(--font-mono); background: var(--bg-card-solid); padding: 2px 5px; border-radius: 3px;">supabase/schema.sql</code></li>
            <li>Click <strong>Run</strong></li>
          </ol>
          <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-copy-schema-sql">
              Copy SQL Schema
            </button>
            <span style="font-size: 0.78rem; color: var(--text-muted);">(BuildVantage is currently caching all records seamlessly on the server)</span>
          </div>
        </div>
      ` : `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.82rem; color: #34d399;">
          ✓ All admin users and audit logs are persisting directly to PostgreSQL with Row Level Security enabled.
        </div>
      `}
    `;

    const copyBtn = document.getElementById('btn-copy-schema-sql');
    if (copyBtn) {
      copyBtn.onclick = () => {
        fetch('/supabase/schema.sql')
          .then(r => r.text())
          .then(sql => {
            navigator.clipboard.writeText(sql);
            showToast('SQL Schema copied to clipboard!', 'success');
          })
          .catch(() => showToast('SQL schema is located in supabase/schema.sql', 'info'));
      };
    }
  }

  // =========================================================================
  // API Calls
  // =========================================================================
  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        state.users = json.data || [];
      }
    } catch (err) {
      console.warn('API fetch failed, loading fallback admin users', err);
    }
    renderAdminKPIs();
    renderAdminUsers();
  }

  async function fetchAuditLogs() {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const json = await res.json();
        state.auditLogs = json.data || [];
        renderAuditLogs();
      }
    } catch (err) {
      console.warn('Audit logs fetch failed', err);
    }
  }

  // =========================================================================
  // Render KPI Metrics
  // =========================================================================
  function renderAdminKPIs() {
    const total = state.users.length;
    const active = state.users.filter(u => u.status === 'Active').length;
    const twoFaCount = state.users.filter(u => u.twoFactor).length;
    const rolesSet = new Set(state.users.map(u => u.role));

    const totalEl = document.getElementById('admin-val-total');
    const activePctEl = document.getElementById('admin-val-active-pct');
    const activeEl = document.getElementById('admin-val-active');
    const twoFaEl = document.getElementById('admin-val-2fa');
    const rolesEl = document.getElementById('admin-val-roles');
    const badgeCount = document.getElementById('badge-admin-count');

    if (totalEl) totalEl.textContent = total;
    if (activePctEl) activePctEl.textContent = total > 0 ? `${Math.round((active / total) * 100)}% active` : '0%';
    if (activeEl) activeEl.textContent = active;
    if (twoFaEl) twoFaEl.textContent = total > 0 ? `${Math.round((twoFaCount / total) * 100)}%` : '0%';
    if (rolesEl) rolesEl.textContent = rolesSet.size;
    if (badgeCount) badgeCount.textContent = total;
  }

  // Filter Users
  function getFilteredUsers() {
    const query = state.searchQuery.trim().toLowerCase();
    return state.users.filter(u => {
      if (query) {
        const matchName = u.name.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        const matchRole = u.role.toLowerCase().includes(query);
        const matchDept = (u.department || '').toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchRole && !matchDept) return false;
      }
      if (state.filterRole !== 'ALL' && u.role !== state.filterRole) return false;
      if (state.filterStatus !== 'ALL' && u.status !== state.filterStatus) return false;
      return true;
    });
  }

  // Get Role Color Classes
  function getRoleStyle(role) {
    if (role === 'Super Admin') return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
    if (role === 'Dispatch Coordinator') return { bg: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: 'rgba(6, 182, 212, 0.35)' };
    if (role === 'Compliance & Safety Officer') return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' };
    if (role === 'Payroll & Accounts Lead') return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
    return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' };
  }

  // =========================================================================
  // Render: Admin Users (Grid and Table)
  // =========================================================================
  function renderAdminUsers() {
    const users = getFilteredUsers();
    const cardsContainer = document.getElementById('admin-users-cards');
    const tableContainer = document.getElementById('admin-users-table-container');
    const tableBody = document.getElementById('admin-users-table-body');

    if (state.viewMode === 'grid') {
      if (cardsContainer) cardsContainer.style.display = 'grid';
      if (tableContainer) tableContainer.style.display = 'none';
      renderCardsView(users, cardsContainer);
    } else {
      if (cardsContainer) cardsContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      renderTableView(users, tableBody);
    }
  }

  function renderCardsView(users, container) {
    if (!container) return;
    if (users.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-medium);">
          <p style="color: var(--text-muted); font-size: 0.9rem;">No backend administrator accounts match your criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = users.map(u => {
      const avatarSrc = getUserAvatar(u);
      const roleStyle = getRoleStyle(u.role);
      const isSuper = u.role === 'Super Admin';

      return `
        <article class="worker-card" data-admin-id="${u.id}">
          <div class="worker-card-header">
            <div class="worker-avatar-box" style="border-color: ${roleStyle.border};">
              <img src="${avatarSrc}" alt="${escapeHtml(u.name)}" loading="lazy">
              ${u.status === 'Active' ? '<span class="worker-badge-online"></span>' : ''}
            </div>
            <div class="worker-main-info">
              <div class="worker-name-row">
                <span class="worker-name">${escapeHtml(u.name)}</span>
                <span class="worker-reg-id">#${u.id}</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(u.email)}</div>
              <div style="margin-top: 4px;">
                <span style="display: inline-block; background: ${roleStyle.bg}; color: ${roleStyle.color}; border: 1px solid ${roleStyle.border}; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full);">
                  ${escapeHtml(u.role)}
                </span>
              </div>
            </div>
          </div>

          <div class="worker-card-body">
            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span>Department:</span>
              <strong style="color: var(--text-primary);">${escapeHtml(u.department || 'Operations')}</strong>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span>Security 2FA:</span>
              <span style="color: ${u.twoFactor ? 'var(--accent-emerald)' : 'var(--text-muted)'}; font-weight: 600;">
                ${u.twoFactor ? '✓ 2FA Enforced' : '○ Optional'}
              </span>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
              <span>Last Login:</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem;">${escapeHtml(u.lastLogin || 'Never')}</span>
            </div>

            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">Assigned Permissions</div>
              <div class="skills-tags-wrap">
                ${(u.permissions || []).map(p => `<span class="skill-tag" style="font-size: 0.68rem;">${p.replace(/_/g, ' ')}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="worker-card-footer">
            <span class="badge-status ${u.status === 'Active' ? 'status-available' : 'status-leave'}" style="font-size: 0.68rem;">
              ${u.status}
            </span>
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-admin" data-id="${u.id}">Edit</button>
              <button type="button" class="btn btn-outline btn-sm btn-toggle-status" data-id="${u.id}" title="Toggle active status">
                ${u.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
              ${!isSuper ? `
                <button type="button" class="btn btn-danger btn-sm btn-delete-admin" data-id="${u.id}">Delete</button>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderTableView(users, tbody) {
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
      const roleStyle = getRoleStyle(u.role);
      const isSuper = u.role === 'Super Admin';

      return `
        <tr data-admin-id="${u.id}">
          <td>
            <div class="table-worker-cell">
              <div class="table-avatar" style="overflow: hidden; width: 34px; height: 34px;">
                <img src="${getUserAvatar(u)}" alt="${escapeHtml(u.name)}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div>
                <strong style="color: var(--text-primary); font-size: 0.86rem;">${escapeHtml(u.name)}</strong>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); display: block;">#${u.id} • ${escapeHtml(u.email)}</span>
              </div>
            </div>
          </td>
          <td>
            <span style="display: inline-block; background: ${roleStyle.bg}; color: ${roleStyle.color}; border: 1px solid ${roleStyle.border}; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full);">
              ${escapeHtml(u.role)}
            </span>
          </td>
          <td>${escapeHtml(u.department || 'Operations')}</td>
          <td>
            <div style="font-size: 0.74rem; color: var(--text-secondary);">
              ${(u.permissions || []).map(p => p.replace(/_/g, ' ')).slice(0, 2).join(', ')}${(u.permissions || []).length > 2 ? '...' : ''}
            </div>
          </td>
          <td>
            <span style="color: ${u.twoFactor ? 'var(--accent-emerald)' : 'var(--text-muted)'}; font-weight: 600; font-size: 0.78rem;">
              ${u.twoFactor ? '✓ Active' : '○ Off'}
            </span>
          </td>
          <td>
            <span class="badge-status ${u.status === 'Active' ? 'status-available' : 'status-leave'}" style="font-size: 0.68rem;">
              ${u.status}
            </span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(u.lastLogin || 'Never')}</span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-admin" data-id="${u.id}">Edit</button>
              <button type="button" class="btn btn-outline btn-sm btn-toggle-status" data-id="${u.id}">
                ${u.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
              ${!isSuper ? `
                <button type="button" class="btn btn-danger btn-sm btn-delete-admin" data-id="${u.id}">Delete</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // Render: Audit Logs Table
  // =========================================================================
  function renderAuditLogs() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    if (state.auditLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No audit events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.auditLogs.map(log => `
      <tr>
        <td>
          <strong style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.78rem;">#${log.id}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(log.timestamp)}</div>
        </td>
        <td>
          <strong>${escapeHtml(log.user)}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(log.role)}</div>
        </td>
        <td>
          <span class="skill-tag" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.3); color: var(--accent-cyan); font-weight: 700;">
            ${escapeHtml(log.action)}
          </span>
        </td>
        <td style="max-width: 480px; font-size: 0.8rem; color: var(--text-secondary);">
          ${escapeHtml(log.details)}
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(log.ip || '127.0.0.1')}</span>
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // Modals & User Management Form
  // =========================================================================
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function setupAdminModal() {
    const form = document.getElementById('form-admin-user');
    const openBtn = document.getElementById('btn-open-add-user-modal');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        document.getElementById('admin-user-id').value = '';
        document.getElementById('modal-admin-title-text').textContent = 'Create Backend Administrator';
        form.reset();
        openModal('modal-admin-user');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('admin-user-id').value;

        const name = document.getElementById('inp-admin-name').value.trim();
        const email = document.getElementById('inp-admin-email').value.trim();
        const role = document.getElementById('inp-admin-role').value;
        const department = document.getElementById('inp-admin-dept').value.trim() || 'Operations';
        const status = document.getElementById('inp-admin-status').value;
        const twoFactor = document.getElementById('inp-admin-2fa').checked;

        const permCheckboxes = document.querySelectorAll('input[name="perm"]:checked');
        const permissions = Array.from(permCheckboxes).map(cb => cb.value);

        const payload = { name, email, role, department, status, twoFactor, permissions };

        try {
          let url = '/api/admin/users';
          let method = 'POST';

          if (editId) {
            url = `/api/admin/users/${editId}`;
            method = 'PUT';
          }

          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || 'Operation failed');
            return;
          }

          showToast(editId ? `User #${editId} updated!` : `Administrator ${name} created!`, 'success');
          closeModal('modal-admin-user');
          await fetchUsers();
          await fetchAuditLogs();
        } catch (err) {
          console.error('Save user failed', err);
          showToast('Failed to save backend user', 'error');
        }
      });
    }
  }

  function openEditModal(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('admin-user-id').value = user.id;
    document.getElementById('modal-admin-title-text').textContent = `Edit Administrator #${user.id}`;
    document.getElementById('inp-admin-name').value = user.name;
    document.getElementById('inp-admin-email').value = user.email;
    document.getElementById('inp-admin-role').value = user.role;
    document.getElementById('inp-admin-dept').value = user.department || '';
    document.getElementById('inp-admin-status').value = user.status || 'Active';
    document.getElementById('inp-admin-2fa').checked = !!user.twoFactor;

    // Check permissions
    document.querySelectorAll('input[name="perm"]').forEach(cb => {
      cb.checked = (user.permissions || []).includes(cb.value);
    });

    openModal('modal-admin-user');
  }

  async function toggleStatus(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`User #${userId} status changed to ${newStatus}`, 'info');
        await fetchUsers();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Toggle status error', err);
    }
  }

  async function deleteAdminUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Revoke credentials and delete administrator ${user.name} (#${userId})?`)) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`User #${userId} permanently deleted.`, 'warning');
          await fetchUsers();
          await fetchAuditLogs();
        }
      } catch (err) {
        console.error('Delete user error', err);
      }
    }
  }

  // =========================================================================
  // Tabs & Navigation
  // =========================================================================
  function switchTab(targetId) {
    state.activeTab = targetId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
    });
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === targetId);
    });

    if (targetId === 'panel-admin-audit') {
      fetchAuditLogs();
    }
  }

  // =========================================================================
  // Event Delegation & Setup
  // =========================================================================
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) switchTab(target);
      });
    });

    // Search input
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderAdminUsers();
      });
    }

    // Role filter
    const roleFilter = document.getElementById('filter-admin-role');
    if (roleFilter) {
      roleFilter.addEventListener('change', (e) => {
        state.filterRole = e.target.value;
        renderAdminUsers();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('filter-admin-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        state.filterStatus = e.target.value;
        renderAdminUsers();
      });
    }

    // View toggle
    const btnGrid = document.getElementById('btn-admin-view-grid');
    const btnTable = document.getElementById('btn-admin-view-table');

    if (btnGrid && btnTable) {
      btnGrid.addEventListener('click', () => {
        state.viewMode = 'grid';
        btnGrid.classList.add('active');
        btnTable.classList.remove('active');
        renderAdminUsers();
      });

      btnTable.addEventListener('click', () => {
        state.viewMode = 'table';
        btnTable.classList.add('active');
        btnGrid.classList.remove('active');
        renderAdminUsers();
      });
    }

    // Refresh buttons
    const btnRefresh = document.getElementById('btn-refresh-admin');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        await fetchUsers();
        await fetchAuditLogs();
        showToast('Administrative state re-synchronized.', 'success');
      });
    }

    const btnRefreshAudit = document.getElementById('btn-refresh-audit');
    if (btnRefreshAudit) {
      btnRefreshAudit.addEventListener('click', async () => {
        await fetchAuditLogs();
        showToast('Audit trail refreshed.', 'success');
      });
    }

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('BUILDVANTAGE_THEME', newTheme);
        showToast(`Theme switched to ${newTheme === 'dark' ? 'Night Operations' : 'High-Vis Daylight'}`, 'info');
      });
    }

    // Delegated actions for edit / toggle / delete
    document.body.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-admin');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        openEditModal(id);
        return;
      }

      const toggleBtn = e.target.closest('.btn-toggle-status');
      if (toggleBtn) {
        const id = toggleBtn.getAttribute('data-id');
        toggleStatus(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-admin');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        deleteAdminUser(id);
        return;
      }
    });

    // Supabase Diagnostics Modal Trigger
    const statusPill = document.getElementById('db-status-pill');
    if (statusPill) {
      statusPill.addEventListener('click', () => {
        renderSupabaseModal();
        const modal = document.getElementById('modal-supabase-info');
        if (modal) modal.classList.add('active');
      });
    }

    const btnRecheck = document.getElementById('btn-recheck-supabase');
    if (btnRecheck) {
      btnRecheck.addEventListener('click', async () => {
        btnRecheck.disabled = true;
        showToast('Testing Supabase Cloud connection...', 'info');
        await checkSupabaseHealth();
        renderSupabaseModal();
        btnRecheck.disabled = false;
        if (supabaseStatus.isReady) {
          showToast('Supabase PostgreSQL database is live and synced!', 'success');
        } else if (supabaseStatus.connected) {
          showToast('Connected to Supabase! Run schema.sql in SQL Editor to activate tables.', 'warning');
        } else {
          showToast('Supabase unreachable. Operating in local mode.', 'error');
        }
      });
    }
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    const savedTheme = localStorage.getItem('BUILDVANTAGE_THEME');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    setupAdminModal();
    setupEventListeners();

    checkSupabaseHealth();
    fetchUsers();
    fetchAuditLogs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
