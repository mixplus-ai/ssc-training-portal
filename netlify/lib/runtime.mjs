// รันตรรกะเดิมของ app/Code.gs บน Netlify Functions โดยเก็บข้อมูลใน Supabase (Postgres)
// แต่ละชีตเก็บเป็นเอกสาร JSON 1 แถวในตาราง tp_sheets (2D array เหมือนใน Google Sheet)
// ทุกคำขอ: ล็อก → โหลดชีต (ใช้แคชในหน่วยความจำถ้าเวอร์ชันไม่เปลี่ยน) → รัน api() → บันทึกเฉพาะชีตที่เปลี่ยน → ปลดล็อก
// งานที่ช้า (อัปโหลดไฟล์ ส่งอีเมล) ทำหลังรันตรรกะ: อัปโหลดก่อน commit, อีเมลส่งหลังตอบกลับ
process.env.TZ = 'Asia/Bangkok';
import postgres from 'postgres';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { zipSync } from 'fflate';
import CODE from './code.mjs';

const TZ = 'Asia/Bangkok';
let SQL = null;
const db = () => SQL || (SQL = postgres(process.env.DATABASE_URL, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 }));
const SUPA_URL = () => String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const BUCKET = () => process.env.SUPABASE_BUCKET || 'files';

// ---------- Utilities.formatDate (รองรับโซนเวลาจริง) ----------
function formatDate(d, tz, fmt) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: tz || TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).forEach(p => { parts[p.type] = p.value; });
  let out = '', i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "'") { const j = fmt.indexOf("'", i + 1); out += fmt.slice(i + 1, j < 0 ? fmt.length : j); i = j < 0 ? fmt.length : j + 1; continue; }
    const tok = ['yyyy', 'yy', 'MM', 'dd', 'HH', 'mm', 'ss'].find(t => fmt.startsWith(t, i));
    if (tok) { out += { yyyy: parts.year, yy: parts.year.slice(2), MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second }[tok]; i += tok.length; }
    else out += fmt[i++];
  }
  return out;
}

// ---------- ชีตในหน่วยความจำ (ตัวเดียวกับที่ใช้ในชุดทดสอบ) ----------
const strip = x => (typeof x === 'string' && x[0] === "'" ? x.slice(1) : x);
function mkSheet(book, name, data) {
  data = data || [];
  const sh = {
    name, data,
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data.reduce((m, r) => Math.max(m, r.length), 0),
    getRange: (r, c, nr = 1, nc = 1) => {
      const rg = {
        getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push((data[r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(row); } return o; },
        getValue: () => (data[r - 1] || [])[c - 1] ?? '',
        setValues: v => { v.forEach((row, i) => { data[r - 1 + i] = data[r - 1 + i] || []; row.forEach((x, j) => { data[r - 1 + i][c - 1 + j] = strip(x); }); }); return rg; },
        setValue: x => { data[r - 1] = data[r - 1] || []; data[r - 1][c - 1] = strip(x); return rg; },
        setFontWeight: () => rg, setBackground: () => rg, setFontColor: () => rg, setNumberFormat: () => rg
      };
      return rg;
    },
    appendRow: row => { data.push(row.map(strip)); return sh; },
    deleteRow: i => { data.splice(i - 1, 1); },
    setFrozenRows() { }, setColumnWidth() { }, autoResizeColumns() { }
  };
  book.sheets[name] = sh;
  return sh;
}
function mkBook(stored) {
  const book = { sheets: {} };
  Object.keys(stored).forEach(n => mkSheet(book, n, JSON.parse(JSON.stringify(stored[n]))));
  book.ss = {
    getSheetByName: n => book.sheets[n] || null,
    insertSheet: n => mkSheet(book, n, []),
    getSheets: () => Object.values(book.sheets),
    deleteSheet: s => { delete book.sheets[s.name]; }
  };
  return book;
}

// ---------- แคชในหน่วยความจำของฟังก์ชัน (อยู่ได้ระหว่างคำขอที่เครื่องยังอุ่น) ----------
let MEM = { ver: -1, sheets: null };
const CACHE = new Map(); // CacheService แทน: ใช้ภายในเครื่องเท่านั้น
const IMG = new Map(); // รูปเทมเพลตที่ดึงมาแล้ว
const cacheSvc = {
  get: k => { const e = CACHE.get(k); if (!e) return null; if (e.t < Date.now()) { CACHE.delete(k); return null; } return e.v; },
  put: (k, v, s) => { CACHE.set(k, { v: String(v), t: Date.now() + (s || 600) * 1000 }); },
  remove: k => { CACHE.delete(k); },
  getAll: ks => Object.fromEntries(ks.map(k => [k, cacheSvc.get(k)]).filter(x => x[1] != null)),
  putAll: (o, s) => Object.keys(o).forEach(k => cacheSvc.put(k, o[k], s)),
  removeAll: ks => ks.forEach(k => CACHE.delete(k))
};

// ---------- Blob / Drive แทนด้วย Supabase Storage ----------
function mkBlob(bytes, mime, name) {
  let b = Buffer.from(bytes || []), m = mime || 'application/octet-stream', n = name || 'file';
  const blob = {
    getBytes: () => [...b], getContentType: () => m, getName: () => n,
    setName: x => { n = x; return blob; }, setContentType: x => { m = x; return blob; },
    getDataAsString: () => b.toString('utf8'), copyBlob: () => mkBlob(b, m, n), _buf: () => b
  };
  return blob;
}
const publicUrl = path => `${SUPA_URL()}/storage/v1/object/public/${BUCKET()}/${path.split('/').map(encodeURIComponent).join('/')}`;
function mkDrive(job) {
  const folder = prefix => ({
    getId: () => prefix || 'root',
    getFoldersByName: n => { let used = false; return { hasNext: () => !used, next: () => { used = true; return folder((prefix ? prefix + '/' : '') + n); } }; },
    createFolder: n => folder((prefix ? prefix + '/' : '') + n),
    createFile: blob => {
      const safe = String(blob.getName() || 'file').replace(/[^\w.\-ก-๙]+/g, '_').slice(-80);
      const path = (prefix ? prefix + '/' : '') + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex') + '_' + safe;
      job.uploads.push({ path, buf: blob._buf(), mime: blob.getContentType() });
      return { getId: () => path, setSharing() { }, getUrl: () => publicUrl(path), getName: () => safe };
    }
  });
  return {
    createFolder: n => folder(n), getFolderById: id => folder(id === 'root' ? '' : id),
    getFileById: id => { throw new Error('ไฟล์นี้ต้องดึงผ่านระบบใหม่: ' + id); },
    getFilesByName: () => ({ hasNext: () => false }),
    Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 }
  };
}

// ---------- สร้างบริบทสำหรับรัน Code.gs ----------
const SCRIPT = new vm.Script(CODE, { filename: 'Code.gs' });
function mkContext(book, props, job) {
  const ctx = {
    console, Logger: { log: (...a) => console.log(...a) },
    SpreadsheetApp: { openById: () => book.ss, flush() { } },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      formatDate,
      computeDigest: (a, s) => [...crypto.createHash('sha256').update(String(s), 'utf8').digest()].map(x => (x > 127 ? x - 256 : x)),
      computeHmacSha256Signature: (s, k) => [...crypto.createHmac('sha256', k).update(String(s), 'utf8').digest()].map(x => (x > 127 ? x - 256 : x)),
      base64Encode: b => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : (b || []).map(x => x & 255)).toString('base64'),
      base64EncodeWebSafe: b => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : (b || []).map(x => x & 255)).toString('base64url'),
      base64Decode: s => [...Buffer.from(String(s), 'base64')].map(x => (x > 127 ? x - 256 : x)),
      newBlob: (b, m, n) => mkBlob(typeof b === 'string' ? Buffer.from(b, 'utf8') : (b || []).map(x => x & 255), m, n),
      zip: (blobs, name) => { const files = {}; blobs.forEach(x => { files[x.getName()] = new Uint8Array(x._buf()); }); return mkBlob(Buffer.from(zipSync(files, { level: 6 })), 'application/zip', name); },
      sleep() { },
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); job.propsDirty = true; } }) },
    CacheService: { getScriptCache: () => cacheSvc },
    LockService: { getScriptLock: () => ({ waitLock() { }, tryLock: () => true, releaseLock() { } }) },
    Session: { getScriptTimeZone: () => TZ },
    ScriptApp: { getService: () => ({ getUrl: () => process.env.URL || '' }), getProjectTriggers: () => [], newTrigger: () => { const t = { timeBased: () => t, everyDays: () => t, everyMinutes: () => t, atHour: () => t, create: () => t }; return t; } },
    MailApp: { sendEmail: o => { job.mails.push(o); }, getRemainingDailyQuota: () => 100 },
    DriveApp: mkDrive(job),
    HtmlService: {}, ContentService: {},
    Date, Math, JSON, String, Number, Object, Array, Error, RegExp, Boolean, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent
  };
  vm.createContext(ctx);
  SCRIPT.runInContext(ctx);
  // ลิงก์ไฟล์ใหม่ชี้ไปที่ Supabase Storage (มี / ในชื่อ) ไฟล์เก่าที่อยู่ใน Google Drive ยังใช้ลิงก์เดิม
  ctx.imgUrl_ = id => (/^https?:/.test(id) ? id : String(id).includes('/') ? publicUrl(id) : 'https://lh3.googleusercontent.com/d/' + id);
  ctx.fileLink_ = f => publicUrl(f.getId());
  return ctx;
}

// ---------- งานที่ต้องใช้ไฟล์ (เดิมอ่านจาก Drive แบบ sync) ----------
async function fetchBuf(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error('fetch ' + r.status);
  return { buf: Buffer.from(await r.arrayBuffer()), type: (r.headers.get('content-type') || '').split(';')[0] };
}
const PRELOAD = {
  // รูปพื้นหลังเทมเพลตใบประกาศ (ส่งเป็น data URL ให้หน้าเว็บวาดบน canvas)
  async templateImage(ctx, p) {
    const t = ctx.findBy_('Templates', 'id', p.templateId);
    if (!t) throw new Error('ไม่พบเทมเพลต');
    const fid = String(t.imageFileId || '');
    const url = fid ? (fid.includes('/') ? publicUrl(fid) : 'https://drive.google.com/uc?export=download&id=' + fid) : String(t.imageUrl || '');
    if (!url) throw new Error('เทมเพลตนี้ยังไม่มีรูป');
    const key = t.id + '_' + url, hit = IMG.get(key);
    if (hit) return hit;
    const f = await fetchBuf(url);
    const data = 'data:' + (f.type || 'image/jpeg') + ';base64,' + f.buf.toString('base64');
    if (IMG.size > 30) IMG.clear();
    IMG.set(key, data);
    return data;
  },
  // รวมสลิป / 50 ทวิ / ใบเสร็จ ของรอบเป็น .zip
  async paymentDocsZip(ctx, p) {
    const s = ctx.normSession_(ctx.findBy_('Sessions', 'id', p.sessionId));
    if (!s || !s.id) throw new Error('ไม่พบรอบอบรม');
    const c = ctx.findBy_('Courses', 'id', s.courseId) || {}, users = ctx.indexBy_(ctx.readTable_('Users'), 'id');
    const kinds = p.kind === 'wht' ? [['whtCertUrl', '50ทวิ']] : p.kind === 'slip' ? [['slipUrl', 'สลิป']] : [['slipUrl', 'สลิป'], ['whtCertUrl', '50ทวิ'], ['receiptUrl', 'ใบเสร็จ']];
    const files = {}; let missing = 0;
    for (const r of ctx.readTable_('Registrations')) {
      if (r.sessionId !== s.id || r.status === 'cancelled') continue;
      const u = users[r.userId] || {}, b = ctx.parseJson_(r.billing) || {};
      const who = String(b.billingName || u.company || ctx.fullName_(u) || r.id).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60);
      for (const k of kinds) {
        const url = String(r[k[0]] || ''); if (!url) continue;
        const dl = url.includes('/storage/v1/object/') ? url : (ctx.driveId_(url) ? 'https://drive.google.com/uc?export=download&id=' + ctx.driveId_(url) : url);
        try {
          const f = await fetchBuf(dl);
          const ext = (url.match(/\.[a-z0-9]{2,5}(?=$|\?)/i) || [ctx.mimeExt_(f.type)])[0] || '';
          let name = k[1] + '_' + who + ext, n = 2;
          while (files[name]) name = k[1] + '_' + who + '_' + (n++) + ext;
          files[name] = new Uint8Array(f.buf);
        } catch (e) { missing++; }
      }
    }
    if (!Object.keys(files).length) throw new Error('รอบนี้ยังไม่มีไฟล์ที่แนบมา');
    const zipName = (p.kind === 'wht' ? '50ทวิ_' : p.kind === 'slip' ? 'สลิป_' : 'เอกสารชำระเงิน_') + (c.code || '') + '_' + s.date + '.zip';
    const zip = Buffer.from(zipSync(files, { level: 6 }));
    return { name: zipName, count: Object.keys(files).length, missing, data: 'data:application/zip;base64,' + zip.toString('base64') };
  }
};
const READ_ONLY = new Set(['publicHome', 'verifyCert', 'me', 'listSessions', 'myTrainings', 'getCertificate', 'templateImage', 'rewardsPage',
  'adminData', 'sessionRoster', 'listUsers', 'exportRegistrations', 'listQuotes', 'listRedemptions', 'paymentDocsZip', 'emailDefaults']);

// ---------- ส่งไฟล์ขึ้น Storage และส่งอีเมล ----------
async function upload(u) {
  const r = await fetch(`${SUPA_URL()}/storage/v1/object/${BUCKET()}/${u.path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', body: u.buf,
    headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, apikey: process.env.SUPABASE_SERVICE_KEY, 'Content-Type': u.mime || 'application/octet-stream', 'x-upsert': 'true', 'cache-control': '31536000' }
  });
  if (!r.ok) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ (' + r.status + ')');
}
// ส่งอีเมลผ่าน Apps Script เดิม (บัญชี Google เดิม โควตาเดิม) ด้วยรหัสลับร่วม MAIL_RELAY_KEY
export async function sendMails(mails) {
  if (!mails.length) return;
  const url = process.env.MAIL_RELAY_URL, key = process.env.MAIL_RELAY_KEY;
  if (!url || !key) { console.log('mail relay not configured; skipped', mails.length); return; }
  const payload = mails.map(m => ({
    to: m.to, subject: m.subject, htmlBody: m.htmlBody, name: m.name, replyTo: m.replyTo,
    attachments: (m.attachments || []).map(a => ({ name: a.getName(), mimeType: a.getContentType(), data: a._buf().toString('base64') }))
  }));
  try {
    const r = await fetch(url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'relayMail', payload: { key, mails: payload } }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) console.log('mail relay error', j.error || r.status);
  } catch (e) { console.log('mail relay failed', e.message); }
}

// ---------- รันคำขอ 1 ครั้ง ----------
// คำสั่งอ่านอย่างเดียวไม่ต้องรอล็อก ถ้าบังเอิญมีการเขียน (เช่น สร้างรหัสลับครั้งแรก) จะรันใหม่แบบล็อก
const PUB_TABLES = ['Sessions', 'Courses', 'Banners', 'Registrations', 'Settings'];
class Retry extends Error { }
export async function run(action, payload, opt) {
  opt = opt || {};
  const ro = !opt.fn && READ_ONLY.has(action);
  try { return await attempt(action, payload, opt, ro); }
  catch (e) { if (e instanceof Retry) return attempt(action, payload, opt, false); throw e; }
}
async function attempt(action, payload, opt, readOnly) {
  const sql = db();
  const job = { uploads: [], mails: [], propsDirty: false };
  let result, changed = [];
  await sql.begin(async tx => {
    if (!readOnly) await tx`select pg_advisory_xact_lock(424242)`;
    const [{ ver }] = await tx`select coalesce((select v from tp_meta where k = 'ver'), 0)::bigint as ver`;
    if (MEM.ver !== Number(ver) || !MEM.sheets) {
      const rows = await tx`select name, data from tp_sheets`;
      const sheets = {}; rows.forEach(r => { sheets[r.name] = r.data; });
      const pr = await tx`select k, v from tp_props`;
      const props = {}; pr.forEach(r => { props[r.k] = r.v; });
      MEM = { ver: Number(ver), sheets, props };
      CACHE.clear(); // ข้อมูลเปลี่ยนจากเครื่องอื่น → ล้างแคชของ Code.gs (หน้าแรก การตั้งค่า)
    }
    const base = MEM;
    const book = mkBook(base.sheets), props = Object.assign({}, base.props);
    const ctx = mkContext(book, props, job);
    if (opt.fn) result = { ok: true, data: ctx[opt.fn]() };
    else if (PRELOAD[action]) {
      try {
        const auth = ctx.API[action] && ctx.API[action].auth;
        const user = auth ? ctx.authUser_((payload || {}).token) : null;
        if (auth && !user) result = { ok: false, code: 'AUTH', error: 'กรุณาเข้าสู่ระบบใหม่' };
        else if (auth === 'admin' && user.role !== 'admin') result = { ok: false, error: 'สำหรับผู้ดูแลระบบเท่านั้น' };
        else result = { ok: true, data: await PRELOAD[action](ctx, payload || {}) };
      } catch (e) { result = { ok: false, error: e.message }; }
    } else result = ctx.api(String(action || ''), payload || {});

    // บันทึกเฉพาะชีตที่เปลี่ยน
    changed = Object.keys(book.sheets).filter(n => JSON.stringify(book.sheets[n].data) !== JSON.stringify(base.sheets[n] || null));
    const removed = Object.keys(base.sheets).filter(n => !book.sheets[n]);
    const dirty = changed.length || removed.length || job.propsDirty;
    if (dirty && readOnly) throw new Retry();
    if (job.uploads.length) await Promise.all(job.uploads.map(upload));
    if (!dirty) return;
    for (const n of changed) await tx`insert into tp_sheets (name, data, updated_at) values (${n}, ${tx.json(book.sheets[n].data)}, now()) on conflict (name) do update set data = excluded.data, updated_at = now()`;
    for (const n of removed) await tx`delete from tp_sheets where name = ${n}`;
    if (job.propsDirty) for (const k of Object.keys(props)) await tx`insert into tp_props (k, v) values (${k}, ${props[k]}) on conflict (k) do update set v = excluded.v`;
    const [{ v }] = await tx`insert into tp_meta (k, v) values ('ver', 1) on conflict (k) do update set v = tp_meta.v + 1 returning v`;
    const next = {}; Object.keys(book.sheets).forEach(n => { next[n] = book.sheets[n].data; });
    MEM = { ver: Number(v), sheets: JSON.parse(JSON.stringify(next)), props: Object.assign({}, props) };
  });
  return { result, mails: job.mails, homeChanged: changed.some(n => PUB_TABLES.includes(n)) };
}
export const _test = { formatDate, mkBook, mkContext, cacheSvc, reset: () => { MEM = { ver: -1, sheets: null }; CACHE.clear(); }, end: () => SQL && SQL.end() };
