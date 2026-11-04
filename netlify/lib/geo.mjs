// ดึงพิกัด (lat,lng) จากลิงก์ Google Maps — รองรับลิงก์ย่อ maps.app.goo.gl โดยตามการ redirect
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|g\.co|(www\.|maps\.)?google\.[a-z.]{2,8}|consent\.google\.[a-z.]{2,8})$/i;

export function parseLatLng(t) {
  t = String(t || '');
  try { t = decodeURIComponent(t); } catch (e) { /* keep raw */ }
  const m = t.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) || t.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/)
    || t.match(/[?&](?:q|query|ll|center|destination|daddr)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/)
    || t.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export async function geoFromMapUrl(url) {
  const direct = parseLatLng(url);
  if (direct) return direct;
  let u;
  try { u = new URL(String(url || '').trim()).href; } catch (e) { return null; }
  for (let i = 0; i < 6; i++) {
    const h = new URL(u);
    if (h.protocol !== 'https:' && h.protocol !== 'http:') return null;
    if (!HOSTS.test(h.hostname)) return null;
    const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; SSC-Training/1.0)', 'accept-language': 'th,en' }, signal: AbortSignal.timeout(6000) });
    const loc = r.headers.get('location');
    if (loc) {
      u = new URL(loc, u).href;
      const p = parseLatLng(u);
      if (p) return p;
      continue;
    }
    const html = (await r.text()).slice(0, 400000);
    return parseLatLng((html.match(/https?:[^"'\s]*(?:center|@|!3d)[^"'\s]*/) || [''])[0]) || null;
  }
  return null;
}
