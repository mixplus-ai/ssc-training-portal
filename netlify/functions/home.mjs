// ข้อมูลหน้าแรก (หลักสูตร รอบที่เปิดรับ แบนเนอร์ การตั้งค่าสาธารณะ) ผ่าน CDN ของ Netlify
// เก็บไว้ 5 นาที และส่งของเดิมให้ทันทีระหว่างดึงข้อมูลใหม่จาก Apps Script เบื้องหลัง
// ไฟล์ home.mjs สร้างจากไฟล์นี้โดย build_netlify.py (ใส่ลิงก์จาก netlify-site/config.js)
const API_URL = process.env.API_URL || 'https://script.google.com/macros/s/AKfycbzR1uqROfLBTuAhkjKluBJoxTI7c_W89yLXDwD8Cm4fGsM3OeU6Is33pajEYhTB1Qr1/exec';

export default async () => {
  try {
    if (!API_URL) throw new Error('no API_URL');
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'publicHome', payload: {} }),
      redirect: 'follow'
    });
    const text = await r.text();
    const j = JSON.parse(text);
    if (!j || !j.ok) throw new Error((j && j.error) || 'upstream error');
    return new Response(text, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=300, stale-while-revalidate=86400'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'upstream' }), {
      status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
};

export const config = { path: '/api/home' };
