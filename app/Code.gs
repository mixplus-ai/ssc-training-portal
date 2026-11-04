/**
 * ระบบอบรมและใบประกาศนียบัตร (Training & Certificate Portal) — v2
 * Google Apps Script Web App + Google Sheet เป็นฐานข้อมูล
 * ติดตั้ง: ดู README-ติดตั้ง.md
 */

// ====== ค่าตั้งต้น ======
var SPREADSHEET_ID = '1xTy1AIcyUGHd9zTem4qp-vSS7gessFR-1OmFw1XYTA4';
var DRIVE_FOLDER_NAME = 'TrainingPortal Files';
var TOKEN_DAYS = 30;

var SCHEMA = {
  Users: ['id', 'email', 'passwordHash', 'salt', 'prefix', 'firstName', 'lastName', 'nameEn', 'phone', 'company', 'position', 'photoUrl',
    'billingType', 'billingName', 'taxId', 'branch', 'billingAddress', 'role', 'status', 'bannedUntil', 'penaltyAt', 'createdAt', 'lastLogin'],
  Courses: ['id', 'code', 'title', 'subtitle', 'description', 'hours', 'price', 'color', 'coverUrl', 'defaultTemplateId', 'sort', 'active'],
  Sessions: ['id', 'courseId', 'title', 'date', 'endDate', 'startTime', 'endTime', 'hours', 'location', 'mapUrl', 'capacity', 'status', 'templateId',
    'price', 'fees', 'vat', 'whtAllowed', 'checkinCode', 'note', 'createdAt', 'archived', 'speakerName', 'speakerEmail', 'speakerNotifiedAt'],
  Registrations: ['id', 'userId', 'sessionId', 'status', 'registeredAt', 'checkedInAt', 'attendedAt', 'certNo', 'certIssuedAt', 'pointsAwarded',
    'rescheduledFrom', 'cancelReason', 'cancelledAt', 'remindedAt',
    'payStatus', 'subtotal', 'vatAmount', 'whtAmount', 'total', 'billing', 'slipUrl', 'whtCertUrl', 'receiptUrl', 'paidAt', 'note', 'saleName', 'source', 'couponCode', 'discount', 'evaluatedAt'],
  Strikes: ['id', 'userId', 'regId', 'type', 'reason', 'createdAt'],
  Templates: ['id', 'name', 'imageFileId', 'imageUrl', 'config', 'createdAt'],
  Banners: ['id', 'placement', 'month', 'title', 'subtitle', 'imageUrl', 'imageFileId', 'link', 'active', 'sort', 'createdAt'],
  Materials: ['id', 'courseId', 'sessionId', 'type', 'title', 'url', 'fileId', 'visibility', 'createdAt'],
  Points: ['id', 'userId', 'year', 'points', 'type', 'refId', 'note', 'createdAt'],
  Rewards: ['id', 'kind', 'name', 'description', 'imageUrl', 'points', 'stock', 'weight', 'active', 'sort', 'createdAt'],
  Redemptions: ['id', 'userId', 'rewardId', 'rewardName', 'points', 'kind', 'status', 'note', 'createdAt'],
  QuoteRequests: ['id', 'userId', 'sessionId', 'courseTitle', 'sessionDate', 'companyName', 'branch', 'address', 'postcode', 'taxId', 'contactName', 'phone', 'email', 'note', 'status', 'adminNote', 'createdAt'],
  Coupons: ['id', 'code', 'sessionId', 'kind', 'value', 'maxUses', 'active', 'note', 'createdAt'],
  Evaluations: ['id', 'regId', 'userId', 'sessionId', 'speakerName', 'q1', 'q2', 'q3', 'q4', 'q5', 'comment', 'createdAt'],
  Settings: ['key', 'value', 'description']
};
/** แบบประเมินความพึงพอใจต่อวิทยากร (เช็คเอาท์) ระดับคะแนน 4 ระดับ */
var EVAL_QUESTIONS = [
  'วิทยากรมีความรู้และความเชี่ยวชาญในหัวข้อที่อบรม',
  'วิทยากรอธิบายเนื้อหาได้ชัดเจน เข้าใจง่าย',
  'วิทยากรถ่ายทอดความรู้ได้อย่างน่าสนใจและเป็นลำดับ',
  'วิทยากรสามารถตอบคำถามและให้คำแนะนำได้อย่างชัดเจน',
  'วิทยากรบริหารเวลาและเนื้อหาการอบรมได้อย่างเหมาะสม'
];
var EVAL_SCALE = ['ควรปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก'];

var DEFAULT_SETTINGS = [
  ['ORG_NAME', 'Siam Solar Cell Training Center', 'ชื่อหน่วยงาน (แสดงบนเว็บ)'],
  ['ORG_SHORT', 'SSC Training', 'ชื่อย่อ (แสดงที่โลโก้)'],
  ['LOGO_URL', '', 'ลิงก์รูปโลโก้ (ว่าง = ใช้ตัวอักษร)'],
  ['CONTACT', 'โทร 02-000-0000 · training@example.com', 'ข้อมูลติดต่อ (ส่วนท้ายเว็บ)'],
  ['CERT_FORMAT', 'SSC-{CODE}-{YYYY}-{RUN}', 'รูปแบบเลขใบเซอร์ ใช้ {CODE} {YYYY} {YY} {MM} {RUN}'],
  ['CERT_RUN_DIGITS', '4', 'จำนวนหลักของเลขรัน'],
  ['CERT_VALID_MONTHS', '12', 'อายุใบเซอร์ (เดือน นับจากวันอบรม)'],
  ['AUTO_ISSUE_ON_ATTEND', 'FALSE', 'TRUE = ออกใบเซอร์ทันทีเมื่อเช็คอิน/เช็กชื่อเข้าร่วม'],
  ['MAX_ACTIVE_BOOKINGS', '5', 'จองล่วงหน้าได้สูงสุดกี่รอบ'],
  ['CHANGE_DAYS_BEFORE', '3', 'เลื่อน/ยกเลิกได้ถึงกี่วันก่อนวันอบรม'],
  ['STRIKE_LIMIT', '2', 'เลื่อน/ยกเลิก/ไม่มา ได้กี่ครั้ง (เกินนี้ระงับสิทธิ์)'],
  ['AUTO_NOSHOW', 'TRUE', 'TRUE = รอบที่จบแล้วแต่ไม่ได้เช็คอิน นับเป็น "ไม่มา" อัตโนมัติ'],
  ['REMIND_DAYS', '5', 'ส่งอีเมลเตือนก่อนวันอบรมกี่วัน'],
  ['CHECKIN_OPEN_MINUTES', '120', 'เปิดให้เช็คอินก่อนเวลาเริ่มกี่นาที'],
  ['HERO_SPEED', '6', 'ความเร็วสไลด์หน้าแรก (วินาทีต่อภาพ)'],
  ['POINTS_PER_HOUR', '1', 'แต้มต่อชั่วโมงอบรม'],
  ['REWARDS_ENABLED', 'TRUE', 'TRUE = แสดงหน้าแลกของรางวัลให้ลูกค้า'],
  ['LUCKY_COST', '10', 'แต้มที่ใช้ต่อการสุ่มรางวัล 1 ครั้ง'],
  ['VAT_RATE', '7', 'อัตราภาษีมูลค่าเพิ่ม (%)'],
  ['WHT_RATE', '3', 'อัตราหัก ณ ที่จ่าย (%)'],
  ['PAY_INFO', 'ธนาคารกสิกรไทย เลขที่ 000-0-00000-0 ชื่อบัญชี บจก. สยามโซล่าร์เซลล์', 'ข้อมูลบัญชีสำหรับโอนค่าอบรม'],
  ['SITE_URL', '', 'ลิงก์หน้าเว็บ ถ้าโฮสต์ภายนอก เช่น https://ssc-training.netlify.app (ว่าง = ใช้ลิงก์ Apps Script)'],
  ['SEND_EMAIL', 'TRUE', 'TRUE = ส่งอีเมลยืนยัน/เตือน/ใบเซอร์พร้อม'],
  ["WHT_PAYEE_INFO", "บริษัท สยามโซล่าร์เซลล์ จำกัด (สำนักงานใหญ่)\nเลขประจำตัวผู้เสียภาษี 0000000000000\nที่อยู่ 000 ถนน........ แขวง........ เขต........ กรุงเทพมหานคร 10000", "ชื่อ ที่อยู่ เลขผู้เสียภาษีของบริษัท สำหรับให้ลูกค้าออกหนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)"],
  ["PERSON_NO_VAT", "TRUE", "TRUE = บุคคลธรรมดาไม่คิดภาษีมูลค่าเพิ่ม (VAT) และไม่หัก ณ ที่จ่าย"],
  ['EVAL_REQUIRED', 'TRUE', 'TRUE = ต้องทำแบบประเมินวิทยากร (เช็คเอาท์) ก่อนรับใบประกาศ'],
  ['SPEAKER_REMIND_DAYS', '3', 'ส่งอีเมลแจ้งวิทยากรก่อนวันอบรมกี่วัน'],
  ["QUOTE_EMAIL", "", "อีเมลรับแจ้งคำขอใบเสนอราคา (ว่าง = ส่งถึงผู้ดูแลระบบทุกคน)"],
  ['EMAIL_REG_SUBJECT', "ยืนยันการลงทะเบียนอบรม: {หลักสูตร}", 'หัวข้ออีเมลยืนยันการลงทะเบียน'],
  ['EMAIL_REG_BODY', "เรียน {ชื่อ}\n\nท่านได้ลงทะเบียนอบรมหลักสูตร **{หลักสูตร}** เรียบร้อยแล้ว\n\nวันที่: **{วันที่}**\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\n{ข้อมูลการชำระเงิน}\n\nเลขที่การลงทะเบียน: {เลขที่ลงทะเบียน}\nไฟล์แนบ .ics สามารถเพิ่มลงปฏิทินของท่านได้ (แจ้งเตือนล่วงหน้า 1 วัน)\nดูรายละเอียดและเอกสารประกอบได้ที่เมนู “การอบรมของฉัน”: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}", 'เนื้อหาอีเมลยืนยันการลงทะเบียน'],
  ['EMAIL_REMIND_SUBJECT', "แจ้งเตือน: อีก {อีกกี่วัน} วันถึงวันอบรม {หลักสูตร}", 'หัวข้ออีเมลแจ้งเตือนก่อนวันอบรม'],
  ['EMAIL_REMIND_BODY', "เรียน {ชื่อ}\n\nขอแจ้งเตือนการอบรมที่ท่านลงทะเบียนไว้ หลักสูตร **{หลักสูตร}**\n\nวันที่: **{วันที่}** (อีก {อีกกี่วัน} วัน)\nเวลา: {เวลา}\nสถานที่: {สถานที่}\nแผนที่การเดินทาง: {แผนที่}\n\nเมื่อมาถึงสถานที่ กรุณาสแกน QR Code ที่จุดลงทะเบียนเพื่อเช็คอิน และรับเอกสารประกอบการบรรยาย\nหากไม่สามารถเข้าร่วมได้ กรุณาเลื่อนหรือยกเลิกล่วงหน้าที่: {ลิงก์เว็บ}\n\nขอแสดงความนับถือ\n{หน่วยงาน}\n{ติดต่อ}", 'เนื้อหาอีเมลแจ้งเตือนก่อนวันอบรม'],
  ['SALES_LIST', 'Ms Asamaporn Photim (Nous)\nMr Teerawat Chatpomarat (Boy)\nMs Jirawadee Khumphusa (Aoom)\nMs Jirapreeya Sornkaew (Parry)\nMr Kittisak Jaratpattaranit (Tree)\nMr Chaleomchai Phowong (O)', 'รายชื่อ Sale ที่เชิญเข้าร่วม (บรรทัดละ 1 ชื่อ) · ใช้ในแบบฟอร์มลงทะเบียน'],
  ['SOURCE_LIST', 'เฟซบุ๊ก (Facebook) ของสยามโซล่าเซลล์\nไลน์แอด (LINE OA) ของสยามโซล่าเซลล์\nคำแนะนำจากเพื่อน / คนรู้จัก\nคำแนะนำจากฝ่ายขาย / ทีมงาน', 'ช่องทางที่รู้จักกิจกรรม (บรรทัดละ 1 ช่องทาง ระบบเพิ่ม “อื่นๆ” ให้เอง)']
];

// ====== Web App entry ======
function doGet(e) {
  var p = (e && e.parameter) || {};
  var t = HtmlService.createTemplateFromFile('Index');
  t.verify = p.verify || '';
  t.checkin = p.checkin || '';
  t.course = p.course || '';
  t.appUrl = siteUrl_();
  return t.evaluate()
    .setTitle(getSetting_('ORG_SHORT') || 'Training Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** API สำหรับหน้าเว็บที่โฮสต์ภายนอก (เช่น Netlify): POST {action, payload} เป็น text/plain → JSON */
function doPost(e) {
  var out;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = api(String(body.action || ''), body.payload || {});
  } catch (err) { out = { ok: false, error: 'คำขอไม่ถูกต้อง' }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
/** ลิงก์หน้าเว็บที่ผู้ใช้เปิด: SITE_URL (เช่น https://xxx.netlify.app) ถ้าตั้งไว้ ไม่งั้นใช้ลิงก์ Apps Script */
function siteUrl_() { return String(getSetting_('SITE_URL') || '').trim().replace(/\/+$/, '') || ScriptApp.getService().getUrl(); }

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

/** รันหลังวางโค้ด (และทุกครั้งที่อัปเดตเวอร์ชัน): สร้าง/เพิ่มคอลัมน์ชีต ค่าตั้งต้น และตัวตั้งเวลารายวัน */
function setup() {
  var ss = ss_();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = SCHEMA[name];
    var existing = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    if (existing.join('') === '') sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    else headers.forEach(function (h) { if (existing.indexOf(h) < 0) sh.getRange(1, sh.getLastColumn() + 1).setValue(h); });
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#0f2242').setFontColor('#ffffff');
  });
  var first = ss.getSheetByName('ชีต1') || ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);

  var have = readTable_('Settings').map(function (r) { return r.key; });
  DEFAULT_SETTINGS.forEach(function (s) { if (have.indexOf(s[0]) < 0) ss.getSheetByName('Settings').appendRow(s); });

  if (readTable_('Courses').length === 0) {
    [
      { code: 'OM', title: 'SolarEdge O&M (Operation & Maintenance)', subtitle: 'หลักสูตรการบำรุงรักษาระบบโซล่าเซลล์ SolarEdge', description: 'การตรวจสอบ บำรุงรักษา และแก้ไขปัญหาระบบ SolarEdge ภาคปฏิบัติ', hours: 6, price: 0, color: '#8f1424', sort: 1 },
      { code: 'BSD', title: 'Basics Solar System Design', subtitle: 'พื้นฐานการออกแบบระบบโซล่าร์เซลล์ SolarEdge', description: 'หลักการออกแบบระบบโซล่าร์เซลล์เบื้องต้น การเลือกอุปกรณ์ และการคำนวณ', hours: 6, price: 0, color: '#1f6b3a', sort: 2 },
      { code: 'CDI', title: 'SolarEdge Commercial Designer and Installation System', subtitle: 'การออกแบบระบบโซล่าร์เซลล์ขนาดโรงงานและการติดตั้ง', description: 'ออกแบบระบบขนาดเชิงพาณิชย์/โรงงาน การติดตั้งระบบรวมถึงการตั้งค่าขั้นสูง', hours: 6, price: 0, color: '#16235a', sort: 3 }
    ].forEach(function (c) { c.id = uid_('C'); c.active = true; insert_('Courses', c); });
  }
  getFolder_('');
  getSecret_();
  var hasTrigger = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyJobs'; });
  if (!hasTrigger) ScriptApp.newTrigger('dailyJobs').timeBased().everyDays(1).atHour(8).create();
  var hasWarm = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'warmCache'; });
  if (!hasWarm) ScriptApp.newTrigger('warmCache').timeBased().everyMinutes(5).create();
  CacheService.getScriptCache().remove('settings'); bustPub_();
  return 'ติดตั้งเรียบร้อย';
}

// ====== Single API dispatcher ======
function api(action, payload) {
  payload = payload || {};
  TABLE_CACHE_ = {};
  try {
    var fn = API[action];
    if (!fn) throw new Error('ไม่พบคำสั่ง ' + action);
    var user = null;
    if (fn.auth) {
      user = authUser_(payload.token);
      if (!user) return { ok: false, error: 'กรุณาเข้าสู่ระบบใหม่', code: 'AUTH' };
      if (fn.auth === 'admin' && user.role !== 'admin') return { ok: false, error: 'สำหรับผู้ดูแลระบบเท่านั้น' };
    }
    return { ok: true, data: fn.run(payload, user) };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}
/** ทริกเกอร์ทุก 5 นาที: เตรียมข้อมูลหน้าแรกไว้ในแคชล่วงหน้า และกันสคริปต์ “หลับ” ทำให้ผู้ใช้คนแรกไม่ต้องรอนาน */
function warmCache() {
  CacheService.getScriptCache().remove(pubKey_());
  API.publicHome.run({});
}
var API = {};
function def_(name, auth, run) { API[name] = { auth: auth, run: run }; }

// ---------- Public ----------
def_('publicHome', null, function () {
  var cache = CacheService.getScriptCache(), key = pubKey_(), hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var data = {
    settings: publicSettings_(), courses: activeCourses_(), banners: banners_(),
    sessions: sessionsWithStats_().filter(function (s) { return s.status === 'open' && s.date >= today_(); }).map(publicSession_)
  };
  try { var json = JSON.stringify(data); if (json.length < 95000) cache.put(key, json, 900); } catch (e) { }
  return data;
});

def_('register', null, function (p) {
  var email = String(p.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
  if (String(p.password || '').length < 6) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  if (!p.firstName || !p.lastName) throw new Error('กรุณากรอกชื่อและนามสกุล');
  return withLock_(function () {
    if (findBy_('Users', 'email', email)) throw new Error('อีเมลนี้ลงทะเบียนแล้ว');
    var salt = Utilities.getUuid();
    var isFirst = readTable_('Users').length === 0;
    var u = {
      id: uid_('U'), email: email, salt: salt, passwordHash: hash_(p.password, salt),
      prefix: p.prefix || '', firstName: p.firstName, lastName: p.lastName, nameEn: p.nameEn || '',
      phone: p.phone || '', company: p.company || '', position: p.position || '', photoUrl: '',
      role: isFirst ? 'admin' : 'user', status: 'active', createdAt: now_(), lastLogin: now_()
    };
    insert_('Users', u);
    return { token: makeToken_(u.id), user: meData_(u) };
  });
});

def_('login', null, function (p) {
  var u = findBy_('Users', 'email', String(p.email || '').trim().toLowerCase());
  if (!u || u.passwordHash !== hash_(p.password || '', u.salt)) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  if (u.status === 'disabled') throw new Error('บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแล');
  update_('Users', u.id, { lastLogin: now_() });
  return { token: makeToken_(u.id), user: meData_(u) };
});

def_('forgotPassword', null, function (p) {
  var email = String(p.email || '').trim().toLowerCase();
  var u = findBy_('Users', 'email', email);
  if (u) {
    var temp = Math.random().toString(36).slice(2, 10);
    update_('Users', u.id, { passwordHash: hash_(temp, u.salt) });
    MailApp.sendEmail({ to: email, subject: '[' + getSetting_('ORG_SHORT') + '] รหัสผ่านชั่วคราว',
      htmlBody: 'เรียน คุณ' + u.firstName + '<br><br>รหัสผ่านชั่วคราวของท่านคือ <b style="font-size:18px">' + temp + '</b><br>กรุณาเข้าสู่ระบบแล้วเปลี่ยนรหัสผ่านที่เมนู “ข้อมูลส่วนตัว”' });
  }
  return { sent: true };
});

def_('verifyCert', null, function (p) {
  var no = String(p.certNo || '').trim();
  if (!no) throw new Error('กรุณากรอกเลขที่ใบประกาศ');
  var r = findBy_('Registrations', 'certNo', no);
  if (!r) return { valid: false };
  var u = findBy_('Users', 'id', r.userId) || {};
  var s = normSession_(findBy_('Sessions', 'id', r.sessionId) || {});
  var c = findBy_('Courses', 'id', s.courseId) || {};
  var exp = certExpiry_(s);
  return { valid: true, certNo: no, name: fullName_(u), company: u.company, course: c.title, date: s.date, endDate: s.endDate, startTime: s.startTime, endTime: s.endTime,
    location: s.location, hours: s.hours || c.hours, checkedInAt: r.checkedInAt, issuedAt: r.certIssuedAt, expiresAt: exp, expired: exp < today_() };
});

// ---------- User ----------
def_('me', 'user', function (p, user) { return { user: meData_(user), settings: publicSettings_() }; });

def_('updateProfile', 'user', function (p, user) {
  var allowed = ['prefix', 'firstName', 'lastName', 'nameEn', 'phone', 'company', 'position', 'billingType', 'billingName', 'taxId', 'branch', 'billingAddress'];
  var patch = {};
  allowed.forEach(function (k) { if (p[k] !== undefined) patch[k] = String(p[k]).trim(); });
  if (p.photo) patch.photoUrl = saveImage_(p.photo, 'profiles', user.id + '_' + Date.now());
  if (patch.firstName === '' || patch.lastName === '') throw new Error('กรุณากรอกชื่อและนามสกุล');
  update_('Users', user.id, patch);
  return meData_(findBy_('Users', 'id', user.id));
});

def_('changePassword', 'user', function (p, user) {
  if (user.passwordHash !== hash_(p.oldPassword || '', user.salt)) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  if (String(p.newPassword || '').length < 6) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
  update_('Users', user.id, { passwordHash: hash_(p.newPassword, user.salt) });
  return true;
});

def_('listSessions', 'user', function (p, user) {
  var mine = readTable_('Registrations').filter(function (r) { return r.userId === user.id && r.status !== 'cancelled'; });
  var map = {}; mine.forEach(function (r) { map[r.sessionId] = r; });
  var list = sessionsWithStats_().filter(function (s) { return s.status !== 'draft' && s.status !== 'cancelled' && !isTrue_(s.archived) && s.date >= today_(); }).map(publicSession_);
  list.forEach(function (s) { var r = map[s.id]; s.myStatus = r ? r.status : ''; s.myRegId = r ? r.id : ''; });
  return { courses: activeCourses_(), sessions: list, banners: banners_(), me: meData_(user) };
});

def_('registerSession', 'user', function (p, user) {
  return withLock_(function () {
    var rules = bookingRules_(user);
    if (rules.banned) throw new Error('บัญชีของท่านถูกระงับการลงทะเบียนถึงวันที่ ' + thaiDate_(rules.bannedUntil) + ' เนื่องจากเลื่อน/ยกเลิก/ไม่มาอบรมเกินกำหนด');
    if (rules.active >= rules.maxActive) throw new Error('ท่านจองล่วงหน้าได้สูงสุด ' + rules.maxActive + ' รอบ');
    var s = sessionWithStats_(p.sessionId);
    if (!s || s.status !== 'open') throw new Error('รอบนี้ไม่เปิดรับลงทะเบียน');
    if (s.date < today_()) throw new Error('รอบนี้ผ่านไปแล้ว');
    var regs = readTable_('Registrations');
    if (regs.some(function (r) { return r.userId === user.id && r.sessionId === s.id && r.status !== 'cancelled'; })) throw new Error('ท่านลงทะเบียนรอบนี้แล้ว');
    if (s.seatsLeft === 0) throw new Error('ขออภัย ที่นั่งเต็มแล้ว');
    var saleName = String(p.saleName || '').trim().slice(0, 120), source = String(p.source || '').trim().slice(0, 200);
    if (!saleName) throw new Error('กรุณาระบุชื่อ Sale ที่เชิญท่านเข้าร่วมกิจกรรม');
    if (!source) throw new Error('กรุณาระบุช่องทางที่ท่านรู้จักกิจกรรมนี้');
    ensureColumn_('Registrations', 'saleName'); ensureColumn_('Registrations', 'source');
    var coupon = p.couponCode ? findCoupon_(p.couponCode, s.id) : null;
    var money = calcFees_(s, p.billing, p.wht, coupon);
    var r = { id: uid_('R'), userId: user.id, sessionId: s.id, status: 'registered', registeredAt: now_(),
      payStatus: money.total > 0 ? 'unpaid' : 'free', subtotal: money.subtotal, vatAmount: money.vat, whtAmount: money.wht, total: money.total,
      billing: money.gross > 0 ? JSON.stringify(p.billing || {}) : '', saleName: saleName, source: source,
      couponCode: coupon ? coupon.code : '', discount: money.discount || '' };
    if (p.slip) { r.slipUrl = fileLink_(saveFile_(p.slip, 'payments', 'slip_' + r.id)); r.payStatus = 'review'; }
    insert_('Registrations', r);
    if (p.saveBilling && p.billing) update_('Users', user.id, pick_(p.billing, ['billingType', 'billingName', 'taxId', 'branch', 'billingAddress']));
    var c = findBy_('Courses', 'id', s.courseId) || {};
    sendTplMail_('REG', user, s, c, r, [icsBlob_(s, c)]);
    return r;
  });
});

def_('uploadPayment', 'user', function (p, user) {
  var r = findBy_('Registrations', 'id', p.regId);
  if (!r || r.userId !== user.id) throw new Error('ไม่พบการลงทะเบียน');
  var patch = {};
  if (p.slip) { patch.slipUrl = fileLink_(saveFile_(p.slip, 'payments', 'slip_' + r.id + '_' + Date.now())); if (r.payStatus !== 'paid') patch.payStatus = 'review'; }
  if (p.whtCert) patch.whtCertUrl = fileLink_(saveFile_(p.whtCert, 'payments', 'wht_' + r.id + '_' + Date.now()));
  update_('Registrations', r.id, patch);
  return findBy_('Registrations', 'id', r.id);
});

/** ลูกค้าขอใบเสนอราคา → บันทึกในชีต QuoteRequests + อีเมลแจ้งผู้ดูแล */
def_('requestQuote', 'user', function (p, user) {
  var q = pick_(p.quote || {}, ['companyName', 'branch', 'address', 'postcode', 'taxId', 'contactName', 'phone', 'email', 'note']);
  Object.keys(q).forEach(function (k) { q[k] = String(q[k] || '').trim().slice(0, 500); });
  [['companyName', 'ชื่อบริษัท'], ['branch', 'สาขา / สำนักงานใหญ่'], ['address', 'ที่อยู่'], ['postcode', 'รหัสไปรษณีย์'], ['taxId', 'เลขประจำตัวผู้เสียภาษี'], ['contactName', 'ผู้ติดต่อ'], ['phone', 'เบอร์โทร'], ['email', 'อีเมล']]
    .forEach(function (f) { if (!q[f[0]]) throw new Error('กรุณากรอก' + f[1]); });
  if (!/^\d{5}$/.test(q.postcode)) throw new Error('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
  if (!/^\d{13}$/.test(q.taxId.replace(/[\s-]/g, ''))) throw new Error('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email)) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
  var s = p.sessionId ? normSession_(findBy_('Sessions', 'id', p.sessionId)) : null, c = s && s.courseId ? findBy_('Courses', 'id', s.courseId) || {} : {};
  ensureSheet_('QuoteRequests');
  q.id = uid_('Q'); q.userId = user.id; q.sessionId = p.sessionId || ''; q.courseTitle = c.title || ''; q.sessionDate = s && s.date || ''; q.status = 'new'; q.createdAt = now_();
  q.taxId = q.taxId.replace(/[\s-]/g, '');
  insert_('QuoteRequests', q);
  var to = getSetting_('QUOTE_EMAIL') || readTable_('Users').filter(function (u) { return u.role === 'admin'; }).map(function (u) { return u.email; }).join(',');
  var e = function (x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  notify_(to, 'คำขอใบเสนอราคาใหม่: ' + q.companyName, '<b>มีลูกค้าขอใบเสนอราคา</b><br><br>หลักสูตร: ' + e(q.courseTitle || '-') + (q.sessionDate ? ' · รอบ ' + thaiDate_(q.sessionDate) : '') +
    '<br>ชื่อบริษัท: ' + e(q.companyName) + ' (' + e(q.branch) + ')<br>ที่อยู่: ' + e(q.address) + ' ' + e(q.postcode) + '<br>เลขผู้เสียภาษี: ' + e(q.taxId) +
    '<br>ผู้ติดต่อ: ' + e(q.contactName) + ' · โทร ' + e(q.phone) + ' · ' + e(q.email) + (q.note ? '<br>หมายเหตุ: ' + e(q.note) : '') +
    '<br><br>ดูทั้งหมดได้ที่ แอดมิน → คำขอใบเสนอราคา: ' + siteUrl_());
  return { id: q.id };
});
def_('listQuotes', 'admin', function () { return readTable_('QuoteRequests').reverse(); });
def_('setQuote', 'admin', function (p) { ensureSheet_('QuoteRequests'); update_('QuoteRequests', p.id, pick_(p, ['status', 'adminNote'])); return true; });
function ensureSheet_(name) {
  var ss = ss_(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, SCHEMA[name].length).setValues([SCHEMA[name]]).setFontWeight('bold'); sh.setFrozenRows(1); }
  else SCHEMA[name].forEach(function (h) { ensureColumn_(name, h); });
}

def_('cancelRegistration', 'user', function (p, user) {
  if (!String(p.reason || '').trim()) throw new Error('กรุณาระบุเหตุผลการยกเลิก');
  return withLock_(function () {
    var r = findBy_('Registrations', 'id', p.regId);
    if (!r || r.userId !== user.id || r.status !== 'registered') throw new Error('ไม่สามารถยกเลิกได้');
    var s = normSession_(findBy_('Sessions', 'id', r.sessionId));
    assertChangeWindow_(s);
    update_('Registrations', r.id, { status: 'cancelled', cancelReason: p.reason, cancelledAt: now_() });
    var pen = addStrike_(user, r.id, 'cancel', p.reason);
    return { penalty: pen };
  });
});

def_('rescheduleRegistration', 'user', function (p, user) {
  return withLock_(function () {
    var r = findBy_('Registrations', 'id', p.regId);
    if (!r || r.userId !== user.id || r.status !== 'registered') throw new Error('ไม่สามารถเลื่อนรอบได้');
    var from = normSession_(findBy_('Sessions', 'id', r.sessionId));
    assertChangeWindow_(from);
    var to = sessionWithStats_(p.toSessionId);
    if (!to || to.status !== 'open' || to.courseId !== from.courseId || to.id === from.id) throw new Error('กรุณาเลือกรอบใหม่ในหลักสูตรเดียวกัน');
    if (to.seatsLeft === 0) throw new Error('รอบที่เลือกเต็มแล้ว');
    if (to.date < today_()) throw new Error('รอบที่เลือกผ่านไปแล้ว');
    update_('Registrations', r.id, { sessionId: to.id, rescheduledFrom: from.id, remindedAt: '', note: 'เลื่อนจาก ' + from.date + (p.reason ? ' · ' + p.reason : '') });
    var pen = addStrike_(user, r.id, 'reschedule', p.reason || '');
    var c = findBy_('Courses', 'id', to.courseId) || {};
    if (!pen) notify_(user.email, 'ยืนยันการเลื่อนรอบอบรม: ' + c.title, 'เรียน ' + fullName_(user) + '<br><br>ท่านได้เลื่อนรอบอบรมเป็น<br>' + sessionHtml_(to), [icsBlob_(to, c)]);
    return { penalty: pen };
  });
});

def_('checkin', 'user', function (p, user) {
  var parts = String(p.code || '').trim().split('.');
  var sessions = readTable_('Sessions').map(normSession_);
  var s = parts.length === 2 ? sessions.filter(function (x) { return x.id === parts[0] && String(x.checkinCode) === parts[1]; })[0]
    : sessions.filter(function (x) { return String(x.checkinCode) === parts[0] && x.date <= today_() && (x.endDate || x.date) >= today_(); })[0];
  if (!s) throw new Error('รหัสเช็คอินไม่ถูกต้อง');
  var nowD = new Date();
  var open = dt_(s.date, s.startTime || '00:00'); open.setMinutes(open.getMinutes() - Number(getSetting_('CHECKIN_OPEN_MINUTES') || 120));
  var close = dt_(s.endDate || s.date, s.endTime || '23:59');
  if (nowD < open) throw new Error('ยังไม่ถึงเวลาเช็คอิน (เปิดเช็คอินวันที่ ' + thaiDate_(s.date) + ')');
  if (nowD > close) throw new Error('การอบรมรอบนี้จบไปแล้ว');
  var r = readTable_('Registrations').filter(function (x) { return x.userId === user.id && x.sessionId === s.id && x.status !== 'cancelled'; })[0];
  if (!r) throw new Error('ไม่พบการลงทะเบียนของท่านในรอบนี้ กรุณาติดต่อเจ้าหน้าที่');
  if (!r.checkedInAt) {
    update_('Registrations', r.id, { checkedInAt: now_(), status: 'attended', attendedAt: now_() });
    afterAttend_([r.id]);
  }
  var c = findBy_('Courses', 'id', s.courseId) || {};
  return { regId: r.id, course: c.title, session: s, already: !!r.checkedInAt, checkedInAt: r.checkedInAt || now_() };
});

def_('myTrainings', 'user', function (p, user) {
  var regs = readTable_('Registrations').filter(function (r) { return r.userId === user.id && r.status !== 'cancelled'; });
  var sessions = indexBy_(readTable_('Sessions'), 'id');
  var courses = indexBy_(readTable_('Courses'), 'id');
  var mats = readTable_('Materials');
  var nowD = new Date(), evalReq = isTrue_(getSetting_('EVAL_REQUIRED') || defaultSetting_('EVAL_REQUIRED'));
  var list = regs.map(function (r) {
    var s = normSession_(sessions[r.sessionId] || {});
    var c = courses[s.courseId] || {};
    var start = dt_(s.date, s.startTime || '00:00'), end = dt_(s.endDate || s.date, s.endTime || '23:59');
    var m = mats.filter(function (x) { return (x.sessionId && x.sessionId === s.id) || (!x.sessionId && x.courseId === s.courseId); }).map(function (x) {
      var o = cleanMaterial_(x), lock = '';
      if (x.visibility === 'checkin') {
        if (!r.checkedInAt) lock = 'เปิดให้ดาวน์โหลดหลังเช็คอินที่หน้างาน';
        else if (nowD < start) lock = 'เปิดให้ดาวน์โหลดเมื่อการอบรมเริ่ม เวลา ' + (s.startTime || '') + ' น.';
      } else if (x.visibility === 'after' || x.visibility === 'attended') {
        if (nowD < end) lock = 'เปิดให้ดาวน์โหลดหลังการอบรมจบ';
        else if (x.visibility === 'attended' && r.status !== 'attended') lock = 'สำหรับผู้ที่เข้าร่วมอบรม';
      }
      if (lock) { o.url = ''; o.downloadUrl = ''; o.locked = lock; }
      return o;
    });
    var exp = r.certNo ? certExpiry_(s) : '';
    var rv = { reg: publicReg_(r), session: publicSession_(s), course: c, materials: m, hasCert: !!r.certNo, certExpires: exp, certExpired: exp ? exp < today_() : false };
    rv.canChange = r.status === 'registered' && changeAllowed_(s);
    rv.needEval = evalReq && !r.evaluatedAt && (r.status === 'attended' || !!r.checkedInAt);
    rv.certLocked = rv.hasCert && rv.needEval;
    return rv;
  }).sort(function (a, b) { return a.session.date < b.session.date ? 1 : -1; });
  return { list: list, rules: bookingRules_(user), payInfo: getSetting_('PAY_INFO'), evalQuestions: EVAL_QUESTIONS, evalScale: EVAL_SCALE };
});

def_('getCertificate', 'user', function (p, user) {
  var r = findBy_('Registrations', 'id', p.regId);
  if (!r || (r.userId !== user.id && user.role !== 'admin')) throw new Error('ไม่พบใบประกาศ');
  if (!r.certNo) throw new Error('ยังไม่ได้ออกใบประกาศ');
  if (user.role !== 'admin' && !r.evaluatedAt && isTrue_(getSetting_('EVAL_REQUIRED') || defaultSetting_('EVAL_REQUIRED'))) throw new Error('กรุณาทำแบบประเมินวิทยากร (เช็คเอาท์) ก่อนรับใบประกาศ');
  var owner = r.userId === user.id ? user : findBy_('Users', 'id', r.userId);
  var s = normSession_(findBy_('Sessions', 'id', r.sessionId));
  var exp = certExpiry_(s);
  if (exp < today_() && user.role !== 'admin') throw new Error('ใบประกาศหมดอายุแล้วเมื่อ ' + thaiDate_(exp) + ' จึงไม่สามารถเปิดดูหรือดาวน์โหลดได้');
  var c = findBy_('Courses', 'id', s.courseId) || {};
  var tpl = findBy_('Templates', 'id', s.templateId || c.defaultTemplateId);
  if (!tpl) throw new Error('ยังไม่ได้กำหนดเทมเพลตใบประกาศสำหรับรอบนี้');
  return {
    name: fullName_(owner), nameEn: owner.nameEn, certNo: r.certNo, date: s.endDate || s.date, expires: exp,
    course: c.title, hours: s.hours || c.hours, verifyUrl: siteUrl_() + '?verify=' + encodeURIComponent(r.certNo),
    template: { id: tpl.id, name: tpl.name, config: parseJson_(tpl.config) }
  };
});

def_('templateImage', 'user', function (p) {
  var tpl = findBy_('Templates', 'id', p.templateId);
  if (!tpl) throw new Error('ไม่พบเทมเพลต');
  return templateDataUrl_(tpl);
});

// ---------- Rewards (user) ----------
def_('rewardsPage', 'user', function (p, user) {
  if (!isTrue_(getSetting_('REWARDS_ENABLED')) && user.role !== 'admin') throw new Error('หน้าแลกของรางวัลปิดอยู่ในขณะนี้');
  var rewards = readTable_('Rewards').filter(function (x) { return isTrue_(x.active); }).sort(bySort_);
  return {
    points: pointsOf_(user.id), items: rewards.filter(function (x) { return x.kind !== 'prize'; }),
    prizes: rewards.filter(function (x) { return x.kind === 'prize' && (x.stock === '' || Number(x.stock) > 0); }).map(function (x) { return pick_(x, ['id', 'name', 'imageUrl']); }),
    luckyCost: Number(getSetting_('LUCKY_COST') || 0),
    history: readTable_('Redemptions').filter(function (x) { return x.userId === user.id; }).reverse(),
    ledger: readTable_('Points').filter(function (x) { return x.userId === user.id && String(x.year) === String(year_()); }).reverse()
  };
});

def_('redeemReward', 'user', function (p, user) {
  if (!isTrue_(getSetting_('REWARDS_ENABLED'))) throw new Error('หน้าแลกของรางวัลปิดอยู่');
  return withLock_(function () {
    var rw = findBy_('Rewards', 'id', p.rewardId);
    if (!rw || !isTrue_(rw.active) || rw.kind === 'prize') throw new Error('ไม่พบของรางวัล');
    if (rw.stock !== '' && Number(rw.stock) <= 0) throw new Error('ของรางวัลหมดแล้ว');
    var cost = Number(rw.points);
    if (pointsOf_(user.id).balance < cost) throw new Error('แต้มไม่เพียงพอ');
    if (rw.stock !== '') update_('Rewards', rw.id, { stock: Number(rw.stock) - 1 });
    var rd = { id: uid_('D'), userId: user.id, rewardId: rw.id, rewardName: rw.name, points: cost, kind: 'redeem', status: 'pending', createdAt: now_() };
    insert_('Redemptions', rd);
    addPoints_(user.id, -cost, 'redeem', rd.id, 'แลก ' + rw.name);
    return { redemption: rd, points: pointsOf_(user.id) };
  });
});

def_('luckyDraw', 'user', function (p, user) {
  if (!isTrue_(getSetting_('REWARDS_ENABLED'))) throw new Error('หน้าแลกของรางวัลปิดอยู่');
  return withLock_(function () {
    var cost = Number(getSetting_('LUCKY_COST') || 0);
    if (pointsOf_(user.id).balance < cost) throw new Error('แต้มไม่เพียงพอสำหรับการสุ่ม');
    var pool = readTable_('Rewards').filter(function (x) { return x.kind === 'prize' && isTrue_(x.active) && (x.stock === '' || Number(x.stock) > 0) && Number(x.weight || 0) > 0; });
    if (!pool.length) throw new Error('ยังไม่มีรางวัลในกล่องสุ่ม');
    var total = pool.reduce(function (a, x) { return a + Number(x.weight); }, 0), r = Math.random() * total, win = pool[0];
    for (var i = 0; i < pool.length; i++) { r -= Number(pool[i].weight); if (r <= 0) { win = pool[i]; break; } }
    if (win.stock !== '') update_('Rewards', win.id, { stock: Number(win.stock) - 1 });
    var rd = { id: uid_('D'), userId: user.id, rewardId: win.id, rewardName: win.name, points: cost, kind: 'lucky', status: 'pending', createdAt: now_() };
    insert_('Redemptions', rd);
    addPoints_(user.id, -cost, 'lucky', rd.id, 'สุ่มรางวัล: ' + win.name);
    return { prize: pick_(win, ['id', 'name', 'imageUrl', 'description']), redemption: rd, points: pointsOf_(user.id) };
  });
});

// ---------- Admin ----------
def_('adminData', 'admin', function () {
  var regs = readTable_('Registrations');
  var sessions = sessionsWithStats_();
  return {
    courses: readTable_('Courses').sort(bySort_), sessions: sessions,
    templates: readTable_('Templates').map(function (t) { t.config = parseJson_(t.config); return t; }),
    banners: readTable_('Banners'), materials: readTable_('Materials').map(cleanMaterial_), settings: readTable_('Settings'),
    rewards: readTable_('Rewards').sort(bySort_),
    stats: {
      users: readTable_('Users').length,
      registrations: regs.filter(function (r) { return r.status !== 'cancelled'; }).length,
      certs: regs.filter(function (r) { return r.certNo; }).length,
      upcoming: sessions.filter(function (s) { return s.date >= today_() && s.status === 'open'; }).length,
      payReview: regs.filter(function (r) { return r.payStatus === 'review'; }).length,
      redeemPending: readTable_('Redemptions').filter(function (r) { return r.status === 'pending'; }).length,
      quotesNew: readTable_('QuoteRequests').filter(function (q) { return q.status === 'new'; }).length
    }
  };
});

def_('saveCourse', 'admin', function (p) {
  var c = pick_(p.course, SCHEMA.Courses);
  if (p.cover) c.coverUrl = saveImage_(p.cover, 'courses', 'course_' + Date.now());
  if (c.id) update_('Courses', c.id, c); else { c.id = uid_('C'); if (c.active === undefined) c.active = true; insert_('Courses', c); }
  return findBy_('Courses', 'id', c.id);
});

def_('saveSession', 'admin', function (p) {
  var s = pick_(p.session, SCHEMA.Sessions);
  if (!s.courseId || !s.date) throw new Error('กรุณาเลือกหลักสูตรและวันที่');
  if (!Number(s.hours)) throw new Error('กรุณาระบุจำนวนชั่วโมงอบรม (ใช้คำนวณแต้ม)');
  s.speakerName = String(s.speakerName || '').trim(); s.speakerEmail = String(s.speakerEmail || '').trim().toLowerCase();
  if (!s.speakerName) throw new Error('กรุณาระบุชื่อวิทยากร');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.speakerEmail)) throw new Error('กรุณาระบุอีเมลวิทยากรให้ถูกต้อง');
  if (s.id) { var old = findBy_('Sessions', 'id', s.id); if (old && (old.speakerEmail !== s.speakerEmail || dateStr_(old.date) !== s.date)) s.speakerNotifiedAt = ''; }
  var c = findBy_('Courses', 'id', s.courseId);
  if (!s.templateId) s.templateId = c && c.defaultTemplateId || '';
  if (typeof s.fees === 'object') s.fees = JSON.stringify(s.fees);
  if (s.id) update_('Sessions', s.id, s);
  else { s.id = uid_('S'); s.createdAt = now_(); s.status = s.status || 'open'; s.checkinCode = checkinCode_(); insert_('Sessions', s); }
  return s;
});

def_('newCheckinCode', 'admin', function (p) { var code = checkinCode_(); update_('Sessions', p.sessionId, { checkinCode: code }); return code; });

/** ลบรอบอบรม: ไม่เคยมีผู้ลงทะเบียน → ลบแถวจริง
 *  มีประวัติ → ย้ายไป “ที่ลบแล้ว” (archived) เพื่อเก็บประวัติ/ใบประกาศ
 *  ถ้าเป็นรอบที่ยังไม่จัด → ยกเลิกผู้ลงทะเบียนทั้งหมด (ไม่นับ strike) + ส่งอีเมลแจ้ง */
def_('deleteSession', 'admin', function (p) {
  return withLock_(function () {
    var s = findBy_('Sessions', 'id', p.id);
    if (!s) throw new Error('ไม่พบรอบอบรม');
    normSession_(s);
    var regs = readTable_('Registrations').filter(function (r) { return r.sessionId === p.id; });
    if (!regs.length) { remove_('Sessions', p.id); return { deleted: true }; }
    ensureColumn_('Sessions', 'archived');
    var upcoming = (s.endDate || s.date) >= today_(), n = 0;
    if (upcoming) {
      var c = findBy_('Courses', 'id', s.courseId) || {}, users = indexBy_(readTable_('Users'), 'id');
      regs.forEach(function (r) {
        if (r.status !== 'registered') return;
        update_('Registrations', r.id, { status: 'cancelled', cancelReason: 'ผู้จัดยกเลิกรอบอบรม', cancelledAt: now_() }); n++;
        var u = users[r.userId];
        if (u) notify_(u.email, 'แจ้งยกเลิกรอบอบรม ' + (c.title || ''),
          'เรียน คุณ' + (u.firstName || '') + '<br><br>ขออภัย รอบอบรม <b>' + (c.title || '') + '</b> วันที่ ' + s.date + ' ได้ถูกยกเลิกโดยผู้จัด'
          + '<br>การยกเลิกนี้ไม่นับเป็นการผิดกติกาของท่าน ท่านสามารถจองรอบใหม่ได้ที่ ' + siteUrl_()
          + (Number(r.total) && r.payStatus === 'paid' ? '<br>เจ้าหน้าที่จะติดต่อกลับเรื่องการคืนเงิน' : ''));
      });
      update_('Sessions', p.id, { status: 'cancelled', archived: true });
    } else update_('Sessions', p.id, { archived: true });
    return { archived: true, cancelledRegs: n };
  });
});

def_('restoreSession', 'admin', function (p) {
  ensureColumn_('Sessions', 'archived');
  update_('Sessions', p.id, { archived: false });
  return true;
});
function ensureColumn_(name, col) {
  var sh = sheet_(name), h = headers_(name);
  if (h.indexOf(col) < 0) { sh.getRange(1, h.length + 1).setValue(col); delete TABLE_CACHE_[name]; }
}

def_('sessionRoster', 'admin', function (p) {
  var users = indexBy_(readTable_('Users'), 'id');
  return readTable_('Registrations').filter(function (r) { return r.sessionId === p.sessionId; }).map(function (r) {
    return { reg: publicReg_(r), user: safeUser_(users[r.userId] || {}) };
  });
});

def_('addToSession', 'admin', function (p) {
  var u = findBy_('Users', 'email', String(p.email || '').trim().toLowerCase());
  if (!u) throw new Error('ไม่พบผู้ใช้ที่ใช้อีเมลนี้ (ให้ผู้อบรมสมัครสมาชิกก่อน)');
  if (readTable_('Registrations').some(function (r) { return r.userId === u.id && r.sessionId === p.sessionId && r.status !== 'cancelled'; })) throw new Error('ผู้ใช้นี้อยู่ในรอบนี้แล้ว');
  var s = sessionWithStats_(p.sessionId), money = calcFees_(s, { billingType: u.billingType || (u.company ? 'company' : 'person') }, false);
  var r = { id: uid_('R'), userId: u.id, sessionId: p.sessionId, status: 'registered', registeredAt: now_(), note: 'เพิ่มโดยผู้ดูแล',
    payStatus: money.total > 0 ? 'unpaid' : 'free', subtotal: money.subtotal, vatAmount: money.vat, whtAmount: 0, total: money.total };
  insert_('Registrations', r);
  return r;
});

def_('setRegStatus', 'admin', function (p) {
  var regs = indexBy_(readTable_('Registrations'), 'id');
  (p.regIds || []).forEach(function (id) {
    var r = regs[id]; if (!r) return;
    var patch = { status: p.status };
    if (p.status === 'attended') { patch.attendedAt = now_(); if (!r.checkedInAt) patch.checkedInAt = now_(); }
    update_('Registrations', id, patch);
    if (p.status === 'absent' && r.status !== 'absent') {
      var u = findBy_('Users', 'id', r.userId); if (u) addStrike_(u, id, 'noshow', 'ไม่มาอบรม (ผู้ดูแลบันทึก)');
      if (r.pointsAwarded) revokePoints_(r);
    }
  });
  if (p.status === 'attended') afterAttend_(p.regIds || []);
  return true;
});

def_('issueCerts', 'admin', function (p) { return issueCerts_(p.regIds || []); });
def_('revokeCert', 'admin', function (p) { update_('Registrations', p.regId, { certNo: '', certIssuedAt: '' }); return true; });

def_('setPayment', 'admin', function (p) {
  var patch = { payStatus: p.status };
  if (p.status === 'paid') patch.paidAt = now_();
  if (p.receipt) patch.receiptUrl = fileLink_(saveFile_(p.receipt, 'payments', 'receipt_' + p.regId));
  update_('Registrations', p.regId, patch);
  var r = findBy_('Registrations', 'id', p.regId), u = findBy_('Users', 'id', r.userId);
  if (u && (p.status === 'paid' || p.status === 'rejected')) notify_(u.email, p.status === 'paid' ? 'ยืนยันการชำระค่าอบรม' : 'หลักฐานการชำระเงินไม่ผ่านการตรวจสอบ',
    'เรียน ' + fullName_(u) + '<br><br>' + (p.status === 'paid' ? 'เราได้รับชำระค่าอบรม ' + Number(r.total).toLocaleString() + ' บาท เรียบร้อยแล้ว' : 'กรุณาแนบหลักฐานการโอนใหม่ที่เมนู “การอบรมของฉัน”' + (p.note ? '<br>หมายเหตุ: ' + p.note : '')));
  return publicReg_(r);
});

def_('saveTemplate', 'admin', function (p) {
  var t = pick_(p.template, SCHEMA.Templates);
  if (typeof t.config === 'object') t.config = JSON.stringify(t.config);
  if (p.image) { var f = saveFile_(p.image, 'templates', 'template_' + Date.now()); t.imageFileId = f.getId(); t.imageUrl = imgUrl_(f.getId()); }
  if (t.id) update_('Templates', t.id, t); else { t.id = uid_('T'); t.createdAt = now_(); insert_('Templates', t); }
  var out = findBy_('Templates', 'id', t.id); out.config = parseJson_(out.config);
  return out;
});
def_('deleteTemplate', 'admin', function (p) { remove_('Templates', p.id); return true; });

def_('saveBanner', 'admin', function (p) {
  var b = pick_(p.banner, SCHEMA.Banners);
  if (p.image) { var f = saveFile_(p.image, 'banners', 'banner_' + Date.now()); b.imageFileId = f.getId(); b.imageUrl = imgUrl_(f.getId()); }
  if (b.id) update_('Banners', b.id, b); else { b.id = uid_('B'); b.createdAt = now_(); if (b.active === undefined) b.active = true; b.placement = b.placement || 'home'; insert_('Banners', b); }
  return findBy_('Banners', 'id', b.id);
});
def_('deleteBanner', 'admin', function (p) { remove_('Banners', p.id); return true; });

def_('saveMaterial', 'admin', function (p) {
  var m = pick_(p.material, SCHEMA.Materials);
  if (p.file) {
    var f = saveFile_(p.file, m.type === 'photo' ? 'gallery' : 'materials', p.file.name || ('file_' + Date.now()));
    m.fileId = f.getId();
    m.url = m.type === 'photo' ? imgUrl_(f.getId()) : 'https://drive.google.com/file/d/' + f.getId() + '/view';
  }
  if (!m.url) throw new Error('กรุณาแนบไฟล์หรือใส่ลิงก์');
  if (m.id) update_('Materials', m.id, m); else { m.id = uid_('M'); m.createdAt = now_(); insert_('Materials', m); }
  return cleanMaterial_(findBy_('Materials', 'id', m.id));
});
def_('deleteMaterial', 'admin', function (p) { remove_('Materials', p.id); return true; });

def_('listUsers', 'admin', function () {
  var regs = readTable_('Registrations'), pts = readTable_('Points'), y = String(year_()), strikes = readTable_('Strikes');
  return readTable_('Users').map(function (u) {
    var s = safeUser_(u);
    s.trainings = regs.filter(function (r) { return r.userId === u.id && r.status !== 'cancelled'; }).length;
    s.certs = regs.filter(function (r) { return r.userId === u.id && r.certNo; }).length;
    s.points = pts.filter(function (x) { return x.userId === u.id && String(x.year) === y; }).reduce(function (a, x) { return a + Number(x.points || 0); }, 0);
    s.strikes = strikes.filter(function (x) { return x.userId === u.id && (!u.penaltyAt || x.createdAt > u.penaltyAt); }).length;
    return s;
  });
});

/** export รายชื่อผู้ลงทะเบียน ตามหลักสูตร/รอบ */
def_('exportRegistrations', 'admin', function (p) {
  var users = indexBy_(readTable_('Users'), 'id'), courses = indexBy_(readTable_('Courses'), 'id');
  var sessions = indexBy_(readTable_('Sessions').map(normSession_), 'id');
  return readTable_('Registrations').filter(function (r) {
    var s = sessions[r.sessionId] || {};
    return (!p.sessionId || r.sessionId === p.sessionId) && (!p.courseId || s.courseId === p.courseId) && (p.includeCancelled || r.status !== 'cancelled');
  }).map(function (r) {
    var s = sessions[r.sessionId] || {}, c = courses[s.courseId] || {}, u = users[r.userId] || {}, b = parseJson_(r.billing);
    return {
      course: c.code + ' ' + c.title, session: (s.title || '') + ' ' + s.date, name: fullName_(u), email: u.email, phone: u.phone, company: u.company, position: u.position,
      status: r.status, checkedInAt: r.checkedInAt, certNo: r.certNo, payStatus: r.payStatus, total: r.total, wht: r.whtAmount,
      billingName: b.billingName || u.billingName, taxId: b.taxId || u.taxId, billingAddress: b.billingAddress || u.billingAddress, registeredAt: r.registeredAt, cancelReason: r.cancelReason,
      saleName: r.saleName, source: r.source, couponCode: r.couponCode || '', discount: r.discount || '', evaluatedAt: r.evaluatedAt || ''
    };
  });
});

def_('saveUser', 'admin', function (p) {
  var patch = pick_(p.user, ['prefix', 'firstName', 'lastName', 'nameEn', 'phone', 'company', 'position', 'role', 'status', 'bannedUntil', 'billingType', 'billingName', 'taxId', 'branch', 'billingAddress']);
  if (p.clearStrikes) patch.penaltyAt = now_();
  update_('Users', p.user.id, patch);
  return safeUser_(findBy_('Users', 'id', p.user.id));
});

def_('adminResetPassword', 'admin', function (p) {
  var u = findBy_('Users', 'id', p.userId);
  var temp = Math.random().toString(36).slice(2, 10);
  update_('Users', u.id, { passwordHash: hash_(temp, u.salt) });
  return { tempPassword: temp };
});

def_('adjustPoints', 'admin', function (p) {
  if (!Number(p.points)) throw new Error('กรุณาระบุจำนวนแต้ม');
  addPoints_(p.userId, Number(p.points), 'adjust', '', p.note || 'ปรับโดยผู้ดูแล');
  return pointsOf_(p.userId);
});

def_('saveReward', 'admin', function (p) {
  var r = pick_(p.reward, SCHEMA.Rewards);
  if (p.image) r.imageUrl = saveImage_(p.image, 'rewards', 'reward_' + Date.now());
  if (r.id) update_('Rewards', r.id, r); else { r.id = uid_('W'); r.createdAt = now_(); insert_('Rewards', r); }
  return findBy_('Rewards', 'id', r.id);
});
def_('deleteReward', 'admin', function (p) { remove_('Rewards', p.id); return true; });

def_('listRedemptions', 'admin', function () {
  var users = indexBy_(readTable_('Users'), 'id');
  return readTable_('Redemptions').reverse().map(function (r) { var u = users[r.userId] || {}; r.userName = fullName_(u); r.email = u.email; r.phone = u.phone; return r; });
});
def_('setRedemption', 'admin', function (p) {
  var r = findBy_('Redemptions', 'id', p.id);
  if (p.status === 'cancelled' && r.status !== 'cancelled') addPoints_(r.userId, Number(r.points), 'refund', r.id, 'คืนแต้ม: ' + r.rewardName);
  update_('Redemptions', p.id, { status: p.status, note: p.note || r.note });
  return true;
});

/** รวมไฟล์สลิป / หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ) / ใบเสร็จ ของรอบอบรม เป็นไฟล์ .zip */
def_('paymentDocsZip', 'admin', function (p) {
  var s = normSession_(findBy_('Sessions', 'id', p.sessionId));
  if (!s || !s.id) throw new Error('ไม่พบรอบอบรม');
  var c = findBy_('Courses', 'id', s.courseId) || {}, users = indexBy_(readTable_('Users'), 'id');
  var kinds = p.kind === 'wht' ? [['whtCertUrl', '50ทวิ']] : p.kind === 'slip' ? [['slipUrl', 'สลิป']] : [['slipUrl', 'สลิป'], ['whtCertUrl', '50ทวิ'], ['receiptUrl', 'ใบเสร็จ']];
  var blobs = [], used = {}, missing = 0;
  readTable_('Registrations').forEach(function (r) {
    if (r.sessionId !== s.id || r.status === 'cancelled') return;
    var u = users[r.userId] || {}, b = parseJson_(r.billing) || {};
    var who = String(b.billingName || u.company || fullName_(u) || r.id).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60);
    kinds.forEach(function (k) {
      var id = driveId_(r[k[0]]); if (!id) return;
      try {
        var blob = DriveApp.getFileById(id).getBlob(), ext = (blob.getName().match(/\.[a-z0-9]{2,5}$/i) || [mimeExt_(blob.getContentType())])[0];
        var name = k[1] + '_' + who + ext, n = 2;
        while (used[name]) name = k[1] + '_' + who + '_' + (n++) + ext;
        used[name] = 1; blobs.push(blob.setName(name));
      } catch (e) { missing++; }
    });
  });
  if (!blobs.length) throw new Error('รอบนี้ยังไม่มีไฟล์ที่แนบมา');
  var zipName = (p.kind === 'wht' ? '50ทวิ_' : p.kind === 'slip' ? 'สลิป_' : 'เอกสารชำระเงิน_') + (c.code || '') + '_' + s.date + '.zip';
  var zip = Utilities.zip(blobs, zipName);
  return { name: zipName, count: blobs.length, missing: missing, data: 'data:application/zip;base64,' + Utilities.base64Encode(zip.getBytes()) };
});
function driveId_(url) { var m = String(url || '').match(/\/d\/([\w-]{10,})|[?&]id=([\w-]{10,})/); return m ? (m[1] || m[2]) : ''; }
function mimeExt_(t) { return { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[t] || ''; }

def_('emailDefaults', 'admin', function () {
  var o = {}; ['EMAIL_REG_SUBJECT', 'EMAIL_REG_BODY', 'EMAIL_REMIND_SUBJECT', 'EMAIL_REMIND_BODY'].forEach(function (k) { o[k] = defaultSetting_(k); }); return o;
});
/** ส่งอีเมลทดสอบถึงผู้ดูแลที่กดปุ่ม ใช้ข้อความที่กำลังแก้ไข (ยังไม่ต้องบันทึก) กับข้อมูลรอบอบรมล่าสุด */
def_('sendTestEmail', 'admin', function (p, user) {
  var ss = readTable_('Sessions').map(normSession_).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var s = ss.filter(function (x) { return x.date >= today_(); }).pop() || ss[0] || { date: today_(), startTime: '09:00', endTime: '16:00', location: 'สถานที่ตัวอย่าง' };
  var c = findBy_('Courses', 'id', s.courseId) || { title: 'หลักสูตรตัวอย่าง', code: 'DEMO' };
  var v = mailVars_(user, s, c, { id: 'R-TEST', total: 0, saleName: 'Sale ตัวอย่าง' });
  notify_(user.email, '[ทดสอบ] ' + renderMailTpl(p.subject, v, false), renderMailTpl(p.body, v, true), [], true, true);
  return { to: user.email };
});

def_('saveSettings', 'admin', function (p) {
  var sh = sheet_('Settings');
  var keys = readTable_('Settings').map(function (r) { return r.key; });
  Object.keys(p.settings || {}).forEach(function (k) {
    var i = keys.indexOf(k);
    if (i >= 0) sh.getRange(i + 2, 2).setValue(p.settings[k]); else sh.appendRow([k, p.settings[k], '']);
  });
  CacheService.getScriptCache().remove('settings');
  delete TABLE_CACHE_['Settings']; bustPub_();
  return true;
});

// ส่งอีเมลแทนหลังบ้านชุดใหม่ (Netlify + Supabase) เพื่อใช้บัญชี Google และโควตาเดิม ป้องกันด้วยรหัสลับ MAIL_RELAY_KEY
def_('relayMail', null, function (p) {
  var want = String(PropertiesService.getScriptProperties().getProperty('MAIL_RELAY_KEY') || getSetting_('MAIL_RELAY_KEY') || '');
  if (want.length < 24 || String(p.key || '') !== want) throw new Error('ไม่ได้รับอนุญาต');
  var sent = 0;
  (p.mails || []).slice(0, 50).forEach(function (m) {
    if (!m || !m.to) return;
    var o = { to: m.to, subject: m.subject || '', htmlBody: m.htmlBody || '' };
    if (m.name) o.name = m.name;
    if (m.replyTo) o.replyTo = m.replyTo;
    o.attachments = (m.attachments || []).map(function (a) { return Utilities.newBlob(Utilities.base64Decode(a.data), a.mimeType, a.name); });
    MailApp.sendEmail(o); sent++;
  });
  return { sent: sent, quota: MailApp.getRemainingDailyQuota() };
});

// ====== กติกาการจอง / เลื่อน / ระงับสิทธิ์ ======
function bookingRules_(user) {
  var regs = readTable_('Registrations');
  var sessions = indexBy_(readTable_('Sessions').map(normSession_), 'id');
  var active = regs.filter(function (r) { return r.userId === user.id && r.status === 'registered' && (sessions[r.sessionId] || {}).date >= today_(); }).length;
  var strikes = readTable_('Strikes').filter(function (s) { return s.userId === user.id && (!user.penaltyAt || s.createdAt > user.penaltyAt); });
  var bannedUntil = dateStr_(user.bannedUntil);
  return {
    active: active, maxActive: Number(getSetting_('MAX_ACTIVE_BOOKINGS') || 5), strikes: strikes.length,
    strikeLimit: Number(getSetting_('STRIKE_LIMIT') || 2), changeDays: Number(getSetting_('CHANGE_DAYS_BEFORE') || 3),
    bannedUntil: bannedUntil, banned: !!bannedUntil && bannedUntil > today_()
  };
}
function changeAllowed_(s) {
  var days = Number(getSetting_('CHANGE_DAYS_BEFORE') || 3);
  var limit = dt_(s.date, '00:00'); limit.setDate(limit.getDate() - days);
  return new Date() < limit;
}
function assertChangeWindow_(s) {
  if (!changeAllowed_(s)) throw new Error('เลื่อนหรือยกเลิกได้ถึง ' + getSetting_('CHANGE_DAYS_BEFORE') + ' วันก่อนวันอบรมเท่านั้น กรุณาติดต่อเจ้าหน้าที่');
}
/** บันทึกการเลื่อน/ยกเลิก/ไม่มา ถ้าเกินกำหนด: ยกเลิกการจองทั้งหมดและระงับสิทธิ์ เดือนถัดไปทั้งเดือน (ลงได้อีกครั้งในเดือนที่ 3) */
function addStrike_(user, regId, type, reason) {
  insert_('Strikes', { id: uid_('K'), userId: user.id, regId: regId, type: type, reason: reason || '', createdAt: now_() });
  var u = findBy_('Users', 'id', user.id);
  var rules = bookingRules_(u);
  if (rules.strikes <= rules.strikeLimit) return null;
  var d = new Date(); var until = new Date(d.getFullYear(), d.getMonth() + 2, 1);
  var untilStr = Utilities.formatDate(until, tz_(), 'yyyy-MM-dd');
  var sessions = indexBy_(readTable_('Sessions').map(normSession_), 'id');
  readTable_('Registrations').forEach(function (r) {
    if (r.userId === u.id && r.status === 'registered' && (sessions[r.sessionId] || {}).date >= today_())
      update_('Registrations', r.id, { status: 'cancelled', cancelReason: 'ระงับสิทธิ์อัตโนมัติ (เลื่อน/ยกเลิก/ไม่มา เกิน ' + rules.strikeLimit + ' ครั้ง)', cancelledAt: now_() });
  });
  update_('Users', u.id, { bannedUntil: untilStr, penaltyAt: now_() });
  notify_(u.email, 'แจ้งระงับสิทธิ์การลงทะเบียนอบรมชั่วคราว', 'เรียน ' + fullName_(u) + '<br><br>เนื่องจากมีการเลื่อน/ยกเลิก/ไม่มาอบรม เกิน ' + rules.strikeLimit +
    ' ครั้ง ระบบได้ยกเลิกการลงทะเบียนที่ค้างอยู่ทั้งหมด และระงับสิทธิ์การลงทะเบียนจนถึงวันที่ ' + thaiDate_(untilStr) + ' ท่านสามารถลงทะเบียนได้อีกครั้งตั้งแต่วันดังกล่าว');
  return { bannedUntil: untilStr };
}

// ====== งานรายวัน (ตั้งเวลาอัตโนมัติจาก setup) ======
function dailyJobs() {
  var spDays = Number(getSetting_('SPEAKER_REMIND_DAYS') || 3), spT = new Date(); spT.setDate(spT.getDate() + spDays);
  var spStr = Utilities.formatDate(spT, tz_(), 'yyyy-MM-dd');
  readTable_('Sessions').map(normSession_).forEach(function (s) {
    if (s.speakerEmail && !s.speakerNotifiedAt && !isTrue_(s.archived) && (s.status === 'open' || s.status === 'closed') && s.date <= spStr && s.date >= today_()) notifySpeaker_(s);
  });
  var remindDays = Number(getSetting_('REMIND_DAYS') || 5);
  var target = new Date(); target.setDate(target.getDate() + remindDays);
  var targetStr = Utilities.formatDate(target, tz_(), 'yyyy-MM-dd');
  var sessions = indexBy_(readTable_('Sessions').map(normSession_), 'id');
  var courses = indexBy_(readTable_('Courses'), 'id');
  var users = indexBy_(readTable_('Users'), 'id');
  readTable_('Registrations').forEach(function (r) {
    var s = sessions[r.sessionId]; if (!s) return;
    var u = users[r.userId], c = courses[s.courseId] || {};
    // เตือนล่วงหน้า
    if (r.status === 'registered' && !r.remindedAt && s.date <= targetStr && s.date > today_() && u) {
      sendTplMail_('REMIND', u, s, c, r, [icsBlob_(s, c)]);
      update_('Registrations', r.id, { remindedAt: now_() });
    }
    // ไม่มาอบรม
    if (isTrue_(getSetting_('AUTO_NOSHOW')) && r.status === 'registered' && !r.checkedInAt && (s.endDate || s.date) < today_() && u) {
      update_('Registrations', r.id, { status: 'absent' });
      addStrike_(u, r.id, 'noshow', 'ไม่ได้เช็คอินในวันอบรม');
    }
  });
}

// ====== แต้ม ======
function addPoints_(userId, pts, type, refId, note) {
  insert_('Points', { id: uid_('P'), userId: userId, year: year_(), points: pts, type: type, refId: refId || '', note: note || '', createdAt: now_() });
}
function pointsOf_(userId) {
  var y = String(year_()), rows = readTable_('Points').filter(function (x) { return x.userId === userId && String(x.year) === y; });
  var earned = rows.filter(function (x) { return Number(x.points) > 0 && x.type !== 'refund'; }).reduce(function (a, x) { return a + Number(x.points); }, 0);
  var balance = rows.reduce(function (a, x) { return a + Number(x.points || 0); }, 0);
  return { year: Number(y), earned: earned, balance: balance, expiresAt: y + '-12-31' };
}
function afterAttend_(regIds) {
  var regs = indexBy_(readTable_('Registrations'), 'id');
  var sessions = indexBy_(readTable_('Sessions'), 'id'), courses = indexBy_(readTable_('Courses'), 'id');
  var pph = Number(getSetting_('POINTS_PER_HOUR') || 1);
  regIds.forEach(function (id) {
    var r = regs[id]; if (!r || r.pointsAwarded) return;
    var s = sessions[r.sessionId] || {}, c = courses[s.courseId] || {};
    var pts = Math.round(Number(s.hours || c.hours || 0) * pph);
    if (pts > 0) { addPoints_(r.userId, pts, 'earn', r.id, 'อบรม ' + (c.code || '') + ' ' + dateStr_(s.date)); update_('Registrations', r.id, { pointsAwarded: pts }); }
  });
  if (isTrue_(getSetting_('AUTO_ISSUE_ON_ATTEND'))) issueCerts_(regIds);
}
function revokePoints_(r) { addPoints_(r.userId, -Number(r.pointsAwarded), 'adjust', r.id, 'ยกเลิกแต้มอบรม'); update_('Registrations', r.id, { pointsAwarded: '' }); }

// ====== ค่าอบรม ======
/** ค่าอบรม: ส่วนลดคูปองหักจากยอดก่อนภาษี · บุคคลธรรมดาไม่คิด VAT (PERSON_NO_VAT) · หัก ณ ที่จ่ายเฉพาะนิติบุคคล */
function calcFees_(s, billing, wht, coupon) {
  var fees = parseJson_(s.fees); if (!Array.isArray(fees)) fees = [];
  var gross = Number(s.price || 0) + fees.reduce(function (a, f) { return a + Number(f.amount || 0); }, 0);
  var discount = coupon ? couponDiscount_(coupon, gross) : 0;
  var subtotal = round2_(gross - discount);
  var isCo = !!(billing && billing.billingType === 'company');
  var noVat = !isCo && isTrue_(getSetting_('PERSON_NO_VAT') || defaultSetting_('PERSON_NO_VAT'));
  var vat = isTrue_(s.vat) && !noVat ? round2_(subtotal * Number(getSetting_('VAT_RATE') || 7) / 100) : 0;
  var w = (wht && isTrue_(s.whtAllowed) && isCo) ? round2_(subtotal * Number(getSetting_('WHT_RATE') || 3) / 100) : 0;
  return { gross: gross, discount: discount, subtotal: subtotal, vat: vat, wht: w, total: round2_(subtotal + vat - w) };
}
// ====== คูปองส่วนลด (แอดมินสร้างเฉพาะรอบ) ======
function couponDiscount_(cp, gross) {
  var v = Number(cp.value || 0);
  var d = cp.kind === 'percent' ? gross * Math.min(Math.max(v, 0), 100) / 100 : Math.max(v, 0);
  return round2_(Math.min(d, gross));
}
function findCoupon_(code, sessionId, exceptRegId) {
  code = String(code || '').trim().toUpperCase();
  if (!code) return null;
  var cp = readTable_('Coupons').filter(function (c) { return String(c.code).toUpperCase() === code && (!c.sessionId || c.sessionId === sessionId); })[0];
  if (!cp || !isTrue_(cp.active)) throw new Error('โค้ดส่วนลดไม่ถูกต้อง หรือไม่สามารถใช้กับรอบนี้ได้');
  var used = readTable_('Registrations').filter(function (r) { return r.status !== 'cancelled' && String(r.couponCode).toUpperCase() === code && r.id !== exceptRegId; }).length;
  if (Number(cp.maxUses) > 0 && used >= Number(cp.maxUses)) throw new Error('โค้ดส่วนลดนี้ถูกใช้ครบจำนวนแล้ว');
  cp.code = code; cp.used = used;
  return cp;
}
def_('checkCoupon', 'user', function (p) {
  var s = sessionWithStats_(p.sessionId);
  if (!s || !s.id) throw new Error('ไม่พบรอบอบรม');
  var cp = findCoupon_(p.code, s.id);
  return { code: cp.code, kind: cp.kind === 'percent' ? 'percent' : 'amount', value: Number(cp.value || 0) };
});
def_('listCoupons', 'admin', function () {
  var regs = readTable_('Registrations');
  return readTable_('Coupons').map(function (c) {
    c.used = regs.filter(function (r) { return r.status !== 'cancelled' && String(r.couponCode).toUpperCase() === String(c.code).toUpperCase(); }).length;
    return c;
  }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
});
def_('saveCoupon', 'admin', function (p) {
  var c = pick_(p.coupon || {}, SCHEMA.Coupons);
  c.code = String(c.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9_-]{3,30}$/.test(c.code)) throw new Error('โค้ดต้องเป็นตัวอักษรอังกฤษหรือตัวเลข 3–30 ตัว');
  if (!c.sessionId) throw new Error('กรุณาเลือกรอบอบรมที่ใช้คูปอง');
  c.kind = c.kind === 'percent' ? 'percent' : 'amount';
  c.value = Number(c.value || 0);
  if (!(c.value > 0) || (c.kind === 'percent' && c.value > 100)) throw new Error('กรุณาระบุมูลค่าส่วนลดให้ถูกต้อง');
  c.maxUses = Number(c.maxUses || 0);
  c.active = c.active === undefined ? true : isTrue_(c.active);
  ensureSheet_('Coupons');
  return withLock_(function () {
    var dup = readTable_('Coupons').filter(function (x) { return String(x.code).toUpperCase() === c.code && x.id !== c.id; })[0];
    if (dup) throw new Error('มีโค้ด ' + c.code + ' อยู่แล้ว');
    if (c.id) update_('Coupons', c.id, c); else { c.id = uid_('V'); c.createdAt = now_(); insert_('Coupons', c); }
    return c;
  });
});
def_('deleteCoupon', 'admin', function (p) { remove_('Coupons', p.id); return true; });

// ====== แบบประเมินวิทยากร (เช็คเอาท์) ======
def_('submitEvaluation', 'user', function (p, user) {
  var regId = withLock_(function () {
    var r = findBy_('Registrations', 'id', p.regId);
    if (!r || r.userId !== user.id) throw new Error('ไม่พบการลงทะเบียน');
    if (r.status !== 'attended' && !r.checkedInAt) throw new Error('ทำแบบประเมินได้หลังเช็คอินเข้าอบรมแล้ว');
    if (r.evaluatedAt) throw new Error('ท่านทำแบบประเมินรอบนี้แล้ว');
    var s = normSession_(findBy_('Sessions', 'id', r.sessionId));
    var a = p.answers || [], e = { id: uid_('E'), regId: r.id, userId: user.id, sessionId: r.sessionId, speakerName: s.speakerName || '', comment: String(p.comment || '').trim().slice(0, 1000), createdAt: now_() };
    for (var i = 0; i < EVAL_QUESTIONS.length; i++) {
      var v = Number(a[i]);
      if (!(v >= 1 && v <= 4)) throw new Error('กรุณาให้คะแนนข้อ ' + (i + 1));
      e['q' + (i + 1)] = v;
    }
    ensureSheet_('Evaluations');
    insert_('Evaluations', e);
    update_('Registrations', r.id, { evaluatedAt: now_() });
    return r.id;
  });
  // เช็คอินแล้ว + ประเมินแล้ว → ออกใบประกาศให้ทันที
  var r2 = findBy_('Registrations', 'id', regId);
  if (r2 && !r2.certNo && r2.status !== 'absent' && r2.status !== 'cancelled') issueCerts_([regId]);
  r2 = findBy_('Registrations', 'id', regId);
  return { evaluatedAt: r2.evaluatedAt, certNo: r2.certNo || '' };
});
def_('evaluationSummary', 'admin', function (p) {
  var list = readTable_('Evaluations').filter(function (e) { return e.sessionId === p.sessionId; });
  var users = indexBy_(readTable_('Users'), 'id');
  var avg = EVAL_QUESTIONS.map(function (q, i) {
    var k = 'q' + (i + 1), n = list.length;
    return { question: q, avg: n ? round2_(list.reduce(function (a, e) { return a + Number(e[k] || 0); }, 0) / n) : 0,
      dist: [1, 2, 3, 4].map(function (v) { return list.filter(function (e) { return Number(e[k]) === v; }).length; }) };
  });
  var all = avg.length && list.length ? round2_(avg.reduce(function (a, x) { return a + x.avg; }, 0) / avg.length) : 0;
  return { count: list.length, overall: all, questions: avg, scale: EVAL_SCALE,
    comments: list.filter(function (e) { return e.comment; }).map(function (e) { return { name: fullName_(users[e.userId] || {}), comment: e.comment, createdAt: e.createdAt }; }),
    rows: list.map(function (e) { var u = users[e.userId] || {}; return { name: fullName_(u), email: u.email || '', company: u.company || '', q: [e.q1, e.q2, e.q3, e.q4, e.q5], comment: e.comment || '', createdAt: e.createdAt }; }) };
});

// ====== แจ้งวิทยากรก่อนวันอบรม ======
function notifySpeaker_(s, force) {
  if (!s.speakerEmail) return false;
  var c = findBy_('Courses', 'id', s.courseId) || {};
  var users = indexBy_(readTable_('Users'), 'id');
  var regs = readTable_('Registrations').filter(function (r) { return r.sessionId === s.id && r.status !== 'cancelled'; });
  var rows = regs.map(function (r, i) { var u = users[r.userId] || {}; return '<tr><td style="padding:4px 8px;border:1px solid #ddd">' + (i + 1) + '</td><td style="padding:4px 8px;border:1px solid #ddd">' + esc_(fullName_(u)) + '</td><td style="padding:4px 8px;border:1px solid #ddd">' + esc_(u.company || '-') + '</td></tr>'; }).join('');
  notify_(s.speakerEmail, 'แจ้งกำหนดการบรรยาย: ' + (c.title || '') + ' ' + thaiDate_(s.date),
    'เรียน ' + esc_(s.speakerName || 'วิทยากร') + '<br><br>ขอแจ้งกำหนดการบรรยายหลักสูตร <b>' + esc_(c.title || '') + '</b>' + (s.title ? ' (' + esc_(s.title) + ')' : '') + '<br>' + sessionHtml_(s) +
    '<br><br>จำนวนผู้ลงทะเบียน: <b>' + regs.length + ' คน</b>' + (Number(s.capacity) ? ' จาก ' + s.capacity + ' ที่นั่ง' : '') +
    (rows ? '<br><table style="border-collapse:collapse;margin-top:8px;font-size:13px"><tr><th style="padding:4px 8px;border:1px solid #ddd">#</th><th style="padding:4px 8px;border:1px solid #ddd">ชื่อ</th><th style="padding:4px 8px;border:1px solid #ddd">บริษัท</th></tr>' + rows + '</table>' : '') +
    '<br>หากมีข้อสงสัย กรุณาติดต่อ ' + esc_(getSetting_('CONTACT') || ''), [icsBlob_(s, c)], false, !!force);
  update_('Sessions', s.id, { speakerNotifiedAt: now_() });
  return true;
}
function esc_(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
def_('notifySpeaker', 'admin', function (p) {
  var s = normSession_(findBy_('Sessions', 'id', p.sessionId));
  if (!s || !s.id) throw new Error('ไม่พบรอบอบรม');
  if (!s.speakerEmail) throw new Error('รอบนี้ยังไม่ได้ระบุอีเมลวิทยากร');
  notifySpeaker_(s, true);
  return true;
});
function round2_(n) { return Math.round(n * 100) / 100; }

// ====== ใบประกาศ ======
function certExpiry_(s) {
  var d = dt_(s.endDate || s.date, '00:00'); d.setMonth(d.getMonth() + Number(getSetting_('CERT_VALID_MONTHS') || 12));
  return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd');
}
function issueCerts_(regIds) {
  return withLock_(function () {
    var regs = readTable_('Registrations');
    var sessions = indexBy_(readTable_('Sessions'), 'id'), courses = indexBy_(readTable_('Courses'), 'id'), users = indexBy_(readTable_('Users'), 'id');
    var fmt = getSetting_('CERT_FORMAT') || 'CERT-{CODE}-{YYYY}-{RUN}', digits = Number(getSetting_('CERT_RUN_DIGITS') || 4);
    var issued = [], toAttend = [];
    regIds.forEach(function (id) {
      var r = regs.filter(function (x) { return x.id === id; })[0];
      if (!r || r.certNo || r.status === 'cancelled') return;
      var s = normSession_(sessions[r.sessionId] || {}), c = courses[s.courseId] || {};
      var yyyy = s.date.slice(0, 4), mm = s.date.slice(5, 7);
      var prefix = fmt.replace('{CODE}', c.code || 'X').replace('{YYYY}', yyyy).replace('{YY}', yyyy.slice(2)).replace('{MM}', mm);
      var head = prefix.split('{RUN}')[0], max = 0;
      regs.forEach(function (x) { if (x.certNo && String(x.certNo).indexOf(head) === 0) { var n = parseInt(String(x.certNo).slice(head.length), 10); if (n > max) max = n; } });
      var run = String(max + 1); while (run.length < digits) run = '0' + run;
      r.certNo = prefix.replace('{RUN}', run); r.certIssuedAt = now_();
      if (r.status !== 'attended') toAttend.push(r.id);
      r.status = 'attended';
      update_('Registrations', r.id, { certNo: r.certNo, certIssuedAt: r.certIssuedAt, status: 'attended' });
      issued.push({ regId: r.id, certNo: r.certNo });
      var u = users[r.userId];
      if (u) notify_(u.email, 'ใบประกาศนียบัตรของท่านพร้อมดาวน์โหลดแล้ว', 'เรียน ' + fullName_(u) + '<br><br>ใบประกาศนียบัตรหลักสูตร <b>' + c.title + '</b> เลขที่ <b>' + r.certNo +
        '</b> พร้อมแล้ว (ใช้ได้ถึง ' + thaiDate_(certExpiry_(s)) + ')<br>เข้าสู่ระบบเพื่อดาวน์โหลดได้ที่ <a href="' + siteUrl_() + '">' + siteUrl_() + '</a>');
    });
    if (toAttend.length) {
      var pph = Number(getSetting_('POINTS_PER_HOUR') || 1);
      toAttend.forEach(function (id) {
        var r = regs.filter(function (x) { return x.id === id; })[0]; if (!r || r.pointsAwarded) return;
        var s = sessions[r.sessionId] || {}, c = courses[s.courseId] || {}, pts = Math.round(Number(s.hours || c.hours || 0) * pph);
        if (pts > 0) { addPoints_(r.userId, pts, 'earn', r.id, 'อบรม ' + (c.code || '')); update_('Registrations', r.id, { pointsAwarded: pts }); }
      });
    }
    return issued;
  });
}
function templateDataUrl_(tpl) {
  var cache = CacheService.getScriptCache(), key = 'tplimg_' + tpl.id + '_' + tpl.imageFileId, n = cache.get(key + '_n');
  if (n) {
    var keys = []; for (var k = 0; k < Number(n); k++) keys.push(key + '_' + k);
    var got = cache.getAll(keys), s = '';
    keys.forEach(function (x) { s += got[x] || ''; });
    if (s && keys.every(function (x) { return got[x]; })) return s;
  }
  var blob = DriveApp.getFileById(tpl.imageFileId).getBlob();
  var data = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  try {
    var size = 90000, cnt = Math.ceil(data.length / size), put = {};
    for (var j = 0; j < cnt; j++) put[key + '_' + j] = data.substr(j * size, size);
    put[key + '_n'] = String(cnt);
    cache.putAll(put, 21600);
  } catch (e) { }
  return data;
}

// ====== Helpers: data ======
var SS_ = null;
function ss_() { return SS_ || (SS_ = SpreadsheetApp.openById(SPREADSHEET_ID)); }
/** ข้อมูลหน้าแรกเก็บในแคช 2 นาที ล้างทันทีเมื่อมีการแก้รอบอบรม หลักสูตร แบนเนอร์ การลงทะเบียน หรือการตั้งค่า */
var PUB_TABLES_ = ['Sessions', 'Courses', 'Banners', 'Registrations', 'Settings'];
function pubKey_() { return 'pub_home_' + today_(); }
function bustPub_(name) { if (!name || PUB_TABLES_.indexOf(name) >= 0) { try { CacheService.getScriptCache().remove(pubKey_()); } catch (e) { } } }
var TABLE_CACHE_ = {};
function readTable_(name) {
  if (TABLE_CACHE_[name]) return TABLE_CACHE_[name].map(function (o) { return Object.assign({}, o); });
  var sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var headers = values.shift();
  var rows = values.filter(function (row) { return row.join('') !== ''; }).map(function (row) {
    var o = {};
    headers.forEach(function (h, i) {
      var v = row[i];
      if (v instanceof Date) v = (h === 'date' || h === 'endDate' || h === 'bannedUntil') ? Utilities.formatDate(v, tz_(), 'yyyy-MM-dd') :
        (h === 'startTime' || h === 'endTime') ? Utilities.formatDate(v, tz_(), 'HH:mm') : (h === 'month' ? Utilities.formatDate(v, tz_(), 'yyyy-MM') : v.toISOString());
      o[h] = v;
    });
    return o;
  });
  TABLE_CACHE_[name] = rows;
  return rows.map(function (o) { return Object.assign({}, o); });
}
/** คืนชีตตามชื่อ ถ้ายังไม่มี (ยังไม่ได้รัน setup) สร้างให้พร้อมหัวคอลัมน์ */
function sheet_(name) {
  var ss = ss_(), sh = ss.getSheetByName(name);
  if (sh && sh.getLastColumn() > 0) return sh;
  if (!sh) sh = ss.insertSheet(name);
  var h = SCHEMA[name] || ['id'];
  sh.getRange(1, 1, 1, h.length).setValues([h]); sh.setFrozenRows(1);
  if (name === 'Settings') DEFAULT_SETTINGS.forEach(function (row) { sh.appendRow(row); });
  delete TABLE_CACHE_[name];
  return sh;
}
function headers_(name) { var sh = sheet_(name); return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; }
/** เพิ่มคอลัมน์ที่ยังไม่มีตาม SCHEMA (ครั้งเดียวต่อการทำงาน) — อัปเดตเวอร์ชันแล้วไม่ต้องรัน setup ใหม่ */
var SCHEMA_OK_ = {};
function schemaOk_(name) {
  if (SCHEMA_OK_[name] || !SCHEMA[name]) return;
  var sh = sheet_(name), h = headers_(name), miss = SCHEMA[name].filter(function (k) { return h.indexOf(k) < 0; });
  if (miss.length) { sh.getRange(1, h.length + 1, 1, miss.length).setValues([miss]); delete TABLE_CACHE_[name]; }
  SCHEMA_OK_[name] = true;
}
function insert_(name, obj) {
  schemaOk_(name);
  delete TABLE_CACHE_[name]; bustPub_(name);
  var h = headers_(name);
  sheet_(name).appendRow(h.map(function (k) { return toCell_(k, obj[k]); }));
}
function update_(name, id, patch) {
  schemaOk_(name);
  delete TABLE_CACHE_[name]; bustPub_(name);
  var sh = sheet_(name), h = headers_(name);
  var ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return r[0]; });
  var i = ids.indexOf(id);
  if (i < 0) throw new Error('ไม่พบข้อมูล ' + id);
  var range = sh.getRange(i + 2, 1, 1, h.length), row = range.getValues()[0];
  h.forEach(function (k, j) {
    if (k === 'id') return;
    var v = patch[k] !== undefined ? patch[k] : row[j];
    row[j] = v instanceof Date ? v : toCell_(k, v);
  });
  range.setValues([row]);
}
function remove_(name, id) {
  delete TABLE_CACHE_[name]; bustPub_(name);
  var sh = sheet_(name);
  var ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return r[0]; });
  var i = ids.indexOf(id);
  if (i >= 0) sh.deleteRow(i + 2);
}
function toCell_(k, v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
  if (['date', 'endDate', 'startTime', 'endTime', 'phone', 'month', 'certNo', 'taxId', 'branch', 'bannedUntil', 'checkinCode'].indexOf(k) >= 0 && v !== '') return "'" + v;
  return v;
}
function findBy_(name, key, val) { return readTable_(name).filter(function (r) { return String(r[key]) === String(val); })[0] || null; }
function indexBy_(arr, key) { var o = {}; arr.forEach(function (x) { o[x[key]] = x; }); return o; }
function pick_(obj, keys) { var o = {}; keys.forEach(function (k) { if (obj && obj[k] !== undefined) o[k] = obj[k]; }); return o; }
function bySort_(a, b) { return Number(a.sort || 0) - Number(b.sort || 0); }
function parseJson_(s) { try { return typeof s === 'string' ? JSON.parse(s || '{}') : (s || {}); } catch (e) { return {}; } }
function isTrue_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function uid_(p) { return p + Utilities.formatDate(new Date(), 'UTC', 'yyMMdd') + Math.random().toString(36).slice(2, 7).toUpperCase(); }
function checkinCode_() { return String(Math.floor(100000 + Math.random() * 900000)); }
function now_() { return new Date().toISOString(); }
function tz_() { return Session.getScriptTimeZone() || 'Asia/Bangkok'; }
function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function year_() { return Number(Utilities.formatDate(new Date(), tz_(), 'yyyy')); }
function dateStr_(d) { return d instanceof Date ? Utilities.formatDate(d, tz_(), 'yyyy-MM-dd') : String(d || ''); }
/** วันที่+เวลา (เวลาไทย UTC+7) เป็น Date */
function dt_(dateStr, time) { return new Date(dateStr_(dateStr) + 'T' + (time || '00:00') + ':00+07:00'); }
function daysBetween_(a, b) { return Math.round((dt_(b) - dt_(a)) / 864e5); }
function thaiDate_(d) {
  var m = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var p = dateStr_(d).split('-'); if (p.length < 3) return '-';
  return Number(p[2]) + ' ' + m[Number(p[1]) - 1] + ' ' + (Number(p[0]) + 543);
}
function normSession_(s) { if (!s) return {}; s.date = dateStr_(s.date); s.endDate = s.endDate ? dateStr_(s.endDate) : ''; return s; }
function fullName_(u) { return [u.prefix, u.firstName, u.lastName].filter(String).join(' '); }
function sessionHtml_(s) {
  return 'วันที่ <b>' + thaiDate_(s.date) + (s.endDate && s.endDate !== s.date ? ' – ' + thaiDate_(s.endDate) : '') + '</b> เวลา ' + (s.startTime || '') + '–' + (s.endTime || '') + ' น.<br>สถานที่: ' + (s.location || '-') +
    (s.mapUrl ? ' (<a href="' + s.mapUrl + '">แผนที่</a>)' : '');
}
function icsBlob_(s, c) {
  var f = function (d, t) { return Utilities.formatDate(dt_(d, t), 'UTC', "yyyyMMdd'T'HHmmss'Z'"); };
  var esc = function (x) { return String(x || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); };
  var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Training Portal//TH', 'METHOD:PUBLISH', 'BEGIN:VEVENT', 'UID:' + s.id + '@training',
    'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"), 'DTSTART:' + f(s.date, s.startTime || '09:00'), 'DTEND:' + f(s.endDate || s.date, s.endTime || '16:00'),
    'SUMMARY:' + esc('อบรม: ' + (c.title || '')), 'LOCATION:' + esc(s.location), 'DESCRIPTION:' + esc((c.title || '') + ' · ' + (s.title || '') + ' · ' + (s.mapUrl || '')),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc('พรุ่งนี้มีอบรม ' + (c.title || '')), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return Utilities.newBlob(ics, 'text/calendar', 'training.ics');
}
function sessionsWithStats_() {
  var regs = readTable_('Registrations'), courses = indexBy_(readTable_('Courses'), 'id');
  return readTable_('Sessions').map(function (s) {
    normSession_(s);
    var active = regs.filter(function (r) { return r.sessionId === s.id && r.status !== 'cancelled'; });
    s.registered = active.length;
    s.checkedIn = active.filter(function (r) { return r.checkedInAt; }).length;
    s.attended = active.filter(function (r) { return r.status === 'attended'; }).length;
    s.certs = active.filter(function (r) { return r.certNo; }).length;
    s.payReview = active.filter(function (r) { return r.payStatus === 'review'; }).length;
    s.seatsLeft = Number(s.capacity) ? Math.max(Number(s.capacity) - s.registered, 0) : null;
    var c = courses[s.courseId] || {};
    s.courseTitle = c.title; s.courseCode = c.code; s.courseColor = c.color;
    s.hours = s.hours || c.hours;
    s.fees = parseJson_(s.fees); if (!Array.isArray(s.fees)) s.fees = [];
    s.feeTotal = Number(s.price || 0) + s.fees.reduce(function (a, f) { return a + Number(f.amount || 0); }, 0);
    return s;
  }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
}
function sessionWithStats_(id) { return sessionsWithStats_().filter(function (s) { return s.id === id; })[0] || null; }
function publicSession_(s) { var o = Object.assign({}, s); delete o.checkinCode; delete o.speakerEmail; delete o.speakerNotifiedAt; return o; }
function publicReg_(r) { var o = Object.assign({}, r); o.billing = parseJson_(r.billing); return o; }
function activeCourses_() { return readTable_('Courses').filter(function (c) { return isTrue_(c.active); }).sort(bySort_); }
function banners_() {
  var m = today_().slice(0, 7);
  var all = readTable_('Banners').filter(function (b) { return isTrue_(b.active); }).sort(bySort_);
  var out = {};
  all.forEach(function (b) { var pl = b.placement || 'home'; (out[pl] = out[pl] || []).push(b); });
  Object.keys(out).forEach(function (pl) {
    var cur = out[pl].filter(function (b) { return !b.month || b.month === m; });
    out[pl] = cur.length ? cur : out[pl].slice(-1);
  });
  return out;
}
function cleanMaterial_(m) { if (m.fileId && m.type !== 'photo') m.downloadUrl = 'https://drive.google.com/uc?export=download&id=' + m.fileId; return m; }
function safeUser_(u) {
  var o = {};
  Object.keys(u || {}).forEach(function (k) { if (k !== 'passwordHash' && k !== 'salt') o[k] = u[k]; });
  o.fullName = fullName_(u || {});
  return o;
}
function meData_(u) { var o = safeUser_(u); o.points = pointsOf_(u.id); o.rules = bookingRules_(u); return o; }

// ====== Settings ======
function getSetting_(key) {
  var cache = CacheService.getScriptCache(), raw = cache.get('settings'), map;
  if (raw) map = JSON.parse(raw);
  else { map = {}; readTable_('Settings').forEach(function (r) { map[r.key] = r.value; }); cache.put('settings', JSON.stringify(map), 300); }
  return map[key];
}
function defaultSetting_(k) { var d = DEFAULT_SETTINGS.filter(function (s) { return s[0] === k; })[0]; return d ? d[1] : ''; }
function publicSettings_() {
  var o = {};
  ['ORG_NAME', 'ORG_SHORT', 'LOGO_URL', 'CONTACT', 'HERO_SPEED', 'REWARDS_ENABLED', 'MAX_ACTIVE_BOOKINGS', 'CHANGE_DAYS_BEFORE', 'STRIKE_LIMIT',
    'VAT_RATE', 'WHT_RATE', 'PAY_INFO', 'CERT_VALID_MONTHS', 'LUCKY_COST', 'POINTS_PER_HOUR', 'CHECKIN_OPEN_MINUTES', 'SALES_LIST', 'SOURCE_LIST', 'WHT_PAYEE_INFO', 'PERSON_NO_VAT', 'EVAL_REQUIRED', 'SPEAKER_REMIND_DAYS'].forEach(function (k) { o[k] = getSetting_(k) || defaultSetting_(k); });
  o.APP_URL = siteUrl_();
  return o;
}

// ====== Auth ======
function hash_(pw, salt) {
  var v = salt + '|' + pw;
  for (var i = 0; i < 500; i++) v = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, v + salt, Utilities.Charset.UTF_8));
  return v;
}
function getSecret_() {
  var props = PropertiesService.getScriptProperties(), s = props.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('TOKEN_SECRET', s); }
  return s;
}
function sign_(str) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(str, getSecret_())).replace(/=+$/, ''); }
function makeToken_(userId) { var body = userId + '.' + (Date.now() + TOKEN_DAYS * 864e5); return body + '.' + sign_(body); }
function authUser_(token) {
  if (!token) return null;
  var p = String(token).split('.');
  if (p.length !== 3 || sign_(p[0] + '.' + p[1]) !== p[2] || Number(p[1]) < Date.now()) return null;
  var u = findBy_('Users', 'id', p[0]);
  return u && u.status !== 'disabled' ? u : null;
}
function withLock_(fn) { var lock = LockService.getScriptLock(); lock.waitLock(20000); try { return fn(); } finally { lock.releaseLock(); } }

// ====== Drive ======
function getFolder_(sub) {
  var props = PropertiesService.getScriptProperties(), rootId = props.getProperty('ROOT_FOLDER_ID'), root;
  try { root = rootId ? DriveApp.getFolderById(rootId) : null; } catch (e) { root = null; }
  if (!root) { root = DriveApp.createFolder(DRIVE_FOLDER_NAME); props.setProperty('ROOT_FOLDER_ID', root.getId()); }
  if (!sub) return root;
  var it = root.getFoldersByName(sub);
  return it.hasNext() ? it.next() : root.createFolder(sub);
}
/** file = { name, mimeType, data(base64 or dataURL) } */
function saveFile_(file, sub, name) {
  var data = String(file.data || ''), mime = file.mimeType || 'application/octet-stream';
  var m = data.match(/^data:([^;]+);base64,(.*)$/);
  if (m) { mime = m[1]; data = m[2]; }
  var f = getFolder_(sub).createFile(Utilities.newBlob(Utilities.base64Decode(data), mime, file.name || name));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return f;
}
function saveImage_(file, sub, name) { return imgUrl_(saveFile_(file, sub, name).getId()); }
function fileLink_(f) { return 'https://drive.google.com/file/d/' + f.getId() + '/view'; }
function imgUrl_(id) { return 'https://lh3.googleusercontent.com/d/' + id; }

function notify_(to, subject, html, attachments, noSign, force) {
  if ((!force && !isTrue_(getSetting_('SEND_EMAIL'))) || !to) return;
  try {
    MailApp.sendEmail({
      to: to, subject: '[' + (getSetting_('ORG_SHORT') || 'Training') + '] ' + subject, attachments: attachments || [],
      htmlBody: '<div style="font-family:Tahoma,sans-serif;font-size:14px;line-height:1.7;color:#1d2433">' + html + (noSign ? '' : '<br><br>ขอแสดงความนับถือ<br>' + (getSetting_('ORG_NAME') || '')) + '</div>'
    });
  } catch (e) { if (force) throw e; }
}

// ====== เทมเพลตอีเมล (แก้ไขได้ที่ แอดมิน → อีเมลแจ้งเตือน) ======
function renderMailTpl(tpl, vars, html) {
  var out = String(tpl || '').replace(/\{([^{}\n]{1,30})\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k] == null ? '' : vars[k]) : m; });
  if (!html) return out.replace(/\s*\n\s*/g, ' ').trim();
  out = out.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/https?:\/\/[^\s<]+/g, function (u) { return '<a href="' + u + '" style="color:#1a4fa0">' + u + '</a>'; });
  return out.replace(/\n/g, '<br>');
}
function mailVars_(u, s, c, r) {
  s = s || {}; c = c || {}; r = r || {}; u = u || {};
  var total = Number(r.total || 0), pph = Number(getSetting_('POINTS_PER_HOUR') || 1);
  var pay = total > 0 ? 'ค่าอบรมที่ต้องชำระ: **' + total.toLocaleString() + ' บาท**\n' + (getSetting_('PAY_INFO') || '') + '\n' +
    (r.slipUrl ? 'ได้รับหลักฐานการโอนแล้ว อยู่ระหว่างตรวจสอบ' : 'กรุณาแนบหลักฐานการโอนที่เมนู “การอบรมของฉัน”') : '';
  return {
    'ชื่อ': fullName_(u), 'ชื่อจริง': u.firstName || '', 'อีเมล': u.email || '', 'บริษัท': u.company || '',
    'หลักสูตร': c.title || '', 'รหัสหลักสูตร': c.code || '', 'ชื่อรอบ': s.title || '',
    'วันที่': s.date ? thaiDate_(s.date) + (s.endDate && s.endDate !== s.date ? ' – ' + thaiDate_(s.endDate) : '') : '',
    'เวลา': (s.startTime || '') + '–' + (s.endTime || '') + ' น.', 'สถานที่': s.location || '-',
    'แผนที่': s.mapUrl || (s.location ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.location) : '-'),
    'ชั่วโมง': s.hours || c.hours || '', 'แต้ม': Math.round(Number(s.hours || c.hours || 0) * pph),
    'อีกกี่วัน': s.date ? daysBetween_(today_(), s.date) : '', 'เลขที่ลงทะเบียน': r.id || '',
    'ยอดชำระ': total > 0 ? total.toLocaleString() + ' บาท' : 'ไม่มีค่าใช้จ่าย', 'ข้อมูลการชำระเงิน': pay,
    'Sale': r.saleName || '', 'ลิงก์เว็บ': siteUrl_(), 'หน่วยงาน': getSetting_('ORG_NAME') || '', 'ติดต่อ': getSetting_('CONTACT') || ''
  };
}
function mailTpl_(kind) {
  return { subject: getSetting_('EMAIL_' + kind + '_SUBJECT') || defaultSetting_('EMAIL_' + kind + '_SUBJECT'), body: getSetting_('EMAIL_' + kind + '_BODY') || defaultSetting_('EMAIL_' + kind + '_BODY') };
}
function sendTplMail_(kind, u, s, c, r, attachments) {
  if (!u || !u.email) return;
  var t = mailTpl_(kind), v = mailVars_(u, s, c, r);
  notify_(u.email, renderMailTpl(t.subject, v, false), renderMailTpl(t.body, v, true), attachments, true);
}

// ====== ติดตั้งเทมเพลตใบเซอร์ตั้งต้น ======
/** อัปโหลดรูป tpl-om-red.jpg, tpl-basic-green.jpg, tpl-commercial-blue.jpg ไว้ใน Google Drive ก่อน แล้วรันฟังก์ชันนี้ */
function installDefaultTemplates() {
  var defs = [
    { file: 'tpl-om-red.jpg', name: 'SolarEdge O&M – แดง', code: 'OM', color: '#7a0f1c', sub: '#8f2230' },
    { file: 'tpl-basic-green.jpg', name: 'Basics Solar Design – เขียว', code: 'BSD', color: '#2f7d47', sub: '#3c8d5c' },
    { file: 'tpl-commercial-blue.jpg', name: 'Commercial Designer – น้ำเงิน', code: 'CDI', color: '#16235a', sub: '#2c3a6e' }
  ];
  var courses = readTable_('Courses'), out = [];
  defs.forEach(function (d) {
    var it = DriveApp.getFilesByName(d.file);
    if (!it.hasNext()) { out.push('ไม่พบไฟล์ ' + d.file + ' ใน Drive'); return; }
    var f = it.next();
    f.moveTo(getFolder_('templates'));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var t = { id: uid_('T'), name: d.name, imageFileId: f.getId(), imageUrl: imgUrl_(f.getId()), config: JSON.stringify(defaultTemplateConfig(d.color, d.sub)), createdAt: now_() };
    insert_('Templates', t);
    var c = courses.filter(function (x) { return x.code === d.code; })[0];
    if (c) update_('Courses', c.id, { defaultTemplateId: t.id });
    out.push('สร้าง ' + d.name);
  });
  Logger.log(out.join('\n'));
  return out;
}
function defaultTemplateConfig(color, subColor) {
  return {
    dateLang: 'en',
    fields: {
      name: { show: true, x: 0.5, y: 0.388, size: 0.052, color: color, weight: 500, font: 'Kanit', align: 'center', maxWidth: 0.62 },
      certNo: { show: true, x: 0.1445, y: 0.9045, size: 0.0205, color: subColor, weight: 400, font: 'Kanit', align: 'left' },
      date: { show: true, x: 0.179, y: 0.9265, size: 0.0205, color: subColor, weight: 400, font: 'Kanit', align: 'left' },
      expires: { show: false, x: 0.179, y: 0.948, size: 0.0185, color: subColor, weight: 400, font: 'Kanit', align: 'left', prefix: 'VALID UNTIL: ' },
      qr: { show: true, x: 0.2, y: 0.735, size: 0.115, color: '#111111' },
      course: { show: false, x: 0.5, y: 0.47, size: 0.035, color: color, weight: 600, font: 'Kanit', align: 'center', maxWidth: 0.7 }
    }
  };
}
