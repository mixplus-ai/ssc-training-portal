# ขึ้นเว็บบน Netlify

หน้าเว็บจะอยู่บน Netlify ส่วนฐานข้อมูล อีเมล และไฟล์ ยังทำงานผ่าน Google Apps Script และ Google Sheet เหมือนเดิม

## ขั้นตอน

1. **อัปเดต Apps Script ก่อน**
   - วาง `Code.gs` และ `App.html` ใหม่ทับไฟล์เดิม
   - กด **Deploy → Manage deployments → แก้ไข (ดินสอ) → Version: New version → Deploy**
   - ต้องตั้ง Who has access = **Anyone** และ Execute as = **Me**
   - คัดลอกลิงก์ **Web app URL** ที่ลงท้ายด้วย `/exec`
2. **ใส่ลิงก์ใน `config.js`** (ไฟล์ในโฟลเดอร์นี้)
   ```js
   window.API_URL = 'https://script.google.com/macros/s/xxxxxxxx/exec';
   ```
   ถ้าเว้นว่างไว้ เว็บจะเปิดเป็น **โหมดเดโม** (ข้อมูลจำลอง) ใช้ดูหน้าตาก่อนได้
3. **อัปโหลดขึ้น Netlify**
   - เข้า https://app.netlify.com/drop (ล็อกอินหรือสมัครฟรี)
   - ลาก **ทั้งโฟลเดอร์ `netlify-site`** (ที่แตกไฟล์ zip แล้ว) ไปวางในกรอบ
   - จะได้ลิงก์ เช่น `https://random-name-123.netlify.app`
   - เปลี่ยนชื่อได้ที่ **Site configuration → Change site name** เช่น `ssc-training` หรือผูกโดเมนของบริษัทที่ **Domain management**
4. **บอกระบบว่าเว็บอยู่ที่ไหน**
   - เข้าเว็บ Netlify ด้วยบัญชีแอดมิน → **ตั้งค่าระบบ** → ช่อง `SITE_URL` ใส่ลิงก์ Netlify (เช่น `https://ssc-training.netlify.app`) → บันทึก
   - ทำให้ลิงก์ในอีเมล QR เช็คอิน QR บนใบประกาศ และลิงก์แชร์ LINE ชี้มาที่ Netlify
   - ถ้าไม่เห็นช่อง `SITE_URL` ให้รัน `setup()` ใน Apps Script หนึ่งครั้ง

## อัปเดตครั้งถัดไป
- แก้หน้าตาเว็บ: Netlify → Deploys → ลากโฟลเดอร์ใหม่ไปวาง (ลิงก์เดิม)
- แก้ระบบหลังบ้าน: แก้ใน Apps Script แล้ว Deploy เป็น New version (ลิงก์ `/exec` เดิมใช้ต่อได้)

## หมายเหตุ
- ลิงก์ Apps Script เดิมยังเปิดใช้ได้ตามปกติ QR บนใบประกาศที่ออกไปก่อนหน้ายังตรวจสอบได้
- ห้ามใส่รหัสผ่านหรือข้อมูลลับใน `config.js` เพราะทุกคนเปิดดูได้ ลิงก์ `/exec` เปิดเผยได้ ระบบตรวจสิทธิ์ทุกคำขอด้วย token ของผู้ใช้อยู่แล้ว
