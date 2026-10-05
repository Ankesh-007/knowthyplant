// Worker profile creation: guarded page, photo upload to Storage, upsert to profiles.
import { getSupabase } from './supabaseClient.js';
import { requireAuth, getProfile } from './auth.js';
import { mountNavbar, mountFooter } from './components.js';
import { mountAuthModal } from './authModal.js';
import { serviceCategories } from './data.js';
import { toast, initials, escapeHtml } from './ui.js';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
let currentPhotoUrl = null;

function populateTrades() {
  const select = document.getElementById('trade');
  select.innerHTML =
    '<option value="" disabled selected>Choose a category…</option>' +
    serviceCategories.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
}

function setPreview({ photoUrl, name }) {
  const el = document.getElementById('photo-preview');
  if (photoUrl) {
    el.innerHTML = `<img class="worker-tile__photo" src="${escapeHtml(photoUrl)}" alt="" style="width:100%;height:100%">`;
  } else {
    el.textContent = initials(name);
  }
}

async function prefill() {
  const profile = await getProfile();
  const form = document.getElementById('profile-form');
  const name = profile?.full_name || '';
  if (profile) {
    form.full_name.value = profile.full_name || '';
    if (profile.trade) form.trade.value = profile.trade;
    form.location.value = profile.location || '';
    form.phone.value = profile.phone || '';
    form.daily_rate.value = profile.daily_rate ?? '';
    form.skills.value = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
    form.bio.value = profile.bio || '';
    currentPhotoUrl = profile.photo_url || null;
  }
  setPreview({ photoUrl: currentPhotoUrl, name });
}

function wirePhotoPreview() {
  const input = document.getElementById('photo');
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast('Please choose an image under 5 MB.', 'error');
      input.value = '';
      return;
    }
    const el = document.getElementById('photo-preview');
    el.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  });
}

async function uploadPhoto(supabase, userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('worker-photos')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from('worker-photos').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`; // cache-bust after re-upload
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = document.getElementById('save-btn');

  if (!form.full_name.value.trim() || !form.trade.value) {
    toast('Please add your name and pick a category.', 'error');
    return;
  }

  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = 'Saving…';
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/?auth=login'; return; }

    const file = form.photo.files?.[0];
    let photoUrl = currentPhotoUrl;
    if (file) photoUrl = await uploadPhoto(supabase, user.id, file);

    const rate = parseFloat(form.daily_rate.value);
    const payload = {
      id: user.id,
      role: 'worker',
      full_name: form.full_name.value.trim(),
      trade: form.trade.value,
      location: form.location.value.trim() || null,
      phone: form.phone.value.trim() || null,
      daily_rate: Number.isFinite(rate) ? rate : null,
      skills: form.skills.value.split(',').map((s) => s.trim()).filter(Boolean),
      bio: form.bio.value.trim() || null,
      photo_url: photoUrl
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) throw error;

    toast('Profile saved!', 'success');
    setTimeout(() => { window.location.href = '/find-workers'; }, 700);
  } catch (err) {
    toast(err.message || 'Could not save your profile. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = label;
  }
}

async function init() {
  mountNavbar({ active: 'find-work' });
  mountFooter();
  mountAuthModal();

  const session = await requireAuth('worker'); // redirects if signed out / wrong role
  if (!session) return;

  populateTrades();
  await prefill();
  wirePhotoPreview();
  document.getElementById('profile-form').addEventListener('submit', onSubmit);
}

document.addEventListener('DOMContentLoaded', init);
