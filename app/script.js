/**
 * BUILDVANTAGE - Labour Supply & Workforce Registry Engine
 * Enterprise Operations Controller & State Manager
 */
import { requireAdmin, signOutAdmin } from './js/adminGate.js';
import * as data from './js/dataClient.js';

(function () {
  'use strict';

  // LocalStorage Keys
  const STORAGE_WORKERS_KEY = 'BUILDVANTAGE_WORKERS_V2';
  const STORAGE_SITES_KEY = 'BUILDVANTAGE_SITES_V2';
  const STORAGE_ATTENDANCE_KEY = 'BUILDVANTAGE_ATTENDANCE_V2';
  const STORAGE_THEME_KEY = 'BUILDVANTAGE_THEME';

  // Seed Data: Project Sites
  const INITIAL_SITES = [
    {
      id: 'SITE-01',
      name: 'Metro Rail Extension - Line 3 Viaduct',
      client: 'Metropolitan Transit Authority',
      location: 'North Corridor, Zone 4',
      quota: 15,
      supervisor: 'Eng. Viktor Vance (+1 555-883-9102)',
      shiftTiming: 'Morning Shift (07:00 - 15:30)'
    },
    {
      id: 'SITE-02',
      name: 'Skyline Residency Tower B',
      client: 'Apex Urban Developers Ltd',
      location: 'Waterfront Sector 12',
      quota: 18,
      supervisor: 'Supervisor Marcus Reed (+1 555-492-8811)',
      shiftTiming: 'Morning Shift (07:00 - 15:30)'
    },
    {
      id: 'SITE-03',
      name: 'Apex Logistics Multi-Hub Terminal',
      client: 'Global Cargo Logistics',
      location: 'Highway Interchange Sector 9',
      quota: 12,
      supervisor: 'Foreman Dave Gallagher (+1 555-201-9494)',
      shiftTiming: 'Evening Shift (15:00 - 23:30)'
    },
    {
      id: 'SITE-04',
      name: 'Solar Energy Substation Grid 2',
      client: 'SunPower Renewable Utilities',
      location: 'East Desert Basin, Lot 44',
      quota: 10,
      supervisor: 'Chief Tech Sarah Chen (+1 555-731-0988)',
      shiftTiming: 'Morning Shift (07:00 - 15:30)'
    }
  ];

  // Seed Data: Workforce Registry (18 realistic diverse workers)
  const INITIAL_WORKERS = [
    {
      id: 'LAB-801',
      name: 'Alejandro Morales',
      phone: '+1 (555) 349-8201',
      trade: 'Welding & Fabrication',
      skills: ['SMAW/MIG/TIG Certified', 'Pressure Vessel Welding', 'Blueprint Reading', 'Confined Space Safe'],
      experience: 'Master Craftsman',
      yearsExp: 9,
      dailyRate: 230,
      age: 38,
      bloodGroup: 'O+',
      location: 'Metro District, North',
      emergencyContact: 'Carmen Morales (Wife) +1 555-349-8209',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.9,
      status: 'Deployed',
      assignedSiteId: 'SITE-01',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-802',
      name: 'Tariq Al-Mansoor',
      phone: '+1 (555) 782-1940',
      trade: 'Heavy Equipment Operator',
      skills: ['Hydraulic Excavator', 'Tower Crane Grade II', 'Bulldozer GPS Grade', 'Trench Safety'],
      experience: 'Master Craftsman',
      yearsExp: 11,
      dailyRate: 250,
      age: 42,
      bloodGroup: 'A+',
      location: 'Industrial Belt East',
      emergencyContact: 'Zahra Al-Mansoor (Sister) +1 555-782-9900',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 5.0,
      status: 'Deployed',
      assignedSiteId: 'SITE-01',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-803',
      name: 'Rohan Sharma',
      phone: '+1 (555) 621-4493',
      trade: 'Electrical & Wiring',
      skills: ['Industrial Switchboards', 'High Voltage Substation', 'Conduit Bending', 'PLC Automation'],
      experience: 'Site Supervisor',
      yearsExp: 13,
      dailyRate: 260,
      age: 45,
      bloodGroup: 'B+',
      location: 'Metro Sector 8',
      emergencyContact: 'Pooja Sharma (Wife) +1 555-621-9988',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.95,
      status: 'Deployed',
      assignedSiteId: 'SITE-04',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-804',
      name: 'Mateo Hernandez',
      phone: '+1 (555) 438-9902',
      trade: 'Carpentry & Formwork',
      skills: ['Doka Formwork Systems', 'Bridge Decking', 'Timber Framing', 'Rough Carpentry'],
      experience: 'Master Craftsman',
      yearsExp: 8,
      dailyRate: 195,
      age: 34,
      bloodGroup: 'O+',
      location: 'Southside Valley',
      emergencyContact: 'Rosa Hernandez (Mother) +1 555-438-1122',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.8,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-805',
      name: 'Kwame Osei',
      phone: '+1 (555) 912-7744',
      trade: 'Masonry & Brickwork',
      skills: ['Precision AAC Blocks', 'Reinforced Retaining Walls', 'Stone Cladding', 'Mortar Batching'],
      experience: 'Journeyman',
      yearsExp: 5,
      dailyRate: 175,
      age: 29,
      bloodGroup: 'AB+',
      location: 'Central Heights',
      emergencyContact: 'Abena Osei (Sister) +1 555-912-3321',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.85,
      status: 'Deployed',
      assignedSiteId: 'SITE-02',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-806',
      name: 'Liam Gallagher',
      phone: '+1 (555) 238-6611',
      trade: 'Scaffolding & Rigging',
      skills: ['Cuplok & Layher Systems', 'Suspended Scaffolds', 'Rigging Load Calculation', 'Fall Protection Leader'],
      experience: 'Master Craftsman',
      yearsExp: 10,
      dailyRate: 215,
      age: 37,
      bloodGroup: 'O-',
      location: 'Port Terminal District',
      emergencyContact: 'Clara Gallagher (Wife) +1 555-238-4400',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.9,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-807',
      name: 'Chen Wei',
      phone: '+1 (555) 803-4921',
      trade: 'Steel Fixing & Rebar',
      skills: ['Heavy Rebar Tying', 'PT Cable Tensioning', 'Bar Bending Schedule (BBS)', 'Foundation Mat Reinforcement'],
      experience: 'Journeyman',
      yearsExp: 4,
      dailyRate: 170,
      age: 28,
      bloodGroup: 'A+',
      location: 'East Corridor',
      emergencyContact: 'Mei Wei (Mother) +1 555-803-0099',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.75,
      status: 'Deployed',
      assignedSiteId: 'SITE-02',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-808',
      name: 'Gabriel Santos',
      phone: '+1 (555) 512-8833',
      trade: 'Plumbing & Pipefitting',
      skills: ['CPVC & Cast Iron Drainage', 'Fire Hydrant Piping', 'Hydrostatic Pressure Testing', 'Sanitary Rough-in'],
      experience: 'Master Craftsman',
      yearsExp: 7,
      dailyRate: 190,
      age: 33,
      bloodGroup: 'B+',
      location: 'South River Zone',
      emergencyContact: 'Luisa Santos (Wife) +1 555-512-2211',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.88,
      status: 'Deployed',
      assignedSiteId: 'SITE-03',
      shiftTiming: 'Evening Shift (15:00 - 23:30)',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-809',
      name: 'Darius Vance',
      phone: '+1 (555) 670-3490',
      trade: 'General Construction Helper',
      skills: ['Site Debris Clearance', 'Concrete Vibrator Operation', 'Material Staging', 'Trench Shoring Assistance'],
      experience: 'Apprentice',
      yearsExp: 1,
      dailyRate: 120,
      age: 22,
      bloodGroup: 'O+',
      location: 'North Hill Community',
      emergencyContact: 'Reginald Vance (Father) +1 555-670-8800',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.65,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-810',
      name: 'Ananya Deshmukh',
      phone: '+1 (555) 902-6134',
      trade: 'Electrical & Wiring',
      skills: ['Industrial Control Panels', 'Cable Tray Layout', 'Low Voltage Systems', 'Megger Insulation Testing'],
      experience: 'Journeyman',
      yearsExp: 6,
      dailyRate: 195,
      age: 30,
      bloodGroup: 'B-',
      location: 'Metro Sector 4',
      emergencyContact: 'Kunal Deshmukh (Brother) +1 555-902-5500',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.92,
      status: 'Deployed',
      assignedSiteId: 'SITE-04',
      shiftTiming: 'Morning Shift (07:00 - 15:30)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-811',
      name: 'Bogdan Kovalenko',
      phone: '+1 (555) 334-1188',
      trade: 'Welding & Fabrication',
      skills: ['Structural Beam Welding', 'Flux-Cored Arc (FCAW)', 'Plasma Torch Cutting', 'Overhead Position'],
      experience: 'Master Craftsman',
      yearsExp: 12,
      dailyRate: 240,
      age: 44,
      bloodGroup: 'A+',
      location: 'Harbor Gate Sector 3',
      emergencyContact: 'Oksana Kovalenko (Wife) +1 555-334-9922',
      kycVerified: true,
      oshaCertified: false,
      medicalCleared: true,
      rating: 4.8,
      status: 'Pending',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-812',
      name: 'Samuel Kiprop',
      phone: '+1 (555) 720-9944',
      trade: 'Masonry & Brickwork',
      skills: ['Exposed Brick Facade', 'Curved Arch Masonry', 'Tile Bedding', 'Waterproof Plastering'],
      experience: 'Journeyman',
      yearsExp: 4,
      dailyRate: 165,
      age: 27,
      bloodGroup: 'O+',
      location: 'East Valley Point',
      emergencyContact: 'Faith Kiprop (Sister) +1 555-720-3322',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.7,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-813',
      name: 'Jean-Luc Dubois',
      phone: '+1 (555) 441-2850',
      trade: 'Painter & Finisher',
      skills: ['Airless Spray Painting', 'Epoxy Floor Coating', 'Fireproofing Paint (Intumescent)', 'Drywall Finishing'],
      experience: 'Master Craftsman',
      yearsExp: 8,
      dailyRate: 175,
      age: 35,
      bloodGroup: 'AB-',
      location: 'West Commercial Hub',
      emergencyContact: 'Camille Dubois (Wife) +1 555-441-9900',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.85,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-814',
      name: 'Rajendra Prasad',
      phone: '+1 (555) 880-1234',
      trade: 'Heavy Equipment Operator',
      skills: ['Motor Grader', 'Backhoe Loader', 'Soil Compactor Roller', 'Grade Laser Leveling'],
      experience: 'Master Craftsman',
      yearsExp: 14,
      dailyRate: 245,
      age: 48,
      bloodGroup: 'A-',
      location: 'North Arterial Road',
      emergencyContact: 'Sunita Prasad (Wife) +1 555-880-4321',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.95,
      status: 'Deployed',
      assignedSiteId: 'SITE-03',
      shiftTiming: 'Evening Shift (15:00 - 23:30)',
      avatar: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-815',
      name: 'Carlos Mendez',
      phone: '+1 (555) 551-7890',
      trade: 'General Construction Helper',
      skills: ['Forklift Certified', 'Safety Barricade Setup', 'Aggregate Loading', 'Site Housekeeping'],
      experience: 'Apprentice',
      yearsExp: 2,
      dailyRate: 130,
      age: 24,
      bloodGroup: 'O+',
      location: 'South District Gate',
      emergencyContact: 'Maria Mendez (Sister) +1 555-551-3344',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.7,
      status: 'On Leave',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'LAB-816',
      name: 'Kenji Takahashi',
      phone: '+1 (555) 619-3382',
      trade: 'Carpentry & Formwork',
      skills: ['Architectural Woodwork', 'Precision Joinery', 'Curved Shuttering', 'Acoustic Wall Panels'],
      experience: 'Master Craftsman',
      yearsExp: 15,
      dailyRate: 220,
      age: 46,
      bloodGroup: 'B+',
      location: 'Harbor Gateway',
      emergencyContact: 'Yoko Takahashi (Wife) +1 555-619-8800',
      kycVerified: true,
      oshaCertified: true,
      medicalCleared: true,
      rating: 4.98,
      status: 'Available',
      assignedSiteId: null,
      shiftTiming: null,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // State Store
  const state = {
    workers: [],
    sites: [],
    attendance: {}, // keyed by date (YYYY-MM-DD): { workerId: { status: 'P'|'OT'|'H'|'A', otHours: 0, notes: '' } }
    selectedWorkerIdForBadge: null,
    searchQuery: '',
    filterTrade: 'ALL',
    filterStatus: 'ALL',
    filterExp: 'ALL',
    sortOrder: 'name_asc',
    viewMode: 'grid', // 'grid' or 'table'
    activeTab: 'panel-directory',
    currentAttendanceDate: new Date().toISOString().split('T')[0]
  };

  // Safe Avatar Generator for Fallbacks
  function getWorkerAvatar(worker) {
    if (worker.avatar && worker.avatar.startsWith('http')) {
      return worker.avatar;
    }
    // High-contrast SVG avatar data URI fallback
    const initials = worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const bgColors = ['#f59e0b', '#06b6d4', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const charCode = worker.name.charCodeAt(0) + (worker.name.charCodeAt(1) || 0);
    const color = bgColors[charCode % bgColors.length];
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${encodeURIComponent(color)}"/><text x="50%" y="54%" font-family="system-ui, sans-serif" font-weight="bold" font-size="38" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`;
  }

  // Supabase & Cloud Backend State
  let supabaseStatus = {
    connected: false,
    isReady: false,
    tablesFound: [],
    missingTables: []
  };

  // Check Supabase connection (direct client query) & update navbar badge
  async function checkSupabaseHealth() {
    const pill = document.getElementById('db-status-pill');
    const text = document.getElementById('db-status-text');

    const status = await data.health();
    supabaseStatus = status;

    if (pill && text) {
      pill.className = 'status-pill-live';
      if (status.isReady) {
        pill.classList.add('status-live');
        pill.setAttribute('title', 'Supabase Cloud Database connected and operational. Click for details.');
        text.textContent = 'SUPABASE CLOUD LIVE';
      } else {
        pill.classList.add('status-offline');
        pill.setAttribute('title', 'Cannot reach Supabase (or not authorized). Click for details.');
        text.textContent = 'SUPABASE UNREACHABLE';
      }
    }
    return status;
  }

  // Populate Supabase Diagnostics Modal (connection status + sign out)
  function renderSupabaseModal() {
    const container = document.getElementById('supabase-modal-content');
    if (!container) return;

    const isReady = supabaseStatus.isReady;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding: 1rem; border-radius: var(--radius-md); background: ${isReady ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
        <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isReady ? '#10b981' : '#ef4444'}; color: #fff; font-size: 1.2rem; flex-shrink: 0;">
          ${isReady ? '✓' : '!'}
        </div>
        <div>
          <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">
            ${isReady ? 'Supabase connected — live & secured' : 'Supabase unreachable'}
          </h4>
          <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--text-muted);">
            ${isReady
              ? 'Reads & writes persist to PostgreSQL with Row Level Security (admin-only).'
              : 'Check your connection, or that your account is an active administrator.'}
          </p>
        </div>
      </div>

      <button type="button" class="btn btn-outline btn-sm" id="btn-gate-signout">Sign out</button>
    `;

    const signOutBtn = document.getElementById('btn-gate-signout');
    if (signOutBtn) signOutBtn.onclick = signOutAdmin;
  }

  // Sync data from Supabase (direct client). localStorage stays as an offline cache.
  async function syncWithBackend() {
    try {
      const [workersRows, sitesRows, attMap] = await Promise.all([
        data.workers.getAll().catch(() => null),
        data.sites.getAll().catch(() => null),
        data.attendance.getByDate(state.currentAttendanceDate).catch(() => null)
      ]);

      let dataChanged = false;

      if (Array.isArray(workersRows) && workersRows.length > 0) {
        state.workers = workersRows;
        localStorage.setItem(STORAGE_WORKERS_KEY, JSON.stringify(state.workers));
        dataChanged = true;
      }

      if (Array.isArray(sitesRows) && sitesRows.length > 0) {
        state.sites = sitesRows;
        localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(state.sites));
        dataChanged = true;
      }

      if (attMap && Object.keys(attMap).length > 0) {
        state.attendance[state.currentAttendanceDate] = attMap;
        localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(state.attendance));
        dataChanged = true;
      }

      if (dataChanged) {
        renderKPIs();
        renderBadgeCount();
        if (state.activeTab === 'panel-directory') renderWorkforceDirectory();
        else if (state.activeTab === 'panel-deployments') renderSitesView();
        else if (state.activeTab === 'panel-attendance') renderAttendanceView();
        else if (state.activeTab === 'panel-compliance') renderComplianceAndBadgeView();
      }
    } catch (e) {
      console.warn('Backend sync failed, continuing with cached records', e);
    }
  }

  // Load from Storage or Initialize Defaults
  function initData() {
    try {
      const storedWorkers = localStorage.getItem(STORAGE_WORKERS_KEY);
      const storedSites = localStorage.getItem(STORAGE_SITES_KEY);
      const storedAttendance = localStorage.getItem(STORAGE_ATTENDANCE_KEY);
      const storedTheme = localStorage.getItem(STORAGE_THEME_KEY);

      state.workers = storedWorkers ? JSON.parse(storedWorkers) : JSON.parse(JSON.stringify(INITIAL_WORKERS));
      state.sites = storedSites ? JSON.parse(storedSites) : JSON.parse(JSON.stringify(INITIAL_SITES));
      state.attendance = storedAttendance ? JSON.parse(storedAttendance) : {};

      if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      // Seed initial attendance for today if empty
      const today = state.currentAttendanceDate;
      if (!state.attendance[today]) {
        state.attendance[today] = {};
        state.workers.forEach(w => {
          if (w.status === 'Deployed') {
            state.attendance[today][w.id] = { status: 'P', otHours: 0 };
          }
        });
        saveAttendance();
      }

      if (state.workers.length > 0) {
        state.selectedWorkerIdForBadge = state.workers[0].id;
      }
    } catch (e) {
      console.error('Error loading stored workforce data, falling back to seed', e);
      state.workers = JSON.parse(JSON.stringify(INITIAL_WORKERS));
      state.sites = JSON.parse(JSON.stringify(INITIAL_SITES));
      state.attendance = {};
    }

    // Trigger asynchronous background sync with Supabase backend
    checkSupabaseHealth();
    syncWithBackend();
  }

  // Background persistence helpers (Supabase-direct). Updates/deletes are
  // optimistic: local state already changed; these persist and surface errors.
  function apiUpdateWorker(id, updates) {
    data.workers.update(id, updates).catch(e => {
      console.warn('worker update failed', e);
      showToast('Could not sync worker change: ' + (e.message || 'error'), 'error');
    });
  }

  function apiDeleteWorker(id) {
    data.workers.delete(id).catch(e => {
      console.warn('worker delete failed', e);
      showToast('Could not delete worker in cloud: ' + (e.message || 'error'), 'error');
    });
  }

  function apiDeleteSite(id) {
    data.sites.delete(id).catch(e => {
      console.warn('site delete failed', e);
      showToast('Could not delete site in cloud: ' + (e.message || 'error'), 'error');
    });
  }

  let attendanceSyncDebounce = null;
  function apiSaveAttendance(date, records) {
    clearTimeout(attendanceSyncDebounce);
    attendanceSyncDebounce = setTimeout(() => {
      data.attendance.save(date, records).catch(e => console.warn('attendance sync error', e));
    }, 400);
  }

  function saveWorkers(worker, action) {
    localStorage.setItem(STORAGE_WORKERS_KEY, JSON.stringify(state.workers));
    renderKPIs();
    renderBadgeCount();

    // Creates are persisted (awaited) in the form handler so the DB-assigned id
    // is captured; here we only sync updates/deletes.
    if (worker && action === 'update') {
      apiUpdateWorker(worker.id, worker);
    } else if (worker && action === 'delete') {
      apiDeleteWorker(worker.id);
    }
  }

  function saveSites(site, action) {
    localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(state.sites));
    renderKPIs();
    renderBadgeCount();

    if (site && action === 'delete') {
      apiDeleteSite(site.id);
    }
  }

  function saveAttendance() {
    localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(state.attendance));
    apiSaveAttendance(state.currentAttendanceDate, state.attendance[state.currentAttendanceDate]);
  }

  // =========================================================================
  // Toast Notifications
  // =========================================================================
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

  // =========================================================================
  // KPI Metrics Calculation & Rendering
  // =========================================================================
  function renderKPIs() {
    const total = state.workers.length;
    const available = state.workers.filter(w => w.status === 'Available').length;
    const deployed = state.workers.filter(w => w.status === 'Deployed').length;
    const pending = state.workers.filter(w => !w.kycVerified || !w.oshaCertified || !w.medicalCleared).length;
    const compliant = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

    // Daily wage bill of currently deployed workers
    const deployedWageSum = state.workers
      .filter(w => w.status === 'Deployed')
      .reduce((acc, curr) => acc + (curr.dailyRate || 0), 0);

    const avgRate = total > 0
      ? Math.round(state.workers.reduce((acc, curr) => acc + (curr.dailyRate || 0), 0) / total)
      : 0;

    // Update KPI Elements
    document.getElementById('kpi-val-total').textContent = total;
    document.getElementById('kpi-val-available').textContent = available;
    document.getElementById('kpi-val-available-pct').textContent = total > 0 ? `${Math.round((available / total) * 100)}%` : '0%';
    document.getElementById('kpi-val-deployed').textContent = deployed;
    document.getElementById('kpi-val-sites-count').textContent = `${state.sites.length} sites`;
    document.getElementById('kpi-val-compliance').textContent = `${compliant}%`;
    document.getElementById('kpi-val-unverified').textContent = `${pending} pending check`;
    document.getElementById('kpi-val-wage').textContent = `$${deployedWageSum.toLocaleString()}`;
    document.getElementById('kpi-val-avg-rate').textContent = `$${avgRate}/day`;
  }

  function renderBadgeCount() {
    const badgeDirectory = document.getElementById('badge-count-directory');
    const badgeSites = document.getElementById('badge-count-sites');
    if (badgeDirectory) badgeDirectory.textContent = state.workers.length;
    if (badgeSites) badgeSites.textContent = state.sites.length;
  }

  // =========================================================================
  // Filter & Search Logic
  // =========================================================================
  function getFilteredWorkers() {
    const query = state.searchQuery.trim().toLowerCase();
    
    return state.workers.filter(w => {
      // Search matching
      if (query) {
        const matchName = w.name.toLowerCase().includes(query);
        const matchId = w.id.toLowerCase().includes(query);
        const matchTrade = w.trade.toLowerCase().includes(query);
        const matchPhone = w.phone.toLowerCase().includes(query);
        const matchSkills = w.skills && w.skills.some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchId && !matchTrade && !matchPhone && !matchSkills) {
          return false;
        }
      }

      // Trade filter
      if (state.filterTrade !== 'ALL' && w.trade !== state.filterTrade) {
        return false;
      }

      // Status filter
      if (state.filterStatus !== 'ALL') {
        if (state.filterStatus === 'Pending') {
          const isPending = !w.kycVerified || !w.oshaCertified || !w.medicalCleared || w.status === 'Pending';
          if (!isPending) return false;
        } else if (w.status !== state.filterStatus) {
          return false;
        }
      }

      // Experience filter
      if (state.filterExp !== 'ALL' && w.experience !== state.filterExp) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (state.sortOrder === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (state.sortOrder === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (state.sortOrder === 'rate_desc') {
        return (b.dailyRate || 0) - (a.dailyRate || 0);
      } else if (state.sortOrder === 'rate_asc') {
        return (a.dailyRate || 0) - (b.dailyRate || 0);
      } else if (state.sortOrder === 'experience_desc') {
        return (b.yearsExp || 0) - (a.yearsExp || 0);
      }
      return 0;
    });
  }

  // =========================================================================
  // Render: Workforce Directory (Grid & Table)
  // =========================================================================
  function renderWorkforceDirectory() {
    const workers = getFilteredWorkers();
    const countEl = document.getElementById('filter-match-count');
    const clearLink = document.getElementById('filter-clear-link');
    const emptyState = document.getElementById('workers-empty-state');
    const cardsContainer = document.getElementById('workers-cards-container');
    const tableContainer = document.getElementById('workers-table-container');
    const tableBody = document.getElementById('workers-table-body');

    if (countEl) countEl.textContent = workers.length;

    // Toggle clear link
    const isFiltered = state.searchQuery || state.filterTrade !== 'ALL' || state.filterStatus !== 'ALL' || state.filterExp !== 'ALL';
    if (clearLink) clearLink.style.display = isFiltered ? 'inline-block' : 'none';

    if (workers.length === 0) {
      if (cardsContainer) cardsContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (state.viewMode === 'grid') {
      if (cardsContainer) cardsContainer.style.display = 'grid';
      if (tableContainer) tableContainer.style.display = 'none';
      renderCardsView(workers, cardsContainer);
    } else {
      if (cardsContainer) cardsContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      renderTableView(workers, tableBody);
    }
  }

  function renderCardsView(workers, container) {
    container.innerHTML = workers.map(w => {
      const avatarSrc = getWorkerAvatar(w);
      const assignedSite = w.assignedSiteId ? state.sites.find(s => s.id === w.assignedSiteId) : null;
      const statusClass = w.status === 'Available' ? 'status-available'
        : w.status === 'Deployed' ? 'status-deployed'
        : w.status === 'Pending' ? 'status-pending' : 'status-leave';

      const skillsHtml = (w.skills || []).slice(0, 3).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('');
      const moreSkills = (w.skills || []).length > 3 ? `<span class="skill-tag">+${w.skills.length - 3}</span>` : '';

      return `
        <article class="worker-card" data-worker-id="${w.id}">
          <div class="worker-card-header">
            <div class="worker-avatar-box">
              <img src="${avatarSrc}" alt="${escapeHtml(w.name)}" loading="lazy">
              ${w.status === 'Available' ? '<span class="worker-badge-online" title="Ready for dispatch"></span>' : ''}
            </div>
            <div class="worker-main-info">
              <div class="worker-name-row">
                <span class="worker-name" title="${escapeHtml(w.name)}">${escapeHtml(w.name)}</span>
                <span class="worker-reg-id">#${w.id}</span>
              </div>
              <div class="worker-trade-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                <span>${escapeHtml(w.trade)}</span>
              </div>
              <div class="worker-meta-line">
                <span>${escapeHtml(w.experience)} (${w.yearsExp}y)</span>
                <span>•</span>
                <span>★ ${w.rating || 5.0}</span>
                <span>•</span>
                <span>${escapeHtml(w.location || 'Metro')}</span>
              </div>
            </div>
          </div>

          <div class="worker-card-body">
            <div class="skills-tags-wrap">
              ${skillsHtml}
              ${moreSkills}
            </div>

            <div class="worker-status-box">
              <div class="badge-status ${statusClass}">
                <span class="status-pulse-dot" style="background: currentColor;"></span>
                <span>${w.status}</span>
              </div>
              <div class="rate-badge">
                $${w.dailyRate}<span class="rate-sub"> /day</span>
              </div>
            </div>

            ${assignedSite ? `
              <div style="font-size: 0.76rem; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: var(--radius-sm); padding: 5px 8px; color: var(--accent-cyan); display: flex; align-items: center; gap: 5px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Stationed: ${escapeHtml(assignedSite.name)}</span>
              </div>
            ` : ''}

            <div class="compliance-pills">
              <span class="pill-check ${w.kycVerified ? '' : 'warning'}">
                ${w.kycVerified ? '✓ KYC' : '⚠ KYC Pending'}
              </span>
              <span>•</span>
              <span class="pill-check ${w.oshaCertified ? '' : 'warning'}">
                ${w.oshaCertified ? '✓ OSHA-30' : '⚠ Safety'}
              </span>
              <span>•</span>
              <span class="pill-check ${w.medicalCleared ? '' : 'warning'}">
                ${w.medicalCleared ? '✓ Medical' : '⚠ Health'}
              </span>
            </div>
          </div>

          <div class="worker-card-footer">
            <button type="button" class="btn btn-outline btn-sm btn-action-dossier" data-id="${w.id}">
              <span>Dossier</span>
            </button>
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm btn-action-badge" data-id="${w.id}" title="View digital pass">
                <span>ID Card</span>
              </button>
              ${w.status === 'Available' ? `
                <button type="button" class="btn btn-primary btn-sm btn-action-dispatch" data-id="${w.id}">
                  <span>Deploy</span>
                </button>
              ` : w.status === 'Deployed' ? `
                <button type="button" class="btn btn-outline btn-sm btn-action-recall" data-id="${w.id}" style="color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.3);">
                  <span>Recall</span>
                </button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm btn-action-edit" data-id="${w.id}">
                  <span>Verify</span>
                </button>
              `}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderTableView(workers, tbody) {
    tbody.innerHTML = workers.map(w => {
      const avatarSrc = getWorkerAvatar(w);
      const assignedSite = w.assignedSiteId ? state.sites.find(s => s.id === w.assignedSiteId) : null;
      const statusClass = w.status === 'Available' ? 'status-available'
        : w.status === 'Deployed' ? 'status-deployed'
        : w.status === 'Pending' ? 'status-pending' : 'status-leave';

      return `
        <tr data-worker-id="${w.id}">
          <td>
            <div class="table-worker-cell">
              <div class="table-avatar" style="overflow: hidden;">
                <img src="${avatarSrc}" alt="${escapeHtml(w.name)}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div>
                <strong style="color: var(--text-primary); display: block;">${escapeHtml(w.name)}</strong>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">#${w.id} • ${escapeHtml(w.phone)}</span>
              </div>
            </div>
          </td>
          <td>
            <strong style="color: var(--accent-gold);">${escapeHtml(w.trade)}</strong>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${(w.skills || []).slice(0, 2).join(', ')}</div>
          </td>
          <td>
            <div>${escapeHtml(w.experience)}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${w.yearsExp} yrs exp</div>
          </td>
          <td>
            <strong style="font-family: var(--font-mono); color: var(--text-primary);">$${w.dailyRate}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">/day</span>
          </td>
          <td>
            <div style="font-size: 0.76rem; display: flex; flex-direction: column; gap: 2px;">
              <span class="pill-check ${w.kycVerified ? '' : 'warning'}">${w.kycVerified ? '✓ Govt KYC' : '⚠ KYC'}</span>
              <span class="pill-check ${w.oshaCertified ? '' : 'warning'}">${w.oshaCertified ? '✓ OSHA-30' : '⚠ OSHA'}</span>
            </div>
          </td>
          <td>
            <span class="badge-status ${statusClass}">${w.status}</span>
          </td>
          <td>
            ${assignedSite ? `<span style="color: var(--accent-cyan); font-size: 0.78rem;">${escapeHtml(assignedSite.name)}</span>` : '<span style="color: var(--text-muted); font-size: 0.75rem;">— Unassigned —</span>'}
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button type="button" class="btn btn-outline btn-sm btn-action-dossier" data-id="${w.id}">Profile</button>
              ${w.status === 'Available' ? `
                <button type="button" class="btn btn-primary btn-sm btn-action-dispatch" data-id="${w.id}">Deploy</button>
              ` : w.status === 'Deployed' ? `
                <button type="button" class="btn btn-outline btn-sm btn-action-recall" data-id="${w.id}" style="color: var(--accent-rose);">Recall</button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm btn-action-edit" data-id="${w.id}">Edit</button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // Render: Sites & Deployments Manager
  // =========================================================================
  function renderSitesView() {
    const container = document.getElementById('sites-cards-container');
    if (!container) return;

    container.innerHTML = state.sites.map(site => {
      const deployedWorkers = state.workers.filter(w => w.assignedSiteId === site.id);
      const count = deployedWorkers.length;
      const quota = site.quota || 1;
      const pct = Math.min(100, Math.round((count / quota) * 100));

      const crewListHtml = deployedWorkers.length > 0 ? deployedWorkers.map(w => `
        <div class="site-crew-item">
          <div>
            <strong>${escapeHtml(w.name)}</strong>
            <span style="color: var(--accent-gold); font-size: 0.72rem; margin-left: 4px;">(${escapeHtml(w.trade)})</span>
          </div>
          <button type="button" class="btn btn-outline btn-sm btn-action-recall" data-id="${w.id}" style="padding: 2px 7px; font-size: 0.7rem; color: var(--accent-rose);">Recall</button>
        </div>
      `).join('') : '<div style="color: var(--text-muted); font-size: 0.78rem; padding: 6px;">No workers currently dispatched to this site.</div>';

      return `
        <article class="site-card" data-site-id="${site.id}">
          <div class="site-card-header">
            <div class="site-title-box">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-gold);">
                  <rect x="2" y="7" width="20" height="14" rx="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>${escapeHtml(site.name)}</span>
              </h3>
              <div class="site-client">${escapeHtml(site.client)}</div>
              <div class="site-location">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${escapeHtml(site.location)}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge-status status-deployed">${count} / ${quota} CREW</span>
            </div>
          </div>

          <div class="site-progress-box">
            <div class="site-progress-meta">
              <span style="color: var(--text-secondary);">Requisition Fulfilment</span>
              <span style="color: var(--accent-cyan); font-family: var(--font-mono);">${pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.78rem; color: var(--text-muted);">
            <div><strong>Supervisor:</strong> ${escapeHtml(site.supervisor || 'On-site Foreman')}</div>
            <div><strong>Schedule:</strong> ${escapeHtml(site.shiftTiming || 'General 8-hr Shift')}</div>
          </div>

          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
              <span>Dispatched Crew (${count})</span>
              <span style="color: var(--accent-gold); font-family: var(--font-mono);">$${deployedWorkers.reduce((acc, w) => acc + (w.dailyRate || 0), 0)} /day</span>
            </div>
            <div class="site-crew-list">
              ${crewListHtml}
            </div>
          </div>

          <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm btn-site-dispatch-crew" data-site-id="${site.id}">+ Dispatch Crew</button>
            <button type="button" class="btn btn-danger btn-sm btn-site-delete" data-site-id="${site.id}" title="Delete site">Remove</button>
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // Render: Daily Shift Attendance & Wage Ledger
  // =========================================================================
  function renderAttendanceView() {
    const tbody = document.getElementById('attendance-table-body');
    const dateInput = document.getElementById('attendance-date');
    if (!tbody || !dateInput) return;

    const dateKey = state.currentAttendanceDate;
    dateInput.value = dateKey;

    if (!state.attendance[dateKey]) {
      state.attendance[dateKey] = {};
    }
    const daySheet = state.attendance[dateKey];

    let presentCount = 0;
    let otHoursSum = 0;
    let totalPaySum = 0;

    tbody.innerHTML = state.workers.map(w => {
      const record = daySheet[w.id] || { status: w.status === 'Deployed' ? 'P' : 'A', otHours: 0 };
      const assignedSite = w.assignedSiteId ? state.sites.find(s => s.id === w.assignedSiteId) : null;
      
      // Calculate daily net pay
      let baseRate = w.dailyRate || 0;
      let multiplier = 0;
      if (record.status === 'P') multiplier = 1.0;
      else if (record.status === 'OT') multiplier = 1.0;
      else if (record.status === 'H') multiplier = 0.5;
      else if (record.status === 'A') multiplier = 0.0;

      const hourlyRate = baseRate / 8;
      const otPay = (record.otHours || 0) * (hourlyRate * 1.5);
      const totalWorkerPay = Math.round((baseRate * multiplier) + otPay);

      if (record.status === 'P' || record.status === 'OT' || record.status === 'H') {
        presentCount++;
      }
      otHoursSum += (record.otHours || 0);
      totalPaySum += totalWorkerPay;

      return `
        <tr data-worker-id="${w.id}">
          <td>
            <div class="table-worker-cell">
              <div class="table-avatar" style="overflow: hidden; width: 32px; height: 32px;">
                <img src="${getWorkerAvatar(w)}" alt="${escapeHtml(w.name)}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div>
                <strong style="color: var(--text-primary); font-size: 0.86rem;">${escapeHtml(w.name)}</strong>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); display: block;">#${w.id}</span>
              </div>
            </div>
          </td>
          <td>
            <span style="font-size: 0.8rem; color: var(--accent-gold);">${escapeHtml(w.trade)}</span>
          </td>
          <td>
            ${assignedSite ? `<span style="font-size: 0.78rem; color: var(--accent-cyan);">${escapeHtml(assignedSite.name)}</span>` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Unassigned</span>'}
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700;">$${baseRate}</span>
          </td>
          <td>
            <div class="attendance-toggle-group" data-worker-id="${w.id}">
              <button type="button" class="att-btn present ${record.status === 'P' ? 'active' : ''}" data-val="P">Full (8h)</button>
              <button type="button" class="att-btn ot ${record.status === 'OT' ? 'active' : ''}" data-val="OT">OT Shift</button>
              <button type="button" class="att-btn half ${record.status === 'H' ? 'active' : ''}" data-val="H">Half Day</button>
              <button type="button" class="att-btn absent ${record.status === 'A' ? 'active' : ''}" data-val="A">Absent</button>
            </div>
          </td>
          <td>
            <input type="number" class="custom-select inp-att-ot" data-worker-id="${w.id}" value="${record.otHours || 0}" min="0" max="12" step="1" style="width: 70px; padding: 4px 8px; font-family: var(--font-mono);">
          </td>
          <td>
            <strong style="font-family: var(--font-mono); color: var(--accent-emerald); font-size: 0.95rem;">$${totalWorkerPay}</strong>
          </td>
          <td>
            <span class="badge-status ${record.status !== 'A' ? 'status-available' : 'status-leave'}" style="font-size: 0.68rem;">
              ${record.status !== 'A' ? 'VERIFIED & DUE' : 'NO WAGE'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Summary Elements
    const presEl = document.getElementById('att-summary-present');
    const otEl = document.getElementById('att-summary-ot');
    const totalEl = document.getElementById('att-summary-total-pay');
    if (presEl) presEl.textContent = `${presentCount} Workers`;
    if (otEl) otEl.textContent = `${otHoursSum} hrs`;
    if (totalEl) totalEl.textContent = `$${totalPaySum.toLocaleString()}`;
  }

  // =========================================================================
  // Render: Digital ID Card Badge & Compliance Center
  // =========================================================================
  function renderComplianceAndBadgeView() {
    const selector = document.getElementById('badge-worker-selector');
    if (!selector) return;

    // Populate worker dropdown
    selector.innerHTML = state.workers.map(w => `
      <option value="${w.id}" ${w.id === state.selectedWorkerIdForBadge ? 'selected' : ''}>
        #${w.id} — ${escapeHtml(w.name)} (${escapeHtml(w.trade)})
      </option>
    `).join('');

    const worker = state.workers.find(w => w.id === state.selectedWorkerIdForBadge) || state.workers[0];
    if (!worker) return;

    // Fill Badge Elements
    const photoEl = document.getElementById('badge-photo');
    const nameEl = document.getElementById('badge-name');
    const tradeEl = document.getElementById('badge-trade');
    const regIdEl = document.getElementById('badge-reg-id');
    const bloodEl = document.getElementById('badge-blood');
    const govtEl = document.getElementById('badge-govt-id');

    if (photoEl) photoEl.src = getWorkerAvatar(worker);
    if (nameEl) nameEl.textContent = worker.name;
    if (tradeEl) tradeEl.textContent = worker.trade.toUpperCase();
    if (regIdEl) regIdEl.textContent = `#${worker.id}`;
    if (bloodEl) bloodEl.textContent = worker.bloodGroup || 'O+';
    if (govtEl) govtEl.textContent = worker.kycVerified ? 'VERIFIED PASS' : 'KYC PENDING';

    // Fill Compliance Dossier Breakdown
    const dossierContainer = document.getElementById('compliance-dossier-content');
    if (dossierContainer) {
      dossierContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          
          <div style="background: var(--bg-input); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Statutory KYC Verification</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
              <span class="status-pulse-dot" style="background: ${worker.kycVerified ? '#10b981' : '#f59e0b'};"></span>
              <strong style="color: ${worker.kycVerified ? '#10b981' : '#f59e0b'}; font-size: 0.95rem;">
                ${worker.kycVerified ? 'Approved & Validated' : 'Document Pending'}
              </strong>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.4rem;">Govt biometric ID checked against national registry.</div>
          </div>

          <div style="background: var(--bg-input); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">OSHA 30 Safety Clearance</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
              <span class="status-pulse-dot" style="background: ${worker.oshaCertified ? '#10b981' : '#f43f5e'};"></span>
              <strong style="color: ${worker.oshaCertified ? '#10b981' : '#f43f5e'}; font-size: 0.95rem;">
                ${worker.oshaCertified ? 'OSHA 30 Certified' : 'Safety Induction Incomplete'}
              </strong>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.4rem;">Standard site hazard awareness & scaffold safe pass.</div>
          </div>

          <div style="background: var(--bg-input); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Medical & Physical Fitness</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
              <span class="status-pulse-dot" style="background: ${worker.medicalCleared ? '#10b981' : '#f59e0b'};"></span>
              <strong style="color: ${worker.medicalCleared ? '#10b981' : '#f59e0b'}; font-size: 0.95rem;">
                ${worker.medicalCleared ? 'Fit for Heavy Construction' : 'Medical Due Renewal'}
              </strong>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.4rem;">Audiometry, pulmonary, and vision clearance logged.</div>
          </div>

        </div>

        <div style="background: var(--bg-card-solid); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">Emergency Contacts & Dispatch Details</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
            <div><span style="color: var(--text-muted);">Emergency Contact:</span> <strong>${escapeHtml(worker.emergencyContact || 'None recorded')}</strong></div>
            <div><span style="color: var(--text-muted);">Blood Group:</span> <strong style="font-family: var(--font-mono);">${worker.bloodGroup || 'O+'}</strong></div>
            <div><span style="color: var(--text-muted);">Base Region:</span> <strong>${escapeHtml(worker.location || 'Metro')}</strong></div>
            <div><span style="color: var(--text-muted);">Current Deployment:</span> <strong style="color: var(--accent-cyan);">${worker.status === 'Deployed' ? 'Active on Project Site' : 'In Reserve Pool'}</strong></div>
          </div>
        </div>
      `;
    }
  }

  // =========================================================================
  // Modal Handlers & Actions
  // =========================================================================
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  // Register or Edit Worker Form
  function setupWorkerFormModal() {
    const form = document.getElementById('form-worker-registry');
    const openBtn = document.getElementById('btn-open-register-modal');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        document.getElementById('worker-form-id').value = '';
        document.getElementById('modal-worker-title-text').textContent = 'Register New Labourer';
        form.reset();
        document.getElementById('inp-worker-rate').value = 180;
        document.getElementById('inp-worker-age').value = 30;
        document.getElementById('inp-worker-kyc').checked = true;
        document.getElementById('inp-worker-osha').checked = true;
        document.getElementById('inp-worker-medical').checked = true;
        openModal('modal-worker-form');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('worker-form-id').value;

        const name = document.getElementById('inp-worker-name').value.trim();
        const phone = document.getElementById('inp-worker-phone').value.trim();
        const trade = document.getElementById('inp-worker-trade').value;
        const experience = document.getElementById('inp-worker-exp').value;
        const dailyRate = parseFloat(document.getElementById('inp-worker-rate').value) || 150;
        const age = parseInt(document.getElementById('inp-worker-age').value, 10) || 30;
        const bloodGroup = document.getElementById('inp-worker-blood').value;
        const skillsRaw = document.getElementById('inp-worker-skills').value;
        const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const location = document.getElementById('inp-worker-location').value.trim() || 'Central District';
        const emergencyContact = document.getElementById('inp-worker-emergency').value.trim();
        const kycVerified = document.getElementById('inp-worker-kyc').checked;
        const oshaCertified = document.getElementById('inp-worker-osha').checked;
        const medicalCleared = document.getElementById('inp-worker-medical').checked;

        if (editId) {
          // Editing existing worker
          const workerIndex = state.workers.findIndex(w => w.id === editId);
          if (workerIndex !== -1) {
            state.workers[workerIndex] = {
              ...state.workers[workerIndex],
              name, phone, trade, experience, dailyRate, age, bloodGroup,
              skills: skills.length ? skills : state.workers[workerIndex].skills,
              location, emergencyContact, kycVerified, oshaCertified, medicalCleared
            };
            saveWorkers(state.workers[workerIndex], 'update');
            showToast(`Worker #${editId} record updated successfully!`, 'success');
          }
        } else {
          // New worker — the DB trigger assigns the LAB-### id; capture it from the insert.
          const payload = {
            name, phone, trade, experience,
            yearsExp: experience === 'Apprentice' ? 1 : experience === 'Journeyman' ? 4 : experience === 'Master Craftsman' ? 8 : 12,
            dailyRate, age, bloodGroup,
            skills: skills.length ? skills : ['General Labour Skills', 'PPE Compliant'],
            location, emergencyContact, kycVerified, oshaCertified, medicalCleared,
            rating: 4.8,
            status: 'Available',
            assignedSiteId: null,
            shiftTiming: null,
            avatar: null
          };
          try {
            const created = await data.workers.create(payload);
            state.workers.unshift(created);
            state.selectedWorkerIdForBadge = created.id;
            saveWorkers(); // persist cache + refresh KPIs (no extra network write)
            showToast(`Labourer ${created.name} registered as #${created.id}!`, 'success');
          } catch (err) {
            showToast('Could not register worker: ' + (err.message || 'error'), 'error');
          }
        }

        renderWorkforceDirectory();
        renderComplianceAndBadgeView();
        closeModal('modal-worker-form');
      });
    }
  }

  // Populate & open edit form for specific worker
  function openEditWorkerModal(workerId) {
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker) return;

    document.getElementById('worker-form-id').value = worker.id;
    document.getElementById('modal-worker-title-text').textContent = `Edit Record: #${worker.id}`;
    document.getElementById('inp-worker-name').value = worker.name;
    document.getElementById('inp-worker-phone').value = worker.phone;
    document.getElementById('inp-worker-trade').value = worker.trade;
    document.getElementById('inp-worker-exp').value = worker.experience;
    document.getElementById('inp-worker-rate').value = worker.dailyRate;
    document.getElementById('inp-worker-age').value = worker.age || 32;
    document.getElementById('inp-worker-blood').value = worker.bloodGroup || 'O+';
    document.getElementById('inp-worker-skills').value = (worker.skills || []).join(', ');
    document.getElementById('inp-worker-location').value = worker.location || '';
    document.getElementById('inp-worker-emergency').value = worker.emergencyContact || '';
    document.getElementById('inp-worker-kyc').checked = !!worker.kycVerified;
    document.getElementById('inp-worker-osha').checked = !!worker.oshaCertified;
    document.getElementById('inp-worker-medical').checked = !!worker.medicalCleared;

    openModal('modal-worker-form');
  }

  // Open Dossier Profile Modal
  function openDossierModal(workerId) {
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker) return;

    const assignedSite = worker.assignedSiteId ? state.sites.find(s => s.id === worker.assignedSiteId) : null;
    const nameEl = document.getElementById('dossier-name');
    const idEl = document.getElementById('dossier-reg-id');
    const avatarEl = document.getElementById('dossier-avatar');
    const bodyEl = document.getElementById('dossier-body-content');

    if (nameEl) nameEl.textContent = worker.name;
    if (idEl) idEl.textContent = `#${worker.id} • ${worker.trade}`;
    if (avatarEl) {
      avatarEl.innerHTML = `<img src="${getWorkerAvatar(worker)}" alt="${escapeHtml(worker.name)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: var(--bg-input); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Primary Trade</span>
            <div style="font-weight: 700; color: var(--accent-gold); font-size: 0.95rem;">${escapeHtml(worker.trade)}</div>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Experience & Rank</span>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(worker.experience)} (${worker.yearsExp} yrs)</div>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Standard Daily Rate</span>
            <div style="font-weight: 700; color: var(--accent-emerald); font-family: var(--font-mono); font-size: 1.1rem;">$${worker.dailyRate} /day</div>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Current Deployment</span>
            <div style="font-weight: 700; color: ${worker.status === 'Available' ? 'var(--accent-emerald)' : 'var(--accent-cyan)'}; font-size: 0.95rem;">
              ${worker.status} ${assignedSite ? `(${assignedSite.name})` : ''}
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Specialized Skills & Qualifications</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${(worker.skills || []).map(s => `<span class="skill-tag" style="padding: 4px 10px; font-size: 0.8rem;">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.84rem;">
          <div style="background: rgba(255, 255, 255, 0.02); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <strong>Personal Record</strong>
            <div style="margin-top: 0.35rem; color: var(--text-secondary);">Phone: ${escapeHtml(worker.phone)}</div>
            <div style="color: var(--text-secondary);">Age: ${worker.age} • Blood Group: ${worker.bloodGroup || 'O+'}</div>
            <div style="color: var(--text-secondary);">Base Location: ${escapeHtml(worker.location || 'Metro')}</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.02); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <strong>Emergency & Safety Clearance</strong>
            <div style="margin-top: 0.35rem; color: var(--text-secondary);">Emergency: ${escapeHtml(worker.emergencyContact || 'None')}</div>
            <div style="color: var(--text-secondary);">KYC: ${worker.kycVerified ? '✓ Cleared' : '⚠ Incomplete'}</div>
            <div style="color: var(--text-secondary);">OSHA 30: ${worker.oshaCertified ? '✓ Active Pass' : '⚠ Pending'}</div>
          </div>
        </div>
      `;
    }

    // Connect dossier buttons
    const btnDel = document.getElementById('btn-dossier-delete-worker');
    const btnEdit = document.getElementById('btn-dossier-edit-worker');
    const btnBadge = document.getElementById('btn-dossier-view-badge');

    if (btnDel) {
      btnDel.onclick = () => {
        if (confirm(`Are you sure you want to remove worker #${worker.id} (${worker.name}) from registry?`)) {
          state.workers = state.workers.filter(w => w.id !== worker.id);
          saveWorkers({ id: worker.id }, 'delete');
          renderWorkforceDirectory();
          closeModal('modal-worker-dossier');
          showToast(`Worker #${worker.id} removed from registry.`, 'warning');
        }
      };
    }

    if (btnEdit) {
      btnEdit.onclick = () => {
        closeModal('modal-worker-dossier');
        openEditWorkerModal(worker.id);
      };
    }

    if (btnBadge) {
      btnBadge.onclick = () => {
        closeModal('modal-worker-dossier');
        state.selectedWorkerIdForBadge = worker.id;
        switchTab('panel-compliance');
        renderComplianceAndBadgeView();
      };
    }

    openModal('modal-worker-dossier');
  }

  // Open Dispatch Labour to Site Modal
  function openDispatchModal(workerId) {
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker) return;

    document.getElementById('dispatch-worker-id').value = worker.id;
    document.getElementById('dispatch-worker-name').textContent = worker.name;
    document.getElementById('dispatch-worker-trade').textContent = worker.trade;

    const selectSite = document.getElementById('dispatch-select-site');
    if (selectSite) {
      selectSite.innerHTML = state.sites.map(s => {
        const count = state.workers.filter(w => w.assignedSiteId === s.id).length;
        return `<option value="${s.id}">${escapeHtml(s.name)} (${count}/${s.quota} Filled)</option>`;
      }).join('');
    }

    openModal('modal-dispatch-worker');
  }

  // Setup Dispatch Form Submission
  function setupDispatchForm() {
    const form = document.getElementById('form-dispatch');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const workerId = document.getElementById('dispatch-worker-id').value;
      const targetSiteId = document.getElementById('dispatch-select-site').value;
      const shiftTiming = document.getElementById('dispatch-shift-timing').value;

      const workerIndex = state.workers.findIndex(w => w.id === workerId);
      if (workerIndex !== -1) {
        state.workers[workerIndex].status = 'Deployed';
        state.workers[workerIndex].assignedSiteId = targetSiteId;
        state.workers[workerIndex].shiftTiming = shiftTiming;

        const targetSite = state.sites.find(s => s.id === targetSiteId);
        showToast(`${state.workers[workerIndex].name} dispatched to ${targetSite ? targetSite.name : 'site'}!`, 'success');

        saveWorkers(state.workers[workerIndex], 'update');
        renderWorkforceDirectory();
        renderSitesView();
        renderAttendanceView();
        closeModal('modal-dispatch-worker');
      }
    });
  }

  // Recall / Return Worker to Pool
  function recallWorker(workerId) {
    const workerIndex = state.workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      const worker = state.workers[workerIndex];
      worker.status = 'Available';
      worker.assignedSiteId = null;
      worker.shiftTiming = null;

      showToast(`${worker.name} returned to available labour pool.`, 'info');
      saveWorkers(worker, 'update');
      renderWorkforceDirectory();
      renderSitesView();
      renderAttendanceView();
    }
  }

  // New Project Site Modal
  function setupSiteModal() {
    const form = document.getElementById('form-new-site');
    const openBtn = document.getElementById('btn-quick-new-site');
    const addOrderBtn = document.getElementById('btn-site-add-workorder');

    const handleOpen = () => {
      form.reset();
      openModal('modal-site-form');
    };

    if (openBtn) openBtn.addEventListener('click', handleOpen);
    if (addOrderBtn) addOrderBtn.addEventListener('click', handleOpen);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inp-site-name').value.trim();
        const client = document.getElementById('inp-site-client').value.trim();
        const location = document.getElementById('inp-site-location').value.trim();
        const quota = parseInt(document.getElementById('inp-site-quota').value, 10) || 10;
        const supervisor = document.getElementById('inp-site-supervisor').value.trim() || 'Chief Site Engineer';

        try {
          const created = await data.sites.create({
            name, client, location, quota, supervisor,
            shiftTiming: 'Morning Shift (07:00 - 15:30)'
          });
          state.sites.unshift(created);
          saveSites(); // persist cache + refresh KPIs (no extra network write)
          showToast(`Work order site "${created.name}" created!`, 'success');
        } catch (err) {
          showToast('Could not create site: ' + (err.message || 'error'), 'error');
        }
        renderSitesView();
        closeModal('modal-site-form');
      });
    }
  }

  // Delete Project Site
  function deleteSite(siteId) {
    const site = state.sites.find(s => s.id === siteId);
    if (!site) return;

    if (confirm(`Remove project site "${site.name}"? Any currently deployed workers will be recalled to available pool.`)) {
      state.workers.forEach(w => {
        if (w.assignedSiteId === siteId) {
          w.assignedSiteId = null;
          w.status = 'Available';
          saveWorkers(w, 'update');
        }
      });
      state.sites = state.sites.filter(s => s.id !== siteId);
      saveSites({ id: siteId }, 'delete');
      renderWorkforceDirectory();
      renderSitesView();
      showToast(`Site "${site.name}" removed.`, 'warning');
    }
  }

  // =========================================================================
  // Tab Switcher Controller
  // =========================================================================
  function switchTab(targetPanelId) {
    state.activeTab = targetPanelId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === targetPanelId);
    });
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === targetPanelId);
    });

    if (targetPanelId === 'panel-directory') renderWorkforceDirectory();
    else if (targetPanelId === 'panel-deployments') renderSitesView();
    else if (targetPanelId === 'panel-attendance') renderAttendanceView();
    else if (targetPanelId === 'panel-compliance') renderComplianceAndBadgeView();
  }

  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) switchTab(target);
      });
    });
  }

  // =========================================================================
  // Global Event Delegation & Toolbar Listeners
  // =========================================================================
  function setupEventListeners() {
    // Global Search
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderWorkforceDirectory();
      });
    }

    // Keyboard shortcut '/' focuses search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !document.activeElement.matches('input, textarea, select')) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    // Filter selects
    const filterTrade = document.getElementById('filter-trade');
    if (filterTrade) {
      filterTrade.addEventListener('change', (e) => {
        state.filterTrade = e.target.value;
        renderWorkforceDirectory();
      });
    }

    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        state.filterStatus = e.target.value;
        renderWorkforceDirectory();
      });
    }

    const filterExp = document.getElementById('filter-experience');
    if (filterExp) {
      filterExp.addEventListener('change', (e) => {
        state.filterExp = e.target.value;
        renderWorkforceDirectory();
      });
    }

    const filterSort = document.getElementById('filter-sort');
    if (filterSort) {
      filterSort.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        renderWorkforceDirectory();
      });
    }

    // Quick filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const preset = chip.getAttribute('data-preset');
        if (preset === 'all') {
          state.filterStatus = 'ALL';
          state.filterTrade = 'ALL';
          state.filterExp = 'ALL';
        } else if (preset === 'available') {
          state.filterStatus = 'Available';
          state.filterTrade = 'ALL';
        } else if (preset === 'verified') {
          state.filterStatus = 'ALL';
        } else if (preset === 'masters') {
          state.filterExp = 'Master Craftsman';
        } else if (preset === 'heavy') {
          state.filterTrade = 'Heavy Equipment Operator';
        } else if (preset === 'pending') {
          state.filterStatus = 'Pending';
        }

        if (filterStatus) filterStatus.value = state.filterStatus;
        if (filterTrade) filterTrade.value = state.filterTrade;
        if (filterExp) filterExp.value = state.filterExp;

        renderWorkforceDirectory();
      });
    });

    // Clear filters link
    const clearLink = document.getElementById('filter-clear-link');
    const emptyResetBtn = document.getElementById('btn-empty-reset');
    const resetFilters = () => {
      state.searchQuery = '';
      state.filterTrade = 'ALL';
      state.filterStatus = 'ALL';
      state.filterExp = 'ALL';
      if (searchInput) searchInput.value = '';
      if (filterTrade) filterTrade.value = 'ALL';
      if (filterStatus) filterStatus.value = 'ALL';
      if (filterExp) filterExp.value = 'ALL';
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-preset') === 'all'));
      renderWorkforceDirectory();
    };

    if (clearLink) clearLink.addEventListener('click', resetFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

    // View Mode Toggle (Grid vs Table)
    const btnGrid = document.getElementById('btn-view-grid');
    const btnTable = document.getElementById('btn-view-table');

    if (btnGrid && btnTable) {
      btnGrid.addEventListener('click', () => {
        state.viewMode = 'grid';
        btnGrid.classList.add('active');
        btnTable.classList.remove('active');
        renderWorkforceDirectory();
      });

      btnTable.addEventListener('click', () => {
        state.viewMode = 'table';
        btnTable.classList.add('active');
        btnGrid.classList.remove('active');
        renderWorkforceDirectory();
      });
    }

    // KPI Card Quick Filter clicks
    const kpiTotal = document.getElementById('kpi-total-workers');
    const kpiAvailable = document.getElementById('kpi-available-workers');
    const kpiDeployed = document.getElementById('kpi-deployed-workers');
    const kpiCompliance = document.getElementById('kpi-compliance-workers');

    if (kpiTotal) {
      kpiTotal.addEventListener('click', () => {
        switchTab('panel-directory');
        resetFilters();
      });
    }

    if (kpiAvailable) {
      kpiAvailable.addEventListener('click', () => {
        switchTab('panel-directory');
        state.filterStatus = 'Available';
        if (filterStatus) filterStatus.value = 'Available';
        renderWorkforceDirectory();
      });
    }

    if (kpiDeployed) {
      kpiDeployed.addEventListener('click', () => {
        switchTab('panel-deployments');
      });
    }

    if (kpiCompliance) {
      kpiCompliance.addEventListener('click', () => {
        switchTab('panel-compliance');
      });
    }

    // Theme Toggle (Sunlight High-Vis vs Night Ops)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_THEME_KEY, newTheme);
        showToast(`Switched to ${newTheme === 'dark' ? 'Night Operations' : 'High-Vis Daylight'} mode`, 'info');
      });
    }

    // Supabase Diagnostics Modal Trigger
    const statusPill = document.getElementById('db-status-pill');
    if (statusPill) {
      statusPill.addEventListener('click', () => {
        renderSupabaseModal();
        openModal('modal-supabase-info');
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

    // Reset Demo Data
    const btnResetDemo = document.getElementById('btn-reset-demo');
    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', () => {
        if (confirm('Reset workforce database back to initial factory demo dataset?')) {
          state.workers = JSON.parse(JSON.stringify(INITIAL_WORKERS));
          state.sites = JSON.parse(JSON.stringify(INITIAL_SITES));
          state.attendance = {};
          saveWorkers();
          saveSites();
          saveAttendance();
          renderKPIs();
          renderWorkforceDirectory();
          renderSitesView();
          renderAttendanceView();
          renderComplianceAndBadgeView();
          showToast('Database reset to factory demo records.', 'success');
        }
      });
    }

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Close on outside backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Delegated clicks inside cards and tables
    document.body.addEventListener('click', (e) => {
      const dossierBtn = e.target.closest('.btn-action-dossier');
      if (dossierBtn) {
        const id = dossierBtn.getAttribute('data-id');
        openDossierModal(id);
        return;
      }

      const dispatchBtn = e.target.closest('.btn-action-dispatch');
      if (dispatchBtn) {
        const id = dispatchBtn.getAttribute('data-id');
        openDispatchModal(id);
        return;
      }

      const recallBtn = e.target.closest('.btn-action-recall');
      if (recallBtn) {
        const id = recallBtn.getAttribute('data-id');
        recallWorker(id);
        return;
      }

      const editBtn = e.target.closest('.btn-action-edit');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        openEditWorkerModal(id);
        return;
      }

      const badgeBtn = e.target.closest('.btn-action-badge');
      if (badgeBtn) {
        const id = badgeBtn.getAttribute('data-id');
        state.selectedWorkerIdForBadge = id;
        switchTab('panel-compliance');
        renderComplianceAndBadgeView();
        return;
      }

      const siteDispatchBtn = e.target.closest('.btn-site-dispatch-crew');
      if (siteDispatchBtn) {
        const siteId = siteDispatchBtn.getAttribute('data-site-id');
        const availableWorker = state.workers.find(w => w.status === 'Available');
        if (availableWorker) {
          openDispatchModal(availableWorker.id);
          const sel = document.getElementById('dispatch-select-site');
          if (sel) sel.value = siteId;
        } else {
          showToast('No available workers in reserve pool! Register or recall workers first.', 'warning');
        }
        return;
      }

      const siteDeleteBtn = e.target.closest('.btn-site-delete');
      if (siteDeleteBtn) {
        const siteId = siteDeleteBtn.getAttribute('data-site-id');
        deleteSite(siteId);
        return;
      }
    });

    // Attendance Date change
    const attDateInput = document.getElementById('attendance-date');
    if (attDateInput) {
      attDateInput.addEventListener('change', (e) => {
        state.currentAttendanceDate = e.target.value;
        renderAttendanceView();
      });
    }

    // Attendance Punch Button Clicks (delegated)
    const attTbody = document.getElementById('attendance-table-body');
    if (attTbody) {
      attTbody.addEventListener('click', (e) => {
        const attBtn = e.target.closest('.att-btn');
        if (!attBtn) return;

        const group = attBtn.closest('.attendance-toggle-group');
        const workerId = group.getAttribute('data-worker-id');
        const statusVal = attBtn.getAttribute('data-val');

        const dateKey = state.currentAttendanceDate;
        if (!state.attendance[dateKey]) state.attendance[dateKey] = {};
        if (!state.attendance[dateKey][workerId]) state.attendance[dateKey][workerId] = { status: 'P', otHours: 0 };

        state.attendance[dateKey][workerId].status = statusVal;
        saveAttendance();
        renderAttendanceView();
      });

      attTbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('inp-att-ot')) {
          const workerId = e.target.getAttribute('data-worker-id');
          const hours = parseFloat(e.target.value) || 0;
          const dateKey = state.currentAttendanceDate;

          if (!state.attendance[dateKey]) state.attendance[dateKey] = {};
          if (!state.attendance[dateKey][workerId]) state.attendance[dateKey][workerId] = { status: 'P', otHours: 0 };

          state.attendance[dateKey][workerId].otHours = hours;
          if (hours > 0 && state.attendance[dateKey][workerId].status === 'P') {
            state.attendance[dateKey][workerId].status = 'OT';
          }
          saveAttendance();
          renderAttendanceView();
        }
      });
    }

    // "Mark All Deployed Present" Button
    const btnMarkAll = document.getElementById('btn-mark-all-present');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        const dateKey = state.currentAttendanceDate;
        if (!state.attendance[dateKey]) state.attendance[dateKey] = {};

        state.workers.forEach(w => {
          if (w.status === 'Deployed') {
            state.attendance[dateKey][w.id] = {
              status: 'P',
              otHours: (state.attendance[dateKey][w.id]?.otHours || 0)
            };
          }
        });
        saveAttendance();
        renderAttendanceView();
        showToast('All deployed crew marked Present for this shift date.', 'success');
      });
    }

    // Badge Worker Selector Change
    const badgeSelector = document.getElementById('badge-worker-selector');
    if (badgeSelector) {
      badgeSelector.addEventListener('change', (e) => {
        state.selectedWorkerIdForBadge = e.target.value;
        renderComplianceAndBadgeView();
      });
    }

    // Print Badge Button
    const btnPrintBadge = document.getElementById('btn-print-badge');
    if (btnPrintBadge) {
      btnPrintBadge.addEventListener('click', () => {
        window.print();
      });
    }

    // Export Registry CSV
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', exportWorkersCsv);
    }

    // Export Wage Sheet CSV
    const btnExportWageCsv = document.getElementById('btn-export-wage-csv');
    if (btnExportWageCsv) {
      btnExportWageCsv.addEventListener('click', exportWageSheetCsv);
    }
  }

  // =========================================================================
  // CSV Exporters
  // =========================================================================
  function exportWorkersCsv() {
    const headers = ['Worker ID', 'Name', 'Phone', 'Trade', 'Experience', 'Years Exp', 'Daily Wage ($)', 'Status', 'Assigned Site', 'KYC Verified', 'OSHA Certified', 'Medical Cleared'];
    const rows = state.workers.map(w => {
      const site = w.assignedSiteId ? state.sites.find(s => s.id === w.assignedSiteId) : null;
      return [
        w.id,
        `"${w.name.replace(/"/g, '""')}"`,
        `"${w.phone}"`,
        `"${w.trade}"`,
        `"${w.experience}"`,
        w.yearsExp,
        w.dailyRate,
        w.status,
        `"${site ? site.name.replace(/"/g, '""') : 'Unassigned'}"`,
        w.kycVerified ? 'YES' : 'NO',
        w.oshaCertified ? 'YES' : 'NO',
        w.medicalCleared ? 'YES' : 'NO'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buildvantage_labour_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Workforce Registry exported to CSV!', 'success');
  }

  function exportWageSheetCsv() {
    const dateKey = state.currentAttendanceDate;
    const daySheet = state.attendance[dateKey] || {};
    const headers = ['Shift Date', 'Worker ID', 'Name', 'Trade', 'Site', 'Base Daily Wage', 'Punch Status', 'OT Hours', 'Total Net Pay ($)'];

    const rows = state.workers.map(w => {
      const rec = daySheet[w.id] || { status: w.status === 'Deployed' ? 'P' : 'A', otHours: 0 };
      const site = w.assignedSiteId ? state.sites.find(s => s.id === w.assignedSiteId) : null;
      let multiplier = rec.status === 'P' || rec.status === 'OT' ? 1.0 : rec.status === 'H' ? 0.5 : 0;
      let otPay = (rec.otHours || 0) * ((w.dailyRate / 8) * 1.5);
      let netPay = Math.round((w.dailyRate * multiplier) + otPay);

      return [
        dateKey,
        w.id,
        `"${w.name.replace(/"/g, '""')}"`,
        `"${w.trade}"`,
        `"${site ? site.name.replace(/"/g, '""') : 'Unassigned'}"`,
        w.dailyRate,
        rec.status === 'P' ? 'PRESENT' : rec.status === 'OT' ? 'OVERTIME' : rec.status === 'H' ? 'HALF DAY' : 'ABSENT',
        rec.otHours || 0,
        netPay
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buildvantage_wage_sheet_${dateKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Wage sheet for ${dateKey} exported to CSV!`, 'success');
  }

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
  // Initialize Application
  // =========================================================================
  async function init() {
    // Gate the dashboard: only boots once an active admin is signed in.
    const admin = await requireAdmin();
    if (!admin) return;

    initData();
    renderKPIs();
    renderBadgeCount();
    renderWorkforceDirectory();
    renderSitesView();
    renderAttendanceView();
    renderComplianceAndBadgeView();

    setupTabs();
    setupWorkerFormModal();
    setupDispatchForm();
    setupSiteModal();
    setupEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
