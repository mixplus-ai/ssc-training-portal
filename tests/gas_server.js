// Local stand-in for the Apps Script web app: serves netlify-site/ (with a given API_URL) and answers POST /exec through Code.gs doPost.
const fs = require('fs'), http = require('http'), path = require('path'), vm = require('vm');
const src = fs.readFileSync('tests/gas_test.js', 'utf8');
const header = src.slice(0, src.indexOf('vm.createContext(ctx)'));
const harness = new Function('require', header + `
  ctx.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) };
  ctx.MailApp = { sendEmail: o => console.log('MAIL ->', o.to, '|', o.subject) };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('app/Code.gs', 'utf8'), ctx);
  return ctx;`)(require);
const ctx = harness;
ctx.setup();
// seed: admin + one session
const A = (a, p) => { const r = ctx.api(a, p); if (!r.ok) throw new Error(a + ': ' + r.error); return r.data; };
const adm = A('register', { email: 'admin@x.com', password: 'secret1', firstName: 'แอด', lastName: 'มิน' });
const users = ctx.SpreadsheetApp.openById().getSheetByName('Users'); const h = users.data[0];
users.data[1][h.indexOf('role')] = 'admin';
const C = A('adminData', { token: adm.token }).courses;
const d = new Date(); d.setDate(d.getDate() + 20);
A('saveSession', { token: adm.token, session: { courseId: C[0].id, date: d.toISOString().slice(0, 10), startTime: '09:00', endTime: '16:00', hours: 6, capacity: 30, location: 'SSC บางนา', status: 'open' } });
const PORT = 8770;
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/exec')) {
    let b = ''; req.on('data', c => b += c); req.on('end', () => {
      const out = ctx.doPost({ postData: { contents: b } });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(out.s);
    }); return;
  }
  let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/index.html';
  if (f === '/config.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); return res.end(`window.API_URL = 'http://localhost:${PORT}/exec';`); }
  const fp = path.join('netlify-site', f);
  if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.jpg': 'image/jpeg' }[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
}).listen(PORT, () => console.log('gas server on', PORT));
