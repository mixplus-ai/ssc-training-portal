// ข้อมูลหน้าแรก (หลักสูตร รอบที่เปิดรับ แบนเนอร์ การตั้งค่าสาธารณะ) ผ่าน CDN ของ Netlify
// ระบบใหม่ (มี DATABASE_URL): อ่านจาก Supabase และล้างแคชทันทีเมื่อแอดมินแก้ข้อมูล (แท็ก home)
// ระบบเดิม: ดึงจาก Apps Script เก็บไว้ 5 นาที และส่งของเดิมให้ทันทีระหว่างดึงข้อมูลใหม่เบื้องหลัง
// ไฟล์ home.mjs สร้างจากไฟล์นี้โดย build_netlify.py (ใส่ลิงก์จาก netlify-site/config.js)
import { run } from '../lib/runtime.mjs';
const API_URL = process.env.API_URL || '/api';

async function fromGas() {
  if (!API_URL || !/^https:/.test(API_URL)) throw new Error('no API_URL');
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'publicHome', payload: {} }),
    redirect: 'follow'
  });
  return JSON.parse(await r.text());
}

export default async () => {
  try {
    const db = !!process.env.DATABASE_URL;
    const j = db ? (await run('publicHome', {})).result : await fromGas();
    if (!j || !j.ok) throw new Error((j && j.error) || 'upstream error');
    return new Response(JSON.stringify(j), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': db ? 'public, durable, s-maxage=900, stale-while-revalidate=60' : 'public, durable, s-maxage=300, stale-while-revalidate=86400',
        'Netlify-Cache-Tag': 'home'
      }
    });
  } catch (e) {
    console.log('home error', e && e.message);
    return new Response(JSON.stringify({ ok: false, error: 'upstream' }), {
      status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
};

export const config = { path: '/api/home' };
