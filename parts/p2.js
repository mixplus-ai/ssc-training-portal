
// ====================== SCHEDULE (calendar left · details right) ======================
VIEWS.schedule = async el => {
  el.innerHTML = `<div class="wrap page"><div class="skeleton" style="height:360px"></div></div>`;
  const d = S.user ? await call('listSessions', {}) : await fetchHome();
  S.banners = d.banners || S.banners || {};
  if (d.me) S.user = Object.assign(S.user, d.me);
  if (S.params.course !== undefined) { S.schedCourse = S.params.course; delete S.params.course; }
  const f = S.schedCourse || '';
  const all = d.sessions.filter(s => !f || s.courseId === f);
  const key = 'sched';
  const draw = () => {
    const list = all.filter(s => inCalView(key, s));
    el.innerHTML = `${bannerBlock('schedule')}<div class="wrap page">
      <div class="page-head"><div><div class="eyebrow">Training Calendar</div><h1>ตารางอบรมล่วงหน้า</h1><div class="muted">เลือกวันในปฏิทินเพื่อดูรายละเอียด จองที่นั่ง หรือบันทึกลงปฏิทินของท่าน</div></div>
        <button class="btn btn-gold" data-go="book">${ic('plus')} ลงทะเบียนอบรม</button></div>
      ${S.user ? rulesStrip(S.user.rules) : ''}
      <div class="filters" style="margin:4px 0 18px"><a class="filter ${!f ? 'active' : ''}" data-f="">ทุกหลักสูตร</a>${d.courses.map(c => `<a class="filter ${f === c.id ? 'active' : ''}" data-f="${c.id}"><i class="dotc" style="background:${esc(c.color)}"></i>${esc(c.code)}<span class="hide-sm"> · ${esc(c.title.length > 30 ? c.title.slice(0, 28) + '…' : c.title)}</span></a>`).join('')}</div>
      <div class="split">
        <aside class="split-side"><div class="card card-b">${calendarHtml(key, all, { legend: d.courses.map(c => ({ color: c.color, label: c.code })) })}</div></aside>
        <section class="split-main">
          <div class="list-label">${calViewLabel(key)} · ${list.length} รอบ</div>
          ${list.length ? `<div class="grid" style="gap:14px">${list.map(sessionDetailCard).join('')}</div>`
            : `<div class="card empty">${ic('cal')}<div>ไม่มีรอบอบรมใน${calViewLabel(key)}</div><div class="small">ลองเลื่อนเดือนในปฏิทิน หรือเลือก “ทุกหลักสูตร”</div></div>`}
        </section></div></div>`;
    $$('[data-f]', el).forEach(a => a.onclick = () => { S.schedCourse = a.dataset.f; delete S.cal[key]; VIEWS.schedule(el); });
    bindCalendar(el, key, draw); bindCommon(el, all); bindBanners(el, draw);
  };
  draw();
};

// ====================== PAYMENT FORM (fees · VAT · WHT · slip) ======================
/** ตรงกับ calcFees_ ใน Code.gs: คูปองหักก่อนภาษี · บุคคลธรรมดาไม่คิด VAT · หัก ณ ที่จ่ายเฉพาะนิติบุคคล */
function calcFees(s, billing, wht, coupon) {
  const fees = Array.isArray(s.fees) ? s.fees : [];
  const r2 = n => Math.round(n * 100) / 100;
  const gross = Number(s.price || 0) + fees.reduce((a, f) => a + Number(f.amount || 0), 0);
  const discount = coupon ? r2(Math.min(gross, coupon.kind === 'percent' ? gross * Math.min(Math.max(coupon.value, 0), 100) / 100 : Math.max(coupon.value, 0))) : 0;
  const subtotal = r2(gross - discount), isCo = !!(billing && billing.billingType === 'company');
  const noVat = !isCo && isTrue(S.settings.PERSON_NO_VAT);
  const vat = isTrue(s.vat) && !noVat ? r2(subtotal * Number(S.settings.VAT_RATE || 7) / 100) : 0;
  const w = (wht && isTrue(s.whtAllowed) && isCo) ? r2(subtotal * Number(S.settings.WHT_RATE || 3) / 100) : 0;
  return { gross, discount, subtotal, vat, wht: w, total: r2(subtotal + vat - w), noVat: isTrue(s.vat) && noVat, coupon };
}
function feeTable(s, m) {
  const fees = Array.isArray(s.fees) ? s.fees : [];
  return `<table class="fee-tbl"><tbody>
    ${Number(s.price) ? `<tr><td>ค่าอบรม</td><td>${money(s.price)}</td></tr>` : ''}
    ${fees.map(f => `<tr><td>${esc(f.name)}</td><td>${money(f.amount)}</td></tr>`).join('')}
    ${m.discount ? `<tr class="disc"><td>ส่วนลดโค้ด <b>${esc(m.coupon.code)}</b>${m.coupon.kind === 'percent' ? ` (${esc(m.coupon.value)}%)` : ''}</td><td>−${money(m.discount)}</td></tr>` : ''}
    ${m.noVat ? `<tr><td class="muted">บุคคลธรรมดา ไม่คิดภาษีมูลค่าเพิ่ม</td><td>0</td></tr>` : ''}
    ${m.vat ? `<tr><td>ภาษีมูลค่าเพิ่ม ${esc(S.settings.VAT_RATE || 7)}%</td><td>${money(m.vat)}</td></tr>` : ''}
    ${m.wht ? `<tr><td>หัก ณ ที่จ่าย ${esc(S.settings.WHT_RATE || 3)}%</td><td>−${money(m.wht)}</td></tr>` : ''}
    <tr class="tot"><td>ยอดชำระ</td><td>${money(m.total)} บาท</td></tr></tbody></table>`;
}
function paymentForm(s, u) {
  const bt = u.billingType || (u.company ? 'company' : 'person');
  return `<div class="pay-box">
    ${quoteLink()}
    <div class="fs-title">${ic('receipt')} ค่าใช้จ่ายการอบรม</div>
    <div id="feeT">${feeTable(s, calcFees(s, { billingType: bt }, false))}</div>
    <div class="coupon-row"><div class="field" style="flex:1;margin:0"><label>${icS('tag', 14)} โค้ดส่วนลด / โปรโมชั่น (ถ้ามี)</label><input class="input" name="couponIn" id="couponIn" placeholder="กรอกโค้ด" autocomplete="off" style="text-transform:uppercase"></div>
      <button type="button" class="btn btn-ghost" id="couponBtn">ใช้โค้ด</button></div><div class="small" id="couponMsg"></div>
    <fieldset class="fs"><legend>ข้อมูลออกใบเสร็จ / ใบกำกับภาษี</legend>
      <div class="opt-row"><label class="check"><input type="radio" name="billingType" value="person" ${bt !== 'company' ? 'checked' : ''}> บุคคลธรรมดา</label><label class="check"><input type="radio" name="billingType" value="company" ${bt === 'company' ? 'checked' : ''}> นิติบุคคล / บริษัท</label></div>
      <div class="field"><label>ชื่อสำหรับออกใบเสร็จ *</label><input class="input" name="billingName" value="${esc(u.billingName || (bt === 'company' ? u.company : u.fullName) || '')}"></div>
      <div class="row"><div class="field"><label>เลขประจำตัวผู้เสียภาษี</label><input class="input" name="taxId" inputmode="numeric" maxlength="13" value="${esc(u.taxId || '')}"></div>
        <div class="field co-only" style="max-width:180px"><label>สาขา</label><input class="input" name="branch" value="${esc(u.branch || '')}" placeholder="สำนักงานใหญ่"></div></div>
      <div class="field"><label>ที่อยู่</label><textarea class="input" name="billingAddress" style="min-height:64px">${esc(u.billingAddress || '')}</textarea></div>
      ${isTrue(s.vat) && isTrue(S.settings.PERSON_NO_VAT) ? `<div class="tiny muted person-only">${icS('alert', 12)} บุคคลธรรมดาไม่คิดภาษีมูลค่าเพิ่ม และไม่หักภาษี ณ ที่จ่าย</div>` : ''}
      ${isTrue(s.whtAllowed) ? `<label class="check co-only"><input type="checkbox" name="wht"> บริษัทหักภาษี ณ ที่จ่าย ${esc(S.settings.WHT_RATE || 3)}% (แนบหนังสือรับรอง 50 ทวิ ภายหลังได้)</label><div class="wht-payee hidden">${payeeBox()}</div>` : ''}
      <label class="check" style="margin-top:8px"><input type="checkbox" name="saveBilling" checked> จำข้อมูลนี้ไว้ใช้ครั้งถัดไป</label>
    </fieldset>
    <div class="pay-info">${ic('building')}<div><b>ชำระโดยโอนเข้าบัญชี</b><div class="small">${esc(S.settings.PAY_INFO || '-')}</div></div></div>
    <div class="field"><label>แนบหลักฐานการโอน (สลิป)</label><input class="input" type="file" id="slip" accept="image/*,application/pdf"><span class="hint">แนบภายหลังได้ที่เมนู “การอบรมของฉัน”</span></div>
  </div>`;
}
const quoteLink = () => `<div class="quote-link">${ic('file')}<div class="small" style="flex:1">ต้องการใบเสนอราคาก่อนชำระเงิน?</div><button type="button" class="btn btn-ghost btn-sm" data-quote>${ic('mail')} ขอใบเสนอราคา / ติดต่อเจ้าหน้าที่</button></div>`;
function quoteForm(sess) {
  const u = S.user || {}, isHQ = !u.branch || /ใหญ่|^0+$/.test(u.branch);
  const m = modal('ขอใบเสนอราคา / ติดต่อเจ้าหน้าที่', `<form id="qf">
    <div class="small muted" style="margin:-4px 0 14px">กรอกรายละเอียดสำหรับออกใบเสนอราคาและใบกำกับภาษี เจ้าหน้าที่จะติดต่อกลับทางอีเมลหรือโทรศัพท์${sess ? `<br>หลักสูตร: <b style="color:var(--ink)">${esc(sess.courseTitle || '')}</b> · ${thDateRange(sess.date, sess.endDate)}` : ''}</div>
    <div class="field"><label>ชื่อบริษัท (ตามใบทะเบียนภาษี) *</label><input class="input" name="companyName" value="${esc(u.billingType === 'company' && u.billingName || u.company || '')}"></div>
    <div class="field"><label>สาขา *</label><div class="opt-row"><label class="check"><input type="radio" name="bt" value="hq" ${isHQ ? 'checked' : ''}> สำนักงานใหญ่</label><label class="check"><input type="radio" name="bt" value="br" ${isHQ ? '' : 'checked'}> สาขาที่</label><input class="input" name="branchNo" placeholder="เช่น 00001" style="max-width:140px" value="${esc(isHQ ? '' : u.branch || '')}"></div></div>
    <div class="field"><label>ที่อยู่ *</label><textarea class="input" name="address" style="min-height:70px" placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด">${esc(u.billingAddress || '')}</textarea></div>
    <div class="row"><div class="field" style="max-width:180px"><label>รหัสไปรษณีย์ *</label><input class="input" name="postcode" inputmode="numeric" maxlength="5"></div>
      <div class="field"><label>เลขประจำตัวผู้เสียภาษี (13 หลัก) *</label><input class="input" name="taxId" inputmode="numeric" maxlength="17" value="${esc(u.taxId || '')}"></div></div>
    <div class="divider-gold"></div>
    <div class="field"><label>ชื่อผู้ติดต่อ *</label><input class="input" name="contactName" value="${esc(u.fullName || '')}"></div>
    <div class="row"><div class="field"><label>เบอร์โทร *</label><input class="input" name="phone" inputmode="tel" value="${esc(u.phone || '')}"></div><div class="field"><label>อีเมล *</label><input class="input" type="email" name="email" value="${esc(u.email || '')}"></div></div>
    <div class="field"><label>รายละเอียดเพิ่มเติม</label><textarea class="input" name="note" style="min-height:60px" placeholder="เช่น จำนวนผู้เข้าอบรม ต้องการใบเสนอราคาภายในวันที่..."></textarea></div></form>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="qok">${ic('mail')} ส่งถึงเจ้าหน้าที่</button>`, { wide: true });
  const pc = $('[name=postcode]', m.el); if (!pc.value) { const z = String(u.billingAddress || '').match(/\b(\d{5})\b(?!.*\d{5})/); if (z) pc.value = z[1]; }
  $('[name=branchNo]', m.el).addEventListener('focus', () => { $('[name=bt][value=br]', m.el).checked = true; });
  $('#qok', m.el).onclick = async () => {
    const v = formData($('#qf', m.el));
    const branch = v.bt === 'br' ? (v.branchNo ? 'สาขาที่ ' + v.branchNo : '') : 'สำนักงานใหญ่';
    if (v.bt === 'br' && !v.branchNo) return toast('กรุณาระบุเลขที่สาขา', true);
    try { await run('requestQuote', { sessionId: sess && sess.id || '', quote: { companyName: v.companyName, branch, address: v.address, postcode: v.postcode, taxId: v.taxId, contactName: v.contactName, phone: v.phone, email: v.email, note: v.note } }); } catch (e) { return; }
    m.close(); modal('ส่งคำขอเรียบร้อย', `<div class="success" style="padding:8px 0;text-align:center"><div class="seal">${ic('check')}</div><p>เจ้าหน้าที่ได้รับคำขอใบเสนอราคาแล้ว และจะติดต่อกลับโดยเร็ว</p></div>`, `<button class="btn btn-primary" data-x>ตกลง</button>`);
  };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-quote]'); if (b) quoteForm(b._sess || S.quoteSess || null); });
function bindPaymentForm(root, s) {
  S.quoteSess = s; root._coupon = null;
  const msg = (t, bad) => { const e = $('#couponMsg', root); e.innerHTML = t; e.style.color = bad ? 'var(--bad)' : 'var(--ok)'; };
  $('#couponBtn', root).onclick = async () => {
    const code = $('#couponIn', root).value.trim();
    if (!code) { root._coupon = null; msg(''); return upd(); }
    $('#couponBtn', root).disabled = true;
    try { root._coupon = await call('checkCoupon', { sessionId: s.id, code }); msg(`${icS('check', 13)} ใช้โค้ด ${esc(root._coupon.code)} แล้ว`); }
    catch (e) { root._coupon = null; msg(esc(e.message), true); }
    $('#couponBtn', root).disabled = false; upd();
  };
  $('#couponIn', root).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#couponBtn', root).click(); } });
  $('#couponIn', root).addEventListener('input', () => { if (root._coupon && $('#couponIn', root).value.trim().toUpperCase() !== root._coupon.code) { root._coupon = null; msg(''); } });
  const upd = () => {
    const v = formData(root);
    $$('.co-only', root).forEach(x => x.classList.toggle('hidden', v.billingType !== 'company'));
    $$('.person-only', root).forEach(x => x.classList.toggle('hidden', v.billingType === 'company'));
    $$('.wht-payee', root).forEach(x => x.classList.toggle('hidden', !(v.billingType === 'company' && v.wht)));
    $('#feeT', root).innerHTML = feeTable(s, calcFees(s, v, v.wht, root._coupon));
  };
  root.addEventListener('input', upd); root.addEventListener('change', upd); upd();
}
async function collectPayment(root) {
  const v = formData(root);
  if (!v.billingName) throw new Error('กรุณากรอกชื่อสำหรับออกใบเสร็จ');
  const billing = { billingType: v.billingType, billingName: v.billingName, taxId: v.taxId, branch: v.billingType === 'company' ? v.branch : '', billingAddress: v.billingAddress };
  if (v.couponIn && (!root._coupon || root._coupon.code !== v.couponIn.trim().toUpperCase())) throw new Error('กรุณากด “ใช้โค้ด” เพื่อตรวจสอบโค้ดส่วนลดก่อน');
  const slip = await readFile(($('#slip', root) || {}).files ? $('#slip', root).files[0] : null, 1600, 0.85);
  return { billing, wht: !!v.wht && v.billingType === 'company', saveBilling: !!v.saveBilling, slip, couponCode: root._coupon ? root._coupon.code : '' };
}

// ====================== BOOK (3 steps) ======================
const listSetting = k => String(S.settings[k] || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
/** แบบฟอร์มสอบถาม (Sale ที่เชิญ + ช่องทางที่รู้จัก) แสดงเป็นกล่องข้อความเมื่อเลือกรอบอบรม */
function surveyModal(sess, prev) {
  prev = prev || {};
  const sales = listSetting('SALES_LIST'), srcs = listSetting('SOURCE_LIST');
  const saleOther = prev.saleName && sales.indexOf(prev.saleName) < 0, srcOther = prev.source && srcs.indexOf(prev.source) < 0;
  const opt = (name, v, checked) => `<label class="check"><input type="radio" name="${name}" value="${esc(v)}" ${checked ? 'checked' : ''}> <span>${esc(v)}</span></label>`;
  return new Promise(res => {
    const m = modal('ข้อมูลประกอบการลงทะเบียน', `<form id="svf">
      <div class="small muted" style="margin:-4px 0 14px">${esc(sess.courseTitle || '')} · ${thDateRange(sess.date, sess.endDate)}</div>
      <div class="q-block"><div class="q-title">1. โปรดระบุชื่อ Sale ที่เชิญท่านเข้าร่วมกิจกรรม <span class="req">*</span></div>
        <div class="opt-list">${sales.map(v => opt('sale', v, prev.saleName === v)).join('')}
          <label class="check other"><input type="radio" name="sale" value="__other" ${saleOther ? 'checked' : ''}> <span>อื่นๆ (ระบุชื่อ)</span><input class="input" id="saleTxt" placeholder="พิมพ์ชื่อ Sale" value="${saleOther ? esc(prev.saleName) : ''}"></label></div></div>
      <div class="q-block"><div class="q-title">2. ท่านรู้จักหรือได้รับข้อมูลข่าวสารกิจกรรมนี้จากช่องทางใด <span class="req">*</span></div>
        <div class="opt-list">${srcs.map(v => opt('src', v, prev.source === v)).join('')}
          <label class="check other"><input type="radio" name="src" value="__other" ${srcOther ? 'checked' : ''}> <span>อื่นๆ:</span><input class="input" id="srcTxt" placeholder="โปรดระบุ" value="${srcOther ? esc(String(prev.source).replace(/^อื่นๆ:\s*/, '')) : ''}"></label></div></div></form>`,
      `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-gold" id="svok">${ic('check')} ยืนยันข้อมูล</button>`);
    let done = false;
    // พิมพ์ในช่อง “อื่นๆ” แล้วเลือกตัวเลือกนั้นให้อัตโนมัติ
    [['saleTxt', 'sale'], ['srcTxt', 'src']].forEach(([id, name]) => { const t = $('#' + id, m.el); t.addEventListener('focus', () => { $(`input[name=${name}][value=__other]`, m.el).checked = true; }); });
    $('#svok', m.el).onclick = () => {
      const v = formData($('#svf', m.el));
      const saleName = v.sale === '__other' ? $('#saleTxt', m.el).value.trim() : v.sale || '';
      const srcTxt = $('#srcTxt', m.el).value.trim();
      const source = v.src === '__other' ? (srcTxt ? 'อื่นๆ: ' + srcTxt : '') : v.src || '';
      if (!saleName) return toast(v.sale === '__other' ? 'กรุณาพิมพ์ชื่อ Sale' : 'กรุณาเลือกชื่อ Sale ที่เชิญท่าน', true);
      if (!source) return toast(v.src === '__other' ? 'กรุณาระบุช่องทางอื่นๆ' : 'กรุณาเลือกช่องทางที่ท่านรู้จักกิจกรรมนี้', true);
      done = true; m.close(); res({ saleName, source });
    };
    m.el.addEventListener('click', e => { if (!done && (e.target.closest('[data-x]') || e.target === m.el)) res(null); });
  });
}
VIEWS.book = async el => {
  const B0 = S.book;
  if (S.params.courseId !== undefined) { S.book = { courseId: S.params.courseId || '', sessionId: S.params.sessionId || '', confirm: !!S.params.sessionId }; S.params = {}; }
  const step = S.book.done ? 4 : S.book.sessionId && S.book.confirm ? 3 : S.book.courseId ? 2 : 1;
  el.innerHTML = `<div class="wrap page"><div class="skeleton" style="height:320px"></div></div>`;
  const d = await call('listSessions', {});
  if (d.me) S.user = Object.assign(S.user, d.me);
  const rules = S.user.rules || {};
  const course = d.courses.find(c => c.id === S.book.courseId);
  const sessions = d.sessions.filter(s => s.courseId === S.book.courseId);
  const sess = d.sessions.find(s => s.id === S.book.sessionId);
  const steps = ['เลือกหลักสูตร', 'เลือกรอบอบรม', 'ยืนยันการลงทะเบียน'];
  const blocked = rules.banned || rules.active >= rules.maxActive;
  let html = `<div class="wrap page"><div class="page-head"><div><div class="eyebrow">Registration</div><h1>ลงทะเบียนอบรม</h1></div></div>
    ${step < 4 ? `<div class="stepper">${steps.map((t, i) => `<div class="step ${i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}"><b>${i + 1 < step ? '✓' : i + 1}</b><span>${t}</span></div>`).join('')}</div>` : ''}
    ${step < 4 ? rulesStrip(rules) : ''}
    ${step < 4 && !rules.banned && rules.active >= rules.maxActive ? `<div class="rules warn">${ic('alert')}<div><b>ท่านจองล่วงหน้าครบ ${rules.maxActive} รอบแล้ว</b><div class="small">ลงทะเบียนเพิ่มได้หลังจากอบรมรอบที่จองไว้เสร็จ</div></div></div>` : ''}`;
  if (step === 1) {
    html += `<div class="grid g3">${d.courses.map(c => courseCard(c, { selectable: true, selected: c.id === S.book.courseId, foot: `<span class="small muted">${d.sessions.filter(s => s.courseId === c.id && s.status === 'open').length} รอบที่เปิดรับ</span><span class="btn btn-primary btn-sm">เลือก ${ic('arrow')}</span>` })).join('')}</div>`;
  } else if (step === 2) {
    html += `<div class="card card-b picked" style="border-left:4px solid ${esc(course && course.color)}">
      <div style="flex:1;min-width:0"><div class="tiny muted">หลักสูตรที่เลือก</div><b style="font-size:16px">${esc(course ? course.title : '')}</b></div>${course ? lineBtn(course.id) : ''}<button class="btn btn-ghost btn-sm" id="chg">${ic('back')} เปลี่ยนหลักสูตร</button></div>
      <div class="split"><aside class="split-side"><div class="card card-b">${calendarHtml('book_' + S.book.courseId, sessions)}</div></aside>
      <section class="split-main" id="bl"></section></div>`;
  } else if (step === 3 && sess) {
    const u = S.user, paid = Number(sess.feeTotal) > 0;
    html += `<form class="confirm-box card" id="cfm"><div class="card-h"><h3>ตรวจสอบข้อมูลก่อนยืนยัน</h3></div><div class="card-b">
      <dl class="kv"><dt>หลักสูตร</dt><dd>${esc(sess.courseTitle)}</dd><dt>รอบอบรม</dt><dd>${thDateRange(sess.date, sess.endDate)}${sess.title ? ' · ' + esc(sess.title) : ''}</dd>
      <dt>เวลา</dt><dd>${esc(sess.startTime)}–${esc(sess.endTime)} น. (${esc(sess.hours || '-')} ชม. · รับ ${Math.round(Number(sess.hours || 0) * Number(S.settings.POINTS_PER_HOUR || 1))} แต้ม)</dd><dt>สถานที่</dt><dd>${esc(sess.location || '-')}${sess.mapUrl ? ` · <a href="${esc(sess.mapUrl)}" target="_blank" rel="noopener">แผนที่</a>` : ''}</dd></dl>
      <div class="divider-gold"></div>
      <dl class="kv"><dt>ผู้เข้าอบรม</dt><dd>${esc(u.fullName)}</dd><dt>อีเมล</dt><dd>${esc(u.email)}</dd><dt>เบอร์โทร</dt><dd>${esc(u.phone || '-')}</dd><dt>บริษัท</dt><dd>${esc(u.company || '-')}</dd></dl>
      <div class="small muted" style="margin-top:14px">ชื่อบนใบประกาศ: <b style="color:var(--ink)">${esc(u.fullName)}</b> · <a style="cursor:pointer" data-go="profile">แก้ไขข้อมูลส่วนตัว</a></div>
      <div class="divider-gold"></div>
      <div id="svSum">${S.book.survey ? `<dl class="kv"><dt>Sale ที่เชิญ</dt><dd>${esc(S.book.survey.saleName)}</dd><dt>รู้จักกิจกรรมจาก</dt><dd>${esc(S.book.survey.source)}</dd></dl>` : `<div class="small muted">ยังไม่ได้กรอกข้อมูลประกอบการลงทะเบียน</div>`}
        <button type="button" class="btn btn-ghost btn-sm" id="svEdit" style="margin-top:6px">${ic('edit')} ${S.book.survey ? 'แก้ไขข้อมูล Sale / ช่องทาง' : 'กรอกข้อมูล'}</button></div>
      ${paid ? `<div class="divider-gold"></div>${paymentForm(sess, u)}` : ''}
      <div class="warn-box">${ic('alert')}<div class="small"><b>เงื่อนไขการลงทะเบียน</b><br>• จองล่วงหน้าได้สูงสุด ${rules.maxActive} รอบ<br>• เลื่อนหรือยกเลิกได้ถึง ${rules.changeDays} วันก่อนวันอบรม<br>• เลื่อน/ยกเลิก/ไม่มา เกิน ${rules.strikeLimit} ครั้ง ระบบจะยกเลิกการจองทั้งหมด และงดลงทะเบียน 1 เดือน (ลงได้อีกครั้งในเดือนที่ 3)<br>• วันอบรมกรุณาสแกน QR Code ที่หน้างานเพื่อเช็คอิน และรับเอกสารประกอบการบรรยาย</div></div>
      <label class="check" style="margin-top:12px"><input type="checkbox" id="agree"> ข้าพเจ้ารับทราบและยอมรับเงื่อนไข</label>
      </div><div class="modal-f"><button type="button" class="btn btn-ghost" id="bk">${ic('back')} ย้อนกลับ</button><button type="button" class="btn btn-gold btn-lg" id="cf" ${blocked ? 'disabled' : ''}>${ic('check')} ยืนยันการลงทะเบียน</button></div></form>`;
  } else if (step === 4) {
    const s = B0.doneSession, r = B0.doneReg || {};
    html += `<div class="card success confirm-box"><div class="seal">${ic('check')}</div><h2>ลงทะเบียนเรียบร้อยแล้ว</h2>
      <p class="muted">${esc(s.courseTitle)}<br>${thDateRange(s.date, s.endDate)} · ${esc(s.startTime)}–${esc(s.endTime)} น. · ${esc(s.location || '')}</p>
      ${Number(r.total) > 0 ? `<p>${payChip(r.payStatus)} ยอดชำระ <b>${money(r.total)} บาท</b></p>` : ''}
      <p class="small muted">ระบบส่งอีเมลยืนยันไปที่ ${esc(S.user.email)} แล้ว และจะแจ้งเตือนอีกครั้ง 5 วันก่อนวันอบรม</p>
      <div class="row" style="justify-content:center;margin-top:18px"><button class="btn btn-gold" id="ac">${ic('calplus')} บันทึกลงปฏิทิน</button>${lineBtn(s.courseId, 'ชวนเพื่อนทาง LINE', '')}</div>
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn btn-primary" data-go="my">ไปที่การอบรมของฉัน</button><button class="btn btn-ghost" id="again">ลงทะเบียนหลักสูตรอื่น</button></div></div>`;
  }
  el.innerHTML = html + '</div>';
  $$('[data-pick-course]', el).forEach(c => c.onclick = () => { S.book = { courseId: c.dataset.pickCourse }; VIEWS.book(el); });
  if (step === 2) {
    const key = 'book_' + S.book.courseId;
    const drawList = () => {
      const list = sessions.filter(s => inCalView(key, s));
      $('#bl', el).innerHTML = `<div class="list-label">${calViewLabel(key)} · ${list.length} รอบ</div>` + (sessions.length ? (list.length ? `<div class="card">${list.map(s => sessionRow(s, s.myStatus ? `<span class="chip ok">ลงทะเบียนแล้ว</span>` : s.status !== 'open' ? sessionChip(s.status) : s.seatsLeft === 0 ? `<span class="chip bad">เต็มแล้ว</span>` : `<button class="btn btn-primary btn-sm" data-pick-session="${s.id}" ${blocked ? 'disabled' : ''}>เลือกรอบนี้</button>`)).join('')}</div>`
        : `<div class="card empty">${ic('cal')}<div>ไม่มีรอบในช่วงที่เลือก</div><div class="small">วันที่มีจุดสีในปฏิทิน คือวันที่มีรอบอบรม</div></div>`)
        : `<div class="card empty">${ic('cal')}<div>ยังไม่มีรอบอบรมที่เปิดรับสำหรับหลักสูตรนี้</div><div class="small">กรุณาติดตามประกาศรอบถัดไป</div></div>`);
      $$('[data-pick-session]', el).forEach(b => b.onclick = () => { S.book.sessionId = b.dataset.pickSession; S.book.confirm = true; VIEWS.book(el); window.scrollTo(0, 0); });
    };
    const redraw = () => { $('.split-side .card', el).innerHTML = calendarHtml(key, sessions); bindCalendar(el, key, redraw); drawList(); };
    bindCalendar(el, key, redraw); drawList();
  }
  $('#chg') && ($('#chg').onclick = () => { S.book = {}; VIEWS.book(el); });
  $('#bk') && ($('#bk').onclick = () => { S.book.sessionId = ''; S.book.confirm = false; S.book.survey = null; VIEWS.book(el); });
  $('#again') && ($('#again').onclick = () => { S.book = {}; VIEWS.book(el); });
  $('#ac') && ($('#ac').onclick = () => addToCalendar(B0.doneSession));
  if (step === 3 && sess && Number(sess.feeTotal) > 0) bindPaymentForm($('.pay-box', el), sess);
  const askSurvey = async () => {
    const r = await surveyModal(sess, S.book.survey); if (!r) return false;
    S.book.survey = r;
    $('#svSum', el).firstElementChild.outerHTML = `<dl class="kv"><dt>Sale ที่เชิญ</dt><dd>${esc(r.saleName)}</dd><dt>รู้จักกิจกรรมจาก</dt><dd>${esc(r.source)}</dd></dl>`;
    $('#svEdit', el).innerHTML = `${ic('edit')} แก้ไขข้อมูล Sale / ช่องทาง`;
    return true;
  };
  if (step === 3 && sess) {
    $('#svEdit', el).onclick = askSurvey;
    if (!S.book.survey && !blocked) setTimeout(askSurvey, 150);
  }
  $('#cf') && ($('#cf').onclick = async () => {
    if (!S.book.survey && !await askSurvey()) return;
    if (!$('#agree').checked) return toast('กรุณายอมรับเงื่อนไขการลงทะเบียน', true);
    let pay = {};
    if (Number(sess.feeTotal) > 0) { try { pay = await collectPayment($('.pay-box', el)); } catch (e) { return toast(e.message, true); } }
    const r = await run('registerSession', Object.assign({ sessionId: sess.id }, S.book.survey, pay));
    S.book = { done: true, doneSession: sess, doneReg: r }; await refreshMe(); VIEWS.book(el); S.book = {};
  });
};

// ====================== MY TRAININGS ======================
const matIcon = t => ({ slide: 'slides', document: 'file', photo: 'image', link: 'link', video: 'video', promo: 'sparkle' }[t] || 'file');
function fileRow(m) {
  if (m.locked) return `<div class="file locked"><div class="ic">${ic('lock')}</div><div class="t">${esc(m.title)}<div class="tiny muted">${esc(m.locked)}</div></div></div>`;
  const dl = m.downloadUrl;
  return `<div class="file"><div class="ic">${ic(matIcon(m.type))}</div><div class="t">${esc(m.title)}</div>
    <a class="btn btn-ghost btn-sm" href="${esc(dl || m.url)}" target="_blank" rel="noopener">${ic(dl ? 'dl' : m.type === 'video' ? 'video' : 'link')} <span class="hide-sm">${dl ? 'ดาวน์โหลด' : m.type === 'video' ? 'ดูวิดีโอ' : 'เปิด'}</span></a></div>`;
}
function trainingCard(t, open) {
  const s = Object.assign({}, t.session, { courseColor: t.course.color, courseTitle: t.course.title, courseCode: t.course.code }), c = t.course, r = t.reg;
  const now = new Date(), start = sessDT(s), end = sessDT(s, true);
  const upcoming = r.status === 'registered' && end >= now;
  const today = s.date <= todayStr() && (s.endDate || s.date) >= todayStr();
  const files = t.materials.filter(m => m.type !== 'photo'), photos = t.materials.filter(m => m.type === 'photo');
  const openPhotos = photos.filter(p => !p.locked);
  const needPay = ['unpaid', 'rejected', 'review'].includes(r.payStatus);
  const steps = [['ลงทะเบียน', true], ['เช็คอิน', !!r.checkedInAt || r.status === 'attended'], ['ประเมิน', !!r.evaluatedAt], ['ใบประกาศ', t.hasCert && !t.certLocked]];
  return `<div class="card training" style="--c:${esc(c.color)}">
    <div class="training-head">${dateBox(s)}
      <div class="th-info"><div class="row" style="gap:6px;margin-bottom:4px">${statusChip(r.status)}${payChip(r.payStatus)}${upcoming ? '<span class="chip gold">กำลังจะมาถึง</span>' : ''}${r.rescheduledFrom ? '<span class="chip">เลื่อนรอบแล้ว</span>' : ''}</div>
        <h3>${esc(c.title)}</h3><div class="meta"><span>${ic('clock')}${thDateRange(s.date, s.endDate)} · ${esc(s.startTime)}–${esc(s.endTime)} น.</span><span>${ic('pin')}${esc(s.location || '-')}${s.mapUrl ? ` · <a href="${esc(s.mapUrl)}" target="_blank" rel="noopener">แผนที่</a>` : ''}</span></div>
        ${t.hasCert ? `<div class="small" style="margin-top:4px">${t.certExpired ? `<span class="chip bad">ใบประกาศหมดอายุ ${thDate(t.certExpires)}</span>` : `<span class="muted">ใบประกาศเลขที่ <span class="cert-no">${esc(r.certNo)}</span> · ใช้ได้ถึง <b>${thDate(t.certExpires, true)}</b></span>`}</div>` : ''}
      </div>
      <div class="mini-tl">${steps.map(x => `<span class="${x[1] ? 'done' : ''}"><i>${x[1] ? ic('check') : ''}</i>${x[0]}</span>`).join('')}</div>
    </div>
    <div class="training-act">
      ${today && !r.checkedInAt && r.status === 'registered' ? `<button class="btn btn-gold btn-sm" data-go="checkin">${ic('qr')} เช็คอินเข้าอบรม</button>` : ''}
      ${upcoming && (s.mapUrl || s.location) ? `<a class="icon-btn map-btn" href="${esc(s.mapUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.location))}" target="_blank" rel="noopener" title="แผนที่การเดินทาง" aria-label="แผนที่การเดินทาง">${ic('map')}</a>` : ''}
      ${t.needEval ? `<button class="btn btn-gold btn-sm" data-eval="${r.id}">${ic('star')} ประเมินวิทยากร (เช็คเอาท์)${t.hasCert ? ' · รับใบประกาศ' : ''}</button>` : ''}
      ${t.hasCert && !t.certExpired && !t.certLocked ? `<button class="btn btn-gold btn-sm" data-cert="${r.id}">${ic('award')} ใบประกาศ</button>` : ''}
      ${needPay ? `<button class="btn ${r.payStatus === 'review' ? 'btn-ghost' : 'btn-primary'} btn-sm" data-pay="${r.id}">${ic('receipt')} ${r.payStatus === 'review' ? 'ดูการชำระเงิน' : 'แนบหลักฐานชำระ ' + money(r.total) + ' บ.'}</button>` : ''}
      ${r.receiptUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(r.receiptUrl)}" target="_blank" rel="noopener">${ic('receipt')} ใบเสร็จ</a>` : ''}
      ${files.length || photos.length ? `<button class="btn btn-ghost btn-sm" data-toggle="${r.id}">${ic('folder')} เอกสาร ${files.length}${photos.length ? ` · รูป ${openPhotos.length}/${photos.length}` : ''}</button>` : ''}
      ${upcoming ? `<button class="btn btn-ghost btn-sm" data-addcal="${s.id}">${ic('calplus')} <span class="hide-sm">บันทึกลงปฏิทิน</span></button>` : ''}
      ${lineBtn(c.id, '')}
      <span class="act-gap"></span>
      ${t.canChange ? `<button class="btn btn-ghost btn-sm" data-resched="${r.id}">${ic('swap')} เลื่อนรอบ</button><button class="btn btn-ghost btn-sm btn-danger" data-cancel="${r.id}">ยกเลิก</button>`
        : upcoming ? `<span class="tiny muted">เลยกำหนดเลื่อน/ยกเลิกแล้ว กรุณาติดต่อเจ้าหน้าที่</span>` : ''}
    </div>
    ${files.length || photos.length ? `<div class="training-body ${open ? '' : 'hidden'}" data-body="${r.id}">
      ${files.length ? `<div><div class="small muted" style="margin-bottom:8px">เอกสารประกอบการบรรยาย / โปรโมชั่น / วิดีโอ</div><div class="files">${files.map(fileRow).join('')}</div></div>` : ''}
      ${photos.length ? `<div><div class="small muted" style="margin-bottom:8px">ภาพบรรยากาศวันอบรม ${openPhotos.length ? `(${openPhotos.length}) · กดที่รูปเพื่อเปิดและดาวน์โหลด` : ''}</div>
        ${openPhotos.length ? `<div class="gallery">${openPhotos.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener"><img src="${esc(m.url)}" loading="lazy" alt=""></a>`).join('')}</div>` : `<div class="file locked"><div class="ic">${ic('lock')}</div><div class="t">${photos.length} รูป<div class="tiny muted">${esc(photos[0].locked)}</div></div></div>`}</div>` : ''}
    </div>` : ''}
  </div>`;
}
VIEWS.my = async el => {
  el.innerHTML = `<div class="wrap page"><div class="skeleton" style="height:320px"></div></div>`;
  const [d] = await Promise.all([call('myTrainings', {}), getBanners()]);
  const list = d.list, key = 'my', now = new Date();
  S.user.rules = d.rules;
  const ev = list.map(t => Object.assign({}, t.session, { color: t.course.color }));
  const openSet = S.myOpen || (S.myOpen = {});
  const draw = () => {
    const sel = S.cal[key].sel;
    const shown = sel ? list.filter(t => inCalView(key, t.session)) : list;
    const up = shown.filter(t => sessDT(t.session, true) >= now).sort((a, b) => a.session.date < b.session.date ? -1 : 1);
    const past = shown.filter(t => sessDT(t.session, true) < now);
    el.innerHTML = `${bannerBlock('my')}<div class="wrap page">
      <div class="page-head"><div><div class="eyebrow">My Training</div><h1>การอบรมของฉัน</h1><div class="muted">ติดตามสถานะ เลื่อน/ยกเลิก ชำระค่าอบรม ดาวน์โหลดเอกสารและภาพบรรยากาศ</div></div>
        <div class="row"><button class="btn btn-ghost" data-go="checkin">${ic('qr')} เช็คอิน</button><button class="btn btn-gold" data-go="book">${ic('plus')} ลงทะเบียนเพิ่ม</button></div></div>
      ${rulesStrip(d.rules)}
      ${list.length ? `<div class="split">
        <aside class="split-side"><div class="card card-b">${calendarHtml(key, ev)}</div>
          <div class="card card-b tiny muted" style="margin-top:12px">${icS('alert', 13)} เลื่อนรอบได้เฉพาะในหลักสูตรเดิม และต้องทำก่อนวันอบรม ${d.rules.changeDays} วัน · การเลื่อน/ยกเลิก/ไม่มา นับเป็น 1 ครั้ง</div></aside>
        <section class="split-main">
          ${sel ? `<div class="list-label">${calViewLabel(key)} · ${shown.length} รายการ</div>` : ''}
          ${up.length ? `<div class="list-label">กำลังจะมาถึง (${up.length})</div><div class="grid" style="gap:14px">${up.map(t => trainingCard(t, openSet[t.reg.id])).join('')}</div>` : ''}
          ${past.length ? `<div class="list-label">ผ่านมาแล้ว (${past.length})</div><div class="grid" style="gap:14px">${past.map(t => trainingCard(t, openSet[t.reg.id])).join('')}</div>` : ''}
          ${!shown.length ? `<div class="card empty">${ic('cal')}<div>ไม่มีการอบรมใน${calViewLabel(key)}</div></div>` : ''}
        </section></div>`
        : `<div class="card empty">${ic('book')}<div style="margin-bottom:14px">ท่านยังไม่มีการลงทะเบียนอบรม</div><button class="btn btn-primary" data-go="book">ลงทะเบียนอบรม</button></div>`}
    </div>`;
    if (list.length) bindCalendar(el, key, draw);
    bindBanners(el, draw);
    bindCommon(el, list.map(t => Object.assign({}, t.session, { courseTitle: t.course.title, courseId: t.course.id })));
    $$('[data-cert]', el).forEach(b => b.onclick = () => openCert(b.dataset.cert));
    $$('[data-toggle]', el).forEach(b => b.onclick = () => { const id = b.dataset.toggle; openSet[id] = !openSet[id]; $(`[data-body="${id}"]`, el).classList.toggle('hidden', !openSet[id]); });
    const find = id => list.find(t => t.reg.id === id);
    $$('[data-cancel]', el).forEach(b => b.onclick = () => cancelFlow(find(b.dataset.cancel), d.rules, () => VIEWS.my(el)));
    $$('[data-resched]', el).forEach(b => b.onclick = () => rescheduleFlow(find(b.dataset.resched), d.rules, () => VIEWS.my(el)));
    $$('[data-pay]', el).forEach(b => b.onclick = () => payFlow(find(b.dataset.pay), d.payInfo, () => VIEWS.my(el)));
    $$('[data-eval]', el).forEach(b => b.onclick = () => evalFlow(find(b.dataset.eval), d, () => VIEWS.my(el)));
  };
  calState(key, ev);
  draw();
};
/** แบบประเมินความพึงพอใจต่อวิทยากร (เช็คเอาท์) → ส่งแล้วได้ใบประกาศ */
function evalFlow(t, d, done) {
  const qs = d.evalQuestions || [], scale = d.evalScale || ['1', '2', '3', '4'], s = t.session;
  const m = modal('แบบประเมินความพึงพอใจต่อวิทยากร', `<form id="evf">
    <div class="small muted" style="margin:-4px 0 6px">สำหรับการอบรมแต่ละหลักสูตรของ ${esc(S.settings.ORG_NAME || '')}</div>
    <div class="sd-mini" style="margin-bottom:12px"><b>${esc(t.course.title)}</b><div class="small muted">${thDateRange(s.date, s.endDate)}${s.speakerName ? ` · วิทยากร <b style="color:var(--ink)">${esc(s.speakerName)}</b>` : ''}</div></div>
    <div class="small" style="margin-bottom:10px"><b>คำชี้แจง:</b> กรุณาประเมินวิทยากรตามความคิดเห็นของท่าน โดยเลือกคะแนนที่ตรงกับความพึงพอใจมากที่สุด (4 ระดับ)</div>
    <div class="eval-scale"><span></span>${scale.map((x, i) => `<span>${i + 1}<br><small>${esc(x)}</small></span>`).join('')}</div>
    ${qs.map((q, i) => `<div class="eval-q"><div class="eq-t">${i + 1}. ${esc(q)}</div><div class="eq-opts">${scale.map((x, j) => `<label title="${esc(x)}"><input type="radio" name="q${i}" value="${j + 1}"><span>${j + 1}</span></label>`).join('')}</div></div>`).join('')}
    <div class="field" style="margin-top:12px"><label>ข้อเสนอแนะเพิ่มเติม</label><textarea class="input" name="comment" style="min-height:64px"></textarea></div></form>`,
    `<button class="btn btn-ghost" data-x>ภายหลัง</button><button class="btn btn-gold" id="evok">${ic('check')} ส่งแบบประเมิน</button>`, { wide: true });
  $('#evok', m.el).onclick = async () => {
    const v = formData($('#evf', m.el)), answers = qs.map((q, i) => Number(v['q' + i] || 0));
    const miss = answers.findIndex(x => !x); if (miss >= 0) return toast('กรุณาให้คะแนนข้อ ' + (miss + 1), true);
    let r; try { r = await run('submitEvaluation', { regId: t.reg.id, answers, comment: v.comment }); } catch (e) { return; }
    m.close();
    const ok = modal('ขอบคุณสำหรับการประเมิน', `<div class="success" style="padding:8px 0;text-align:center"><div class="seal">${ic('check')}</div><p>${r.certNo ? `ใบประกาศนียบัตรเลขที่ <b>${esc(r.certNo)}</b> พร้อมแล้ว` : 'บันทึกแบบประเมินเรียบร้อย ใบประกาศจะพร้อมเมื่อผู้จัดยืนยันการเข้าร่วม'}</p></div>`,
      `${r.certNo ? `<button class="btn btn-gold" id="seeC">${ic('award')} ดูใบประกาศ</button>` : ''}<button class="btn btn-ghost" data-x>ปิด</button>`);
    if (r.certNo) $('#seeC', ok.el).onclick = () => { ok.close(); openCert(t.reg.id); };
    done && done();
  };
}
function strikeWarn(rules, what) {
  const next = rules.strikes + 1, over = next > rules.strikeLimit;
  return `<div class="warn-box ${over ? 'bad' : ''}">${ic('alert')}<div class="small">การ${what}จะนับเป็น <b>ครั้งที่ ${next}</b> (อนุญาต ${rules.strikeLimit} ครั้ง)
    ${over ? `<br><b>ครั้งนี้เกินกำหนด ระบบจะยกเลิกการลงทะเบียนทั้งหมดของท่าน และงดลงทะเบียน 1 เดือน (ลงได้อีกครั้งในเดือนที่ 3)</b>` : ''}</div></div>`;
}
function cancelFlow(t, rules, done) {
  const s = t.session;
  const reasons = ['ติดภารกิจ / งานด่วน', 'เจ็บป่วย', 'เดินทางไม่สะดวก', 'เปลี่ยนแผนการอบรม', 'อื่น ๆ'];
  const m = modal('ยืนยันการยกเลิกการอบรม', `<p style="margin-top:0">ท่านต้องยืนยันการยกเลิกการอบรม <b>${esc(t.course.title)}</b><br><span class="muted small">${thDateRange(s.date, s.endDate)} · ${esc(s.startTime)}–${esc(s.endTime)} น. · ${esc(s.location || '')}</span></p>
    ${strikeWarn(rules, 'ยกเลิก')}
    <div class="field" style="margin-top:14px"><label>เหตุผลการยกเลิก *</label><select class="input" id="rs"><option value="">— เลือกเหตุผล —</option>${reasons.map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field"><label>รายละเอียดเพิ่มเติม</label><textarea class="input" id="rt" placeholder="กรุณาระบุเหตุผล"></textarea></div>`,
    `<button class="btn btn-ghost" data-x>ไม่ยกเลิก</button><button class="btn btn-danger" id="ok">ยืนยันการยกเลิก</button>`);
  $('#ok', m.el).onclick = async () => {
    const reason = [$('#rs', m.el).value, $('#rt', m.el).value.trim()].filter(Boolean).join(' · ');
    if (!$('#rs', m.el).value || ($('#rs', m.el).value === 'อื่น ๆ' && !$('#rt', m.el).value.trim())) return toast('กรุณาใส่เหตุผลการยกเลิก', true);
    const r = await run('cancelRegistration', { regId: t.reg.id, reason });
    m.close(); await refreshMe();
    if (r.penalty) modal('ระงับสิทธิ์การลงทะเบียน', `<div class="rules bad" style="margin:0">${ic('alert')}<div>ระบบได้ยกเลิกการลงทะเบียนทั้งหมด และงดลงทะเบียนจนถึงวันที่ <b>${thDate(r.penalty.bannedUntil, true)}</b></div></div>`);
    else toast('ยกเลิกการลงทะเบียนเรียบร้อย');
    done();
  };
}
async function rescheduleFlow(t, rules, done) {
  const d = await run('listSessions', {});
  const opts = d.sessions.filter(s => s.courseId === t.course.id && s.id !== t.session.id && s.status === 'open' && !s.myStatus && s.seatsLeft !== 0);
  const m = modal('เลื่อนรอบอบรม', `<p style="margin-top:0">${esc(t.course.title)}<br><span class="muted small">รอบเดิม: ${thDateRange(t.session.date, t.session.endDate)} · ${esc(t.session.startTime)} น.</span></p>
    ${strikeWarn(rules, 'เลื่อนรอบ')}
    <div class="list-label" style="margin-top:14px">เลือกรอบใหม่</div>
    ${opts.length ? `<div class="opt-list">${opts.map(s => `<label class="opt-card"><input type="radio" name="to" value="${s.id}"><span>${dateBox(s)}<span><b>${thDateRange(s.date, s.endDate)}</b><span class="tiny muted">${esc(s.startTime)}–${esc(s.endTime)} น. · ${esc(s.location || '')} · ว่าง ${s.seatsLeft == null ? 'ไม่จำกัด' : s.seatsLeft}</span></span></span></label>`).join('')}</div>
      <div class="field" style="margin-top:12px"><label>เหตุผล (ถ้ามี)</label><input class="input" id="rr"></div>`
      : `<div class="empty">ยังไม่มีรอบอื่นที่เปิดรับในหลักสูตรนี้</div>`}`,
    `<button class="btn btn-ghost" data-x>ปิด</button>${opts.length ? `<button class="btn btn-primary" id="ok">${ic('swap')} ยืนยันเลื่อนรอบ</button>` : ''}`);
  const ok = $('#ok', m.el); if (!ok) return;
  ok.onclick = async () => {
    const to = ($('input[name=to]:checked', m.el) || {}).value; if (!to) return toast('กรุณาเลือกรอบใหม่', true);
    const r = await run('rescheduleRegistration', { regId: t.reg.id, toSessionId: to, reason: $('#rr', m.el).value });
    m.close(); await refreshMe();
    if (r.penalty) modal('ระงับสิทธิ์การลงทะเบียน', `<div class="rules bad" style="margin:0">${ic('alert')}<div>ระบบได้ยกเลิกการลงทะเบียนทั้งหมด และงดลงทะเบียนจนถึงวันที่ <b>${thDate(r.penalty.bannedUntil, true)}</b></div></div>`);
    else toast('เลื่อนรอบเรียบร้อย ระบบส่งอีเมลยืนยันแล้ว');
    done();
  };
}
function payFlow(t, payInfo, done) {
  const r = t.reg;
  const m = modal('การชำระค่าอบรม', `<div class="row" style="justify-content:space-between"><div><b>${esc(t.course.title)}</b><div class="tiny muted">${thDateRange(t.session.date, t.session.endDate)}</div></div>${payChip(r.payStatus)}</div>
    <table class="fee-tbl" style="margin-top:12px"><tbody><tr><td>ยอดก่อนภาษี</td><td>${money(r.subtotal)}</td></tr>${Number(r.vatAmount) ? `<tr><td>VAT</td><td>${money(r.vatAmount)}</td></tr>` : ''}${Number(r.whtAmount) ? `<tr><td>หัก ณ ที่จ่าย</td><td>−${money(r.whtAmount)}</td></tr>` : ''}<tr class="tot"><td>ยอดชำระ</td><td>${money(r.total)} บาท</td></tr></tbody></table>
    <div class="pay-info">${ic('building')}<div><b>โอนเข้าบัญชี</b><div class="small">${esc(payInfo || '-')}</div></div></div>
    ${Number(r.whtAmount) ? payeeBox() : ''}
    ${r.billing && r.billing.billingName ? `<div class="small muted">ออกใบเสร็จในนาม: <b style="color:var(--ink)">${esc(r.billing.billingName)}</b>${r.billing.taxId ? ' · ' + esc(r.billing.taxId) : ''}</div>` : ''}
    ${r.slipUrl ? `<div class="small" style="margin-top:10px">${icS('check')} แนบสลิปแล้ว · <a href="${esc(r.slipUrl)}" target="_blank" rel="noopener">ดูไฟล์</a></div>` : ''}
    ${r.whtCertUrl ? `<div class="small">${icS('check')} แนบหนังสือรับรอง 50 ทวิ แล้ว · <a href="${esc(r.whtCertUrl)}" target="_blank" rel="noopener">ดูไฟล์</a></div>` : ''}
    ${r.payStatus === 'rejected' ? `<div class="warn-box bad">${ic('alert')}<div class="small">หลักฐานการชำระไม่ผ่านการตรวจสอบ กรุณาแนบใหม่</div></div>` : ''}
    ${r.payStatus !== 'paid' ? `<div class="field" style="margin-top:14px"><label>${r.slipUrl ? 'แนบสลิปใหม่' : 'แนบหลักฐานการโอน (สลิป)'}</label><input class="input" type="file" id="ps" accept="image/*,application/pdf"></div>` : ''}
    ${Number(r.whtAmount) ? `<div class="field"><label>หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</label><input class="input" type="file" id="pw" accept="image/*,application/pdf"></div>` : ''}`,
    `<button type="button" class="btn btn-ghost btn-sm" data-quote style="margin-right:auto">${ic('mail')} ขอใบเสนอราคา</button><button class="btn btn-ghost" data-x>ปิด</button><button class="btn btn-primary" id="ok">${ic('check')} ส่งหลักฐาน</button>`);
  S.quoteSess = Object.assign({}, t.session, { courseTitle: t.course.title });
  $('#ok', m.el).onclick = async () => {
    const slip = await readFile(($('#ps', m.el) || { files: [] }).files[0], 1600, 0.85);
    const whtCert = await readFile(($('#pw', m.el) || { files: [] }).files[0], 1600, 0.85);
    if (!slip && !whtCert) return toast('กรุณาเลือกไฟล์', true);
    await run('uploadPayment', { regId: r.id, slip, whtCert }, { ok: 'ส่งหลักฐานเรียบร้อย รอเจ้าหน้าที่ตรวจสอบ' });
    m.close(); done();
  };
}

// ====================== CHECK-IN (QR at venue) ======================
VIEWS.checkin = async el => {
  const code = S.params.code || '';
  el.innerHTML = `<div class="wrap page"><div class="confirm-box">
    <div class="page-head" style="justify-content:center;text-align:center"><div><div class="eyebrow" style="justify-content:center">Check-in</div><h1>เช็คอินเข้าอบรม</h1><div class="muted">สแกน QR Code ที่หน้างานด้วยกล้องมือถือ หรือกรอกรหัส 6 หลักที่เจ้าหน้าที่แจ้ง</div></div></div>
    <div class="card card-b" id="ck">
      <form id="cf" class="code-form"><input class="input code-in" name="code" inputmode="numeric" maxlength="6" placeholder="••••••" value="${esc(/^\d{6}$/.test(code) ? code : '')}" autocomplete="one-time-code">
        <button class="btn btn-gold btn-lg btn-block">${ic('check')} เช็คอิน</button></form>
      <div class="tiny muted" style="text-align:center;margin-top:12px">เปิดเช็คอินก่อนเวลาเริ่มอบรม ${esc(S.settings.CHECKIN_OPEN_MINUTES || 120)} นาที · เช็คอินแล้วจะได้รับแต้มและเปิดดาวน์โหลดเอกสารเมื่อเริ่มอบรม</div>
    </div></div></div>`;
  const submit = async c => {
    const r = await run('checkin', { code: c });
    await refreshMe();
    $('#ck').innerHTML = `<div class="success" style="padding:18px 6px"><div class="seal">${ic('check')}</div><h2>${r.already ? 'ท่านเช็คอินแล้ว' : 'เช็คอินสำเร็จ'}</h2>
      <p class="muted">${esc(r.course)}<br>${thDateRange(r.session.date, r.session.endDate)} · ${esc(r.session.startTime)}–${esc(r.session.endTime)} น.<br>${esc(r.session.location || '')}</p>
      <p class="small">เวลาเช็คอิน <b>${thDT(r.checkedInAt)}</b>${S.user.points ? ` · แต้มสะสม <b>${money(S.user.points.balance)}</b>` : ''}</p>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn btn-primary" data-go="my">${ic('folder')} ดาวน์โหลดเอกสารการอบรม</button></div></div>`;
  };
  $('#cf').onsubmit = e => { e.preventDefault(); const v = e.target.code.value.trim(); if (!v) return toast('กรุณากรอกรหัสเช็คอิน', true); submit(v).catch(() => { }); };
  if (code) submit(code).catch(() => { });
};
