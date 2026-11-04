/* Demo backend v2: จำลองการทำงานของ Code.gs ในเบราว์เซอร์ (ข้อมูลไม่ถูกบันทึกจริง) */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return fmt(d); };
  const addMonths = (s, n) => { const [y, m, d] = s.split('-').map(Number); return fmt(new Date(y, m - 1 + n, d)); };
  const today = () => fmt(new Date());
  const uid = p => p + Math.random().toString(36).slice(2, 8).toUpperCase();
  const now = () => new Date().toISOString();
  const ago = h => new Date(Date.now() - h * 36e5).toISOString();
  const year = () => new Date().getFullYear();
  const dt = (d, t) => new Date(`${d}T${t || '00:00'}:00+07:00`);
  const r2 = n => Math.round(n * 100) / 100;
  const cfg = (c, s) => ({ dateLang: 'en', fields: {
    name: { show: true, x: .5, y: .388, size: .052, color: c, weight: 500, font: 'Kanit', align: 'center', maxWidth: .62 },
    certNo: { show: true, x: .1445, y: .9045, size: .0205, color: s, weight: 400, font: 'Kanit', align: 'left' },
    date: { show: true, x: .179, y: .9265, size: .0205, color: s, weight: 400, font: 'Kanit', align: 'left' },
    expires: { show: false, x: .179, y: .948, size: .0185, color: s, weight: 400, font: 'Kanit', align: 'left', prefix: 'VALID UNTIL: ' },
    qr: { show: true, x: .2, y: .735, size: .115, color: '#111111' },
    course: { show: false, x: .5, y: .47, size: .035, color: c, weight: 600, font: 'Kanit', align: 'center', maxWidth: .7 } } });
  const art = (w, h, h1, h2, label) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${h1}"/><stop offset="1" stop-color="${h2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>
    <g opacity=".22" fill="#fff">${Array.from({ length: 6 }, (_, i) => `<rect x="${w * .48 + i * w * .085}" y="${h * .28 + (i % 2) * h * .06}" width="${w * .07}" height="${h * .42}" rx="6" transform="skewX(-14)"/>`).join('')}</g>
    <circle cx="${w * .86}" cy="${h * .22}" r="${h * .13}" fill="#f4d58a" opacity=".9"/><path d="M0 ${h * .82} Q ${w * .3} ${h * .7} ${w * .55} ${h * .8} T ${w} ${h * .76} V ${h} H 0Z" fill="#0b1a34" opacity=".45"/>${label ? `<text x="${w - 30}" y="${h - 26}" text-anchor="end" fill="#fff" opacity=".55" font-family="sans-serif" font-size="${h * .05}">${label}</text>` : ''}</svg>`);
  const photo = (h, t) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},45%,38%)"/><stop offset="1" stop-color="hsl(${h + 30},55%,22%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="300" cy="90" r="46" fill="#f4d58a" opacity=".85"/><path d="M0 300 L120 210 L210 270 L300 200 L400 260 L400 400 L0 400Z" fill="#0b1a34" opacity=".55"/><text x="24" y="370" fill="#fff" font-family="sans-serif" font-size="22" opacity=".9">${t}</text></svg>`);
  const gift = (h, t) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="hsl(${h},45%,92%)"/><rect x="110" y="170" width="180" height="140" rx="10" fill="hsl(${h},50%,45%)"/><rect x="95" y="135" width="210" height="45" rx="8" fill="hsl(${h},55%,38%)"/><rect x="188" y="135" width="24" height="175" fill="#f4d58a"/><path d="M200 135 C 170 90 130 100 150 130 Z M200 135 C 230 90 270 100 250 130 Z" fill="#f4d58a"/><text x="200" y="360" text-anchor="middle" fill="hsl(${h},40%,30%)" font-family="sans-serif" font-size="22">${t}</text></svg>`);

  // รอบวันนี้: เริ่ม 1 ชม.ก่อน เพื่อให้ทดลองเช็คอินได้
  const bkkH = (new Date().getUTCHours() + 7) % 24; const sh = Math.max(0, bkkH - 1);
  const todayStart = `${pad(sh)}:00`, todayEnd = `${pad(Math.min(23, sh + 6))}:59`;
  const S = (o) => Object.assign({ hours: 6, price: 0, fees: [], vat: false, whtAllowed: false, capacity: 30, status: 'open', location: 'SSC Training Center บางนา', mapUrl: 'https://maps.google.com', startTime: '09:00', endTime: '16:00', checkinCode: String(100000 + Math.floor(Math.random() * 899999)) }, o);

  const DB = {
    Settings: [
      ['ORG_NAME', 'Siam Solar Cell Training Center', 'ชื่อหน่วยงาน (แสดงบนเว็บ)'], ['ORG_SHORT', 'SSC Training', 'ชื่อย่อ (แสดงที่โลโก้)'], ['LOGO_URL', '', 'ลิงก์รูปโลโก้ (ว่าง = ใช้ตัวอักษร)'],
      ['CONTACT', 'โทร 02-000-0000 · training@example.com', 'ข้อมูลติดต่อ (ส่วนท้ายเว็บ)'], ['CERT_FORMAT', 'SSC-{CODE}-{YYYY}-{RUN}', 'รูปแบบเลขใบเซอร์ ใช้ {CODE} {YYYY} {YY} {MM} {RUN}'], ['CERT_RUN_DIGITS', '4', 'จำนวนหลักของเลขรัน'],
      ['CERT_VALID_MONTHS', '12', 'อายุใบเซอร์ (เดือน นับจากวันอบรม)'], ['AUTO_ISSUE_ON_ATTEND', 'FALSE', 'TRUE = ออกใบเซอร์ทันทีเมื่อเช็คอิน/เช็กชื่อเข้าร่วม'],
      ['MAX_ACTIVE_BOOKINGS', '5', 'จองล่วงหน้าได้สูงสุดกี่รอบ'], ['CHANGE_DAYS_BEFORE', '3', 'เลื่อน/ยกเลิกได้ถึงกี่วันก่อนวันอบรม'], ['STRIKE_LIMIT', '2', 'เลื่อน/ยกเลิก/ไม่มา ได้กี่ครั้ง (เกินนี้ระงับสิทธิ์)'],
      ['AUTO_NOSHOW', 'TRUE', 'TRUE = รอบที่จบแล้วแต่ไม่ได้เช็คอิน นับเป็น "ไม่มา" อัตโนมัติ'], ['REMIND_DAYS', '5', 'ส่งอีเมลเตือนก่อนวันอบรมกี่วัน'], ['CHECKIN_OPEN_MINUTES', '120', 'เปิดให้เช็คอินก่อนเวลาเริ่มกี่นาที'],
      ['HERO_SPEED', '5', 'ความเร็วสไลด์หน้าแรก (วินาทีต่อภาพ)'], ['POINTS_PER_HOUR', '1', 'แต้มต่อชั่วโมงอบรม'], ['REWARDS_ENABLED', 'TRUE', 'TRUE = แสดงหน้าแลกของรางวัลให้ลูกค้า'], ['LUCKY_COST', '10', 'แต้มที่ใช้ต่อการสุ่มรางวัล 1 ครั้ง'],
      ['VAT_RATE', '7', 'อัตราภาษีมูลค่าเพิ่ม (%)'], ['WHT_RATE', '3', 'อัตราหัก ณ ที่จ่าย (%)'], ['PAY_INFO', 'ธนาคารกสิกรไทย เลขที่ 000-0-00000-0 ชื่อบัญชี บจก. สยามโซล่าร์เซลล์', 'ข้อมูลบัญชีสำหรับโอนค่าอบรม'],
      ['SEND_EMAIL', 'TRUE', 'TRUE = ส่งอีเมลยืนยัน/เตือน/ใบเซอร์พร้อม'],
      ["WHT_PAYEE_INFO", "บริษัท สยามโซล่าร์เซลล์ จำกัด (สำนักงานใหญ่)\nเลขประจำตัวผู้เสียภาษี 0000000000000\nที่อยู่ 000 ถนน........ แขวง........ เขต........ กรุงเทพมหานคร 10000", "ชื่อ ที่อยู่ เลขผู้เสียภาษีของบริษัท สำหรับให้ลูกค้าออกหนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)"],
      ["PERSON_NO_VAT", "TRUE", "TRUE = บุคคลทั่วไปเลือก “ไม่รับใบกำกับภาษี (ไม่คิด VAT)” ได้"],
      ["QUOTE_EMAIL", "", "อีเมลรับแจ้งคำขอใบเสนอราคา (ว่าง = ส่งถึงผู้ดูแลระบบทุกคน)"],
      ["EMAIL_REG_SUBJECT", "ยืนยันการลงทะเบียนอบรม: {หลักสูตร}", ""],
      ["EMAIL_REG_BODY", "เรียน {ชื่อ}\n\nท่านได้ลงทะเบียนอบรมหลักสูตร **{หลักสูตร}** เรียบร้อยแล้ว\n\nวันที่: **{วันที่}**\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\n{ข้อมูลการชำระเงิน}\n\nเลขที่การลงทะเบียน: {เลขที่ลงทะเบียน}\nไฟล์แนบ .ics สามารถเพิ่มลงปฏิทินของท่านได้ (แจ้งเตือนล่วงหน้า 1 วัน)\nดูรายละเอียดและเอกสารประกอบได้ที่เมนู “การอบรมของฉัน”: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}", ""],
      ["EMAIL_REMIND_SUBJECT", "แจ้งเตือน: อีก {อีกกี่วัน} วันถึงวันอบรม {หลักสูตร}", ""],
      ["EMAIL_REMIND_BODY", "เรียน {ชื่อ}\n\nขอแจ้งเตือนการอบรมที่ท่านลงทะเบียนไว้ หลักสูตร **{หลักสูตร}**\n\nวันที่: **{วันที่}** (อีก {อีกกี่วัน} วัน)\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\nเมื่อมาถึงสถานที่ กรุณาสแกน QR Code ที่จุดลงทะเบียนเพื่อเช็คอิน และรับเอกสารประกอบการบรรยาย\nหากไม่สามารถเข้าร่วมได้ กรุณาเลื่อนหรือยกเลิกล่วงหน้าที่: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}", ""],
      ['SALES_LIST', 'Ms Asamaporn Photim (Nous)\nMr Teerawat Chatpomarat (Boy)\nMs Jirawadee Khumphusa (Aoom)\nMs Jirapreeya Sornkaew (Parry)\nMr Kittisak Jaratpattaranit (Tree)\nMr Chaleomchai Phowong (O)', 'รายชื่อ Sale ที่เชิญเข้าร่วม (บรรทัดละ 1 ชื่อ) · ใช้ในแบบฟอร์มลงทะเบียน'],
      ['SOURCE_LIST', 'เฟซบุ๊ก (Facebook) ของสยามโซล่าเซลล์\nไลน์แอด (LINE OA) ของสยามโซล่าเซลล์\nคำแนะนำจากเพื่อน / คนรู้จัก\nคำแนะนำจากฝ่ายขาย / ทีมงาน', 'ช่องทางที่รู้จักกิจกรรม (บรรทัดละ 1 ช่องทาง ระบบเพิ่ม “อื่นๆ” ให้เอง)']
    ].map(r => ({ key: r[0], value: r[1], description: r[2] })),
    Templates: [
      { id: 'T1', name: 'SolarEdge O&M – แดง', imageUrl: 'templates/tpl-om-red.jpg', config: cfg('#7a0f1c', '#8f2230') },
      { id: 'T2', name: 'Basics Solar Design – เขียว', imageUrl: 'templates/tpl-basic-green.jpg', config: cfg('#2f7d47', '#3c8d5c') },
      { id: 'T3', name: 'Commercial Designer – น้ำเงิน', imageUrl: 'templates/tpl-commercial-blue.jpg', config: cfg('#16235a', '#2c3a6e') }
    ],
    Courses: [
      { id: 'C1', code: 'OM', title: 'SolarEdge O&M (Operation & Maintenance)', subtitle: 'หลักสูตรการบำรุงรักษาระบบโซล่าเซลล์ SolarEdge', description: 'การตรวจสอบ บำรุงรักษา และแก้ไขปัญหาระบบ SolarEdge ภาคปฏิบัติ', hours: 6, price: 0, color: '#8f1424', sort: 1, active: true, defaultTemplateId: 'T1' },
      { id: 'C2', code: 'BSD', title: 'Basics Solar System Design', subtitle: 'พื้นฐานการออกแบบระบบโซล่าร์เซลล์ SolarEdge', description: 'หลักการออกแบบระบบโซล่าร์เซลล์เบื้องต้น การเลือกอุปกรณ์ และการคำนวณ', hours: 6, price: 0, color: '#1f6b3a', sort: 2, active: true, defaultTemplateId: 'T2' },
      { id: 'C3', code: 'CDI', title: 'SolarEdge Commercial Designer and Installation System', subtitle: 'การออกแบบระบบโซล่าร์เซลล์ขนาดโรงงานและการติดตั้ง', description: 'ออกแบบระบบขนาดเชิงพาณิชย์/โรงงาน การติดตั้งระบบรวมถึงการตั้งค่าขั้นสูง', hours: 12, price: 3500, color: '#16235a', sort: 3, active: true, defaultTemplateId: 'T3' }
    ],
    Sessions: [
      S({ id: 'SX', courseId: 'C2', title: 'รุ่นที่ 1/2568', date: addDays(-400), status: 'done', templateId: 'T2' }),
      S({ id: 'S0', courseId: 'C1', title: 'รุ่นที่ 4/2569', date: addDays(-20), status: 'done', templateId: 'T1' }),
      S({ id: 'ST', courseId: 'C1', title: 'รุ่นพิเศษ (วันนี้)', date: today(), startTime: todayStart, endTime: todayEnd, status: 'open', templateId: 'T1', checkinCode: '246810' }),
      S({ id: 'S1', courseId: 'C1', title: 'รุ่นที่ 5/2569', date: addDays(6), templateId: 'T1' }),
      S({ id: 'S2', courseId: 'C2', title: 'รุ่นที่ 3/2569', date: addDays(12), location: 'โรงแรมเซ็นทารา แกรนด์ ลาดพร้าว', capacity: 40, templateId: 'T2' }),
      S({ id: 'S3', courseId: 'C3', title: 'รุ่นที่ 1/2569', date: addDays(19), endDate: addDays(20), startTime: '08:30', endTime: '16:30', hours: 12, capacity: 24, price: 3500, fees: [{ name: 'ค่าเอกสารและอุปกรณ์ภาคปฏิบัติ', amount: 500 }], vat: true, whtAllowed: true, templateId: 'T3' }),
      S({ id: 'S4', courseId: 'C1', title: 'รุ่นที่ 6/2569', date: addDays(27), location: 'ศูนย์ประชุม จ.เชียงใหม่' }),
      S({ id: 'S5', courseId: 'C2', title: 'รุ่นที่ 4/2569', date: addDays(33), capacity: 20 }),
      S({ id: 'S6', courseId: 'C3', title: 'รุ่นที่ 2/2569', date: addDays(40), endDate: addDays(41), startTime: '08:30', endTime: '16:30', hours: 12, capacity: 24, price: 3500, fees: [{ name: 'ค่าเอกสารและอุปกรณ์ภาคปฏิบัติ', amount: 500 }], vat: true, whtAllowed: true }),
      S({ id: 'S7', courseId: 'C1', title: 'รุ่นที่ 7/2569', date: addDays(48), location: 'โรงแรมอมารี พัทยา' }),
      S({ id: 'S8', courseId: 'C2', title: 'รุ่นที่ 5/2569', date: addDays(55) })
    ],
    Users: [
      { id: 'U1', email: 'admin@demo.com', password: 'demo1234', prefix: 'นางสาว', firstName: 'อัสมาภรณ์', lastName: 'โพธิ์ทิม', phone: '081-000-0000', company: 'Siam Solar Cell', position: 'ผู้ดูแลระบบ', role: 'admin', status: 'active', createdAt: ago(900) },
      { id: 'U2', email: 'wasan@demo.com', password: 'demo1234', prefix: 'นาย', firstName: 'วสันต์', lastName: 'คำเงิน', nameEn: 'Mr. Wasan Khamngoen', phone: '089-123-4567', company: 'บจก. กรีนพาวเวอร์ เอ็นจิเนียริ่ง', position: 'วิศวกรติดตั้ง', billingType: 'company', billingName: 'บริษัท กรีนพาวเวอร์ เอ็นจิเนียริ่ง จำกัด', taxId: '0105561234567', branch: 'สำนักงานใหญ่', billingAddress: '99/9 ถ.บางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260', role: 'user', status: 'active', createdAt: ago(800) },
      { id: 'U3', email: 'somchai@demo.com', password: 'demo1234', prefix: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี', phone: '086-555-1212', company: 'บจก. โซลาร์เทค', role: 'user', status: 'active', createdAt: ago(700) },
      { id: 'U4', email: 'napa@demo.com', password: 'demo1234', prefix: 'นางสาว', firstName: 'นภา', lastName: 'ศรีสุข', phone: '082-777-8899', company: 'หจก. ซันไรส์ เอนเนอร์ยี', role: 'user', status: 'active', createdAt: ago(600) }
    ],
    Registrations: [], Strikes: [], Points: [], Redemptions: [], QuoteRequests: [], QuoteRequests: [],
    Banners: [
      { id: 'B1', placement: 'home', month: '', sort: 1, title: 'เปิดรับสมัครรอบอบรมประจำเดือนนี้แล้ว', subtitle: 'หลักสูตร SolarEdge ทั้ง 3 หลักสูตร พร้อมรับใบประกาศนียบัตรออนไลน์ทันทีหลังจบการอบรม', imageUrl: art(1920, 700, '#0d2a52', '#123a6e', '1920 × 700'), active: true },
      { id: 'B2', placement: 'home', month: '', sort: 2, title: 'อบรมครบ สะสมแต้ม แลกของรางวัล', subtitle: 'อบรม 1 ชั่วโมง รับ 1 แต้ม · แลกของรางวัลหรือลุ้นสุ่มรางวัลได้ทั้งปี', imageUrl: art(1920, 700, '#3b2a10', '#7a5a1f', '1920 × 700'), active: true },
      { id: 'B3', placement: 'home', month: '', sort: 3, title: 'Commercial Designer รุ่นใหม่ เปิดรับแล้ว', subtitle: 'ออกแบบระบบขนาดโรงงาน 2 วันเต็ม พร้อมภาคปฏิบัติ', imageUrl: art(1920, 700, '#0f3a24', '#1f6b3a', '1920 × 700'), active: true },
      { id: 'B4', placement: 'schedule', month: '', title: 'ตารางอบรมล่วงหน้า', subtitle: 'จองที่นั่งได้สูงสุด 5 รอบ · เพิ่มลงปฏิทินของท่านได้ในคลิกเดียว', imageUrl: art(1920, 400, '#16235a', '#244277', '1920 × 400'), active: true },
      { id: 'B5', placement: 'rewards', month: '', title: 'ของรางวัลประจำปี', subtitle: 'แต้มสะสมใช้ได้ถึง 31 ธันวาคม', imageUrl: art(1920, 400, '#5a3d0e', '#b48a3c', '1920 × 400'), active: true }
    ],
    Materials: [
      { id: 'M1', courseId: 'C1', sessionId: '', type: 'slide', title: 'SolarEdge O&M – เอกสารประกอบการบรรยาย.pdf', url: '#', fileId: 'x', visibility: 'checkin' },
      { id: 'M2', courseId: 'C1', sessionId: '', type: 'promo', title: 'โปรโมชั่นพิเศษสำหรับผู้เข้าอบรม – Inverter ลด 10%.pdf', url: '#', fileId: 'y', visibility: 'checkin' },
      { id: 'M3', courseId: 'C1', sessionId: '', type: 'video', title: 'วิดีโอ: ขั้นตอนตรวจ Optimizer (YouTube)', url: 'https://www.youtube.com/', visibility: 'registered' },
      { id: 'M4', courseId: 'C1', sessionId: '', type: 'document', title: 'Checklist การตรวจบำรุงรักษาประจำปี.xlsx', url: '#', fileId: 'z', visibility: 'attended' },
      { id: 'M5', courseId: 'C2', sessionId: '', type: 'slide', title: 'Basics Solar System Design – Slides.pdf', url: '#', fileId: 'a', visibility: 'checkin' },
      { id: 'M6', courseId: 'C3', sessionId: '', type: 'slide', title: 'Commercial Designer – Slides.pdf', url: '#', fileId: 'b', visibility: 'checkin' }
    ],
    Rewards: [
      { id: 'W1', kind: 'item', name: 'แก้วเก็บความเย็น SSC', description: 'ขนาด 30 oz', imageUrl: gift(200, 'Tumbler'), points: 6, stock: 20, active: true, sort: 1 },
      { id: 'W2', kind: 'item', name: 'เสื้อโปโล SolarEdge', description: 'เลือกไซซ์ได้', imageUrl: gift(350, 'Polo'), points: 12, stock: 15, active: true, sort: 2 },
      { id: 'W3', kind: 'item', name: 'คูปองส่วนลดอบรม 1,000 บาท', description: 'ใช้กับหลักสูตรที่มีค่าใช้จ่าย', imageUrl: gift(40, 'Coupon'), points: 18, stock: '', active: true, sort: 3 },
      { id: 'W4', kind: 'item', name: 'มัลติมิเตอร์ดิจิทัล', description: 'สำหรับงานติดตั้ง', imageUrl: gift(120, 'Meter'), points: 30, stock: 5, active: true, sort: 4 },
      { id: 'W5', kind: 'prize', name: 'Power Bank 10,000 mAh', imageUrl: gift(260, 'Power Bank'), weight: 10, stock: 10, active: true },
      { id: 'W6', kind: 'prize', name: 'ร่มพับ SSC', imageUrl: gift(300, 'Umbrella'), weight: 30, stock: '', active: true },
      { id: 'W7', kind: 'prize', name: 'แต้มคืน 5 แต้ม', imageUrl: gift(50, '+5'), weight: 40, stock: '', active: true },
      { id: 'W8', kind: 'prize', name: 'iPad (รางวัลใหญ่)', imageUrl: gift(0, 'iPad'), weight: 1, stock: 1, active: true }
    ]
  };
  ['บรรยาย', 'ภาคปฏิบัติ', 'ตรวจ Inverter', 'ถ่ายภาพหมู่', 'Workshop', 'มอบใบประกาศ'].forEach((t, i) =>
    DB.Materials.push({ id: 'P' + i, courseId: 'C1', sessionId: 'S0', type: 'photo', title: t, url: photo(200 + i * 25, t), visibility: 'after' }));
  DB.Materials.push({ id: 'PT', courseId: 'C1', sessionId: 'ST', type: 'photo', title: 'ภาพบรรยากาศวันนี้', url: photo(20, 'วันนี้'), visibility: 'after' });

  const find = (t, k, v) => DB[t].find(r => String(r[k]) === String(v));
  const setting = k => (find('Settings', 'key', k) || {}).value;
  const isT = v => v === true || String(v).toUpperCase() === 'TRUE';
  const addPoints = (userId, pts, type, refId, note, at) => DB.Points.push({ id: uid('P'), userId, year: year(), points: pts, type, refId: refId || '', note: note || '', createdAt: at || now() });
  const reg = (u, s, st, cert, extra) => { const r = Object.assign({ id: uid('R'), userId: u, sessionId: s, status: st, registeredAt: ago(300), certNo: cert || '', certIssuedAt: cert ? ago(200) : '', payStatus: 'free', subtotal: 0, vatAmount: 0, whtAmount: 0, total: 0 }, extra || {}); DB.Registrations.push(r); return r; };
  const y = year();
  reg('U2', 'SX', 'attended', `SSC-BSD-${y - 1}-0003`, { checkedInAt: ago(9600) });
  const r0 = reg('U2', 'S0', 'attended', `SSC-OM-${y}-0001`, { checkedInAt: ago(480), pointsAwarded: 6 });
  addPoints('U2', 6, 'earn', r0.id, 'อบรม OM ' + addDays(-20), ago(480));
  reg('U3', 'S0', 'attended', `SSC-OM-${y}-0002`, { checkedInAt: ago(480) });
  reg('U4', 'S0', 'attended', '', { checkedInAt: ago(480) });
  addPoints('U2', 12, 'adjust', '', 'แต้มต้อนรับสมาชิก (ผู้ดูแล)', ago(470));
  reg('U2', 'ST', 'registered');
  reg('U2', 'S3', 'registered', '', { payStatus: 'unpaid', subtotal: 4000, vatAmount: 280, whtAmount: 120, total: 4160, billing: { billingType: 'company', billingName: 'บริษัท กรีนพาวเวอร์ เอ็นจิเนียริ่ง จำกัด', taxId: '0105561234567', branch: 'สำนักงานใหญ่', billingAddress: '99/9 ถ.บางนา-ตราด กรุงเทพฯ' } });
  reg('U2', 'S5', 'registered');
  reg('U3', 'ST', 'registered', '', { checkedInAt: ago(0.5), status: 'attended' });
  reg('U3', 'S1', 'registered'); reg('U4', 'S1', 'registered'); reg('U3', 'S2', 'registered');
  reg('U4', 'S3', 'registered', '', { payStatus: 'review', subtotal: 4000, vatAmount: 280, whtAmount: 120, total: 4160, slipUrl: photo(200, 'Slip'), whtCertUrl: photo(30, '50 Tawi'), billing: { billingType: 'company', billingName: 'บริษัท โซลาร์เทค จำกัด', taxId: '0105559876543', branch: 'สำนักงานใหญ่', billingAddress: 'กรุงเทพฯ' } });
  reg('U3', 'S3', 'registered', '', { payStatus: 'review', subtotal: 4000, vatAmount: 280, whtAmount: 0, total: 4280, slipUrl: photo(140, 'Slip'), billing: { billingType: 'person', billingName: 'นาย สมชาย ใจดี' } });
  DB.QuoteRequests.push({ id: uid('Q'), userId: 'U3', sessionId: 'S3', courseTitle: 'SolarEdge Commercial Designer and Installation System', sessionDate: '', companyName: 'บริษัท ซันไรส์ เอนเนอร์ยี่ จำกัด', branch: 'สำนักงานใหญ่', address: '99/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ', postcode: '10400', taxId: '0105561111111', contactName: 'คุณมานี จัดซื้อ', phone: '081-234-5678', email: 'purchase@sunrise.example', note: 'ขอใบเสนอราคา 3 ท่าน', status: 'new', createdAt: ago(3) });
  DB.Strikes.push({ id: uid('K'), userId: 'U2', regId: '', type: 'reschedule', reason: 'ติดงานลูกค้า', createdAt: ago(200) });
  DB.Redemptions.push({ id: uid('D'), userId: 'U3', rewardId: 'W1', rewardName: 'แก้วเก็บความเย็น SSC', points: 6, kind: 'redeem', status: 'pending', createdAt: ago(30) });
  for (let i = 0; i < 17; i++) DB.Registrations.push({ id: uid('R'), userId: 'X' + i, sessionId: ['S1', 'S2', 'S3', 'S1', 'ST'][i % 5], status: 'registered', registeredAt: now(), payStatus: 'free' });

  const fullName = u => [u.prefix, u.firstName, u.lastName].filter(Boolean).join(' ');
  const safe = u => { const o = Object.assign({}, u); delete o.password; o.fullName = fullName(u); return o; };
  const pointsOf = id => { const rows = DB.Points.filter(x => x.userId === id && x.year === year()); return { year: year(), earned: rows.filter(x => x.points > 0 && x.type !== 'refund').reduce((a, x) => a + x.points, 0), balance: rows.reduce((a, x) => a + Number(x.points), 0), expiresAt: year() + '-12-31' }; };
  const rules = u => {
    const active = DB.Registrations.filter(r => r.userId === u.id && r.status === 'registered' && (find('Sessions', 'id', r.sessionId) || {}).date >= today()).length;
    const strikes = DB.Strikes.filter(s => s.userId === u.id && (!u.penaltyAt || s.createdAt > u.penaltyAt)).length;
    return { active, maxActive: +setting('MAX_ACTIVE_BOOKINGS'), strikes, strikeLimit: +setting('STRIKE_LIMIT'), changeDays: +setting('CHANGE_DAYS_BEFORE'), bannedUntil: u.bannedUntil || '', banned: !!u.bannedUntil && u.bannedUntil > today() };
  };
  const me = u => Object.assign(safe(u), { points: pointsOf(u.id), rules: rules(u) });
  const pub = () => { const o = {}; ['ORG_NAME', 'ORG_SHORT', 'LOGO_URL', 'CONTACT', 'HERO_SPEED', 'REWARDS_ENABLED', 'MAX_ACTIVE_BOOKINGS', 'CHANGE_DAYS_BEFORE', 'STRIKE_LIMIT', 'VAT_RATE', 'WHT_RATE', 'PAY_INFO', 'CERT_VALID_MONTHS', 'LUCKY_COST', 'POINTS_PER_HOUR', 'CHECKIN_OPEN_MINUTES', 'SALES_LIST', 'SOURCE_LIST', 'WHT_PAYEE_INFO', 'PERSON_NO_VAT'].forEach(k => o[k] = setting(k) || ''); o.APP_URL = 'https://script.google.com/macros/s/DEMO/exec'; return o; };
  const courses = () => DB.Courses.filter(c => c.active).sort((a, b) => a.sort - b.sort);
  const stats = () => DB.Sessions.map(s0 => {
    const s = JSON.parse(JSON.stringify(s0)); const act = DB.Registrations.filter(r => r.sessionId === s.id && r.status !== 'cancelled');
    s.registered = act.length; s.checkedIn = act.filter(r => r.checkedInAt).length; s.attended = act.filter(r => r.status === 'attended').length; s.certs = act.filter(r => r.certNo).length; s.payReview = act.filter(r => r.payStatus === 'review').length;
    s.seatsLeft = +s.capacity ? Math.max(+s.capacity - s.registered, 0) : null;
    const c = find('Courses', 'id', s.courseId) || {}; s.courseTitle = c.title; s.courseCode = c.code; s.courseColor = c.color; s.hours = s.hours || c.hours;
    s.fees = Array.isArray(s.fees) ? s.fees : []; s.feeTotal = Number(s.price || 0) + s.fees.reduce((a, f) => a + Number(f.amount || 0), 0); return s;
  }).sort((a, b) => a.date < b.date ? -1 : 1);
  const pubS = s => { const o = Object.assign({}, s); delete o.checkinCode; return o; };
  const banners = () => {
    const m = today().slice(0, 7), out = {};
    DB.Banners.filter(b => isT(b.active)).sort((a, b) => (a.sort || 0) - (b.sort || 0)).forEach(b => { const pl = b.placement || 'home'; (out[pl] = out[pl] || []).push(b); });
    Object.keys(out).forEach(pl => { const c = out[pl].filter(b => !b.month || b.month === m); out[pl] = c.length ? c : out[pl].slice(-1); });
    return out;
  };
  const certExpiry = s => addMonths(s.endDate || s.date, +setting('CERT_VALID_MONTHS') || 12);
  const changeAllowed = s => { const l = dt(s.date); l.setDate(l.getDate() - +setting('CHANGE_DAYS_BEFORE')); return new Date() < l; };
  const assertChange = s => { if (!changeAllowed(s)) throw new Error('เลื่อนหรือยกเลิกได้ถึง ' + setting('CHANGE_DAYS_BEFORE') + ' วันก่อนวันอบรมเท่านั้น กรุณาติดต่อเจ้าหน้าที่'); };
  const addStrike = (u, regId, type, reason) => {
    DB.Strikes.push({ id: uid('K'), userId: u.id, regId, type, reason: reason || '', createdAt: now() });
    const rl = rules(u); if (rl.strikes <= rl.strikeLimit) return null;
    const d = new Date(), until = fmt(new Date(d.getFullYear(), d.getMonth() + 2, 1));
    DB.Registrations.forEach(r => { if (r.userId === u.id && r.status === 'registered' && (find('Sessions', 'id', r.sessionId) || {}).date >= today()) { r.status = 'cancelled'; r.cancelReason = 'ระงับสิทธิ์อัตโนมัติ'; r.cancelledAt = now(); } });
    u.bannedUntil = until; u.penaltyAt = now(); return { bannedUntil: until };
  };
  const calcFees = (s, billing, wht) => {
    const sub = Number(s.price || 0) + (s.fees || []).reduce((a, f) => a + Number(f.amount || 0), 0);
    const vat = isT(s.vat) && !(billing && billing.billingType !== 'company' && billing.noVat && isT(setting('PERSON_NO_VAT'))) ? r2(sub * +setting('VAT_RATE') / 100) : 0;
    const w = wht && isT(s.whtAllowed) && billing && billing.billingType === 'company' ? r2(sub * +setting('WHT_RATE') / 100) : 0;
    return { subtotal: sub, vat, wht: w, total: r2(sub + vat - w) };
  };
  const afterAttend = ids => ids.forEach(id => {
    const r = find('Registrations', 'id', id); if (!r || r.pointsAwarded) return;
    const s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId), pts = Math.round(Number(s.hours || c.hours) * +setting('POINTS_PER_HOUR'));
    if (pts > 0) { addPoints(r.userId, pts, 'earn', r.id, 'อบรม ' + c.code + ' ' + s.date); r.pointsAwarded = pts; }
  });
  const mat = m => Object.assign({}, m, m.fileId && m.type !== 'photo' ? { downloadUrl: m.url } : {});
  const upsert = (t, o, p) => { if (o.id && find(t, 'id', o.id)) Object.assign(find(t, 'id', o.id), o); else { o.id = uid(p); o.createdAt = now(); DB[t].push(o); } return find(t, 'id', o.id); };
  const del = (t, id) => { DB[t] = DB[t].filter(r => r.id !== id); };
  const fileUrl = f => f && f.data;
  const tokens = {};
  const verifyUrl = no => (location.href.split('?')[0].split('#')[0]) + '?verify=' + encodeURIComponent(no);

  const A = {
    publicHome: () => ({ settings: pub(), courses: courses(), banners: banners(), sessions: stats().filter(s => s.status === 'open' && s.date >= today()).map(pubS) }),
    register: p => {
      if (find('Users', 'email', (p.email || '').toLowerCase())) throw new Error('อีเมลนี้ลงทะเบียนแล้ว');
      const u = { id: uid('U'), email: p.email.toLowerCase(), password: p.password, prefix: p.prefix, firstName: p.firstName, lastName: p.lastName, phone: p.phone, company: p.company, role: 'user', status: 'active', createdAt: now() };
      DB.Users.push(u); const t = uid('tok'); tokens[t] = u.id; return { token: t, user: me(u) };
    },
    login: p => {
      const u = find('Users', 'email', String(p.email || '').toLowerCase());
      if (!u || u.password !== p.password) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      const t = uid('tok'); tokens[t] = u.id; return { token: t, user: me(u) };
    },
    forgotPassword: () => ({ sent: true }),
    verifyCert: p => {
      const r = find('Registrations', 'certNo', String(p.certNo || '').trim()); if (!r) return { valid: false };
      const u = find('Users', 'id', r.userId), s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId), exp = certExpiry(s);
      return { valid: true, certNo: r.certNo, name: fullName(u), company: u.company, course: c.title, date: s.date, endDate: s.endDate, startTime: s.startTime, endTime: s.endTime, location: s.location, hours: s.hours || c.hours, checkedInAt: r.checkedInAt, issuedAt: r.certIssuedAt, expiresAt: exp, expired: exp < today() };
    },
    me: (p, u) => ({ user: me(u), settings: pub() }),
    updateProfile: (p, u) => { ['prefix', 'firstName', 'lastName', 'nameEn', 'phone', 'company', 'position', 'billingType', 'billingName', 'taxId', 'branch', 'billingAddress'].forEach(k => { if (p[k] !== undefined) u[k] = p[k]; }); if (p.photo) u.photoUrl = fileUrl(p.photo); return me(u); },
    changePassword: (p, u) => { if (p.oldPassword !== u.password) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง'); u.password = p.newPassword; return true; },
    listSessions: (p, u) => {
      const mine = DB.Registrations.filter(r => r.userId === u.id && r.status !== 'cancelled');
      const list = stats().filter(s => !['draft', 'cancelled'].includes(s.status) && s.date >= today()).map(pubS);
      list.forEach(s => { const r = mine.find(x => x.sessionId === s.id); s.myStatus = r ? r.status : ''; s.myRegId = r ? r.id : ''; });
      return { courses: courses(), sessions: list, banners: banners(), me: me(u) };
    },
    registerSession: (p, u) => {
      const rl = rules(u);
      if (rl.banned) throw new Error('บัญชีของท่านถูกระงับการลงทะเบียนถึงวันที่ ' + rl.bannedUntil);
      if (rl.active >= rl.maxActive) throw new Error('ท่านจองล่วงหน้าได้สูงสุด ' + rl.maxActive + ' รอบ');
      const s = stats().find(x => x.id === p.sessionId);
      if (!s || s.status !== 'open') throw new Error('รอบนี้ไม่เปิดรับลงทะเบียน');
      if (DB.Registrations.some(r => r.userId === u.id && r.sessionId === s.id && r.status !== 'cancelled')) throw new Error('ท่านลงทะเบียนรอบนี้แล้ว');
      if (s.seatsLeft === 0) throw new Error('ขออภัย ที่นั่งเต็มแล้ว');
      if (!String(p.saleName || '').trim()) throw new Error('กรุณาระบุชื่อ Sale ที่เชิญท่านเข้าร่วมกิจกรรม');
      if (!String(p.source || '').trim()) throw new Error('กรุณาระบุช่องทางที่ท่านรู้จักกิจกรรมนี้');
      const m = calcFees(s, p.billing, p.wht);
      const r = { id: uid('R'), userId: u.id, sessionId: s.id, status: 'registered', registeredAt: now(), payStatus: m.total > 0 ? 'unpaid' : 'free', subtotal: m.subtotal, vatAmount: m.vat, whtAmount: m.wht, total: m.total, billing: m.total > 0 ? p.billing : '', saleName: String(p.saleName).trim(), source: String(p.source).trim() };
      if (p.slip) { r.slipUrl = fileUrl(p.slip); r.payStatus = 'review'; }
      if (p.saveBilling && p.billing) Object.assign(u, p.billing);
      DB.Registrations.push(r); return r;
    },
    uploadPayment: (p, u) => { const r = find('Registrations', 'id', p.regId); if (p.slip) { r.slipUrl = fileUrl(p.slip); if (r.payStatus !== 'paid') r.payStatus = 'review'; } if (p.whtCert) r.whtCertUrl = fileUrl(p.whtCert); return r; },
    cancelRegistration: (p, u) => {
      if (!String(p.reason || '').trim()) throw new Error('กรุณาระบุเหตุผลการยกเลิก');
      const r = find('Registrations', 'id', p.regId); if (!r || r.userId !== u.id || r.status !== 'registered') throw new Error('ไม่สามารถยกเลิกได้');
      assertChange(find('Sessions', 'id', r.sessionId));
      r.status = 'cancelled'; r.cancelReason = p.reason; r.cancelledAt = now();
      return { penalty: addStrike(u, r.id, 'cancel', p.reason) };
    },
    rescheduleRegistration: (p, u) => {
      const r = find('Registrations', 'id', p.regId); if (!r || r.userId !== u.id || r.status !== 'registered') throw new Error('ไม่สามารถเลื่อนรอบได้');
      const from = find('Sessions', 'id', r.sessionId); assertChange(from);
      const to = stats().find(s => s.id === p.toSessionId);
      if (!to || to.courseId !== from.courseId || to.status !== 'open') throw new Error('กรุณาเลือกรอบใหม่ในหลักสูตรเดียวกัน');
      if (to.seatsLeft === 0) throw new Error('รอบที่เลือกเต็มแล้ว');
      r.sessionId = to.id; r.rescheduledFrom = from.id;
      return { penalty: addStrike(u, r.id, 'reschedule', p.reason) };
    },
    checkin: (p, u) => {
      const parts = String(p.code || '').trim().split('.');
      const s = parts.length === 2 ? DB.Sessions.find(x => x.id === parts[0] && String(x.checkinCode) === parts[1]) : DB.Sessions.find(x => String(x.checkinCode) === parts[0] && x.date <= today() && (x.endDate || x.date) >= today());
      if (!s) throw new Error('รหัสเช็คอินไม่ถูกต้อง (เดโม: ใช้รหัส 246810)');
      const open = dt(s.date, s.startTime); open.setMinutes(open.getMinutes() - +setting('CHECKIN_OPEN_MINUTES'));
      if (new Date() < open) throw new Error('ยังไม่ถึงเวลาเช็คอิน');
      if (new Date() > dt(s.endDate || s.date, s.endTime)) throw new Error('การอบรมรอบนี้จบไปแล้ว');
      const r = DB.Registrations.find(x => x.userId === u.id && x.sessionId === s.id && x.status !== 'cancelled');
      if (!r) throw new Error('ไม่พบการลงทะเบียนของท่านในรอบนี้ กรุณาติดต่อเจ้าหน้าที่');
      const already = !!r.checkedInAt;
      if (!already) { r.checkedInAt = now(); r.status = 'attended'; r.attendedAt = now(); afterAttend([r.id]); }
      return { regId: r.id, course: find('Courses', 'id', s.courseId).title, session: pubS(s), already, checkedInAt: r.checkedInAt };
    },
    myTrainings: (p, u) => ({
      rules: rules(u), payInfo: setting('PAY_INFO'),
      list: DB.Registrations.filter(r => r.userId === u.id && r.status !== 'cancelled').map(r => {
        const s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId), nowD = new Date();
        const start = dt(s.date, s.startTime), end = dt(s.endDate || s.date, s.endTime);
        const m = DB.Materials.filter(x => (x.sessionId && x.sessionId === s.id) || (!x.sessionId && x.courseId === s.courseId)).map(x => {
          const o = mat(x); let lock = '';
          if (x.visibility === 'checkin') { if (!r.checkedInAt) lock = 'เปิดให้ดาวน์โหลดหลังเช็คอินที่หน้างาน'; else if (nowD < start) lock = 'เปิดให้ดาวน์โหลดเมื่อการอบรมเริ่ม เวลา ' + s.startTime + ' น.'; }
          else if (x.visibility === 'after' || x.visibility === 'attended') { if (nowD < end) lock = 'เปิดให้ดาวน์โหลดหลังการอบรมจบ'; else if (x.visibility === 'attended' && r.status !== 'attended') lock = 'สำหรับผู้ที่เข้าร่วมอบรม'; }
          if (lock) { o.url = ''; o.downloadUrl = ''; o.locked = lock; }
          return o;
        });
        const exp = r.certNo ? certExpiry(s) : '';
        return { reg: r, session: pubS(s), course: c, materials: m, hasCert: !!r.certNo, certExpires: exp, certExpired: exp ? exp < today() : false, canChange: r.status === 'registered' && changeAllowed(s) };
      }).sort((a, b) => a.session.date < b.session.date ? 1 : -1)
    }),
    getCertificate: (p, u) => {
      const r = find('Registrations', 'id', p.regId); if (!r || !r.certNo) throw new Error('ยังไม่ได้ออกใบประกาศ');
      const o = find('Users', 'id', r.userId), s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId), exp = certExpiry(s);
      if (exp < today() && u.role !== 'admin') throw new Error('ใบประกาศหมดอายุแล้ว จึงไม่สามารถเปิดดูหรือดาวน์โหลดได้');
      const t = find('Templates', 'id', s.templateId || c.defaultTemplateId);
      return { name: fullName(o), nameEn: o.nameEn, certNo: r.certNo, date: s.endDate || s.date, expires: exp, course: c.title, hours: s.hours || c.hours, verifyUrl: verifyUrl(r.certNo), template: { id: t.id, name: t.name, config: t.config } };
    },
    templateImage: p => find('Templates', 'id', p.templateId).imageUrl,
    rewardsPage: (p, u) => {
      if (!isT(setting('REWARDS_ENABLED')) && u.role !== 'admin') throw new Error('หน้าแลกของรางวัลปิดอยู่ในขณะนี้');
      const rw = DB.Rewards.filter(x => isT(x.active)).sort((a, b) => (a.sort || 0) - (b.sort || 0));
      return { points: pointsOf(u.id), items: rw.filter(x => x.kind !== 'prize'), prizes: rw.filter(x => x.kind === 'prize' && (x.stock === '' || Number(x.stock) > 0)).map(x => ({ id: x.id, name: x.name, imageUrl: x.imageUrl })), luckyCost: +setting('LUCKY_COST'),
        history: DB.Redemptions.filter(x => x.userId === u.id).slice().reverse(), ledger: DB.Points.filter(x => x.userId === u.id && x.year === year()).slice().reverse() };
    },
    redeemReward: (p, u) => {
      const rw = find('Rewards', 'id', p.rewardId); if (!rw || rw.kind === 'prize') throw new Error('ไม่พบของรางวัล');
      if (rw.stock !== '' && +rw.stock <= 0) throw new Error('ของรางวัลหมดแล้ว');
      if (pointsOf(u.id).balance < +rw.points) throw new Error('แต้มไม่เพียงพอ');
      if (rw.stock !== '') rw.stock = +rw.stock - 1;
      const rd = { id: uid('D'), userId: u.id, rewardId: rw.id, rewardName: rw.name, points: +rw.points, kind: 'redeem', status: 'pending', createdAt: now() };
      DB.Redemptions.push(rd); addPoints(u.id, -rw.points, 'redeem', rd.id, 'แลก ' + rw.name); return { redemption: rd, points: pointsOf(u.id) };
    },
    luckyDraw: (p, u) => {
      const cost = +setting('LUCKY_COST'); if (pointsOf(u.id).balance < cost) throw new Error('แต้มไม่เพียงพอสำหรับการสุ่ม');
      const pool = DB.Rewards.filter(x => x.kind === 'prize' && isT(x.active) && (x.stock === '' || +x.stock > 0) && +x.weight > 0);
      if (!pool.length) throw new Error('ยังไม่มีรางวัลในกล่องสุ่ม');
      let r = Math.random() * pool.reduce((a, x) => a + +x.weight, 0), win = pool[0];
      for (const x of pool) { r -= +x.weight; if (r <= 0) { win = x; break; } }
      if (win.stock !== '') win.stock = +win.stock - 1;
      const rd = { id: uid('D'), userId: u.id, rewardId: win.id, rewardName: win.name, points: cost, kind: 'lucky', status: 'pending', createdAt: now() };
      DB.Redemptions.push(rd); addPoints(u.id, -cost, 'lucky', rd.id, 'สุ่มรางวัล: ' + win.name);
      return { prize: { id: win.id, name: win.name, imageUrl: win.imageUrl }, redemption: rd, points: pointsOf(u.id) };
    },
    adminData: () => {
      const regs = DB.Registrations, ss = stats();
      return { courses: DB.Courses.slice().sort((a, b) => a.sort - b.sort), sessions: ss, templates: DB.Templates, banners: DB.Banners, materials: DB.Materials.map(mat), settings: DB.Settings, rewards: DB.Rewards,
        stats: { users: DB.Users.length, registrations: regs.filter(r => r.status !== 'cancelled').length, certs: regs.filter(r => r.certNo).length, upcoming: ss.filter(s => s.date >= today() && s.status === 'open').length, payReview: regs.filter(r => r.payStatus === 'review').length, redeemPending: DB.Redemptions.filter(r => r.status === 'pending').length, quotesNew: DB.QuoteRequests.filter(q => q.status === 'new').length, quotesNew: DB.QuoteRequests.filter(q => q.status === 'new').length } };
    },
    saveCourse: p => { if (p.cover) p.course.coverUrl = fileUrl(p.cover); return upsert('Courses', p.course, 'C'); },
    saveSession: p => { if (!Number(p.session.hours)) throw new Error('กรุณาระบุจำนวนชั่วโมงอบรม (ใช้คำนวณแต้ม)'); const isNew = !find('Sessions', 'id', p.session.id); const s = upsert('Sessions', p.session, 'S'); if (isNew) s.checkinCode = String(100000 + Math.floor(Math.random() * 899999)); return s; },
    newCheckinCode: p => { const c = String(100000 + Math.floor(Math.random() * 899999)); find('Sessions', 'id', p.sessionId).checkinCode = c; return c; },
    deleteSession: p => { const s = find('Sessions', 'id', p.id), regs = DB.Registrations.filter(r => r.sessionId === p.id); if (!regs.length) { del('Sessions', p.id); return { deleted: true }; } let n = 0; if ((s.endDate || s.date) >= today()) { regs.forEach(r => { if (r.status === 'registered') { r.status = 'cancelled'; r.cancelReason = 'ผู้จัดยกเลิกรอบอบรม'; r.cancelledAt = now(); n++; } }); s.status = 'cancelled'; } s.archived = true; return { archived: true, cancelledRegs: n }; },
    restoreSession: p => { find('Sessions', 'id', p.id).archived = false; return true; },
    sessionRoster: p => DB.Registrations.filter(r => r.sessionId === p.sessionId && find('Users', 'id', r.userId)).map(r => ({ reg: r, user: safe(find('Users', 'id', r.userId)) })),
    addToSession: p => { const u = find('Users', 'email', String(p.email).toLowerCase()); if (!u) throw new Error('ไม่พบผู้ใช้ที่ใช้อีเมลนี้'); const s = stats().find(x => x.id === p.sessionId), m = calcFees(s, {}, false); const r = { id: uid('R'), userId: u.id, sessionId: p.sessionId, status: 'registered', registeredAt: now(), payStatus: m.total ? 'unpaid' : 'free', subtotal: m.subtotal, vatAmount: m.vat, whtAmount: 0, total: m.total }; DB.Registrations.push(r); return r; },
    setRegStatus: p => { p.regIds.forEach(id => { const r = find('Registrations', 'id', id); const was = r.status; r.status = p.status; if (p.status === 'attended' && !r.checkedInAt) r.checkedInAt = now(); if (p.status === 'absent' && was !== 'absent') { addStrike(find('Users', 'id', r.userId) || { id: r.userId }, id, 'noshow', 'ไม่มาอบรม'); if (r.pointsAwarded) { addPoints(r.userId, -r.pointsAwarded, 'adjust', r.id, 'ยกเลิกแต้มอบรม'); r.pointsAwarded = ''; } } }); if (p.status === 'attended') afterAttend(p.regIds); return true; },
    issueCerts: p => {
      const out = [];
      p.regIds.forEach(id => {
        const r = find('Registrations', 'id', id); if (!r || r.certNo || r.status === 'cancelled') return;
        const s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId);
        const yy = s.date.slice(0, 4), fmtS = setting('CERT_FORMAT'), dg = +setting('CERT_RUN_DIGITS') || 4;
        const pre = fmtS.replace('{CODE}', c.code).replace('{YYYY}', yy).replace('{YY}', yy.slice(2)).replace('{MM}', s.date.slice(5, 7));
        const head = pre.split('{RUN}')[0];
        const max = DB.Registrations.filter(x => x.certNo && x.certNo.indexOf(head) === 0).reduce((m, x) => Math.max(m, parseInt(x.certNo.slice(head.length), 10) || 0), 0);
        r.certNo = pre.replace('{RUN}', String(max + 1).padStart(dg, '0')); r.certIssuedAt = now(); r.status = 'attended'; out.push({ regId: r.id, certNo: r.certNo });
      });
      afterAttend(p.regIds); return out;
    },
    revokeCert: p => { const r = find('Registrations', 'id', p.regId); r.certNo = ''; return true; },
    setPayment: p => { const r = find('Registrations', 'id', p.regId); r.payStatus = p.status; if (p.status === 'paid') r.paidAt = now(); if (p.receipt) r.receiptUrl = fileUrl(p.receipt); return r; },
    saveTemplate: p => { const t = p.template; if (p.image) t.imageUrl = p.image.data; return upsert('Templates', t, 'T'); },
    deleteTemplate: p => { del('Templates', p.id); return true; },
    saveBanner: p => { if (p.image) p.banner.imageUrl = p.image.data; return upsert('Banners', p.banner, 'B'); },
    deleteBanner: p => { del('Banners', p.id); return true; },
    saveMaterial: p => { const m = p.material; if (p.file) { m.url = p.file.data; m.fileId = 'local'; } if (!m.url) throw new Error('กรุณาแนบไฟล์หรือใส่ลิงก์'); return mat(upsert('Materials', m, 'M')); },
    deleteMaterial: p => { del('Materials', p.id); return true; },
    listUsers: () => DB.Users.map(u => Object.assign(safe(u), { trainings: DB.Registrations.filter(r => r.userId === u.id && r.status !== 'cancelled').length, certs: DB.Registrations.filter(r => r.userId === u.id && r.certNo).length, points: pointsOf(u.id).balance, strikes: rules(u).strikes })),
    exportRegistrations: p => DB.Registrations.filter(r => { const s = find('Sessions', 'id', r.sessionId) || {}; return find('Users', 'id', r.userId) && (!p.sessionId || r.sessionId === p.sessionId) && (!p.courseId || s.courseId === p.courseId) && (p.includeCancelled || r.status !== 'cancelled'); }).map(r => {
      const s = find('Sessions', 'id', r.sessionId), c = find('Courses', 'id', s.courseId), u = find('Users', 'id', r.userId), b = r.billing || {};
      return { course: c.code + ' ' + c.title, session: (s.title || '') + ' ' + s.date, name: fullName(u), email: u.email, phone: u.phone, company: u.company, position: u.position, status: r.status, checkedInAt: r.checkedInAt, certNo: r.certNo, payStatus: r.payStatus, total: r.total, wht: r.whtAmount, billingName: b.billingName || u.billingName, taxId: b.taxId || u.taxId, billingAddress: b.billingAddress || u.billingAddress, registeredAt: r.registeredAt, cancelReason: r.cancelReason, saleName: r.saleName, source: r.source };
    }),
    saveUser: p => { const u = find('Users', 'id', p.user.id); Object.assign(u, p.user); if (p.clearStrikes) u.penaltyAt = now(); return safe(u); },
    adminResetPassword: p => { const t = Math.random().toString(36).slice(2, 10); find('Users', 'id', p.userId).password = t; return { tempPassword: t }; },
    adjustPoints: p => { if (!Number(p.points)) throw new Error('กรุณาระบุจำนวนแต้ม'); addPoints(p.userId, Number(p.points), 'adjust', '', p.note || 'ปรับโดยผู้ดูแล'); return pointsOf(p.userId); },
    saveReward: p => { if (p.image) p.reward.imageUrl = fileUrl(p.image); return upsert('Rewards', p.reward, 'W'); },
    deleteReward: p => { del('Rewards', p.id); return true; },
    listRedemptions: () => DB.Redemptions.slice().reverse().map(r => { const u = find('Users', 'id', r.userId) || {}; return Object.assign({}, r, { userName: fullName(u), email: u.email, phone: u.phone }); }),
    setRedemption: p => { const r = find('Redemptions', 'id', p.id); if (p.status === 'cancelled' && r.status !== 'cancelled') addPoints(r.userId, r.points, 'refund', r.id, 'คืนแต้ม: ' + r.rewardName); r.status = p.status; return true; },
    requestQuote: (p, u) => {
      const q = Object.assign({}, p.quote); const need = [['companyName', 'ชื่อบริษัท'], ['branch', 'สาขา / สำนักงานใหญ่'], ['address', 'ที่อยู่'], ['postcode', 'รหัสไปรษณีย์'], ['taxId', 'เลขประจำตัวผู้เสียภาษี'], ['contactName', 'ผู้ติดต่อ'], ['phone', 'เบอร์โทร'], ['email', 'อีเมล']];
      need.forEach(f => { if (!String(q[f[0]] || '').trim()) throw new Error('กรุณากรอก' + f[1]); });
      if (!/^\d{5}$/.test(q.postcode)) throw new Error('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
      if (!/^\d{13}$/.test(String(q.taxId).replace(/[\s-]/g, ''))) throw new Error('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
      const s = find('Sessions', 'id', p.sessionId) || {}, c = find('Courses', 'id', s.courseId) || {};
      Object.assign(q, { id: uid('Q'), userId: u.id, sessionId: p.sessionId || '', courseTitle: c.title || '', sessionDate: s.date || '', status: 'new', createdAt: now() }); DB.QuoteRequests.push(q); return { id: q.id };
    },
    listQuotes: () => DB.QuoteRequests.slice().reverse(),
    setQuote: p => { Object.assign(find('QuoteRequests', 'id', p.id), { status: p.status, adminNote: p.adminNote }); return true; },
    paymentDocsZip: () => { throw new Error('ในเดโมรวมไฟล์ .zip ไม่ได้ (ระบบจริงดาวน์โหลดได้) · กดดาวน์โหลดทีละไฟล์แทน'); },
    emailDefaults: () => ({"EMAIL_REG_SUBJECT": "ยืนยันการลงทะเบียนอบรม: {หลักสูตร}", "EMAIL_REG_BODY": "เรียน {ชื่อ}\n\nท่านได้ลงทะเบียนอบรมหลักสูตร **{หลักสูตร}** เรียบร้อยแล้ว\n\nวันที่: **{วันที่}**\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\n{ข้อมูลการชำระเงิน}\n\nเลขที่การลงทะเบียน: {เลขที่ลงทะเบียน}\nไฟล์แนบ .ics สามารถเพิ่มลงปฏิทินของท่านได้ (แจ้งเตือนล่วงหน้า 1 วัน)\nดูรายละเอียดและเอกสารประกอบได้ที่เมนู “การอบรมของฉัน”: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}", "EMAIL_REMIND_SUBJECT": "แจ้งเตือน: อีก {อีกกี่วัน} วันถึงวันอบรม {หลักสูตร}", "EMAIL_REMIND_BODY": "เรียน {ชื่อ}\n\nขอแจ้งเตือนการอบรมที่ท่านลงทะเบียนไว้ หลักสูตร **{หลักสูตร}**\n\nวันที่: **{วันที่}** (อีก {อีกกี่วัน} วัน)\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\nเมื่อมาถึงสถานที่ กรุณาสแกน QR Code ที่จุดลงทะเบียนเพื่อเช็คอิน และรับเอกสารประกอบการบรรยาย\nหากไม่สามารถเข้าร่วมได้ กรุณาเลื่อนหรือยกเลิกล่วงหน้าที่: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}"}),
    sendTestEmail: (p, u) => ({ to: u.email }),
    saveSettings: p => { Object.keys(p.settings).forEach(k => { const r = find('Settings', 'key', k); if (r) r.value = p.settings[k]; else DB.Settings.push({ key: k, value: p.settings[k], description: '' }); }); return true; }
  };
  const PUBLIC = ['publicHome', 'register', 'login', 'forgotPassword', 'verifyCert'];
  const USER = ['requestQuote', 'me', 'updateProfile', 'changePassword', 'listSessions', 'registerSession', 'uploadPayment', 'cancelRegistration', 'rescheduleRegistration', 'checkin', 'myTrainings', 'getCertificate', 'templateImage', 'rewardsPage', 'redeemReward', 'luckyDraw'];
  window.MockAPI = (action, p) => {
    try {
      if (!A[action]) throw new Error('ไม่พบคำสั่ง ' + action);
      let u = null;
      if (!PUBLIC.includes(action)) {
        u = find('Users', 'id', tokens[p.token]);
        if (!u) return { ok: false, error: 'กรุณาเข้าสู่ระบบใหม่', code: 'AUTH' };
        if (!USER.includes(action) && u.role !== 'admin') return { ok: false, error: 'สำหรับผู้ดูแลระบบเท่านั้น' };
      }
      return { ok: true, data: JSON.parse(JSON.stringify(A[action](p, u))) };
    } catch (e) { return { ok: false, error: e.message }; }
  };
  window.DEMO_LOGIN = async (email, route) => {
    const r = window.MockAPI('login', { email, password: 'demo1234' });
    const S = window.TP.S; S.token = r.data.token; S.user = r.data.user; S.admin = null;
    window.TP.go(route || (r.data.user.role === 'admin' ? 'admin' : 'my'));
  };
  window.DEMO_RIBBON = () => `<div class="demo-ribbon">โหมดเดโม (ข้อมูลจำลอง) · เข้าใช้เป็น <a onclick="DEMO_LOGIN('wasan@demo.com')">ผู้อบรม</a> หรือ <a onclick="DEMO_LOGIN('admin@demo.com')">ผู้ดูแลระบบ</a> · รหัสเช็คอินรอบวันนี้ <b>246810</b></div>`;
  try { localStorage.removeItem('tp_token'); } catch (e) { }
})();
