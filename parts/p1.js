<script>
/* =========================================================
 * Training & Certificate Portal — client app v2 (vanilla JS)
 * ========================================================= */
(function () {
'use strict';

// ---------- Icons ----------
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  calplus: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v6M9 15.5h6"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5M8 7h8M8 11h6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14 -1.5 8 5-3 5 3-1.5-8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  shield: '<path d="M12 2.5 4 6v6c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
  map: '<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 8h6M7 11h4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  banner: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 15l5-4 4 3 3-2 7 5"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  csv: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M9 13l6 5M15 13l-6 5"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
  coin: '<ellipse cx="12" cy="12" rx="9" ry="9"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.7-2.5 2-2.5.8-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2"/>',
  receipt: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3"/><circle cx="16" cy="8" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="8" cy="16" r="1.3"/><circle cx="16" cy="16" r="1.3"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'
};
const ic = (n, cls) => `<svg ${cls ? `class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;
const icS = (n, px) => ic(n).replace('<svg', `<svg style="width:${px || 14}px;height:${px || 14}px;vertical-align:-2px"`);

// ---------- Utils ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TH_M = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_D = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TH_DS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const EN_M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const p2 = n => String(n).padStart(2, '0');
const pd = s => { const [y, m, d] = String(s || '').slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const thDate = (s, long) => { if (!s) return '-'; const d = pd(s); return `${d.getDate()} ${(long ? TH_M : TH_MS)[d.getMonth()]} ${d.getFullYear() + 543}`; };
const thDateRange = (a, b) => (!b || a === b) ? thDate(a, true) : `${thDate(a)} – ${thDate(b)}`;
const thMonth = s => { const d = pd(s + '-01'); return `${TH_M[d.getMonth()]} ${d.getFullYear() + 543}`; };
const thDT = iso => { if (!iso) return '-'; const d = new Date(iso); return isNaN(d) ? String(iso) : `${thDate(ymd(d))} ${p2(d.getHours())}:${p2(d.getMinutes())} น.`; };
const todayStr = () => ymd(new Date());
const certDate = (s, lang) => { const d = pd(s); return lang === 'th' ? `${d.getDate()} ${TH_M[d.getMonth()]} ${d.getFullYear() + 543}` : `${d.getDate()} ${EN_M[d.getMonth()]} ${d.getFullYear()}`; };
const initials = u => (u && (u.firstName || u.email || '?')).trim().charAt(0).toUpperCase();
const avatar = (u, cls) => `<div class="avatar ${cls || ''}">${u && u.photoUrl ? `<img src="${esc(u.photoUrl)}" alt="">` : esc(initials(u))}</div>`;
const isTrue = v => v === true || String(v).toUpperCase() === 'TRUE';
const money = n => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const sessDT = (s, end) => new Date(`${end ? (s.endDate || s.date) : s.date}T${(end ? s.endTime : s.startTime) || (end ? '23:59' : '00:00')}:00+07:00`);
const appUrl = () => (window.API_URL && location.origin + location.pathname) || (S.settings && S.settings.APP_URL) || ((window.BOOT || {}).appUrl && String(window.BOOT.appUrl).indexOf('<?') !== 0 ? window.BOOT.appUrl : '') || location.href.split('?')[0].split('#')[0];
const csvDownload = (rows, name) => {
  const csv = '﻿' + rows.map(l => l.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob('data:text/csv;charset=utf-8,' + encodeURIComponent(csv), name);
};

// ---------- State ----------
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } }
};
const S = {
  token: LS.get('tp_token'), user: null, settings: {}, route: 'home', params: {}, banners: null,
  book: { courseId: '', sessionId: '' }, adminTab: 'dash', admin: null, cal: {}
};
const rewardsOn = () => isTrue(S.settings.REWARDS_ENABLED) || (S.user && S.user.role === 'admin');

// ---------- API ----------
function call(action, payload) {
  payload = Object.assign({}, payload || {}, { token: S.token });
  return new Promise((resolve, reject) => {
    const done = res => {
      if (res && res.ok) return resolve(res.data);
      if (res && res.code === 'AUTH') { logout(true); }
      reject(new Error((res && res.error) || 'เกิดข้อผิดพลาด'));
    };
    if (window.API_URL) {
      fetch(window.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }), redirect: 'follow' })
        .then(r => { if (!r.ok) throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (' + r.status + ')'); return r.json(); })
        .then(done).catch(e => reject(new Error(/fetch|network|load/i.test(e.message) ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต' : e.message)));
    } else if (window.google && google.script && google.script.run) {
      google.script.run.withSuccessHandler(done).withFailureHandler(e => reject(e)).api(action, payload);
    } else if (window.MockAPI) {
      setTimeout(() => { try { done(window.MockAPI(action, JSON.parse(JSON.stringify(payload)))); } catch (e) { reject(e); } }, 160);
    } else reject(new Error('ไม่พบ backend'));
  });
}
async function run(action, payload, opt) {
  opt = opt || {};
  if (!opt.silent) loading(true);
  try { const d = await call(action, payload); if (opt.ok) toast(opt.ok); return d; }
  catch (e) { toast(e.message, true); throw e; }
  finally { if (!opt.silent) loading(false); }
}
// ข้อมูลหน้าแรก: รวมคำขอที่ซ้ำกันภายใน 5 วิ และจำไว้ในเครื่องเพื่อเปิดหน้าครั้งต่อไปได้ทันที
let HOME_P = null, HOME_T = 0;
// บน Netlify (deploy ผ่าน GitHub) ข้อมูลหน้าแรกมาจากแคชของ Netlify ที่ /api/home ซึ่งเร็วกว่าเรียก Apps Script ตรง
let EDGE_OFF = false;
function edgeHome() {
  if (EDGE_OFF || !window.API_URL || !/^https?:$/.test(location.protocol)) return Promise.reject(new Error('no edge'));
  return fetch('/api/home', { headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('edge ' + r.status)))
    .then(j => { if (j && j.ok) return j.data; throw new Error('edge'); })
    .catch(e => { EDGE_OFF = true; throw e; });
}
function fetchHome(force) {
  if (!force && HOME_P && Date.now() - HOME_T < 5000) return HOME_P;
  HOME_T = Date.now();
  HOME_P = edgeHome().catch(() => call('publicHome', {})).then(d => {
    LS.set('tp_home', JSON.stringify(d)); S.banners = d.banners || {}; S.settings = Object.assign(S.settings, d.settings); return d;
  }).catch(e => { HOME_P = null; throw e; });
  return HOME_P;
}
function cachedHome() { try { return JSON.parse(LS.get('tp_home') || 'null'); } catch (e) { return null; } }
async function refreshMe() { try { const d = await call('me', {}); S.user = d.user; S.settings = Object.assign(S.settings, d.settings); } catch (e) { } }

// ---------- UI helpers ----------
function toast(msg, err) {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), err ? 5500 : 3000);
}
let loadCount = 0;
function loading(on) {
  loadCount += on ? 1 : -1; if (loadCount < 0) loadCount = 0;
  let el = $('.loader');
  if (loadCount && !el) { el = document.createElement('div'); el.className = 'loader'; el.innerHTML = '<div class="spin"></div>'; document.body.appendChild(el); }
  if (!loadCount && el) el.remove();
}
function modal(title, body, foot, opt) {
  opt = opt || {};
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${opt.wide ? 'wide' : ''}"><div class="modal-h"><h3>${title}</h3><button class="icon-btn" data-x>${ic('x')}</button></div>
    <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  document.body.appendChild(bg);
  const close = () => { bg.remove(); opt.onClose && opt.onClose(); };
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-x]')) close(); });
  return { el: bg, close };
}
function confirmBox(msg, okText, danger) {
  return new Promise(res => {
    const m = modal('ยืนยัน', `<p style="margin:0">${msg}</p>`, `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${okText || 'ยืนยัน'}</button>`);
    m.el.querySelector('[data-ok]').onclick = () => { m.close(); res(true); };
    m.el.addEventListener('click', e => { if (e.target.closest('[data-x]')) res(false); });
  });
}
function renderMailTpl(tpl, vars, html) {
  var out = String(tpl || '').replace(/\{([^{}\n]{1,30})\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k] == null ? '' : vars[k]) : m; });
  if (!html) return out.replace(/\s*\n\s*/g, ' ').trim();
  out = out.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/https?:\/\/[^\s<]+/g, function (u) { return '<a href="' + u + '" style="color:#1a4fa0">' + u + '</a>'; });
  return out.replace(/\n/g, '<br>');
}
function copyText(t) {
  const done = () => toast('คัดลอกแล้ว');
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(done).catch(() => fallback());
  fallback();
  function fallback() { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง', true); } a.remove(); }
}
/** กล่องข้อมูลบริษัทสำหรับออกหนังสือรับรองหัก ณ ที่จ่าย + ปุ่มคัดลอก */
function payeeBox() {
  const t = String(S.settings.WHT_PAYEE_INFO || '').trim(); if (!t) return '';
  return `<div class="payee-box"><div class="pb-h">${ic('file')}<b>ข้อมูลสำหรับออกหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</b><button type="button" class="btn btn-ghost btn-sm" data-copy-payee>${ic('copy')} คัดลอก</button></div><div class="pb-t">${esc(t).replace(/\n/g, '<br>')}</div><div class="tiny muted">คัดลอกไปส่งฝ่ายบัญชีของท่าน เพื่อออกหนังสือรับรองในนามบริษัทนี้</div></div>`;
}
document.addEventListener('click', e => { if (e.target.closest('[data-copy-payee]')) copyText(String(S.settings.WHT_PAYEE_INFO || '').trim()); });
function formData(root) {
  const o = {};
  $$('[name]', root).forEach(el => {
    if (el.type === 'file') return;
    if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; return; }
    o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  });
  return o;
}
function readFile(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file.size > 25 * 1024 * 1024) return reject(new Error('ไฟล์ใหญ่เกิน 25MB กรุณาใช้ลิงก์ Google Drive / YouTube แทน'));
    const r = new FileReader();
    r.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    r.onload = () => {
      if (!maxW || !/^image\/(png|jpe?g|webp)/.test(file.type)) return resolve({ name: file.name, mimeType: file.type, data: r.result });
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxW / img.naturalWidth);
        const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve({ name: file.name.replace(/\.\w+$/, '.jpg'), mimeType: 'image/jpeg', data: c.toDataURL('image/jpeg', quality || 0.88), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve({ name: file.name, mimeType: file.type, data: r.result });
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
function downloadBlob(dataUrl, name) {
  const a = document.createElement('a'); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
const statusChip = st => ({
  registered: '<span class="chip info"><span class="dot"></span>ลงทะเบียนแล้ว</span>',
  attended: '<span class="chip ok"><span class="dot"></span>เข้าร่วมแล้ว</span>',
  absent: '<span class="chip bad"><span class="dot"></span>ไม่ได้เข้าร่วม</span>',
  cancelled: '<span class="chip"><span class="dot"></span>ยกเลิก</span>'
}[st] || `<span class="chip">${esc(st)}</span>`);
const sessionChip = st => ({
  open: '<span class="chip ok">เปิดรับสมัคร</span>', closed: '<span class="chip warn">ปิดรับสมัคร</span>',
  draft: '<span class="chip">ฉบับร่าง</span>', done: '<span class="chip info">จบการอบรม</span>', cancelled: '<span class="chip bad">ยกเลิก</span>'
}[st] || `<span class="chip">${esc(st)}</span>`);
const payChip = st => ({
  free: '', unpaid: '<span class="chip warn">รอชำระค่าอบรม</span>', review: '<span class="chip info">รอตรวจสอบการชำระ</span>',
  paid: '<span class="chip ok">ชำระแล้ว</span>', rejected: '<span class="chip bad">หลักฐานไม่ผ่าน</span>'
}[st || 'free'] || '');

// ---------- ไลบรารีภายนอก โหลดเมื่อจำเป็นเท่านั้น (หน้าแรกเปิดเร็วขึ้น) ----------
const loadJs = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = () => no(new Error('โหลดไลบรารีไม่สำเร็จ กรุณาลองใหม่')); document.head.appendChild(s); });
const LIBS = {};
const needLib = (key, src) => window[key] ? Promise.resolve() : (LIBS[key] = LIBS[key] || loadJs(src).catch(e => { delete LIBS[key]; throw e; }));
const needQr = () => needLib('qrcode', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js');
const needPdf = () => needLib('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

// ---------- QR code ----------
function drawQR(ctx, text, x, y, size, color) {
  if (!window.qrcode) return false;
  const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), quiet = 2, cell = size / (n + quiet * 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, size, size);
  ctx.fillStyle = color || '#111111';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c))
    ctx.fillRect(Math.floor(x + (c + quiet) * cell), Math.floor(y + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
  return true;
}
function qrCanvas(text, px, color) {
  const c = document.createElement('canvas'); c.width = c.height = px || 320;
  drawQR(c.getContext('2d'), text, 0, 0, c.width, color);
  return c;
}

// ---------- Calendar export / share ----------
const gcalStamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function gcalUrl(s) {
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: 'อบรม: ' + (s.courseTitle || ''), dates: gcalStamp(sessDT(s)) + '/' + gcalStamp(sessDT(s, true)),
    details: `${s.courseTitle || ''}${s.title ? ' · ' + s.title : ''}\n${s.mapUrl || ''}\n${appUrl()}`, location: s.location || ''
  });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
function icsData(s) {
  const e = x => String(x || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Training Portal//TH', 'METHOD:PUBLISH', 'BEGIN:VEVENT', 'UID:' + s.id + '@training',
    'DTSTAMP:' + gcalStamp(new Date()), 'DTSTART:' + gcalStamp(sessDT(s)), 'DTEND:' + gcalStamp(sessDT(s, true)),
    'SUMMARY:' + e('อบรม: ' + (s.courseTitle || '')), 'LOCATION:' + e(s.location), 'DESCRIPTION:' + e((s.title || '') + ' ' + (s.mapUrl || '')),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(`พรุ่งนี้ ${s.startTime || ''} น. อบรม ${s.courseTitle || ''} ที่ ${s.location || ''}`), 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
function addToCalendar(s) {
  const m = modal('บันทึกลงปฏิทินของท่าน', `<div class="sd-mini"><b>${esc(s.courseTitle)}</b><div class="meta" style="margin-top:6px"><span>${ic('cal')}${thDateRange(s.date, s.endDate)}</span><span>${ic('clock')}${esc(s.startTime)}–${esc(s.endTime)} น.</span><span>${ic('pin')}${esc(s.location || '-')}</span></div></div>
    <div class="grid" style="gap:10px;margin-top:16px">
      <a class="btn btn-primary btn-block" href="${esc(gcalUrl(s))}" target="_blank" rel="noopener">${ic('calplus')} เพิ่มใน Google Calendar</a>
      <button class="btn btn-ghost btn-block" id="ics">${ic('dl')} ดาวน์โหลดไฟล์ปฏิทิน (.ics) · iPhone / Outlook</button></div>
    <p class="tiny muted" style="margin:14px 0 0">ไฟล์ .ics ตั้งการแจ้งเตือนล่วงหน้า 1 วัน (หัวข้อ เวลา สถานที่) ให้อัตโนมัติ · สำหรับ Google Calendar กรุณาตั้งแจ้งเตือน “1 วันก่อน” ในหน้าที่เปิดขึ้น</p>`);
  $('#ics', m.el).onclick = () => downloadBlob(icsData(s), `training_${s.date}.ics`);
}
const courseShareUrl = id => appUrl() + '?course=' + encodeURIComponent(id);
function shareLine(courseId) {
  const url = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(courseShareUrl(courseId));
  window.open(url, '_blank', 'noopener');
}
const lineBtn = (courseId, label, cls) => `<button class="btn btn-line ${cls || 'btn-sm'}" data-line="${esc(courseId)}" title="แชร์หลักสูตรนี้ให้เพื่อนทาง LINE">${icS('share', 15)} ${label == null ? 'แชร์ LINE' : label}</button>`;

// ---------- Mini calendar ----------
function calState(key, events) {
  if (!S.cal[key]) {
    const t = new Date(), up = events.map(e => e.date).filter(d => d >= todayStr()).sort()[0];
    const base = up ? pd(up) : t;
    S.cal[key] = { y: base.getFullYear(), m: base.getMonth(), sel: '' };
  }
  return S.cal[key];
}
function eventDays(e) {
  const out = [], a = pd(e.date), b = pd(e.endDate || e.date);
  for (let d = new Date(a); d <= b && out.length < 31; d.setDate(d.getDate() + 1)) out.push(ymd(d));
  return out;
}
function calendarHtml(key, events, opt) {
  opt = opt || {};
  const st = calState(key, events), first = new Date(st.y, st.m, 1), days = new Date(st.y, st.m + 1, 0).getDate();
  const map = {};
  events.forEach(e => eventDays(e).forEach(d => { (map[d] = map[d] || []).push(e); }));
  const today = todayStr(), cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push('<div class="cd empty"></div>');
  for (let d = 1; d <= days; d++) {
    const k = `${st.y}-${p2(st.m + 1)}-${p2(d)}`, ev = map[k] || [];
    const cols = [...new Set(ev.map(e => e.color || '#0f2242'))].slice(0, 3);
    cells.push(`<button class="cd ${ev.length ? 'has' : ''} ${k === today ? 'today' : ''} ${k === st.sel ? 'sel' : ''} ${k < today ? 'past' : ''}" data-day="${k}" ${ev.length ? '' : 'tabindex="-1"'}>
      <span>${d}</span>${cols.length ? `<i>${cols.map(c => `<b style="background:${esc(c)}"></b>`).join('')}</i>` : ''}</button>`);
  }
  const yNow = new Date().getFullYear();
  const years = []; for (let y = yNow - 2; y <= yNow + 2; y++) years.push(y);
  if (!years.includes(st.y)) years.push(st.y);
  return `<div class="calendar" data-cal="${key}">
    <div class="cal-h"><button class="icon-btn" data-cal-nav="-1" title="เดือนก่อนหน้า">${ic('left')}</button>
      <div class="cal-title"><select class="cal-sel" data-cal-m>${TH_M.map((n, i) => `<option value="${i}" ${i === st.m ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select class="cal-sel" data-cal-y>${years.sort().map(y => `<option value="${y}" ${y === st.y ? 'selected' : ''}>${y + 543}</option>`).join('')}</select></div>
      <button class="icon-btn" data-cal-nav="1" title="เดือนถัดไป">${ic('right')}</button></div>
    <div class="cal-dow">${TH_DS.map(d => `<span>${d}</span>`).join('')}</div>
    <div class="cal-grid">${cells.join('')}</div>
    ${opt.legend && opt.legend.length ? `<div class="cal-legend">${opt.legend.map(l => `<span><i class="dotc" style="background:${esc(l.color)}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''}
    <div class="cal-foot"><button class="btn btn-ghost btn-sm" data-cal-today>วันนี้</button>${st.sel ? `<button class="btn btn-ghost btn-sm" data-cal-clear>แสดงทั้งเดือน</button>` : ''}</div>
  </div>`;
}
function bindCalendar(root, key, onChange) {
  const box = $(`[data-cal="${key}"]`, root); if (!box) return;
  const st = S.cal[key];
  $$('[data-cal-nav]', box).forEach(b => b.onclick = () => { const d = new Date(st.y, st.m + Number(b.dataset.calNav), 1); st.y = d.getFullYear(); st.m = d.getMonth(); st.sel = ''; onChange(); });
  $('[data-cal-m]', box).onchange = e => { st.m = +e.target.value; st.sel = ''; onChange(); };
  $('[data-cal-y]', box).onchange = e => { st.y = +e.target.value; st.sel = ''; onChange(); };
  $$('[data-day]', box).forEach(b => b.onclick = () => { st.sel = st.sel === b.dataset.day ? '' : b.dataset.day; onChange(); });
  $('[data-cal-today]', box).onclick = () => { const t = new Date(); st.y = t.getFullYear(); st.m = t.getMonth(); st.sel = todayStr(); onChange(); };
  const cl = $('[data-cal-clear]', box); if (cl) cl.onclick = () => { st.sel = ''; onChange(); };
}
const inCalView = (key, s) => {
  const st = S.cal[key]; if (!st) return true;
  if (st.sel) return eventDays(s).includes(st.sel);
  const mk = `${st.y}-${p2(st.m + 1)}`;
  return eventDays(s).some(d => d.slice(0, 7) === mk);
};
const calViewLabel = key => { const st = S.cal[key]; return st.sel ? 'วันที่ ' + thDate(st.sel, true) : 'เดือน' + TH_M[st.m] + ' ' + (st.y + 543); };

// ---------- Banners (editable on every page) ----------
const BANNER_PLACES = [['home', 'สไลด์หน้าแรก', '1920 × 700 px'], ['schedule', 'หน้าตารางอบรม', '1920 × 400 px'], ['my', 'หน้าการอบรมของฉัน', '1920 × 400 px'], ['rewards', 'หน้าแลกของรางวัล', '1920 × 400 px']];
const bannerSize = pl => (BANNER_PLACES.find(x => x[0] === pl) || BANNER_PLACES[1])[2];
async function getBanners(force) {
  if (!S.banners || force) await fetchHome(force);
  return S.banners;
}
function bannerBlock(pl) {
  const b = ((S.banners || {})[pl] || [])[0];
  const admin = S.user && S.user.role === 'admin';
  if (!b && !admin) return '';
  if (!b) return `<div class="page-banner empty-banner"><button class="btn btn-ghost btn-sm" data-edit-banner="${pl}">${ic('plus')} เพิ่มแบนเนอร์หน้านี้ <span class="tiny muted">(${bannerSize(pl)})</span></button></div>`;
  const inner = `${b.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="">` : ''}<div class="shade"></div>
    <div class="pb-copy">${b.title ? `<h2>${esc(b.title)}</h2>` : ''}${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}</div>`;
  return `<div class="page-banner">${b.link ? `<a href="${esc(b.link)}" target="_blank" rel="noopener">${inner}</a>` : inner}
    ${admin ? `<button class="edit-fab" data-edit-banner="${pl}" data-bid="${esc(b.id)}">${icS('edit', 14)} แก้ไขแบนเนอร์ · ${bannerSize(pl)}</button>` : ''}</div>`;
}
function bindBanners(root, reload) {
  $$('[data-edit-banner]', root).forEach(b => b.onclick = async e => {
    e.preventDefault(); e.stopPropagation();
    await adminLoad(true);
    const pl = b.dataset.editBanner, cur = b.dataset.bid ? S.admin.banners.find(x => x.id === b.dataset.bid) : null;
    if (pl === 'home') { S.params = { tab: 'banners', bp: 'home' }; return go('admin', { tab: 'banners', bp: 'home' }); }
    bannerForm(cur || { active: true, placement: pl, month: '' }, null, async () => { await getBanners(true); reload(); });
  });
}

// ---------- Router ----------
const MAIN_NAV = [
  ['home', 'หน้าแรก', 'home'], ['schedule', 'ตารางอบรม', 'cal'], ['my', 'การอบรมของฉัน', 'book'], ['certs', 'ใบประกาศ', 'award'], ['rewards', 'แลกของรางวัล', 'gift'], ['profile', 'ข้อมูลส่วนตัว', 'user']
];
const NEED_AUTH = ['my', 'certs', 'profile', 'book', 'admin', 'rewards', 'checkin'];
function go(route, params) {
  if (NEED_AUTH.includes(route) && !S.user) { S.after = { route, params }; route = 'login'; params = { mode: (params && params.mode) || 'login' }; }
  if (route === 'admin' && S.user && S.user.role !== 'admin') route = 'home';
  S.route = route; S.params = params || {};
  render();
  window.scrollTo(0, 0);
}
function logout(silent) {
  S.token = null; S.user = null; S.admin = null; LS.set('tp_token', null);
  if (!silent) toast('ออกจากระบบแล้ว');
  go('home');
}

function shell() {
  const st = S.settings || {};
  const u = S.user;
  const logo = st.LOGO_URL ? `<img src="${esc(st.LOGO_URL)}" alt="">` : esc((st.ORG_SHORT || 'TP').replace(/[^A-Za-zก-๙]/g, '').slice(0, 3).toUpperCase());
  const navItems = MAIN_NAV.filter(n => (u || ['home', 'schedule'].includes(n[0])) && n[0] !== 'profile' && (n[0] !== 'rewards' || rewardsOn()));
  const pts = u && u.points ? u.points.balance : 0;
  const tabs = [MAIN_NAV[0], MAIN_NAV[1], MAIN_NAV[2], MAIN_NAV[3]];
  return `
  ${window.DEMO_RIBBON ? window.DEMO_RIBBON() : ''}
  <header class="topbar"><div class="wrap">
    <div class="brand" data-go="home"><div class="brand-mark">${logo}</div>
      <div class="brand-text"><b>${esc(st.ORG_SHORT || 'Training Portal')}</b><span>Training &amp; Certification</span></div></div>
    <nav class="nav">${navItems.map(n => `<a data-go="${n[0]}" class="${S.route === n[0] || (n[0] === 'schedule' && S.route === 'book') ? 'active' : ''}">${n[1]}</a>`).join('')}
      ${u && u.role === 'admin' ? `<a data-go="admin" class="${S.route === 'admin' ? 'active' : ''}">ผู้ดูแลระบบ</a>` : ''}</nav>
    <div class="user-area nav-desk-user">
    ${u ? `${rewardsOn() ? `<a class="pts-chip" data-go="rewards" title="แต้มสะสมปี ${u.points ? u.points.year + 543 : ''}">${icS('coin', 16)}<b>${money(pts)}</b><span>แต้ม</span></a>` : ''}
      <div class="user-chip" data-menu>${avatar(u)}<span class="nm">${esc(u.firstName)}</span></div>`
      : `<button class="btn btn-gold btn-sm" data-go="login"><span class="hide-sm">เข้าสู่ระบบ / สมัครสมาชิก</span><span class="show-sm">เข้าสู่ระบบ</span></button>`}
    </div>
  </div></header>
  <main id="view"></main>
  <footer><div class="wrap"><div><b>${esc(st.ORG_NAME || '')}</b><div>${esc(st.CONTACT || '')}</div></div>
    <div class="row" style="gap:18px"><a data-go="verify" style="color:#d4af6a;cursor:pointer">ตรวจสอบใบประกาศนียบัตร</a>${u ? `<a data-go="checkin" style="color:#d4af6a;cursor:pointer">เช็คอินหน้างาน</a>` : ''}</div></div></footer>
  ${u ? `<nav class="tabbar">${tabs.map(n => `<a data-go="${n[0]}" class="${S.route === n[0] ? 'active' : ''}">${ic(n[2])}<span>${n[1].replace('การอบรมของฉัน', 'ของฉัน')}</span></a>`).join('')}
    ${u.role === 'admin' ? `<a data-go="admin" class="${S.route === 'admin' ? 'active' : ''}">${ic('shield')}<span>แอดมิน</span></a>` : `<a data-go="profile" class="${S.route === 'profile' ? 'active' : ''}">${ic('user')}<span>โปรไฟล์</span></a>`}</nav>` : ''}`;
}

const VIEWS = {};
function render() {
  const app = $('#app');
  app.innerHTML = shell();
  const v = VIEWS[S.route] || VIEWS.home;
  const el = $('#view');
  Promise.resolve(v(el)).catch(e => { el.innerHTML = `<div class="wrap page"><div class="card empty">${ic('alert')}<div>${esc(e.message)}</div></div></div>`; });
}

document.addEventListener('click', e => {
  const ln = e.target.closest('[data-line]');
  if (ln) { e.preventDefault(); e.stopPropagation(); shareLine(ln.dataset.line); return; }
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); const p = g.dataset.p ? JSON.parse(g.dataset.p) : {}; closeMenu(); go(g.dataset.go, p); return; }
  const m = e.target.closest('[data-menu]');
  if (m) { toggleMenu(m); return; }
  if (!e.target.closest('.menu')) closeMenu();
});
function closeMenu() { $$('.menu').forEach(x => x.remove()); }
function toggleMenu(anchor) {
  if ($('.menu', anchor)) return closeMenu();
  const u = S.user;
  const d = document.createElement('div'); d.className = 'menu';
  d.innerHTML = `<div style="padding:10px 12px"><b>${esc(u.fullName)}</b><div class="tiny muted">${esc(u.email)}</div></div><hr>
    <a data-go="profile">${ic('user')} ข้อมูลส่วนตัว</a><a data-go="my">${ic('book')} การอบรมของฉัน</a><a data-go="certs">${ic('award')} ใบประกาศของฉัน</a>
    ${rewardsOn() ? `<a data-go="rewards">${ic('gift')} แลกของรางวัล</a>` : ''}<a data-go="checkin">${ic('qr')} เช็คอินหน้างาน</a>
    ${u.role === 'admin' ? `<a data-go="admin">${ic('shield')} ผู้ดูแลระบบ</a>` : ''}<hr><a data-logout>${ic('out')} ออกจากระบบ</a>`;
  $$('svg', d).forEach(s => { s.style.width = '17px'; s.style.height = '17px'; s.style.color = 'var(--gold)'; });
  anchor.appendChild(d);
  d.querySelector('[data-logout]').onclick = ev => { ev.stopPropagation(); closeMenu(); logout(); };
}

// ---------- Shared renderers ----------
function courseCard(c, opt) {
  opt = opt || {};
  return `<div class="card course ${Number(c.price) ? 'paid' : ''} ${opt.selectable ? 'selectable' : ''} ${opt.selected ? 'selected' : ''}" style="--c:${esc(c.color || '#0f2242')}" ${opt.selectable ? `data-pick-course="${c.id}"` : ''}>
    <div class="tick">${ic('check')}</div>
    <div class="course-top">${c.coverUrl ? `<img src="${esc(c.coverUrl)}" alt="">` : ''}<div class="course-code">${esc(c.code || '')}</div><div class="course-hours">${esc(c.hours || '-')} ชั่วโมง${Number(c.price) ? '' : ' · ฟรี'}</div>${Number(c.price) ? `<div class="course-price">${icS('tag', 13)} ${money(c.price)} บาท</div>` : ''}</div>
    <div class="course-body"><h3>${esc(c.title)}</h3><p>${esc(c.subtitle || '')}</p>${opt.desc !== false ? `<p class="small muted">${esc(c.description || '')}</p>` : ''}
      <div class="course-foot">${opt.foot || ''}</div></div></div>`;
}
function dateBox(s) {
  const d = pd(s.date);
  return `<div class="datebox" style="--c:${esc(s.courseColor || '#0f2242')}"><div class="m">${TH_MS[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}</div><div class="d">${d.getDate()}</div><div class="w">${TH_D[d.getDay()]}</div></div>`;
}
function seatsHtml(s) {
  if (!Number(s.capacity)) return `<div class="small muted">ไม่จำกัดที่นั่ง</div>`;
  const pct = Math.min(100, Math.round(s.registered / Number(s.capacity) * 100));
  return `<div class="small"><b>${s.seatsLeft}</b> <span class="muted">/ ${s.capacity} ที่นั่งว่าง</span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
}
const feeText = s => Number(s.feeTotal) ? `${money(s.feeTotal)} บาท${isTrue(s.vat) ? ' + VAT' : ''}` : 'ไม่มีค่าใช้จ่าย';
const isPaid = s => Number(s.feeTotal) > 0;
const priceTag = s => isPaid(s) ? `<span class="price-tag">${icS('tag', 13)} ${money(s.feeTotal)} บาท${isTrue(s.vat) ? ' + VAT' : ''}</span>` : `<span class="free-tag">ฟรี</span>`;
function sessionRow(s, action) {
  return `<div class="session ${isPaid(s) ? 'paid' : 'free'}">${dateBox(s)}
    <div class="session-info"><div class="tiny" style="color:${esc(s.courseColor)};font-weight:600;letter-spacing:1px">${esc(s.courseCode || '')}</div>
      <h3>${esc(s.courseTitle || '')} ${priceTag(s)}</h3>
      <div class="meta"><span>${ic('cal')}${thDateRange(s.date, s.endDate)}${s.title ? ' · ' + esc(s.title) : ''}</span>
      <span>${ic('clock')}${esc(s.startTime || '-')}–${esc(s.endTime || '-')} น.</span>
      <span>${ic('pin')}${esc(s.location || '-')}</span></div></div>
    <div class="seats">${seatsHtml(s)}</div>
    <div class="session-act">${action || ''}</div></div>`;
}
function bookBtn(s) {
  if (!S.user) return `<button class="btn btn-ghost btn-sm" data-go="login">เข้าสู่ระบบเพื่อจอง</button>`;
  if (s.myStatus) return `<span class="chip ok">${icS('check', 13)} ลงทะเบียนแล้ว</span>`;
  if (s.status !== 'open') return sessionChip(s.status);
  if (s.seatsLeft === 0) return `<span class="chip bad">เต็มแล้ว</span>`;
  return `<button class="btn btn-primary btn-sm" data-go="book" data-p='${JSON.stringify({ courseId: s.courseId, sessionId: s.id })}'>จองที่นั่ง</button>`;
}
function sessionDetailCard(s) {
  return `<div class="card sdetail ${isPaid(s) ? 'paid' : 'free'}" style="--c:${esc(s.courseColor || '#0f2242')}">${isPaid(s) ? `<div class="paid-ribbon">${icS('tag', 13)} หลักสูตรพิเศษ · ${money(s.feeTotal)} บาท</div>` : ''}
    <div class="sd-top">${dateBox(s)}<div style="flex:1;min-width:0">
      <div class="tiny" style="color:${esc(s.courseColor)};font-weight:600;letter-spacing:1px">${esc(s.courseCode || '')}${s.title ? ' · ' + esc(s.title) : ''}</div>
      <h3>${esc(s.courseTitle || '')} ${priceTag(s)}</h3>
      <div class="meta"><span>${ic('cal')}${thDateRange(s.date, s.endDate)}</span><span>${ic('clock')}${esc(s.startTime || '-')}–${esc(s.endTime || '-')} น.</span>
        <span>${ic('pin')}${esc(s.location || '-')}${s.mapUrl ? ` · <a href="${esc(s.mapUrl)}" target="_blank" rel="noopener">แผนที่</a>` : ''}</span></div>
      <div class="meta" style="margin-top:4px"><span>${ic('receipt')}${feeText(s)}</span><span>${ic('coin')}${esc(s.hours || '-')} ชม. · รับ ${Math.round(Number(s.hours || 0) * Number(S.settings.POINTS_PER_HOUR || 1))} แต้ม</span></div>
    </div></div>
    <div class="sd-foot"><div class="seats">${seatsHtml(s)}</div>
      <div class="row" style="gap:8px;justify-content:flex-end">${lineBtn(s.courseId, '')}<button class="btn btn-ghost btn-sm" data-addcal="${esc(s.id)}" title="บันทึกลงปฏิทิน">${icS('calplus', 15)} <span class="hide-sm">บันทึกลงปฏิทิน</span></button>${bookBtn(s)}</div></div>
  </div>`;
}
function rulesStrip(rules) {
  if (!rules) return '';
  if (rules.banned) return `<div class="rules bad">${ic('alert')}<div><b>ระงับสิทธิ์การลงทะเบียนถึงวันที่ ${thDate(rules.bannedUntil, true)}</b><div class="small">เนื่องจากเลื่อน/ยกเลิก/ไม่มาอบรมเกิน ${rules.strikeLimit} ครั้ง ท่านลงทะเบียนได้อีกครั้งตั้งแต่วันดังกล่าว</div></div></div>`;
  const warn = rules.strikes >= rules.strikeLimit;
  return `<div class="rules ${warn ? 'warn' : ''}">${ic(warn ? 'alert' : 'shield')}<div class="rules-items">
    <span>จองล่วงหน้า <b>${rules.active}/${rules.maxActive}</b> รอบ</span>
    <span>เลื่อน/ยกเลิกได้ถึง <b>${rules.changeDays} วัน</b> ก่อนวันอบรม</span>
    <span>เลื่อน/ยกเลิก/ไม่มา แล้ว <b>${rules.strikes}/${rules.strikeLimit}</b> ครั้ง${warn ? ' · ครั้งถัดไปจะถูกระงับสิทธิ์' : ''}</span></div></div>`;
}
function bindCommon(el, sessions) {
  $$('[data-addcal]', el).forEach(b => b.onclick = () => { const s = sessions.find(x => x.id === b.dataset.addcal); if (s) addToCalendar(s); });
}

// ====================== HOME ======================
VIEWS.home = async el => {
  const c = cachedHome();
  if (c) {
    // แสดงข้อมูลที่จำไว้ทันที แล้วโหลดข้อมูลล่าสุดเบื้องหลัง
    drawHome(el, c);
    fetchHome().then(d => { if (S.route === 'home' && el.isConnected && JSON.stringify(d) !== JSON.stringify(c)) drawHome(el, d); }).catch(() => { });
    return;
  }
  el.innerHTML = `<div class="hero"><div class="hero-slides skeleton" style="border-radius:0"></div></div>`;
  drawHome(el, await fetchHome());
};
function drawHome(el, d) {
  S.settings = Object.assign(S.settings, d.settings); S.home = d; S.banners = d.banners || {};
  const admin = S.user && S.user.role === 'admin';
  const homeB = (d.banners && d.banners.home) || [];
  const slides = homeB.length ? homeB : [null];
  const speed = Math.max(2, Number(d.settings.HERO_SPEED || 6));
  const ghostBtn = 'class="btn btn-lg btn-glass"';
  const up = d.sessions;
  const shown = S.homeMore ? up.length : 6;
  el.innerHTML = `
  <section class="hero"><div class="hero-slides">
    ${slides.map((b, i) => `<div class="hero-slide ${i === 0 ? 'on' : ''} ${b && b.imageUrl ? '' : 'hero-default'}">
      ${b && b.imageUrl ? `<img src="${esc(b.imageUrl)}" alt=""><div class="shade"></div>` : ''}
      <div class="hero-copy"><div class="wrap">
        <div class="month-tag">${icS('sparkle')} ${b && b.month ? 'ประจำเดือน ' + thMonth(b.month) : 'ศูนย์ฝึกอบรมและรับรองหลักสูตร'}</div>
        <h1>${esc(b && b.title || 'ยกระดับมาตรฐานงานติดตั้งระบบโซลาร์ ด้วยหลักสูตรที่รับรองโดยผู้เชี่ยวชาญ')}</h1>
        <p>${esc(b && b.subtitle || 'ลงทะเบียนอบรม ติดตามรอบอบรมล่วงหน้า ดาวน์โหลดเอกสารประกอบการบรรยาย และรับใบประกาศนียบัตรออนไลน์ได้ในที่เดียว')}</p>
        <div class="row">${b && b.link ? `<a class="btn btn-gold btn-lg" href="${esc(b.link)}" target="_blank" rel="noopener">ดูรายละเอียด</a>` : `<button class="btn btn-gold btn-lg" data-go="book">${ic('cal')} ลงทะเบียนอบรม</button>`}
        ${!S.user ? `<button ${ghostBtn} data-go="login">เข้าสู่ระบบ</button>` : `<button ${ghostBtn} data-go="schedule">${ic('cal')} ดูปฏิทินอบรม</button>`}</div>
      </div></div></div>`).join('')}
    ${slides.length > 1 ? `<button class="hero-arrow l" data-hero="-1" aria-label="ก่อนหน้า">${ic('left')}</button><button class="hero-arrow r" data-hero="1" aria-label="ถัดไป">${ic('right')}</button>
      <div class="hero-dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}" data-dot="${i}"></i>`).join('')}</div>` : ''}
    ${admin ? `<button class="edit-fab hero-fab" data-go="admin" data-p='{"tab":"banners","bp":"home"}'>${icS('edit', 14)} จัดการสไลด์ · ${bannerSize('home')} · ${speed} วิ/ภาพ</button>` : ''}
  </div></section>
  <div class="wrap page" style="padding-top:44px">
    <div class="section-head"><div><div class="eyebrow">หลักสูตรของเรา</div><h2>เลือกหลักสูตรที่เหมาะกับคุณ</h2></div></div>
    <div class="grid g3">${d.courses.map(c => courseCard(c, { foot: `<span class="small muted">${up.filter(s => s.courseId === c.id).length} รอบที่เปิดรับ</span><div class="row" style="gap:6px">${lineBtn(c.id, '')}<button class="btn btn-ghost btn-sm" data-go="book" data-p='${JSON.stringify({ courseId: c.id })}'>ลงทะเบียน ${ic('arrow')}</button></div>` })).join('')}</div>
    <div class="section">
      <div class="section-head"><div><div class="eyebrow">ตารางอบรมล่วงหน้า</div><h2>รอบอบรมที่กำลังจะมาถึง</h2></div><button class="btn btn-ghost" data-go="schedule">${ic('cal')} <span class="hide-sm">ดูแบบ</span>ปฏิทิน</button></div>
      <div class="card">${up.length ? up.slice(0, shown).map(s => sessionRow(s, bookBtn(s))).join('') : `<div class="empty">${ic('cal')}<div>ยังไม่มีรอบอบรมที่เปิดรับ</div></div>`}
        ${up.length > 6 ? `<div class="more-row"><button class="btn btn-ghost" id="more">${S.homeMore ? 'ย่อรายการ' : `ดูรอบอื่นเพิ่มเติม (${up.length - 6})`} ${ic(S.homeMore ? 'left' : 'arrow')}</button></div>` : ''}</div>
    </div>
    <div class="section"><div class="card card-b verify-strip">
      <div style="flex:1;min-width:240px"><div class="eyebrow">Certificate Verification</div><h3>ตรวจสอบความถูกต้องของใบประกาศนียบัตร</h3><div class="small muted">กรอกเลขที่ หรือสแกน QR Code บนใบประกาศ เพื่อยืนยันว่าเข้าอบรมจริง</div></div>
      <form class="row" id="vf" style="flex:1;min-width:240px"><input class="input" name="no" placeholder="เช่น SSC-OM-2026-0001" style="flex:1;min-width:0"><button class="btn btn-primary">${ic('search')} ตรวจสอบ</button></form>
    </div></div>
  </div>`;
  $('#vf').onsubmit = e => { e.preventDefault(); go('verify', { no: e.target.no.value.trim() }); };
  const more = $('#more'); if (more) more.onclick = () => { S.homeMore = !S.homeMore; drawHome(el, S.home); };
  clearInterval(S.heroT);
  if (slides.length > 1) {
    let i = 0; const all = $$('.hero-slide', el), dots = $$('.hero-dots i', el);
    const show = n => { i = (n + all.length) % all.length; all.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((s, k) => s.classList.toggle('on', k === i)); };
    const start = () => { clearInterval(S.heroT); S.heroT = setInterval(() => { if (!document.body.contains(all[0])) return clearInterval(S.heroT); show(i + 1); }, speed * 1000); };
    dots.forEach(d => d.onclick = () => { show(+d.dataset.dot); start(); });
    $$('[data-hero]', el).forEach(b => b.onclick = () => { show(i + Number(b.dataset.hero)); start(); });
    const box = $('.hero-slides', el); let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); start(); } x0 = null; });
    start();
  }
}

// ====================== AUTH ======================
VIEWS.login = el => {
  const mode = S.params.mode || 'login';
  el.innerHTML = `<div class="auth">
    <div class="auth-art hero-default"><div style="position:relative;z-index:1">
      <div class="eyebrow" style="color:var(--gold-2)">Member Access</div>
      <h2>พื้นที่สมาชิกสำหรับผู้เข้าอบรม</h2>
      <p>ลงทะเบียนอบรมแต่ละรอบ ดาวน์โหลดเอกสารประกอบการบรรยาย ภาพบรรยากาศ ใบประกาศนียบัตร และสะสมแต้มแลกของรางวัล</p>
      <div class="seal-row"><span class="chip gold">${icS('cal')} จองรอบอบรมล่วงหน้า</span><span class="chip gold">${icS('qr')} เช็คอินด้วย QR</span><span class="chip gold">${icS('award')} ใบประกาศออนไลน์</span><span class="chip gold">${icS('gift')} สะสมแต้ม</span></div>
    </div></div>
    <div class="auth-form"><div class="card">
      <div class="tabs"><a data-mode="login" class="${mode === 'login' ? 'active' : ''}">เข้าสู่ระบบ</a><a data-mode="register" class="${mode === 'register' ? 'active' : ''}">สมัครสมาชิก</a></div>
      <div class="card-b" id="authBody"></div></div></div></div>`;
  $$('[data-mode]', el).forEach(a => a.onclick = () => { S.params.mode = a.dataset.mode; VIEWS.login(el); });
  const body = $('#authBody');
  if (S.after && S.after.route === 'checkin') body.insertAdjacentHTML('beforebegin', `<div class="alert-row info" style="margin:16px 22px 0">${ic('qr')}<div>กรุณาเข้าสู่ระบบเพื่อเช็คอินเข้าอบรม</div></div>`);
  if (mode === 'login') {
    body.innerHTML = `<form id="f"><div class="field"><label>อีเมล</label><input class="input" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label>รหัสผ่าน</label><input class="input" name="password" type="password" required autocomplete="current-password"></div>
      <button class="btn btn-primary btn-block btn-lg">เข้าสู่ระบบ</button>
      <div style="text-align:center;margin-top:14px"><a class="small" style="cursor:pointer" id="forgot">ลืมรหัสผ่าน?</a></div></form>`;
    $('#f').onsubmit = async e => {
      e.preventDefault();
      const d = await run('login', formData(e.target));
      onAuthed(d, 'ยินดีต้อนรับ ' + d.user.firstName);
    };
    $('#forgot').onclick = () => {
      const m = modal('ลืมรหัสผ่าน', `<p class="muted small" style="margin-top:0">ระบบจะส่งรหัสผ่านชั่วคราวไปที่อีเมลของท่าน</p><div class="field"><label>อีเมล</label><input class="input" id="fe" type="email"></div>`,
        `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="fs">ส่งรหัสผ่าน</button>`);
      $('#fs', m.el).onclick = async () => { await run('forgotPassword', { email: $('#fe', m.el).value }, { ok: 'ถ้าอีเมลนี้มีในระบบ ท่านจะได้รับรหัสผ่านชั่วคราวทางอีเมล' }); m.close(); };
    };
  } else {
    body.innerHTML = `<form id="f">
      <div class="row"><div class="field" style="max-width:130px"><label>คำนำหน้า</label><select class="input" name="prefix"><option>นาย</option><option>นาง</option><option>นางสาว</option><option>ดร.</option><option value="">ไม่ระบุ</option></select></div>
      <div class="field"><label>ชื่อ *</label><input class="input" name="firstName" required></div></div>
      <div class="field"><label>นามสกุล *</label><input class="input" name="lastName" required></div>
      <div class="field"><label>อีเมล *</label><input class="input" name="email" type="email" required></div>
      <div class="row"><div class="field"><label>เบอร์โทร</label><input class="input" name="phone" inputmode="tel"></div><div class="field"><label>บริษัท</label><input class="input" name="company"></div></div>
      <div class="field"><label>รหัสผ่าน * (อย่างน้อย 6 ตัวอักษร)</label><input class="input" name="password" type="password" minlength="6" required autocomplete="new-password"></div>
      <div class="hint small muted" style="margin:-4px 0 14px">ชื่อ–นามสกุลจะใช้พิมพ์บนใบประกาศนียบัตร กรุณากรอกให้ถูกต้อง</div>
      <button class="btn btn-gold btn-block btn-lg">สมัครสมาชิก</button></form>`;
    $('#f').onsubmit = async e => {
      e.preventDefault();
      const d = await run('register', formData(e.target));
      onAuthed(d, 'สมัครสมาชิกเรียบร้อย');
    };
  }
};
function onAuthed(d, msg) {
  S.token = d.token; S.user = d.user; LS.set('tp_token', d.token); toast(msg);
  const a = S.after; S.after = null;
  a ? go(a.route, a.params) : go(d.user.role === 'admin' ? 'admin' : 'home');
}
