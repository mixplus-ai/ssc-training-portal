// ทดสอบหลังบ้านชุดใหม่ (netlify/lib/runtime.mjs) กับ Postgres จริงในเครื่อง
// วิธีรัน: DATABASE_URL=postgres://postgres@localhost:55432/tp node tests/runtime_test.mjs
// (ต้องโหลด netlify/sql/schema.sql ลงฐานข้อมูลทดสอบก่อน ข้อมูลในตาราง tp_* จะถูกล้าง)
import crypto from 'node:crypto';
import postgres from 'postgres';

process.env.URL = 'https://cerssc.netlify.app';
process.env.MAIL_RELAY_URL = 'https://script.google.com/macros/s/TEST/exec';
process.env.MAIL_RELAY_KEY = 'k'.repeat(32);

const uploads = [], relays = [];
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');
globalThis.fetch = async (url, o = {}) => {
  url = String(url);
  if (url.includes('netlify.app')) return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  if (url.startsWith(process.env.MAIL_RELAY_URL)) { relays.push(JSON.parse(o.body)); return new Response(JSON.stringify({ ok: true, data: { sent: 1 } })); }
  throw new Error('unexpected fetch ' + url);
};

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
await sql`delete from tp_sheets`; await sql`delete from tp_props`; await sql`delete from tp_meta`; await sql`delete from tp_history`;
const { run, sendMails, _test } = await import('../netlify/lib/runtime.mjs');
const blobs = new Map();
_test.setStore({
  set: async (k, buf, o) => { uploads.push({ k, size: buf.length, type: o.metadata.type }); blobs.set(k, { data: buf, metadata: o.metadata }); },
  getWithMetadata: async k => blobs.get(k) || null
});

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const A = async (a, p, expectErr) => {
  const r = await run(a, p);
  if (!r.result.ok && !expectErr) console.log('ERR', a, r.result.error);
  return expectErr ? r : r.result.data;
};
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// วันที่/เวลาโซนไทย
const f = _test.formatDate;
ok(f(new Date('2026-11-04T20:30:00Z'), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm') === '2026-11-05 03:30', 'formatDate Bangkok');
ok(f(new Date('2026-11-04T20:30:05Z'), 'UTC', "yyMMdd'T'HHmmss") === '261104T203005', 'formatDate quoted literal + UTC');

// ติดตั้ง
const st = await run(null, {}, { fn: 'setup' });
ok(st.result.data === 'ติดตั้งเรียบร้อย', 'setup on Postgres');
const names = (await sql`select name from tp_sheets order by name`).map(r => r.name);
ok(names.includes('Users') && names.includes('Settings') && names.length >= 13, 'sheets stored: ' + names.length);

// สมัคร / รหัสผ่านเข้ากันกับของเดิม
const adm = await A('register', { email: 'a@x.com', password: 'secret1', firstName: 'แอด', lastName: 'มิน' });
const AT = adm.token;
const urow = (await sql`select data from tp_sheets where name = 'Users'`)[0].data;
const hdr = urow[0], row = urow[1], col = k => row[hdr.indexOf(k)];
let v = col('salt') + '|secret1';
for (let i = 0; i < 500; i++) v = crypto.createHash('sha256').update(v + col('salt'), 'utf8').digest('base64');
ok(v === col('passwordHash'), 'password hash identical to Apps Script algorithm');
ok(col('role') === 'admin', 'first user is admin');
ok((await sql`select count(*)::int as n from tp_props where k = 'TOKEN_SECRET'`)[0].n === 1, 'token secret stored');

// ข้อมูลยังอยู่หลังเครื่องเริ่มใหม่ (ล้างแคชในหน่วยความจำ)
_test.reset();
const lg = await A('login', { email: 'a@x.com', password: 'secret1' });
ok(lg && lg.token, 'login after cold start');
ok((await A('me', { token: AT })).user.email === 'a@x.com', 'old token still valid after cold start');
ok((await A('me', { token: AT + 'x' }, true)).result.code === 'AUTH', 'tampered token rejected');

// รอบอบรม + หน้าแรก
const C = (await A('adminData', { token: AT })).courses;
const mk = (n, o) => A('saveSession', { token: AT, session: Object.assign({ courseId: C[0].id, date: day(n), startTime: '09:00', endTime: '16:00', hours: 6, capacity: 30, location: 'BKK', speakerName: 'Spk', speakerEmail: 'spk@x.com' }, o || {}) });
const s1 = await mk(10);
const h = await run('publicHome', {});
ok(h.result.ok && h.result.data.sessions.some(s => s.id === s1.id), 'publicHome shows new session');
ok(h.homeChanged === false, 'publicHome is read-only');

// จอง + อีเมลยืนยันพร้อมไฟล์ปฏิทิน
const u = await A('register', { email: 'u@x.com', password: 'secret1', firstName: 'วสันต์', lastName: 'คำเงิน', company: 'ACME' });
const rr = await run('registerSession', { token: u.token, sessionId: s1.id, saleName: 'x', source: 'y' });
ok(rr.result.ok && rr.homeChanged, 'registerSession ok + home cache purge flagged');
ok(rr.mails.length === 1 && rr.mails[0].to === 'u@x.com' && (rr.mails[0].attachments || []).length === 1, 'confirmation mail queued with .ics');
await sendMails(rr.mails);
const rm = relays.at(-1);
ok(rm && rm.action === 'relayMail' && rm.payload.key === process.env.MAIL_RELAY_KEY && /BEGIN:VCALENDAR/.test(Buffer.from(rm.payload.mails[0].attachments[0].data, 'base64').toString()), 'mail relayed with ics attachment');

// ที่นั่งจำกัด: จองพร้อมกันต้องไม่เกินจำนวน
const s2 = await mk(12, { capacity: 1 });
const us = await Promise.all([1, 2, 3, 4].map(i => A('register', { email: 'p' + i + '@x.com', password: 'secret1', firstName: 'ก' + i, lastName: 'ข' })));
const rs = await Promise.all(us.map(x => run('registerSession', { token: x.token, sessionId: s2.id, saleName: 'x', source: 'y' })));
ok(rs.filter(r => r.result.ok).length === 1, 'concurrent bookings respect capacity 1: ' + rs.map(r => r.result.ok ? 'ok' : r.result.error).join(' / '));

// อัปโหลดสลิป → Supabase Storage
const paid = await mk(25, { courseId: C[2].id, price: 3500, fees: [{ name: 'doc', amount: 500 }], vat: true, whtAllowed: true });
const pr = await A('registerSession', { token: u.token, sessionId: paid.id, saleName: 'x', source: 'y', billing: { billingType: 'company', billingName: 'ACME', taxId: '0105' }, wht: true });
ok(pr.total === 4160, 'fees/VAT/WHT total ' + pr.total);
const up = await A('uploadPayment', { token: u.token, regId: pr.id, slip: { name: 's.png', mimeType: 'image/png', data: 'data:image/png;base64,' + PNG.toString('base64') } });
ok(up.payStatus === 'review' && uploads.length === 1 && uploads[0].type === 'image/png', 'slip stored in Netlify Blobs');
const reg = await A('sessionRoster', { token: AT, sessionId: paid.id });
const slip = JSON.stringify(reg).match(/https:\/\/cerssc\.netlify\.app\/f\/[^"]+/);
ok(!!slip, 'slip link points to /f/ on the site: ' + (slip && slip[0]));

// รวมเอกสารเป็น zip
const z = await A('paymentDocsZip', { token: AT, sessionId: paid.id });
ok(z && z.count === 1 && /^data:application\/zip;base64,UEsD/.test(z.data), 'payment docs zip');
ok((await A('paymentDocsZip', { token: u.token, sessionId: paid.id }, true)).result.ok === false, 'zip admin only');

// รูปเทมเพลตใบประกาศ
const tpl = await A('saveTemplate', { token: AT, template: { name: 'T1', config: '{}' }, image: { name: 't.png', mimeType: 'image/png', data: 'data:image/png;base64,' + PNG.toString('base64') } });
const tid = tpl && (tpl.id || (tpl.template && tpl.template.id));
const ti = await A('templateImage', { token: u.token, templateId: tid });
ok(typeof ti === 'string' && ti.startsWith('data:image/png;base64,'), 'templateImage from storage');

// รหัสส่งอีเมลของ Apps Script ห้ามใช้ผ่านระบบใหม่
ok((await A('relayMail', { key: '', mails: [{ to: 'a@b.c' }] }, true)).result.ok === false, 'relayMail rejected without key');

// งานประจำวัน
const dj = await run(null, {}, { fn: 'dailyJobs' });
ok(dj.result.ok, 'dailyJobs runs: ' + JSON.stringify(dj.result.data));

// สำรองประวัติ
ok((await sql`select count(*)::int as n from tp_history`)[0].n > 0, 'history snapshots kept');

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
await sql.end(); await _test.end();
process.exit(fails ? 1 : 0);
