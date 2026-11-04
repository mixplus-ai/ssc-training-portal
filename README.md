# SSC Training Portal

ระบบลงทะเบียนอบรมและออกใบประกาศนียบัตร (SolarEdge: OM / BSD / CDI)
หลังบ้านเป็น Google Apps Script + Google Sheet, หน้าเว็บเปิดผ่าน Apps Script หรือโฮสต์บน Netlify ก็ได้

## โครงสร้าง

| โฟลเดอร์ / ไฟล์ | คืออะไร |
|---|---|
| `app/` | ไฟล์สำหรับวางใน Google Apps Script: `Code.gs`, `Index.html`, `Styles.html`, `App.html`, `appsscript.json` |
| `parts/` | ซอร์สหน้าเว็บ (`p1`–`p4.js`) รวมกันเป็น `app/App.html` |
| `netlify-site/` | หน้าเว็บสำหรับอัปโหลด Netlify (ตั้งลิงก์ Apps Script ใน `config.js`, ว่าง = โหมดเดโม) |
| `demo/` | เดโมไฟล์เดียว ใช้ข้อมูลจำลอง (`mock.js`) |
| `templates/` | ภาพพื้นหลังใบประกาศ 3 แบบ |
| `tests/` | ทดสอบหลังบ้านด้วย Node (จำลอง Google services) |
| `README-ติดตั้ง.md` | คู่มือติดตั้งและใช้งาน |
| `netlify-site/README-Netlify.md` | คู่มือขึ้น Netlify |

## Build

```bash
cat parts/p1.js parts/p2.js parts/p3.js parts/p4.js > app/App.html   # รวมหน้าเว็บ
python3 build.py           # สร้าง demo/index.html
python3 build_netlify.py   # สร้าง netlify-site/
```

## ทดสอบหลังบ้าน

```bash
TZ=Asia/Bangkok node tests/gas_test.js     # ต้องได้ ALL PASS
node tests/gas_server.js                     # จำลอง Apps Script ที่ http://localhost:8770 พร้อมหน้าเว็บ netlify-site
```

## Deploy

- **Apps Script:** วางไฟล์ใน `app/` → Deploy → New version (Who has access: Anyone)
- **Netlify:** ตั้งค่า Publish directory = `netlify-site` (ไม่มีขั้นตอน build) หรือลากโฟลเดอร์ไปที่ app.netlify.com/drop
  แล้วตั้ง `SITE_URL` ในหน้าตั้งค่าระบบเป็นลิงก์ Netlify
