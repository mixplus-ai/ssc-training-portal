// หลังบ้านชุดใหม่: POST /api {action, payload} → JSON (ตรรกะเดียวกับ Apps Script ทุกประการ ข้อมูลอยู่ใน Supabase)
import { purgeCache } from '@netlify/functions';
import { run, sendMails } from '../lib/runtime.mjs';
import { geoFromMapUrl } from '../lib/geo.mjs';

const json = (o, status) => new Response(JSON.stringify(o), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
  if (!process.env.DATABASE_URL) return json({ ok: false, error: 'ระบบใหม่ยังไม่ได้ตั้งค่าฐานข้อมูล' }, 503);
  let body;
  try { body = JSON.parse(await req.text() || '{}'); } catch (e) { return json({ ok: false, error: 'คำขอไม่ถูกต้อง' }); }
  try {
    if (body.action === 'geoFromMapUrl') {
      const g = await geoFromMapUrl(String((body.payload || {}).url || '').slice(0, 2000)).catch(() => null);
      return json(g ? { ok: true, data: g } : { ok: false, error: 'ดึงพิกัดจากลิงก์นี้ไม่ได้ กรุณากรอกพิกัดเอง (คลิกขวาที่หมุดใน Google Maps แล้วคัดลอกตัวเลข)' });
    }
    const ses = body.action === 'saveSession' && body.payload && body.payload.session;
    if (ses && ses.mapUrl && (ses.lat === undefined || ses.lat === null || ses.lat === '')) {
      const g = await geoFromMapUrl(ses.mapUrl).catch(() => null);
      if (g) { ses.lat = g.lat; ses.lng = g.lng; }
    }
    const out = await run(String(body.action || ''), body.payload || {});
    const after = [];
    if (out.mails.length) after.push(sendMails(out.mails));
    if (out.homeChanged) after.push(purgeCache({ tags: ['home'] }).catch(e => console.log('purge failed', e.message)));
    if (after.length) context.waitUntil(Promise.all(after));
    return json(out.result);
  } catch (e) {
    console.log('api error', body.action, e && e.stack || e);
    return json({ ok: false, error: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง' }, 500);
  }
};

export const config = { path: '/api' };
