import os, shutil
os.chdir(os.path.dirname(os.path.abspath(__file__)))
OUT = 'netlify-site'
cfg = open(f'{OUT}/config.js', encoding='utf-8').read() if os.path.exists(f'{OUT}/config.js') else ''
readme = open(f'{OUT}/README-Netlify.md', encoding='utf-8').read() if os.path.exists(f'{OUT}/README-Netlify.md') else ''
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
if readme: open(f'{OUT}/README-Netlify.md', 'w', encoding='utf-8').write(readme)
sty = open('app/Styles.html', encoding='utf-8').read()
app = open('app/App.html', encoding='utf-8').read()
html = f'''<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SSC Training Portal</title>
  {sty}
  <style>:root{{color-scheme:light}} body{{background:var(--ivory)}}</style>
</head>
<body>
  <div id="app"></div>
  <script src="config.js"></script>
  <script>
    (function () {{
      var q = new URLSearchParams(location.search);
      window.BOOT = {{ verify: q.get('verify') || '', checkin: q.get('checkin') || '', course: q.get('course') || '', appUrl: location.origin + location.pathname }};
      // ยังไม่ได้ใส่ลิงก์ Apps Script ใน config.js → เปิดเป็นโหมดเดโม (ข้อมูลจำลอง)
      if (!window.API_URL) document.write('<script src="mock.js"><\\/script>');
    }})();
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
  {app}
</body>
</html>
'''
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(html)
if cfg: open(f'{OUT}/config.js', 'w', encoding='utf-8').write(cfg)
else: open(f'{OUT}/config.js', 'w', encoding='utf-8').write('''/*
 * ใส่ลิงก์ Web app ของ Google Apps Script (ลงท้ายด้วย /exec) ระหว่างเครื่องหมาย ' '
 * เช่น window.API_URL = 'https://script.google.com/macros/s/AKfy.../exec';
 * ถ้าเว้นว่างไว้ เว็บจะเปิดเป็น “โหมดเดโม” ใช้ข้อมูลจำลอง
 */
window.API_URL = '';
''')
shutil.copy('demo/mock.js', f'{OUT}/mock.js')
if os.path.isdir('demo/templates'): shutil.copytree('demo/templates', f'{OUT}/templates')
open(f'{OUT}/netlify.toml', 'w', encoding='utf-8').write('''[build]
  publish = "."

[[headers]]
  for = "/config.js"
  [headers.values]
    Cache-Control = "no-cache"
''')
print('built', sorted(os.listdir(OUT)))
