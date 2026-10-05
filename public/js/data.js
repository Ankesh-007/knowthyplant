// Single source of truth for landing content + icons.
// OCP: add a service / step / principle here and the UI grows automatically.

// --- Icons (inner markup of a 24x24 stroke icon) --------------------------
const ICONS = {
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',

  // services
  plumbing: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  electrical: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  carpentry: '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.34 2.25.93l1.25 1.25"/>',
  painting: '<rect width="16" height="6" x="2" y="2" rx="2"/><path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7"/><rect width="4" height="6" x="8" y="16" rx="1"/>',
  cleaning: '<path d="M3 3h.01"/><path d="M7 5h.01"/><path d="M11 7h.01"/><path d="M3 7h.01"/><path d="M7 9h.01"/><path d="M3 11h.01"/><rect width="4" height="4" x="15" y="4"/><path d="m19 8 2 2v9a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-9l2-2"/>',
  cook: '<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/>',
  househelp: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  driver: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  construction: '<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',
  dailywage: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',

  // user types
  needWorker: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  findWork: '<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',

  // how it works
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 10h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  done: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',

  // trust
  verified: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  transparent: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  reputation: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  support: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>'
};

/** Build an inline SVG string for an icon name. */
export function icon(name, size = 24) {
  const inner = ICONS[name] || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// --- Content ---------------------------------------------------------------
export const serviceCategories = [
  { slug: 'plumbing', name: 'Plumbing', icon: 'plumbing' },
  { slug: 'electrical', name: 'Electrical', icon: 'electrical' },
  { slug: 'carpentry', name: 'Carpentry', icon: 'carpentry' },
  { slug: 'painting', name: 'Painting', icon: 'painting' },
  { slug: 'cleaning', name: 'Cleaning', icon: 'cleaning' },
  { slug: 'cook', name: 'Cook', icon: 'cook' },
  { slug: 'househelp', name: 'Househelp', icon: 'househelp' },
  { slug: 'driver', name: 'Driver', icon: 'driver' },
  { slug: 'construction', name: 'Construction', icon: 'construction' },
  { slug: 'dailywage', name: 'Daily Wage', icon: 'dailywage' }
];

export const howItWorksCustomer = [
  { icon: 'clipboard', title: 'Tell us what you need', text: 'Describe the job and the kind of help you are looking for.' },
  { icon: 'search', title: 'Find a suitable worker', text: 'Browse nearby workers and compare skills, experience and reviews.' },
  { icon: 'done', title: 'Get the work done', text: 'Connect, agree on the details and get the job completed.' }
];

export const howItWorksWorker = [
  { icon: 'userPlus', title: 'Create your profile', text: 'Add your skills, experience and a photo so people can trust you.' },
  { icon: 'briefcase', title: 'Find opportunities', text: 'Discover work nearby that matches what you do best.' },
  { icon: 'trendingUp', title: 'Work and build your reputation', text: 'Do great work, earn reviews and grow a reputation that brings more.' }
];

export const trustPrinciples = [
  { icon: 'verified', title: 'Verified profiles', text: 'Real people with profiles you can review before you connect.' },
  { icon: 'transparent', title: 'Transparent process', text: 'Clear skills, clear details — no hidden surprises.' },
  { icon: 'reputation', title: 'Reputation & reviews', text: 'Honest reviews help good workers and good customers stand out.' },
  { icon: 'support', title: 'Support when needed', text: 'Help is there if something does not go to plan.' }
];

export const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Find a Worker', href: '/find-workers' },
      { label: 'Find Work', href: '#', action: 'findwork' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Trust & Safety', href: '/#trust' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Help', href: '#' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' }
    ]
  }
];

export const BRAND = 'LocalHands';
