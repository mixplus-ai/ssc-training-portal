// เปิดไฟล์ที่อัปโหลดไว้ (เก็บใน Netlify Blobs): /f/<โฟลเดอร์>/<ชื่อไฟล์>
// ชื่อไฟล์มีรหัสสุ่มต่อท้าย เดาไม่ได้ ไฟล์ไม่เปลี่ยนหลังอัปโหลด จึงแคชได้นาน
import { readFile } from '../lib/runtime.mjs';

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/^\/f\//, '').split('/').map(decodeURIComponent).join('/');
  const f = path && !path.includes('..') ? await readFile(path).catch(() => null) : null;
  if (!f) return new Response('ไม่พบไฟล์', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  const name = path.split('/').pop();
  return new Response(f.buf, {
    headers: {
      'Content-Type': f.type,
      'Content-Disposition': (/^image\//.test(f.type) || f.type === 'application/pdf' ? 'inline' : 'attachment') + "; filename*=UTF-8''" + encodeURIComponent(name),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};

export const config = { path: '/f/*' };
