
// ====================== ADMIN ======================
const ADMIN_TABS = [
  ['dash', 'ภาพรวม', 'grid'], ['sessions', 'รอบอบรม & ผู้เข้าอบรม', 'cal'], ['courses', 'หลักสูตร & ไฟล์แนบ', 'book'], ['templates', 'เทมเพลตใบประกาศ', 'award'],
  ['banners', 'แบนเนอร์ & สไลด์', 'banner'], ['materials', 'ไฟล์ & รูปภาพงาน', 'folder'], ['users', 'สมาชิก & Export', 'users'], ['rewards', 'แต้ม & ของรางวัล', 'gift'], ['payments', 'การชำระเงิน & 50 ทวิ', 'receipt'], ['quotes', 'คำขอใบเสนอราคา', 'file'], ['emails', 'อีเมลแจ้งเตือน', 'mail'], ['settings', 'ตั้งค่าระบบ', 'gear']
];
async function adminLoad(force) {
  if (!S.admin || force) S.admin = await call('adminData', {});
  return S.admin;
}
VIEWS.admin = async el => {
  const tab = S.params.tab || S.adminTab || 'dash'; S.adminTab = tab;
  el.innerHTML = `<div class="wrap admin"><aside class="side"><div class="lbl">ผู้ดูแลระบบ</div>${ADMIN_TABS.map(t => `<a data-tab="${t[0]}" class="${t[0] === tab ? 'active' : ''}">${ic(t[2])}${t[1]}</a>`).join('')}</aside>
    <section id="ap"><div class="skeleton" style="height:300px"></div></section></div>`;
  $$('[data-tab]', el).forEach(a => a.onclick = () => { S.params = { tab: a.dataset.tab }; VIEWS.admin(el); });
  const ap = $('#ap');
  await adminLoad(true);
  await ADMIN[tab](ap);
};
const ADMIN = {};
const reloadTab = async host => { await adminLoad(true); if (host) ADMIN[S.adminTab](host); };
const courseOpts = (sel, all) => (all ? '<option value="">ทุกหลักสูตร</option>' : '') + S.admin.courses.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.code)} · ${esc(c.title)}</option>`).join('');
const tplOpts = sel => '<option value="">— ใช้ค่าเริ่มต้นของหลักสูตร —</option>' + S.admin.templates.map(t => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
const head = (title, sub, act) => `<div class="page-head" style="margin-bottom:18px"><div><h2>${title}</h2>${sub ? `<div class="muted small">${sub}</div>` : ''}</div><div class="row">${act || ''}</div></div>`;
const checkinUrl = s => appUrl() + '?checkin=' + encodeURIComponent(s.id + '.' + s.checkinCode);

ADMIN.dash = el => {
  const a = Object.assign({}, S.admin, { sessions: S.admin.sessions.filter(s => !isTrue(s.archived)) }), today = todayStr();
  const up = a.sessions.filter(s => s.date >= today && s.status !== 'cancelled').slice(0, 6);
  const todays = a.sessions.filter(s => s.date <= today && (s.endDate || s.date) >= today && s.status !== 'cancelled');
  const pending = a.sessions.filter(s => s.date < today && s.attended > s.certs);
  const payS = a.sessions.filter(s => s.payReview);
  el.innerHTML = head('ภาพรวมระบบ', 'สรุปข้อมูลการอบรมทั้งหมด') + `
    <div class="grid g3 stats6">${[['สมาชิกทั้งหมด', a.stats.users, 'users'], ['การลงทะเบียน', a.stats.registrations, 'book'], ['ใบประกาศที่ออกแล้ว', a.stats.certs, 'award'], ['รอบที่เปิดรับ', a.stats.upcoming, 'cal'], ['สลิปรอตรวจสอบ', a.stats.payReview, 'receipt'], ['ของรางวัลรอส่งมอบ', a.stats.redeemPending, 'gift']]
      .map(x => `<div class="card stat"><div class="ic">${ic(x[2])}</div><div class="n">${x[1] || 0}</div><div class="l">${x[0]}</div></div>`).join('')}</div>
    <div class="grid" style="gap:10px;margin-top:18px">
    ${todays.map(s => `<div class="alert-row info">${ic('qr')}<div style="flex:1;min-width:0"><b>วันนี้: ${esc(s.courseCode)} ${esc(s.courseTitle)}</b><div class="small muted">${esc(s.startTime)}–${esc(s.endTime)} น. · เช็คอินแล้ว ${s.checkedIn}/${s.registered} คน</div></div><button class="btn btn-gold btn-sm" data-qr="${s.id}">${ic('qr')} QR เช็คอิน</button><button class="btn btn-ghost btn-sm" data-roster="${s.id}">${ic('users')} รายชื่อ</button></div>`).join('')}
    ${a.stats.quotesNew ? `<div class="alert-row info">${ic('file')}<div style="flex:1;min-width:0"><b>มีคำขอใบเสนอราคาใหม่ ${a.stats.quotesNew} รายการ</b></div><button class="btn btn-primary btn-sm" data-goq>ดูคำขอ</button></div>` : ''}
    ${payS.length ? `<div class="alert-row warn">${ic('receipt')}<div style="flex:1;min-width:0"><b>มีสลิปการโอนรอตรวจสอบ ${a.stats.payReview} รายการ</b><div class="small muted">${payS.map(s => esc(s.courseCode) + ' ' + thDate(s.date) + ` (${s.payReview})`).join(' · ')}</div></div><button class="btn btn-primary btn-sm" data-roster="${payS[0].id}">ตรวจสอบ</button></div>` : ''}
    ${pending.length ? `<div class="alert-row warn">${ic('award')}<div style="flex:1;min-width:0"><b>มีผู้เข้าร่วมที่ยังไม่ได้ออกใบประกาศ</b><div class="small muted">${pending.map(s => esc(s.courseCode) + ' ' + thDate(s.date)).join(' · ')}</div></div><button class="btn btn-primary btn-sm" data-roster="${pending[0].id}">จัดการ</button></div>` : ''}
    ${a.stats.redeemPending ? `<div class="alert-row warn">${ic('gift')}<div style="flex:1"><b>มีของรางวัลรอส่งมอบ ${a.stats.redeemPending} รายการ</b></div><button class="btn btn-primary btn-sm" id="gorw">ดูรายการ</button></div>` : ''}
    </div>
    <div class="card" style="margin-top:18px"><div class="card-h"><h3>รอบอบรมที่กำลังจะมาถึง</h3><button class="btn btn-ghost btn-sm" id="ns">${ic('plus')} เพิ่มรอบอบรม</button></div>
      ${up.length ? up.map(s => sessionRow(s, `<button class="icon-btn" data-qr="${s.id}" title="QR เช็คอิน">${ic('qr')}</button><button class="btn btn-ghost btn-sm" data-roster="${s.id}">${ic('users')} ${s.registered}</button>`)).join('') : `<div class="empty">ยังไม่มีรอบอบรม</div>`}</div>`;
  $$('[data-roster]', el).forEach(b => b.onclick = () => roster(b.dataset.roster, el));
  $$('[data-qr]', el).forEach(b => b.onclick = () => checkinQR(a.sessions.find(s => s.id === b.dataset.qr), el));
  $('[data-goq]', el) && ($('[data-goq]', el).onclick = () => go('admin', { tab: 'quotes' }));
  $('#ns').onclick = () => sessionForm(null, el);
  const g = $('#gorw'); if (g) g.onclick = () => go('admin', { tab: 'rewards' });
};

// ---- Sessions ----
ADMIN.sessions = el => {
  const a = S.admin, f = S.params.sf || 'upcoming', cf = S.params.cf || '', today = todayStr();
  const nArch = a.sessions.filter(s => isTrue(s.archived)).length;
  let list = a.sessions.filter(s => (!cf || s.courseId === cf) && (f === 'archived' ? isTrue(s.archived) : !isTrue(s.archived) && (f === 'all' || (f === 'upcoming' ? (s.endDate || s.date) >= today : (s.endDate || s.date) < today))));
  if (f === 'past') list = list.reverse();
  el.innerHTML = head('รอบอบรม & ผู้เข้าอบรม', 'กำหนดวัน ชั่วโมง (คิดแต้ม) ค่าอบรม เทมเพลตใบประกาศ · QR เช็คอิน · เช็กชื่อ · ตรวจสลิป · ออกใบประกาศ', `<button class="btn btn-gold" id="ns">${ic('plus')} เพิ่มรอบอบรม</button>`) + `
    <div class="card"><div class="toolbar"><div class="filters">${[['upcoming', 'กำลังจะมาถึง'], ['past', 'ผ่านมาแล้ว'], ['all', 'ทั้งหมด'], ['archived', `ที่ลบแล้ว${nArch ? ' (' + nArch + ')' : ''}`]].map(x => `<a class="filter ${f === x[0] ? 'active' : ''}" data-sf="${x[0]}">${x[1]}</a>`).join('')}</div>
      <select class="input" id="cf" style="margin-left:auto">${courseOpts(cf, true)}</select></div>
    <div class="table-wrap"><table class="tbl tbl-sess"><thead><tr><th>วันที่</th><th>หลักสูตร</th><th>ชม./แต้ม</th><th>ค่าอบรม</th><th>ผู้สมัคร</th><th>เช็คอิน</th><th>ใบประกาศ</th><th>สถานะ</th><th></th></tr></thead><tbody>
    ${list.map(s => `<tr><td><b>${thDate(s.date)}</b><div class="tiny muted">${esc(s.startTime)}–${esc(s.endTime)} ${s.title ? '· ' + esc(s.title) : ''}</div><div class="tiny muted">${esc(s.location || '')}</div>${s.speakerName ? `<div class="tiny">${icS('user', 12)} ${esc(s.speakerName)}${s.speakerNotifiedAt ? ` <span class="muted" title="แจ้งวิทยากรแล้ว">· แจ้งแล้ว</span>` : ''}</div>` : `<div class="tiny" style="color:var(--bad)">ยังไม่ระบุวิทยากร</div>`}</td>
      <td><span class="chip" style="background:${esc(s.courseColor)}1a;color:${esc(s.courseColor)}">${esc(s.courseCode)}</span></td>
      <td>${esc(s.hours || '-')}</td><td class="small">${Number(s.feeTotal) ? money(s.feeTotal) + (isTrue(s.vat) ? ' +VAT' : '') : '<span class="muted">ฟรี</span>'}${s.payReview ? `<div><span class="chip warn">สลิป ${s.payReview}</span></div>` : ''}</td>
      <td>${s.registered}${Number(s.capacity) ? ' / ' + s.capacity : ''}</td><td>${s.checkedIn || 0}</td><td>${s.certs}</td><td>${sessionChip(s.status)}</td>
      <td class="acts"><div><button class="icon-btn" data-qr="${s.id}" title="QR เช็คอิน">${ic('qr')}</button> <button class="btn btn-primary btn-sm" data-roster="${s.id}">${ic('users')} <span class="hide-sm">ผู้เข้าอบรม</span></button> ${Number(s.feeTotal) ? `<button class="icon-btn" data-pdoc="${s.id}" title="การชำระเงิน / สลิป / 50 ทวิ">${ic('receipt')}</button> ` : ''}${Number(s.feeTotal) ? `<button class="icon-btn" data-coupon="${s.id}" title="คูปองส่วนลด">${ic('tag')}</button> ` : ''}<button class="icon-btn" data-evalsum="${s.id}" title="ผลประเมินวิทยากร">${ic('star')}</button> <button class="icon-btn" data-edit="${s.id}" title="แก้ไข">${ic('edit')}</button> <button class="icon-btn" data-dup="${s.id}" title="ทำซ้ำรอบนี้">${ic('copy')}</button> ${isTrue(s.archived) ? `<button class="icon-btn" data-restore="${s.id}" title="กู้คืนกลับเข้ารายการ">${ic('undo')}</button>` : `<button class="icon-btn" data-del="${s.id}" title="ลบออกจากรายการ">${ic('trash')}</button>`}</div></td></tr>`).join('')
      || `<tr><td colspan="9"><div class="empty">ไม่มีรอบอบรม</div></td></tr>`}
    </tbody></table></div></div>`;
  $('#ns').onclick = () => sessionForm(null, el);
  $$('[data-sf]', el).forEach(x => x.onclick = () => { S.params.sf = x.dataset.sf; ADMIN.sessions(el); });
  $('#cf').onchange = e => { S.params.cf = e.target.value; ADMIN.sessions(el); };
  $$('[data-roster]', el).forEach(b => b.onclick = () => roster(b.dataset.roster, el));
  $$('[data-qr]', el).forEach(b => b.onclick = () => checkinQR(a.sessions.find(s => s.id === b.dataset.qr), el));
  $$('[data-edit]', el).forEach(b => b.onclick = () => sessionForm(a.sessions.find(s => s.id === b.dataset.edit), el));
  $$('[data-pdoc]', el).forEach(b => b.onclick = () => { go('admin', { tab: 'payments', ps: b.dataset.pdoc }); });
  $$('[data-coupon]', el).forEach(b => b.onclick = () => couponsModal(a.sessions.find(s => s.id === b.dataset.coupon)));
  $$('[data-evalsum]', el).forEach(b => b.onclick = () => evalSummary(a.sessions.find(s => s.id === b.dataset.evalsum)));
  $$('[data-dup]', el).forEach(b => b.onclick = () => duplicateSession(a.sessions.find(s => s.id === b.dataset.dup), el));
  $$('[data-del]', el).forEach(b => b.onclick = async () => {
    const s = a.sessions.find(x => x.id === b.dataset.del), upcoming = (s.endDate || s.date) >= today;
    const msg = !s.registered ? `ลบรอบ ${esc(s.courseCode)} ${thDate(s.date)} ออกจากรายการ?`
      : upcoming ? `รอบ ${esc(s.courseCode)} ${thDate(s.date)} มีผู้ลงทะเบียน ${s.registered} คน<br>ระบบจะยกเลิกการลงทะเบียนทั้งหมด (ไม่นับเป็นการผิดกติกาของผู้อบรม) ส่งอีเมลแจ้ง แล้วย้ายรอบนี้ไปที่ “ที่ลบแล้ว”`
      : `ย้ายรอบ ${esc(s.courseCode)} ${thDate(s.date)} ไปที่ “ที่ลบแล้ว”?<br>ประวัติการอบรมและใบประกาศของผู้อบรม ${s.registered} คนยังอยู่ครบ`;
    if (!await confirmBox(msg, 'ลบออกจากรายการ', true)) return;
    const r = await run('deleteSession', { id: s.id });
    toast(r.deleted ? 'ลบรอบอบรมแล้ว' : r.cancelledRegs ? `ยกเลิกผู้ลงทะเบียน ${r.cancelledRegs} คน และย้ายไป “ที่ลบแล้ว”` : 'ย้ายไป “ที่ลบแล้ว” แล้ว'); reloadTab(el);
  });
  $$('[data-restore]', el).forEach(b => b.onclick = async () => {
    await run('restoreSession', { id: b.dataset.restore }, { ok: 'กู้คืนรอบอบรมแล้ว' }); reloadTab(el);
  });
};
function checkinQR(s, host) {
  const draw = async () => {
    const url = checkinUrl(s);
    const m = modal(`QR เช็คอิน · ${esc(s.courseCode)} ${thDate(s.date)}`, `<div class="qr-wrap"><div id="qrc"></div>
      <div><div class="tiny muted">รหัสเช็คอิน (กรณีสแกนไม่ได้)</div><div class="code-big">${esc(s.checkinCode)}</div>
        <div class="small"><b>${esc(s.courseTitle)}</b><br>${thDateRange(s.date, s.endDate)} · ${esc(s.startTime)}–${esc(s.endTime)} น.<br>${esc(s.location || '')}</div>
        <div class="small muted" style="margin-top:10px">เช็คอินแล้ว <b>${s.checkedIn || 0}</b> / ${s.registered} คน</div>
        <div class="tiny muted" style="margin-top:10px;word-break:break-all">${esc(url)}</div></div></div>
      <p class="tiny muted" style="margin:14px 0 0">พิมพ์หรือเปิด QR นี้ที่หน้างาน ผู้อบรมสแกนด้วยกล้องมือถือ → เข้าสู่ระบบ → เช็คอินอัตโนมัติ (เปิดก่อนเวลาเริ่ม ${esc(S.settings.CHECKIN_OPEN_MINUTES || 120)} นาที)</p>`,
      `<button class="btn btn-ghost" id="nc" style="margin-right:auto">${ic('refresh')} สร้างรหัสใหม่</button><button class="btn btn-ghost" id="pp">${ic('print')} พิมพ์</button><button class="btn btn-gold" id="dq">${ic('dl')} ดาวน์โหลด PNG</button>`, { wide: false });
    await needQr().catch(() => { });
    const c = qrCanvas(url, 560); c.className = 'qr-img'; $('#qrc', m.el).appendChild(c);
    $('#dq', m.el).onclick = () => downloadBlob(c.toDataURL('image/png'), `checkin_${s.courseCode}_${s.date}.png`);
    $('#pp', m.el).onclick = () => {
      const w = window.open('', '_blank'); if (!w) return toast('เบราว์เซอร์บล็อกหน้าต่างใหม่', true);
      w.document.write(`<html><head><meta charset="utf-8"><title>QR Check-in</title></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h1 style="margin:0 0 6px">${esc(s.courseTitle)}</h1><p style="font-size:20px;margin:0 0 20px">${thDateRange(s.date, s.endDate)} · ${esc(s.startTime)}–${esc(s.endTime)} น.</p><img src="${c.toDataURL()}" style="width:420px"><p style="font-size:22px">สแกนเพื่อเช็คอิน · รหัส <b style="letter-spacing:4px">${esc(s.checkinCode)}</b></p></body></html>`);
      w.document.close(); setTimeout(() => w.print(), 300);
    };
    $('#nc', m.el).onclick = async () => {
      if (!await confirmBox('สร้างรหัสเช็คอินใหม่? QR เดิมที่พิมพ์ไว้จะใช้ไม่ได้', 'สร้างใหม่')) return;
      s.checkinCode = await run('newCheckinCode', { sessionId: s.id }); m.close(); draw(); adminLoad(true);
    };
  };
  draw();
}
// ---- คูปองส่วนลดเฉพาะรอบ ----
async function couponsModal(s) {
  const m = modal(`คูปองส่วนลด · ${esc(s.courseCode)} ${thDate(s.date)}`, `<div id="cpb"><div class="skeleton" style="height:120px"></div></div>`, '', { wide: true });
  const draw = async () => {
    const all = (await run('listCoupons', {})).filter(c => c.sessionId === s.id);
    $('#cpb', m.el).innerHTML = `<div class="small muted" style="margin-bottom:12px">${esc(s.courseTitle)} · ค่าอบรม ${money(s.feeTotal)} บาท · ผู้สมัครกรอกโค้ดในขั้นตอนยืนยันการลงทะเบียน ส่วนลดหักจากยอดก่อนภาษี</div>
      <form id="cpf" class="card card-b" style="margin-bottom:14px"><div class="row" style="align-items:flex-end">
        <div class="field" style="margin:0"><label>โค้ด *</label><input class="input" name="code" placeholder="เช่น EARLY500" style="text-transform:uppercase" required></div>
        <div class="field" style="margin:0;max-width:150px"><label>ประเภท</label><select class="input" name="kind"><option value="amount">ลดเป็นบาท</option><option value="percent">ลดเป็น %</option></select></div>
        <div class="field" style="margin:0;max-width:120px"><label>มูลค่า *</label><input class="input" type="number" min="0" step="0.01" name="value" required></div>
        <div class="field" style="margin:0;max-width:140px"><label>ใช้ได้กี่สิทธิ์</label><input class="input" type="number" min="0" name="maxUses" placeholder="0 = ไม่จำกัด"></div>
        <div class="field" style="margin:0"><label>หมายเหตุ</label><input class="input" name="note" placeholder="เช่น ลูกค้า VIP"></div>
        <button class="btn btn-gold" id="cpadd">${ic('plus')} สร้างคูปอง</button></div></form>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>โค้ด</th><th>ส่วนลด</th><th>ใช้แล้ว</th><th>สถานะ</th><th>หมายเหตุ</th><th></th></tr></thead><tbody>
      ${all.map(c => `<tr><td><b class="cert-no">${esc(c.code)}</b></td><td>${c.kind === 'percent' ? esc(c.value) + '%' : money(c.value) + ' บาท'}</td><td>${c.used}${Number(c.maxUses) ? ' / ' + c.maxUses : ''}</td>
        <td>${isTrue(c.active) ? '<span class="chip ok">ใช้งาน</span>' : '<span class="chip">ปิด</span>'}</td><td class="small">${esc(c.note || '')}</td>
        <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-cpt="${c.id}">${isTrue(c.active) ? 'ปิด' : 'เปิด'}</button> <button class="icon-btn" data-cpd="${c.id}" title="ลบ">${ic('trash')}</button></td></tr>`).join('') || `<tr><td colspan="6"><div class="empty">ยังไม่มีคูปองสำหรับรอบนี้</div></td></tr>`}
      </tbody></table></div>`;
    $('#cpf', m.el).onsubmit = async e => {
      e.preventDefault(); const v = formData(e.target);
      await run('saveCoupon', { coupon: { code: v.code, kind: v.kind, value: Number(v.value), maxUses: Number(v.maxUses || 0), note: v.note, sessionId: s.id, active: true } }, { ok: 'สร้างคูปองแล้ว' }); draw();
    };
    $$('[data-cpt]', m.el).forEach(b => b.onclick = async () => { const c = all.find(x => x.id === b.dataset.cpt); await run('saveCoupon', { coupon: Object.assign({}, c, { active: !isTrue(c.active) }) }); draw(); });
    $$('[data-cpd]', m.el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบคูปองนี้? ผู้ที่ใช้ไปแล้วยังได้ส่วนลดตามเดิม', 'ลบ', true)) return; await run('deleteCoupon', { id: b.dataset.cpd }); draw(); });
  };
  draw();
}
// ---- ผลประเมินวิทยากร ----
async function evalSummary(s) {
  const d = await run('evaluationSummary', { sessionId: s.id });
  const bar = v => `<div class="bar" style="width:120px;display:inline-block;vertical-align:middle"><i style="width:${Math.round(v / 4 * 100)}%"></i></div>`;
  const m = modal(`ผลประเมินวิทยากร · ${esc(s.courseCode)} ${thDate(s.date)}`, `<div class="small muted" style="margin-bottom:12px">${esc(s.courseTitle)}${s.speakerName ? ` · วิทยากร <b style="color:var(--ink)">${esc(s.speakerName)}</b>` : ''} · ผู้ตอบ <b style="color:var(--ink)">${d.count}</b> คน${d.count ? ` · คะแนนเฉลี่ยรวม <b style="color:var(--ink)">${d.overall.toFixed(2)}</b> / 4` : ''}</div>
    ${d.count ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>หัวข้อ</th><th>เฉลี่ย</th>${d.scale.map((x, i) => `<th class="tiny">${i + 1} ${esc(x)}</th>`).join('')}</tr></thead><tbody>
      ${d.questions.map((q, i) => `<tr><td class="small">${i + 1}. ${esc(q.question)}</td><td style="white-space:nowrap"><b>${q.avg.toFixed(2)}</b> ${bar(q.avg)}</td>${q.dist.map(n => `<td>${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      ${d.comments.length ? `<div class="list-label" style="margin-top:16px">ข้อเสนอแนะ (${d.comments.length})</div>${d.comments.map(c => `<div class="card card-b small" style="margin-bottom:8px">“${esc(c.comment)}”<div class="tiny muted">${esc(c.name)} · ${thDT(c.createdAt)}</div></div>`).join('')}` : ''}`
      : `<div class="empty">${ic('star')}<div>ยังไม่มีผู้ทำแบบประเมิน</div><div class="small">ผู้อบรมทำแบบประเมินได้หลังเช็คอิน ที่เมนู “การอบรมของฉัน”</div></div>`}`,
    `${d.count ? `<button class="btn btn-ghost" id="evcsv">${ic('csv')} Export CSV</button>` : ''}<button class="btn btn-primary" data-x>ปิด</button>`, { wide: true });
  $('#evcsv', m.el) && ($('#evcsv', m.el).onclick = () => {
    const rows = [['ชื่อ', 'อีเมล', 'บริษัท'].concat(d.questions.map((q, i) => 'ข้อ ' + (i + 1))).concat(['ข้อเสนอแนะ', 'เวลา'])].concat(d.rows.map(r => [r.name, r.email, r.company].concat(r.q).concat([r.comment, r.createdAt])));
    downloadBlob('data:text/csv;charset=utf-8,﻿' + encodeURIComponent(rows.map(r => r.map(x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\n')), `evaluation_${s.courseCode}_${s.date}.csv`);
  });
}
function feeRowsHtml(fees) { return fees.map((f, i) => `<div class="fee-row"><input class="input" data-fn="${i}" placeholder="รายการ เช่น ค่าเอกสาร / ค่าอาหาร" value="${esc(f.name || '')}"><input class="input" type="number" min="0" data-fa="${i}" placeholder="บาท" value="${esc(f.amount || '')}"><button type="button" class="icon-btn" data-fd="${i}">${ic('x')}</button></div>`).join(''); }
function duplicateSession(src, host) {
  const keep = ['courseId', 'title', 'startTime', 'endTime', 'hours', 'location', 'mapUrl', 'capacity', 'templateId', 'price', 'fees', 'vat', 'whtAllowed', 'note', 'speakerName', 'speakerEmail', 'lat', 'lng'];
  const s = { status: 'open' }; keep.forEach(k => { if (src[k] !== undefined) s[k] = src[k]; });
  sessionForm(s, host, { title: `ทำซ้ำรอบอบรม · ${esc(src.courseCode || '')} ${thDate(src.date)}`, hint: 'คัดลอกรายละเอียด เวลา ชั่วโมง ค่าอบรม และเทมเพลตจากรอบเดิมแล้ว กรุณาเลือกวันที่ใหม่ ระบบจะสร้างรหัสเช็คอินใหม่ให้ และไม่คัดลอกรายชื่อผู้ลงทะเบียน' });
}
function sessionForm(s, host, opt) {
  opt = opt || {};
  s = s || { status: 'open', startTime: '09:00', endTime: '16:00', capacity: 30, hours: 6 };
  const fees = (Array.isArray(s.fees) ? s.fees : []).map(x => Object.assign({}, x));
  const m = modal(opt.title || (s.id ? 'แก้ไขรอบอบรม' : 'เพิ่มรอบอบรม'), `${opt.hint ? `<div class="alert-row info" style="margin-bottom:14px">${ic('copy')}<div class="small">${opt.hint}</div></div>` : ''}<form id="sf">
    <div class="field"><label>หลักสูตร *</label><select class="input" name="courseId" required>${courseOpts(s.courseId)}</select></div>
    <div class="field"><label>ชื่อรอบ (ถ้ามี)</label><input class="input" name="title" value="${esc(s.title || '')}" placeholder="เช่น รุ่นที่ 3/2569"></div>
    <div class="row"><div class="field"><label>วันที่อบรม *</label><input class="input" type="date" name="date" value="${esc(s.date || '')}" required></div><div class="field"><label>ถึงวันที่ (ถ้าหลายวัน)</label><input class="input" type="date" name="endDate" value="${esc(s.endDate || '')}"></div></div>
    <div class="row"><div class="field"><label>เวลาเริ่ม</label><input class="input" type="time" name="startTime" value="${esc(s.startTime || '')}"></div><div class="field"><label>เวลาสิ้นสุด</label><input class="input" type="time" name="endTime" value="${esc(s.endTime || '')}"></div>
      <div class="field"><label>ชั่วโมงอบรม *</label><input class="input" type="number" min="0.5" step="0.5" name="hours" value="${esc(s.hours || '')}" required><span class="hint">ระบบให้ ${esc(S.settings.POINTS_PER_HOUR || 1)} แต้ม/ชม. อัตโนมัติ</span></div>
      <div class="field"><label>จำนวนที่นั่ง</label><input class="input" type="number" min="0" name="capacity" value="${esc(s.capacity || '')}"><span class="hint">0 = ไม่จำกัด</span></div></div>
    <fieldset class="fs" style="margin-bottom:14px"><legend>วิทยากร</legend><div class="row">
      <div class="field"><label>ชื่อวิทยากร *</label><input class="input" name="speakerName" value="${esc(s.speakerName || '')}" required></div>
      <div class="field"><label>อีเมลวิทยากร *</label><input class="input" type="email" name="speakerEmail" value="${esc(s.speakerEmail || '')}" required></div></div>
      <div class="hint small muted">ระบบส่งอีเมลแจ้งวิทยากร (รายละเอียดรอบ + รายชื่อผู้ลงทะเบียน) ${esc(S.settings.SPEAKER_REMIND_DAYS || 3)} วันก่อนวันอบรมอัตโนมัติ${s.speakerNotifiedAt ? ` · แจ้งแล้วเมื่อ ${thDT(s.speakerNotifiedAt)}` : ''}</div>
      ${s.id ? `<button type="button" class="btn btn-ghost btn-sm" id="nsp" style="margin-top:8px">${ic('mail')} ส่งอีเมลแจ้งวิทยากรตอนนี้</button>` : ''}</fieldset>
    <div class="field"><label>สถานที่</label><input class="input" name="location" value="${esc(s.location || '')}"></div>
    <div class="row"><div class="field"><label>ลิงก์แผนที่ (Google Maps)</label><input class="input" name="mapUrl" value="${esc(s.mapUrl || '')}"></div>
      <div class="field" style="max-width:300px"><label>พิกัดสถานที่ (ใช้ตรวจรัศมีเช็คอิน)</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="input" name="latlng" id="latlng" placeholder="เช่น 13.7563, 100.5018" value="${s.lat && s.lng ? esc(s.lat + ', ' + s.lng) : ''}"><button type="button" class="btn btn-ghost btn-sm" id="geo" title="ดึงพิกัดจากลิงก์แผนที่">${ic('pin')}</button></div>
        <span class="hint" id="geoh">${Number(S.settings.CHECKIN_RADIUS_M) > 0 ? `เช็คอินได้ในรัศมี ${esc(S.settings.CHECKIN_RADIUS_M)} เมตร · ` : ''}ดึงจากลิงก์อัตโนมัติ หรือคลิกขวาที่หมุดใน Google Maps แล้ววางตัวเลข</span></div></div>
    <fieldset class="fs"><legend>ค่าอบรม และค่าใช้จ่ายอื่น</legend>
      <div class="row"><div class="field" style="max-width:200px"><label>ค่าอบรม (บาท)</label><input class="input" type="number" min="0" name="price" value="${esc(s.price || '')}" placeholder="0 = ฟรี"></div>
        <div class="field"><label class="check" style="margin-top:26px"><input type="checkbox" name="vat" ${isTrue(s.vat) ? 'checked' : ''}> บวก VAT ${esc(S.settings.VAT_RATE || 7)}%</label></div>
        <div class="field"><label class="check" style="margin-top:26px"><input type="checkbox" name="whtAllowed" ${isTrue(s.whtAllowed) ? 'checked' : ''}> ให้นิติบุคคลหัก ณ ที่จ่าย ${esc(S.settings.WHT_RATE || 3)}%</label></div></div>
      <div class="small muted" style="margin-bottom:6px">ค่าใช้จ่ายอื่น</div><div id="fees"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="af">${ic('plus')} เพิ่มรายการ</button>
      <div class="small" style="margin-top:10px">รวมก่อนภาษี: <b id="ft"></b></div></fieldset>
    <div class="row"><div class="field"><label>สถานะ</label><select class="input" name="status">${[['open', 'เปิดรับสมัคร'], ['closed', 'ปิดรับสมัคร'], ['draft', 'ฉบับร่าง (ซ่อน)'], ['done', 'จบการอบรม'], ['cancelled', 'ยกเลิก']].map(x => `<option value="${x[0]}" ${s.status === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></div>
      <div class="field"><label>เทมเพลตใบประกาศ</label><select class="input" name="templateId">${tplOpts(s.templateId)}</select></div></div>
    <div class="field"><label>หมายเหตุ</label><textarea class="input" name="note">${esc(s.note || '')}</textarea></div></form>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">${ic('check')} บันทึก</button>`, { wide: true });
  const box = $('#fees', m.el);
  const total = () => { $('#ft', m.el).textContent = money(Number($('[name=price]', m.el).value || 0) + fees.reduce((a, f) => a + Number(f.amount || 0), 0)) + ' บาท'; };
  const drawFees = () => {
    box.innerHTML = feeRowsHtml(fees);
    $$('[data-fn]', box).forEach(i => i.oninput = () => { fees[+i.dataset.fn].name = i.value; });
    $$('[data-fa]', box).forEach(i => i.oninput = () => { fees[+i.dataset.fa].amount = Number(i.value || 0); total(); });
    $$('[data-fd]', box).forEach(b => b.onclick = () => { fees.splice(+b.dataset.fd, 1); drawFees(); });
    total();
  };
  $('#af', m.el).onclick = () => { fees.push({ name: '', amount: 0 }); drawFees(); };
  $('[name=price]', m.el).oninput = total;
  drawFees();
  $('#nsp', m.el) && ($('#nsp', m.el).onclick = async () => {
    if (!await confirmBox(`ส่งอีเมลแจ้งกำหนดการถึงวิทยากร ${esc(s.speakerEmail || '')}?<br><span class="small muted">ถ้าแก้ชื่อ/อีเมลวิทยากร กรุณากดบันทึกก่อน</span>`, 'ส่งอีเมล')) return;
    await run('notifySpeaker', { sessionId: s.id }, { ok: 'ส่งอีเมลถึงวิทยากรแล้ว' });
  });
  const geoIn = $('#latlng', m.el), geoH = $('#geoh', m.el), mapIn = $('[name=mapUrl]', m.el);
  const fetchGeo = async quiet => {
    const url = mapIn.value.trim(); if (!url) return quiet || toast('กรุณาใส่ลิงก์แผนที่ก่อน', true);
    geoH.textContent = 'กำลังดึงพิกัด...';
    try { const g = await call('geoFromMapUrl', { url }); geoIn.value = g.lat.toFixed(6) + ', ' + g.lng.toFixed(6); geoH.innerHTML = `ได้พิกัดแล้ว · <a href="https://www.google.com/maps?q=${g.lat},${g.lng}" target="_blank" rel="noopener">ตรวจดูบนแผนที่</a>`; }
    catch (e) { geoH.textContent = 'ดึงพิกัดจากลิงก์นี้ไม่ได้ กรุณาคลิกขวาที่หมุดใน Google Maps แล้วคัดลอกตัวเลขมาวาง'; }
  };
  $('#geo', m.el).onclick = () => fetchGeo(false);
  mapIn.onchange = () => { geoIn.value = ''; fetchGeo(true); };
  if (mapIn.value.trim() && !geoIn.value) fetchGeo(true);
  if (opt.hint) setTimeout(() => { const d = $('[name=date]', m.el); if (d) d.focus(); }, 50);
  $('#ok', m.el).onclick = async () => {
    const f = $('#sf', m.el); if (!f.reportValidity()) return;
    const v = formData(f);
    const ll = String(v.latlng || '').trim(); delete v.latlng;
    if (ll) { const mm = ll.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/); if (!mm) return toast('รูปแบบพิกัดไม่ถูกต้อง ตัวอย่าง 13.7563, 100.5018', true); v.lat = Number(mm[1]); v.lng = Number(mm[2]); }
    else { v.lat = ''; v.lng = ''; }
    await run('saveSession', { session: Object.assign({ id: s.id }, v, { fees: fees.filter(x => x.name && Number(x.amount)) }) }, { ok: 'บันทึกรอบอบรมแล้ว' });
    m.close(); reloadTab(host);
  };
}
async function roster(sessionId, host) {
  const s = S.admin.sessions.find(x => x.id === sessionId);
  const rows = await run('sessionRoster', { sessionId });
  const paid = Number(s.feeTotal) > 0;
  const m = modal(`ผู้เข้าอบรม · ${esc(s.courseCode)} ${thDate(s.date)}`, `<div id="rb"></div>`, '', { wide: true });
  const draw = list => {
    const active = list.filter(r => r.reg.status !== 'cancelled');
    $('#rb', m.el).innerHTML = `<div class="row" style="margin-bottom:12px;justify-content:space-between"><div class="small muted">${esc(s.courseTitle)} · ${esc(s.location || '')}<br>ลงทะเบียน ${active.length} · เช็คอิน ${active.filter(r => r.reg.checkedInAt).length} · เข้าร่วม ${active.filter(r => r.reg.status === 'attended').length} · ออกใบประกาศ ${active.filter(r => r.reg.certNo).length}</div>
      <div class="row"><input class="input" id="addEmail" placeholder="เพิ่มผู้เข้าอบรมด้วยอีเมล" style="width:220px;padding:7px 11px"><button class="btn btn-ghost btn-sm" id="add">${ic('plus')} เพิ่ม</button><button class="btn btn-ghost btn-sm" id="qr">${ic('qr')} QR</button><button class="btn btn-ghost btn-sm" id="csv">${ic('csv')} Export</button></div></div>
      <div class="card"><div class="toolbar"><label class="check"><input type="checkbox" id="all"> เลือกทั้งหมด</label><span class="small muted" id="cnt"></span>
        <div class="row" style="margin-left:auto"><button class="btn btn-ghost btn-sm" data-bulk="attended">${ic('check')} เช็กชื่อเข้าร่วม</button><button class="btn btn-ghost btn-sm" data-bulk="absent">ไม่มา</button><button class="btn btn-gold btn-sm" id="issue">${ic('award')} ออกใบประกาศ</button></div></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>ผู้เข้าอบรม</th><th>บริษัท / โทร</th><th>เช็คอิน</th><th>สถานะ</th>${paid ? '<th>การชำระ</th>' : ''}<th>เลขที่ใบประกาศ</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr style="${r.reg.status === 'cancelled' ? 'opacity:.5' : ''}"><td><input type="checkbox" class="rc" value="${r.reg.id}" ${r.reg.status === 'cancelled' ? 'disabled' : ''}></td>
        <td><div class="person">${avatar(r.user)}<div><b>${esc(r.user.fullName)}</b><div class="tiny muted">${esc(r.user.email)}</div>${r.reg.cancelReason ? `<div class="tiny" style="color:var(--bad)">ยกเลิก: ${esc(r.reg.cancelReason)}</div>` : ''}</div></div></td>
        <td class="small">${esc(r.user.company || '-')}<div class="tiny muted">${esc(r.user.phone || '')}</div>${r.reg.saleName ? `<div class="tiny" title="Sale ที่เชิญ / ช่องทาง">Sale: <b>${esc(r.reg.saleName)}</b>${r.reg.source ? ' · ' + esc(r.reg.source) : ''}</div>` : ''}</td>
        <td class="small">${r.reg.checkedInAt ? `<span class="chip ok">${icS('check', 12)} ${thDT(r.reg.checkedInAt).split(' ').slice(-2).join(' ')}</span>${r.reg.checkinDist !== '' && r.reg.checkinDist != null ? `<div class="tiny muted">ห่าง ${esc(r.reg.checkinDist)} ม.</div>` : ''}` : '<span class="muted">—</span>'}</td>
        <td>${statusChip(r.reg.status)}</td>
        ${paid ? `<td>${payChip(r.reg.payStatus) || '-'}<div class="tiny">${money(r.reg.total)} บ.</div>${r.reg.status !== 'cancelled' ? `<button class="btn btn-ghost btn-sm" data-pay="${r.reg.id}" style="margin-top:4px">${ic('receipt')} ตรวจ</button>` : ''}</td>` : ''}
        <td>${r.reg.certNo ? `<span class="cert-no">${esc(r.reg.certNo)}</span>` : '<span class="muted">—</span>'}</td>
        <td style="white-space:nowrap">${r.reg.certNo ? `<button class="icon-btn" data-see="${r.reg.id}" title="ดูใบประกาศ">${ic('eye')}</button> <button class="icon-btn" data-revoke="${r.reg.id}" title="ยกเลิกใบประกาศ">${ic('x')}</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="8"><div class="empty">ยังไม่มีผู้ลงทะเบียน</div></td></tr>`}
      </tbody></table></div></div>`;
    const sel = () => $$('.rc:checked', m.el).map(x => x.value);
    const upd = () => { $('#cnt', m.el).textContent = sel().length ? `เลือก ${sel().length} คน` : ''; };
    $$('.rc', m.el).forEach(x => x.onchange = upd);
    $('#all', m.el).onchange = e => { $$('.rc:not(:disabled)', m.el).forEach(x => x.checked = e.target.checked); upd(); };
    const reload = async () => { const nl = await run('sessionRoster', { sessionId }); list.splice(0, list.length, ...nl); draw(list); adminLoad(true).then(() => host && ADMIN[S.adminTab](host)); };
    $$('[data-bulk]', m.el).forEach(b => b.onclick = async () => {
      if (!sel().length) return toast('กรุณาเลือกผู้เข้าอบรม', true);
      if (b.dataset.bulk === 'absent' && !await confirmBox('บันทึก “ไม่มา” จะนับเป็น 1 ครั้งตามกติกา และยกเลิกแต้มที่ได้รับ ต้องการดำเนินการ?', 'บันทึก', true)) return;
      await run('setRegStatus', { regIds: sel(), status: b.dataset.bulk }, { ok: 'อัปเดตสถานะแล้ว' }); reload();
    });
    $('#issue', m.el).onclick = async () => {
      const ids = sel(); if (!ids.length) return toast('กรุณาเลือกผู้เข้าอบรม', true);
      if (!await confirmBox(`ออกใบประกาศให้ ${ids.length} คน? ระบบจะรันเลขที่ใบประกาศ แจ้งทางอีเมล และให้แต้มตามชั่วโมงอบรม`, 'ออกใบประกาศ')) return;
      const r = await run('issueCerts', { regIds: ids }); toast(`ออกใบประกาศ ${r.length} ใบ`); reload();
    };
    $('#add', m.el).onclick = async () => { await run('addToSession', { sessionId, email: $('#addEmail', m.el).value }, { ok: 'เพิ่มผู้เข้าอบรมแล้ว' }); reload(); };
    $('#qr', m.el).onclick = () => checkinQR(s, host);
    $('#csv', m.el).onclick = () => csvDownload([['ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'บริษัท', 'ตำแหน่ง', 'Sale ที่เชิญ', 'รู้จักกิจกรรมจาก', 'สถานะ', 'เช็คอิน', 'การชำระ', 'ยอดชำระ', 'เลขที่ใบประกาศ', 'วันที่ลงทะเบียน', 'เหตุผลยกเลิก']]
      .concat(list.map(r => [r.user.fullName, r.user.email, r.user.phone, r.user.company, r.user.position, r.reg.saleName, r.reg.source, r.reg.status, r.reg.checkedInAt, r.reg.payStatus, r.reg.total, r.reg.certNo, r.reg.registeredAt, r.reg.cancelReason])), `roster_${s.courseCode}_${s.date}.csv`);
    $$('[data-see]', m.el).forEach(b => b.onclick = () => openCert(b.dataset.see));
    $$('[data-revoke]', m.el).forEach(b => b.onclick = async () => { if (!await confirmBox('ยกเลิกใบประกาศนี้?', 'ยกเลิกใบประกาศ', true)) return; await run('revokeCert', { regId: b.dataset.revoke }); reload(); });
    $$('[data-pay]', m.el).forEach(b => b.onclick = () => payAdmin(list.find(r => r.reg.id === b.dataset.pay), reload));
  };
  draw(rows);
}
// ---- Quote requests ----
const quoteText = q => [`ชื่อบริษัท: ${q.companyName} (${q.branch})`, `ที่อยู่: ${q.address} ${q.postcode}`, `เลขประจำตัวผู้เสียภาษี: ${q.taxId}`, `ผู้ติดต่อ: ${q.contactName}`, `โทร: ${q.phone}`, `อีเมล: ${q.email}`, q.courseTitle ? `หลักสูตร: ${q.courseTitle}${q.sessionDate ? ' · ' + thDate(q.sessionDate) : ''}` : '', q.note ? `หมายเหตุ: ${q.note}` : ''].filter(Boolean).join('\n');
ADMIN.quotes = async el => {
  const f = S.params.qf || 'new';
  el.innerHTML = head('คำขอใบเสนอราคา', 'ลูกค้ากรอกจากหน้าชำระเงิน · ระบบส่งอีเมลแจ้งผู้ดูแลทุกครั้งที่มีคำขอใหม่') + `<div class="skeleton" style="height:200px"></div>`;
  const all = await call('listQuotes', {}), list = all.filter(q => f === 'all' || (f === 'new' ? q.status !== 'done' : q.status === 'done'));
  el.innerHTML = head('คำขอใบเสนอราคา', 'ลูกค้ากรอกจากหน้าชำระเงิน · ระบบส่งอีเมลแจ้งผู้ดูแลทุกครั้งที่มีคำขอใหม่', `<button class="btn btn-ghost" id="qcsv">${ic('csv')} ส่งออก CSV</button>`) + `
    <div class="filters" style="margin-bottom:14px">${[['new', `รอดำเนินการ (${all.filter(q => q.status !== 'done').length})`], ['done', 'ดำเนินการแล้ว'], ['all', 'ทั้งหมด']].map(x => `<a class="filter ${f === x[0] ? 'active' : ''}" data-qf="${x[0]}">${x[1]}</a>`).join('')}</div>
    <div class="grid" style="gap:12px">${list.map(q => `<div class="card quote-card ${q.status === 'done' ? 'done' : ''}"><div class="card-b">
      <div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px"><div style="min-width:0"><b style="font-size:15.5px">${esc(q.companyName)}</b> <span class="tiny muted">(${esc(q.branch)})</span>
        <div class="tiny muted">${thDT(q.createdAt)}${q.courseTitle ? ' · ' + esc(q.courseTitle) + (q.sessionDate ? ' ' + thDate(q.sessionDate) : '') : ''}</div></div>
        ${q.status === 'done' ? '<span class="chip ok">ดำเนินการแล้ว</span>' : '<span class="chip warn">ใหม่</span>'}</div>
      <dl class="kv kv-sm" style="margin-top:10px"><dt>ที่อยู่</dt><dd>${esc(q.address)} ${esc(q.postcode)}</dd><dt>เลขผู้เสียภาษี</dt><dd>${esc(q.taxId)}</dd><dt>ผู้ติดต่อ</dt><dd>${esc(q.contactName)} · <a href="tel:${esc(q.phone)}">${esc(q.phone)}</a> · <a href="mailto:${esc(q.email)}">${esc(q.email)}</a></dd>${q.note ? `<dt>รายละเอียด</dt><dd>${esc(q.note)}</dd>` : ''}${q.adminNote ? `<dt>บันทึกแอดมิน</dt><dd>${esc(q.adminNote)}</dd>` : ''}</dl>
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn btn-ghost btn-sm" data-qcopy="${q.id}">${ic('copy')} คัดลอกข้อมูล</button><a class="btn btn-ghost btn-sm" href="mailto:${esc(q.email)}?subject=${encodeURIComponent('ใบเสนอราคา ' + (q.courseTitle || ''))}">${ic('mail')} ตอบกลับทางอีเมล</a>
        <span style="flex:1"></span>${q.status === 'done' ? `<button class="btn btn-ghost btn-sm" data-qs="${q.id}" data-st="new">ย้ายกลับไปรอดำเนินการ</button>` : `<button class="btn btn-primary btn-sm" data-qs="${q.id}" data-st="done">${ic('check')} ส่งใบเสนอราคาแล้ว</button>`}</div>
    </div></div>`).join('') || `<div class="card empty">${ic('file')}<div>ไม่มีคำขอ</div></div>`}</div>`;
  $$('[data-qf]', el).forEach(x => x.onclick = () => { S.params.qf = x.dataset.qf; ADMIN.quotes(el); });
  $$('[data-qcopy]', el).forEach(b => b.onclick = () => copyText(quoteText(all.find(q => q.id === b.dataset.qcopy))));
  $$('[data-qs]', el).forEach(b => b.onclick = async () => {
    let note = '';
    if (b.dataset.st === 'done') { const q = all.find(x => x.id === b.dataset.qs); note = q.adminNote || ''; }
    await run('setQuote', { id: b.dataset.qs, status: b.dataset.st, adminNote: note }, { ok: 'บันทึกแล้ว' }); adminLoad(true); ADMIN.quotes(el);
  });
  $('#qcsv', el).onclick = () => csvDownload([['วันที่ขอ', 'ชื่อบริษัท', 'สาขา', 'ที่อยู่', 'รหัสไปรษณีย์', 'เลขผู้เสียภาษี', 'ผู้ติดต่อ', 'โทร', 'อีเมล', 'หลักสูตร', 'รอบ', 'รายละเอียด', 'สถานะ']]
    .concat(all.map(q => [q.createdAt, q.companyName, q.branch, q.address, q.postcode, q.taxId, q.contactName, q.phone, q.email, q.courseTitle, q.sessionDate, q.note, q.status === 'done' ? 'ดำเนินการแล้ว' : 'ใหม่'])), 'quote_requests.csv');
};
// ---- Payments: slips / 50 ทวิ / receipts by session ----
const driveDl = u => { const m = String(u || '').match(/\/d\/([\w-]{10,})|[?&]id=([\w-]{10,})/); return m ? 'https://drive.google.com/uc?export=download&id=' + (m[1] || m[2]) : u; };
const docBtns = (u, label, dlName) => u ? `<div class="doc-btns"><a class="btn btn-ghost btn-sm" href="${esc(u)}" target="_blank" rel="noopener" title="เปิดดู ${label}">${ic('eye')}</a><a class="btn btn-ghost btn-sm" href="${esc(driveDl(u))}" ${String(u).startsWith('data:') ? `download="${esc(dlName)}"` : 'target="_blank" rel="noopener"'} title="ดาวน์โหลด ${label}">${ic('dl')}</a></div>` : '';
ADMIN.payments = async el => {
  const a = S.admin, paidS = a.sessions.filter(s => Number(s.feeTotal) > 0);
  if (!paidS.length) { el.innerHTML = head('การชำระเงิน & 50 ทวิ', '') + `<div class="card empty">${ic('receipt')}<div>ยังไม่มีรอบอบรมที่มีค่าใช้จ่าย</div></div>`; return; }
  const today = todayStr();
  const sid = S.params.ps && paidS.some(s => s.id === S.params.ps) ? S.params.ps : (paidS.find(s => s.payReview) || paidS.find(s => (s.endDate || s.date) >= today) || paidS[paidS.length - 1]).id;
  const pf = S.params.pf || 'all';
  const s = paidS.find(x => x.id === sid);
  el.innerHTML = head('การชำระเงิน & 50 ทวิ', 'เลือกรอบอบรม เพื่อตรวจสลิป ดาวน์โหลดหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) และใบเสร็จ') + `<div class="card"><div class="card-b"><div class="skeleton" style="height:200px"></div></div></div>`;
  const rows = (await call('sessionRoster', { sessionId: sid })).filter(r => r.reg.status !== 'cancelled');
  const nSlip = rows.filter(r => r.reg.slipUrl).length, nWht = rows.filter(r => r.reg.whtCertUrl).length, needWht = rows.filter(r => Number(r.reg.whtAmount) > 0).length;
  const nReview = rows.filter(r => r.reg.payStatus === 'review').length, sum = k => rows.reduce((t, r) => t + Number(r.reg[k] || 0), 0);
  const list = rows.filter(r => pf === 'all' || (pf === 'review' ? r.reg.payStatus === 'review' : pf === 'wht' ? Number(r.reg.whtAmount) > 0 || r.reg.whtCertUrl : pf === 'unpaid' ? ['unpaid', 'rejected'].includes(r.reg.payStatus) : true));
  const sessLabel = x => `${thDate(x.date)} · ${x.courseCode} ${x.title ? '· ' + x.title : ''}${x.payReview ? ` (รอตรวจ ${x.payReview})` : ''}`;
  el.innerHTML = head('การชำระเงิน & 50 ทวิ', 'เลือกรอบอบรม เพื่อตรวจสลิป ดาวน์โหลดหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) และใบเสร็จ') + `
    <div class="card card-b pay-pick"><div class="field" style="margin:0;flex:1 1 100%;min-width:0"><label>รอบอบรม</label><select class="input" id="psel">${paidS.slice().reverse().map(x => `<option value="${x.id}" ${x.id === sid ? 'selected' : ''}>${esc(sessLabel(x))}</option>`).join('')}</select></div>
      <div class="pay-zip"><button class="btn btn-gold" data-zip="wht" ${nWht ? '' : 'disabled'}>${ic('dl')} 50 ทวิ ทั้งหมด (${nWht})</button><button class="btn btn-ghost" data-zip="slip" ${nSlip ? '' : 'disabled'}>${ic('dl')} สลิปทั้งหมด (${nSlip})</button><button class="btn btn-ghost" data-zip="all" ${nSlip + nWht ? '' : 'disabled'}>${ic('folder')} ทุกไฟล์ .zip</button><button class="btn btn-ghost" id="pcsv">${ic('csv')} สรุป CSV</button></div></div>
    <div class="grid g4 pay-stats">${[['ผู้ลงทะเบียน', rows.length], ['รอตรวจสลิป', nReview], ['แนบ 50 ทวิ แล้ว', `${nWht} / ${needWht}`], ['ยอดหัก ณ ที่จ่ายรวม', money(sum('whtAmount')) + ' บ.']].map(x => `<div class="card stat sm"><div class="n">${x[1]}</div><div class="l">${x[0]}</div></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><div class="toolbar"><div class="filters">${[['all', 'ทั้งหมด'], ['review', 'รอตรวจสอบ'], ['wht', 'หัก ณ ที่จ่าย'], ['unpaid', 'ยังไม่ชำระ / ไม่ผ่าน']].map(x => `<a class="filter ${pf === x[0] ? 'active' : ''}" data-pf="${x[0]}">${x[1]}</a>`).join('')}</div></div>
    <div class="table-wrap"><table class="tbl tbl-pay"><thead><tr><th>ผู้อบรม / ออกใบเสร็จในนาม</th><th>ยอดชำระ</th><th>หัก ณ ที่จ่าย</th><th>สถานะ</th><th>สลิป</th><th>50 ทวิ</th><th>ใบเสร็จ</th><th></th></tr></thead><tbody>
    ${list.map(r => { const b = r.reg.billing || {}, who = (b.billingName || r.user.company || r.user.fullName || '').replace(/[\\/:*?"<>|]+/g, ' ');
      return `<tr><td><b>${esc(r.user.fullName)}</b><div class="tiny muted">${esc(b.billingName || r.user.company || '-')}${b.taxId ? ' · ' + esc(b.taxId) : ''}</div></td>
      <td>${money(r.reg.total)}</td><td>${Number(r.reg.whtAmount) ? money(r.reg.whtAmount) : '<span class="muted">—</span>'}</td><td>${payChip(r.reg.payStatus)}</td>
      <td>${docBtns(r.reg.slipUrl, 'สลิป', 'สลิป_' + who + '.png') || '<span class="muted tiny">ยังไม่แนบ</span>'}</td>
      <td>${docBtns(r.reg.whtCertUrl, '50 ทวิ', '50ทวิ_' + who + '.png') || (Number(r.reg.whtAmount) ? '<span class="chip warn">ยังไม่แนบ</span>' : '<span class="muted">—</span>')}</td>
      <td>${docBtns(r.reg.receiptUrl, 'ใบเสร็จ', 'ใบเสร็จ_' + who + '.png') || '<span class="muted">—</span>'}</td>
      <td style="text-align:right"><button class="btn btn-primary btn-sm" data-chk="${r.reg.id}">ตรวจ</button></td></tr>`; }).join('') || `<tr><td colspan="8"><div class="empty">ไม่มีรายการ</div></td></tr>`}
    </tbody></table></div></div>`;
  $('#psel', el).onchange = e => { S.params.ps = e.target.value; ADMIN.payments(el); };
  $$('[data-pf]', el).forEach(x => x.onclick = () => { S.params.ps = sid; S.params.pf = x.dataset.pf; ADMIN.payments(el); });
  $$('[data-chk]', el).forEach(b => b.onclick = () => payAdmin(rows.find(r => r.reg.id === b.dataset.chk), () => { S.params.ps = sid; reloadTab(el); }));
  $$('[data-zip]', el).forEach(b => b.onclick = async () => {
    b.disabled = true; const t = b.innerHTML; b.innerHTML = 'กำลังรวมไฟล์...';
    try { const z = await run('paymentDocsZip', { sessionId: sid, kind: b.dataset.zip }); downloadBlob(z.data, z.name); toast(`ดาวน์โหลด ${z.count} ไฟล์${z.missing ? ` (เปิดไม่ได้ ${z.missing} ไฟล์)` : ''}`); }
    catch (e) { } finally { b.disabled = false; b.innerHTML = t; }
  });
  $('#pcsv', el).onclick = () => csvDownload([['ชื่อ-นามสกุล', 'อีเมล', 'โทร', 'ออกใบเสร็จในนาม', 'ประเภท', 'เลขผู้เสียภาษี', 'สาขา', 'ที่อยู่', 'ยอดก่อนภาษี', 'VAT', 'หัก ณ ที่จ่าย', 'ยอดชำระ', 'สถานะ', 'ลิงก์สลิป', 'ลิงก์ 50 ทวิ', 'ลิงก์ใบเสร็จ']]
    .concat(rows.map(r => { const b = r.reg.billing || {}; return [r.user.fullName, r.user.email, r.user.phone, b.billingName, b.billingType === 'company' ? 'นิติบุคคล' : 'บุคคล', b.taxId, b.branch, b.billingAddress, r.reg.subtotal, r.reg.vatAmount, r.reg.whtAmount, r.reg.total, r.reg.payStatus, String(r.reg.slipUrl || '').startsWith('data:') ? '(demo)' : r.reg.slipUrl, String(r.reg.whtCertUrl || '').startsWith('data:') ? '(demo)' : r.reg.whtCertUrl, String(r.reg.receiptUrl || '').startsWith('data:') ? '(demo)' : r.reg.receiptUrl]; })),
    `payments_${s.courseCode}_${s.date}.csv`);
};
function payAdmin(row, done) {
  const r = row.reg, b = r.billing || {};
  const m = modal('ตรวจสอบการชำระเงิน', `<div class="row" style="justify-content:space-between"><b>${esc(row.user.fullName)}</b>${payChip(r.payStatus)}</div>
    <table class="fee-tbl" style="margin-top:10px"><tbody><tr><td>ยอดก่อนภาษี</td><td>${money(r.subtotal)}</td></tr>${Number(r.vatAmount) ? `<tr><td>VAT</td><td>${money(r.vatAmount)}</td></tr>` : ''}${Number(r.whtAmount) ? `<tr><td>หัก ณ ที่จ่าย</td><td>−${money(r.whtAmount)}</td></tr>` : ''}<tr class="tot"><td>ยอดที่ต้องได้รับ</td><td>${money(r.total)} บาท</td></tr></tbody></table>
    <dl class="kv kv-sm" style="margin-top:12px"><dt>ออกใบเสร็จในนาม</dt><dd>${esc(b.billingName || '-')} ${b.billingType === 'company' ? '(นิติบุคคล)' : ''}</dd><dt>เลขผู้เสียภาษี</dt><dd>${esc(b.taxId || '-')} ${b.branch ? '· สาขา ' + esc(b.branch) : ''}</dd><dt>ที่อยู่</dt><dd>${esc(b.billingAddress || '-')}</dd></dl>
    <div class="row" style="margin-top:12px">${r.slipUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(r.slipUrl)}" target="_blank" rel="noopener">${ic('eye')} ดูสลิป</a>` : '<span class="chip">ยังไม่แนบสลิป</span>'}
      ${r.whtCertUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(r.whtCertUrl)}" target="_blank" rel="noopener">${ic('file')} 50 ทวิ</a>` : Number(r.whtAmount) ? '<span class="chip warn">ยังไม่แนบ 50 ทวิ</span>' : ''}
      ${r.receiptUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(r.receiptUrl)}" target="_blank" rel="noopener">${ic('receipt')} ใบเสร็จ</a>` : ''}</div>
    <div class="field" style="margin-top:14px"><label>แนบใบเสร็จ / ใบกำกับภาษี (ไม่บังคับ)</label><input class="input" type="file" id="rcp" accept="image/*,application/pdf"></div>
    <div class="field"><label>หมายเหตุถึงผู้อบรม (กรณีไม่ผ่าน)</label><input class="input" id="nt"></div>`,
    `<button class="btn btn-danger" id="rej" style="margin-right:auto">ไม่ผ่าน</button><button class="btn btn-ghost" data-x>ปิด</button><button class="btn btn-primary" id="ok">${ic('check')} ยืนยันรับชำระแล้ว</button>`);
  const send = async status => {
    const receipt = await readFile($('#rcp', m.el).files[0], 1800, 0.88);
    await run('setPayment', { regId: r.id, status, receipt, note: $('#nt', m.el).value }, { ok: 'บันทึกแล้ว' }); m.close(); done();
  };
  $('#ok', m.el).onclick = () => send('paid');
  $('#rej', m.el).onclick = () => send('rejected');
}

// ---- Courses (+ inline attachments: files, videos, links) ----
const MAT_TYPES = [['slide', 'ไฟล์พรีเซนเทชัน'], ['document', 'เอกสาร'], ['promo', 'โปรโมชั่น'], ['video', 'วิดีโอ'], ['photo', 'รูปภาพงาน'], ['link', 'ลิงก์อื่น ๆ']];
const VIS = [['registered', 'ผู้ลงทะเบียนเห็นทันที'], ['checkin', 'หลังเช็คอิน และเมื่อถึงเวลาเริ่มอบรม'], ['after', 'หลังการอบรมจบ'], ['attended', 'หลังอบรมจบ เฉพาะผู้เข้าร่วม']];
const visChip = v => ({ registered: '<span class="chip info">ทันที</span>', checkin: '<span class="chip gold">หลังเช็คอิน+เริ่มอบรม</span>', after: '<span class="chip">หลังอบรมจบ</span>', attended: '<span class="chip ok">ผู้เข้าร่วม หลังจบ</span>' }[v] || '<span class="chip info">ทันที</span>');
ADMIN.courses = el => {
  el.innerHTML = head('หลักสูตร & ไฟล์แนบ', 'ชื่อหลักสูตร รหัส (ใช้ในเลขที่ใบประกาศ) สี เทมเพลตเริ่มต้น · แนบไฟล์ / วิดีโอ / ลิงก์ ให้ผู้อบรมทุกรอบ', `<button class="btn btn-gold" id="nc">${ic('plus')} เพิ่มหลักสูตร</button>`) +
    `<div class="grid g3">${S.admin.courses.map(c => courseCard(c, { foot: `${isTrue(c.active) ? '<span class="chip ok">เปิดใช้งาน</span>' : '<span class="chip">ปิด</span>'}<span class="tiny muted">${S.admin.materials.filter(m => m.courseId === c.id && !m.sessionId).length} ไฟล์แนบ</span><button class="btn btn-ghost btn-sm" data-ec="${c.id}">${ic('edit')} แก้ไข</button>` })).join('')}</div>`;
  $('#nc').onclick = () => courseForm({ active: true, hours: 6, color: '#0f2242' }, el);
  $$('[data-ec]', el).forEach(b => b.onclick = () => courseForm(S.admin.courses.find(c => c.id === b.dataset.ec), el));
};
function courseForm(c, host) {
  const m = modal(c.id ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตร', `<div class="tpl-editor course-editor"><form id="cf">
    <div class="row"><div class="field" style="max-width:130px"><label>รหัส *</label><input class="input" name="code" value="${esc(c.code || '')}" required></div><div class="field"><label>ชื่อหลักสูตร *</label><input class="input" name="title" value="${esc(c.title || '')}" required></div></div>
    <div class="field"><label>ชื่อภาษาไทย / คำอธิบายสั้น</label><input class="input" name="subtitle" value="${esc(c.subtitle || '')}"></div>
    <div class="field"><label>รายละเอียด</label><textarea class="input" name="description">${esc(c.description || '')}</textarea></div>
    <div class="row"><div class="field"><label>ชั่วโมง (ค่าเริ่มต้น)</label><input class="input" type="number" name="hours" value="${esc(c.hours || '')}"></div><div class="field"><label>ราคาแสดง (บาท)</label><input class="input" type="number" name="price" value="${esc(c.price || '')}"></div><div class="field"><label>สี</label><input type="color" name="color" value="${esc(c.color || '#0f2242')}"></div><div class="field"><label>ลำดับ</label><input class="input" type="number" name="sort" value="${esc(c.sort || '')}"></div></div>
    <div class="field"><label>เทมเพลตใบประกาศเริ่มต้น</label><select class="input" name="defaultTemplateId">${tplOpts(c.defaultTemplateId).replace('— ใช้ค่าเริ่มต้นของหลักสูตร —', '— ไม่กำหนด —')}</select></div>
    <div class="field"><label>รูปหน้าปก / รูปแชร์ LINE <span class="size-hint">1200 × 630 px</span></label><input class="input" type="file" id="cv" accept="image/*"></div>
    <label class="check"><input type="checkbox" name="active" ${isTrue(c.active) ? 'checked' : ''}> เปิดใช้งาน</label></form>
    <div><div class="fs-title">${ic('folder')} ไฟล์แนบของหลักสูตร</div>
      ${c.id ? `<div id="cm"></div>
      <form id="am" class="fs" style="margin-top:12px"><div class="row"><div class="field"><label>ประเภท</label><select class="input" name="type">${MAT_TYPES.filter(t => t[0] !== 'photo').map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></div></div>
        <div class="field"><label>สิทธิ์การเห็น</label><select class="input" name="visibility">${VIS.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('')}</select></div>
        <div class="field"><label>ชื่อที่แสดง</label><input class="input" name="title"></div>
        <div class="field"><label>อัปโหลดไฟล์ (≤ 25MB)</label><input class="input" type="file" id="amf" multiple></div>
        <div class="field"><label>หรือ ลิงก์ (YouTube / Google Drive / เว็บไซต์)</label><input class="input" name="url" placeholder="https://"></div>
        <button type="button" class="btn btn-primary btn-sm" id="amok">${ic('plus')} เพิ่มไฟล์แนบ</button></form>` : `<div class="empty small">บันทึกหลักสูตรก่อน แล้วเปิดแก้ไขเพื่อแนบไฟล์ / วิดีโอ</div>`}</div></div>`,
    `<button class="btn btn-ghost" data-x>ปิด</button><button class="btn btn-primary" id="ok">บันทึกหลักสูตร</button>`, { wide: true });
  const drawMats = () => {
    const list = S.admin.materials.filter(x => x.courseId === c.id && !x.sessionId);
    $('#cm', m.el).innerHTML = list.length ? `<div class="files">${list.map(x => `<div class="file"><div class="ic">${ic(matIcon(x.type))}</div><div class="t">${esc(x.title)}<div class="tiny">${visChip(x.visibility)} <a href="${esc(x.url)}" target="_blank" rel="noopener">เปิด</a></div></div><button type="button" class="icon-btn" data-dm="${x.id}">${ic('trash')}</button></div>`).join('')}</div>` : `<div class="empty small">ยังไม่มีไฟล์แนบ</div>`;
    $$('[data-dm]', m.el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบไฟล์แนบนี้?', 'ลบ', true)) return; await run('deleteMaterial', { id: b.dataset.dm }); await adminLoad(true); drawMats(); });
  };
  if (c.id) {
    drawMats();
    $('#amok', m.el).onclick = async () => {
      const v = formData($('#am', m.el)), files = Array.from($('#amf', m.el).files);
      if (!files.length && !v.url) return toast('กรุณาแนบไฟล์หรือใส่ลิงก์', true);
      const base = { courseId: c.id, sessionId: '', type: v.type, visibility: v.visibility };
      if (files.length) { for (const file of files) { const data = await readFile(file, 0); await run('saveMaterial', { material: Object.assign({}, base, { title: files.length > 1 || !v.title ? file.name : v.title }), file: data }); } }
      else await run('saveMaterial', { material: Object.assign({}, base, { title: v.title || v.url, url: v.url }) });
      toast('เพิ่มไฟล์แนบแล้ว'); $('#am', m.el).reset(); await adminLoad(true); drawMats();
    };
  }
  $('#ok', m.el).onclick = async () => {
    const f = $('#cf', m.el); if (!f.reportValidity()) return;
    const cover = await readFile($('#cv', m.el).files[0], 1200);
    await run('saveCourse', { course: Object.assign({ id: c.id }, formData(f)), cover }, { ok: 'บันทึกหลักสูตรแล้ว' });
    m.close(); reloadTab(host);
  };
}

// ---- Templates ----
const SAMPLE = { name: 'นาย วสันต์ คำเงิน', nameEn: 'Mr. Wasan Khamngoen', certNo: 'SSC-OM-2026-0001', course: 'SolarEdge O&M (Operation & Maintenance)' };
const sampleData = () => Object.assign({ date: todayStr(), expires: ymd(new Date(new Date().setFullYear(new Date().getFullYear() + 1))), verifyUrl: appUrl() + '?verify=' + SAMPLE.certNo }, SAMPLE);
const FIELD_LABEL = { name: 'ชื่อผู้รับ', nameEn: 'ชื่อภาษาอังกฤษ', certNo: 'เลขที่', date: 'วันที่', expires: 'วันหมดอายุ', qr: 'QR ตรวจสอบ', course: 'ชื่อหลักสูตร' };
const DEFAULT_CFG = () => ({ dateLang: 'en', fields: {
  name: { show: true, x: .5, y: .388, size: .052, color: '#7a0f1c', weight: 500, font: 'Kanit', align: 'center', maxWidth: .62 },
  nameEn: { show: false, x: .5, y: .44, size: .03, color: '#555555', weight: 400, font: 'Kanit', align: 'center', maxWidth: .62 },
  certNo: { show: true, x: .1445, y: .9045, size: .0205, color: '#8f2230', weight: 400, font: 'Kanit', align: 'left' },
  date: { show: true, x: .179, y: .9265, size: .0205, color: '#8f2230', weight: 400, font: 'Kanit', align: 'left' },
  expires: { show: false, x: .179, y: .948, size: .0185, color: '#8f2230', weight: 400, font: 'Kanit', align: 'left', prefix: 'VALID UNTIL: ' },
  qr: { show: true, x: .2, y: .735, size: .115, color: '#111111' },
  course: { show: false, x: .5, y: .47, size: .035, color: '#7a0f1c', weight: 600, font: 'Kanit', align: 'center', maxWidth: .7 } } });
ADMIN.templates = el => {
  const list = S.admin.templates;
  el.innerHTML = head('เทมเพลตใบประกาศ', 'อัปโหลดภาพพื้นหลัง (A4 แนวนอน แนะนำ 3508 × 2480 px) แล้วจัดตำแหน่ง ชื่อ เลขที่ วันที่ วันหมดอายุ และ QR ตรวจสอบ', `<button class="btn btn-gold" id="nt">${ic('plus')} เพิ่มเทมเพลต</button>`) +
    `<div class="grid g3">${list.map(t => `<div class="card cert-card"><div class="cert-thumb" data-tt="${t.id}"><div class="ph">กำลังโหลด…</div></div>
      <div class="cert-meta"><h3 style="font-size:16px">${esc(t.name)}</h3><div class="small muted">ใช้กับ: ${esc(S.admin.courses.filter(c => c.defaultTemplateId === t.id).map(c => c.code).join(', ') || '-')}</div></div>
      <div class="cert-actions"><button class="btn btn-primary btn-sm" data-et="${t.id}">${ic('edit')} จัดตำแหน่ง</button><button class="icon-btn" data-dt="${t.id}">${ic('trash')}</button></div></div>`).join('')
      || `<div class="card empty" style="grid-column:1/-1">${ic('award')}<div>ยังไม่มีเทมเพลต</div></div>`}</div>`;
  $('#nt').onclick = () => templateEditor({ name: '', config: DEFAULT_CFG() }, el);
  $$('[data-et]', el).forEach(b => b.onclick = () => templateEditor(JSON.parse(JSON.stringify(list.find(t => t.id === b.dataset.et))), el));
  $$('[data-dt]', el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบเทมเพลตนี้?', 'ลบ', true)) return; await run('deleteTemplate', { id: b.dataset.dt }); reloadTab(el); });
  (async () => { for (const t of list) { try { const img = await templateImg(t.id); await ensureFonts(t.config); const c = document.createElement('canvas'); drawCert(c, img, t.config, sampleData(), { scale: .3 }); const b = $(`[data-tt="${t.id}"]`, el); if (b) { b.innerHTML = ''; b.appendChild(c); } } catch (e) { } } })();
};
async function templateEditor(t, host) {
  const cfg = t.config && t.config.fields ? t.config : DEFAULT_CFG();
  Object.keys(DEFAULT_CFG().fields).forEach(k => { if (!cfg.fields[k]) cfg.fields[k] = DEFAULT_CFG().fields[k]; });
  let img = t.id ? await templateImg(t.id).catch(() => null) : null, newImage = null, sel = 'name';
  const m = modal(t.id ? 'จัดตำแหน่งเทมเพลต' : 'เพิ่มเทมเพลตใบประกาศ', `<div class="tpl-editor">
    <div><div class="tpl-canvas-wrap"><canvas id="tc"></canvas><div id="noimg" class="empty ${img ? 'hidden' : ''}" style="background:#fff;border-radius:6px">${ic('image')}<div>เลือกไฟล์ภาพพื้นหลัง (JPG/PNG ขนาด A4 แนวนอน)</div></div></div>
      <div class="small muted" style="margin-top:8px">คลิกบนภาพเพื่อย้ายตำแหน่งของช่องที่เลือก · ตัวอย่างใช้ชื่อสมมติ · QR จะลิงก์ไปหน้าตรวจสอบ (ชื่อ วันที่ เวลา หัวข้อ)</div></div>
    <div><div class="field"><label>ชื่อเทมเพลต *</label><input class="input" id="tn" value="${esc(t.name || '')}"></div>
      <div class="field"><label>ภาพพื้นหลัง</label><input class="input" type="file" id="tf" accept="image/png,image/jpeg"></div>
      <div class="field"><label>รูปแบบวันที่</label><select class="input" id="dl"><option value="en" ${cfg.dateLang !== 'th' ? 'selected' : ''}>English (2 November 2026)</option><option value="th" ${cfg.dateLang === 'th' ? 'selected' : ''}>ไทย (2 พฤศจิกายน 2569)</option></select></div>
      <div class="field-tabs">${Object.keys(FIELD_LABEL).map(k => `<a class="filter ${k === sel ? 'active' : ''}" data-fk="${k}">${FIELD_LABEL[k]}</a>`).join('')}</div>
      <div id="fc"></div></div></div>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">${ic('check')} บันทึกเทมเพลต</button>`, { wide: true });
  const cv = $('#tc', m.el);
  const draw = async () => { if (!img) { cv.classList.add('hidden'); return; } cv.classList.remove('hidden'); await ensureFonts(cfg); drawCert(cv, img, cfg, sampleData(), { scale: Math.min(1, 1400 / img.naturalWidth), highlight: sel }); };
  const ctrls = () => {
    const f = cfg.fields[sel], isQr = sel === 'qr';
    $('#fc', m.el).innerHTML = `<label class="check" style="margin-bottom:12px"><input type="checkbox" data-k="show" ${f.show !== false ? 'checked' : ''}> แสดงบนใบประกาศ</label>
      <div class="mini"><div class="field"><label>ตำแหน่ง X (%)</label><input class="input" type="number" step="0.1" data-k="x" value="${(f.x * 100).toFixed(1)}"></div>
      <div class="field"><label>ตำแหน่ง Y (%)</label><input class="input" type="number" step="0.1" data-k="y" value="${(f.y * 100).toFixed(1)}"></div>
      <div class="field" style="grid-column:1/-1"><label>${isQr ? 'ขนาด QR' : 'ขนาดตัวอักษร'}</label><input type="range" min="${isQr ? 0.05 : 0.008}" max="${isQr ? 0.3 : 0.1}" step="0.0005" data-k="size" value="${f.size}"></div>
      <div class="field"><label>สี</label><input type="color" data-k="color" value="${esc(f.color)}"></div>
      ${isQr ? '' : `<div class="field"><label>น้ำหนัก</label><select class="input" data-k="weight">${[300, 400, 500, 600].map(w => `<option ${+f.weight === w ? 'selected' : ''}>${w}</option>`).join('')}</select></div>
      <div class="field"><label>ฟอนต์</label><select class="input" data-k="font">${['Kanit', 'Noto Serif Thai', 'IBM Plex Sans Thai'].map(w => `<option ${f.font === w ? 'selected' : ''}>${w}</option>`).join('')}</select></div>
      <div class="field"><label>จัดแนว</label><select class="input" data-k="align">${[['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']].map(w => `<option value="${w[0]}" ${f.align === w[0] ? 'selected' : ''}>${w[1]}</option>`).join('')}</select></div>
      ${sel === 'expires' ? `<div class="field" style="grid-column:1/-1"><label>ข้อความนำหน้า</label><input class="input" data-k="prefix" value="${esc(f.prefix || '')}" placeholder="VALID UNTIL: "></div>` : ''}`}</div>`;
    $$('[data-k]', m.el).forEach(inp => inp.oninput = inp.onchange = () => {
      const k = inp.dataset.k;
      f[k] = k === 'show' ? inp.checked : (k === 'x' || k === 'y') ? (+inp.value / 100) : (k === 'size' || k === 'weight') ? +inp.value : inp.value;
      draw();
    });
  };
  $$('[data-fk]', m.el).forEach(a => a.onclick = () => { sel = a.dataset.fk; $$('[data-fk]', m.el).forEach(x => x.classList.toggle('active', x === a)); ctrls(); draw(); });
  cv.onclick = e => {
    const r = cv.getBoundingClientRect(); const f = cfg.fields[sel];
    f.x = +((e.clientX - r.left) / r.width).toFixed(4); f.y = +((e.clientY - r.top) / r.height).toFixed(4); ctrls(); draw();
  };
  $('#dl', m.el).onchange = e => { cfg.dateLang = e.target.value; draw(); };
  $('#tf', m.el).onchange = async e => {
    newImage = await readFile(e.target.files[0], 2400, 0.9);
    img = await loadImg(newImage.data); $('#noimg', m.el).classList.add('hidden'); draw();
  };
  $('#ok', m.el).onclick = async () => {
    const name = $('#tn', m.el).value.trim(); if (!name) return toast('กรุณาตั้งชื่อเทมเพลต', true);
    if (!t.id && !newImage) return toast('กรุณาเลือกภาพพื้นหลัง', true);
    const saved = await run('saveTemplate', { template: { id: t.id, name, config: cfg }, image: newImage }, { ok: 'บันทึกเทมเพลตแล้ว' });
    if (newImage) TPL_IMG[saved.id] = img;
    m.close(); reloadTab(host);
  };
  ctrls(); draw(); needQr().then(draw).catch(() => { });
}

// ---- Banners & hero slider ----
ADMIN.banners = el => {
  const bp = S.params.bp || 'home';
  const all = S.admin.banners.map(b => Object.assign({ placement: 'home' }, b, { placement: b.placement || 'home' }));
  const list = all.filter(b => b.placement === bp).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0) || String(b.month).localeCompare(String(a.month)));
  const speedRow = S.admin.settings.find(r => r.key === 'HERO_SPEED') || { value: 6 };
  el.innerHTML = head('แบนเนอร์ & สไลด์', 'แก้ไขแบนเนอร์ของทุกหน้า · ระบบเลือกแบนเนอร์ของเดือนปัจจุบันให้อัตโนมัติ (เว้นเดือนว่าง = แสดงทุกเดือน)', `<button class="btn btn-gold" id="nb">${ic('plus')} เพิ่มแบนเนอร์</button>`) +
    `<div class="filters" style="margin-bottom:14px">${BANNER_PLACES.map(p => `<a class="filter ${bp === p[0] ? 'active' : ''}" data-bp="${p[0]}">${p[1]} <span class="tiny">(${all.filter(b => b.placement === p[0]).length})</span></a>`).join('')}</div>
    <div class="card card-b" style="margin-bottom:14px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:220px"><b>${esc((BANNER_PLACES.find(p => p[0] === bp) || [])[1])}</b><div class="small muted">ขนาดที่แนะนำ <span class="size-hint">${bannerSize(bp)}</span> ไฟล์ JPG ไม่เกิน 1MB · ข้อความสำคัญควรอยู่ฝั่งซ้าย</div></div>
      ${bp === 'home' ? `<div style="flex:1;min-width:240px"><label class="small">ความเร็วสไลด์: <b id="spv">${esc(speedRow.value)}</b> วินาที/ภาพ</label><input type="range" min="2" max="15" step="1" id="sp" value="${esc(speedRow.value)}"></div><button class="btn btn-primary btn-sm" id="sps">บันทึกความเร็ว</button>` : ''}
    </div>
    <div class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>ภาพ</th><th>เดือน</th><th>หัวข้อ</th><th>ลำดับ</th><th>สถานะ</th><th></th></tr></thead><tbody>
    ${list.map(b => `<tr><td>${b.imageUrl ? `<img class="thumb" src="${esc(b.imageUrl)}">` : '<div class="thumb"></div>'}</td><td>${b.month ? thMonth(b.month) : 'ทุกเดือน'}</td><td><b>${esc(b.title || '-')}</b><div class="tiny muted">${esc(b.subtitle || '')}</div></td><td>${esc(b.sort || '-')}</td>
      <td>${isTrue(b.active) ? '<span class="chip ok">แสดง</span>' : '<span class="chip">ซ่อน</span>'}</td><td style="white-space:nowrap"><button class="icon-btn" data-eb="${b.id}">${ic('edit')}</button> <button class="icon-btn" data-db="${b.id}">${ic('trash')}</button></td></tr>`).join('')
      || `<tr><td colspan="6"><div class="empty">ยังไม่มีแบนเนอร์ในหน้านี้${bp === 'home' ? ' (หน้าแรกจะใช้ภาพพื้นหลังเริ่มต้น)' : ''}</div></td></tr>`}</tbody></table></div></div>`;
  $$('[data-bp]', el).forEach(a => a.onclick = () => { S.params.bp = a.dataset.bp; ADMIN.banners(el); });
  $('#nb').onclick = () => bannerForm({ active: true, placement: bp, month: '' }, el);
  $$('[data-eb]', el).forEach(b => b.onclick = () => bannerForm(S.admin.banners.find(x => x.id === b.dataset.eb), el));
  $$('[data-db]', el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบแบนเนอร์นี้?', 'ลบ', true)) return; await run('deleteBanner', { id: b.dataset.db }); S.banners = null; reloadTab(el); });
  const sp = $('#sp');
  if (sp) { sp.oninput = () => { $('#spv').textContent = sp.value; }; $('#sps').onclick = async () => { await run('saveSettings', { settings: { HERO_SPEED: sp.value } }, { ok: 'บันทึกความเร็วสไลด์แล้ว' }); S.settings.HERO_SPEED = sp.value; reloadTab(el); }; }
};
function bannerForm(b, host, after) {
  const pl = b.placement || 'home';
  const ratio = pl === 'home' ? '1920/700' : '1920/400';
  const m = modal(b.id ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์', `<form id="bf">
    <div id="bp" style="margin-bottom:10px">${b.imageUrl ? `<img src="${esc(b.imageUrl)}" style="width:100%;border-radius:10px;aspect-ratio:${ratio};object-fit:cover">` : `<div class="banner-ph" style="aspect-ratio:${ratio}">${bannerSize(pl)}</div>`}</div>
    <div class="small muted" id="bsz" style="margin-bottom:12px">ขนาดแนะนำ <span class="size-hint">${bannerSize(pl)}</span></div>
    <div class="field"><label>ภาพแบนเนอร์</label><input class="input" type="file" id="bi" accept="image/*"></div>
    <div class="row"><div class="field"><label>ตำแหน่ง</label><select class="input" name="placement">${BANNER_PLACES.map(p => `<option value="${p[0]}" ${pl === p[0] ? 'selected' : ''}>${p[1]} (${p[2]})</option>`).join('')}</select></div>
      <div class="field"><label>ประจำเดือน</label><input class="input" type="month" name="month" value="${esc(b.month || '')}"><span class="hint">เว้นว่าง = แสดงทุกเดือน</span></div>
      <div class="field" style="max-width:110px"><label>ลำดับ</label><input class="input" type="number" name="sort" value="${esc(b.sort || '')}"></div></div>
    <div class="field"><label>หัวข้อ</label><input class="input" name="title" value="${esc(b.title || '')}"></div>
    <div class="field"><label>ข้อความรอง</label><input class="input" name="subtitle" value="${esc(b.subtitle || '')}"></div>
    <div class="field"><label>ลิงก์เมื่อคลิก (ถ้ามี)</label><input class="input" name="link" value="${esc(b.link || '')}"></div>
    <label class="check"><input type="checkbox" name="active" ${isTrue(b.active) ? 'checked' : ''}> แสดง</label></form>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">บันทึก</button>`);
  let image = null;
  $('#bi', m.el).onchange = async e => {
    image = await readFile(e.target.files[0], 1920, 0.86);
    const want = $('[name=placement]', m.el).value === 'home' ? 700 / 1920 : 400 / 1920;
    const warn = image.w && Math.abs(image.h / image.w - want) > 0.06 ? `<div class="tiny" style="color:var(--warn)">ภาพนี้ ${image.w}×${image.h} px สัดส่วนไม่ตรงกับที่แนะนำ ภาพจะถูกครอปอัตโนมัติ</div>` : '';
    $('#bp', m.el).innerHTML = `<img src="${image.data}" style="width:100%;border-radius:10px;aspect-ratio:${$('[name=placement]', m.el).value === 'home' ? '1920/700' : '1920/400'};object-fit:cover">${warn}`;
  };
  $('[name=placement]', m.el).onchange = e => { $('#bsz', m.el).innerHTML = `ขนาดแนะนำ <span class="size-hint">${bannerSize(e.target.value)}</span>`; };
  $('#ok', m.el).onclick = async () => {
    await run('saveBanner', { banner: Object.assign({ id: b.id }, formData($('#bf', m.el))), image }, { ok: 'บันทึกแบนเนอร์แล้ว' });
    m.close(); S.banners = null;
    if (after) return after();
    reloadTab(host);
  };
}

// ---- Materials (per course / per session; photos after training) ----
ADMIN.materials = el => {
  const a = S.admin, cf = S.params.mc || '';
  const sessName = id => { const s = a.sessions.find(x => x.id === id); return s ? `${s.courseCode} · ${thDate(s.date)}` : ''; };
  const list = a.materials.filter(m => !cf || m.courseId === cf || (a.sessions.find(s => s.id === m.sessionId) || {}).courseId === cf);
  el.innerHTML = head('ไฟล์ & รูปภาพงาน', 'เอกสาร โปรโมชั่น วิดีโอ และภาพบรรยากาศ · กำหนดให้เปิดหลังเช็คอิน/เมื่อเริ่มอบรม หรือหลังอบรมจบได้', `<button class="btn btn-gold" id="nm">${ic('plus')} เพิ่มไฟล์ / รูปภาพ</button>`) +
    `<div class="card"><div class="toolbar"><select class="input" id="mc">${courseOpts(cf, true)}</select></div><div class="table-wrap"><table class="tbl"><thead><tr><th>ไฟล์</th><th>ประเภท</th><th>ใช้กับ</th><th>เปิดให้เห็น</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td><div class="person">${x.type === 'photo' ? `<img src="${esc(x.url)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover">` : `<div class="file" style="padding:0;border:0;background:none"><div class="ic">${ic(matIcon(x.type))}</div></div>`}<div><b>${esc(x.title)}</b><div class="tiny"><a href="${esc(x.url)}" target="_blank" rel="noopener">เปิดไฟล์</a></div></div></div></td>
      <td>${esc((MAT_TYPES.find(t => t[0] === x.type) || [, x.type])[1])}</td><td class="small">${x.sessionId ? 'รอบ ' + esc(sessName(x.sessionId)) : 'หลักสูตร ' + esc((a.courses.find(c => c.id === x.courseId) || {}).code || '')}</td>
      <td>${visChip(x.visibility)}</td>
      <td><button class="icon-btn" data-dm="${x.id}">${ic('trash')}</button></td></tr>`).join('') || `<tr><td colspan="5"><div class="empty">ยังไม่มีไฟล์</div></td></tr>`}</tbody></table></div></div>`;
  $('#mc').onchange = e => { S.params.mc = e.target.value; ADMIN.materials(el); };
  $('#nm').onclick = () => materialForm(el);
  $$('[data-dm]', el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบไฟล์นี้ออกจากระบบ?', 'ลบ', true)) return; await run('deleteMaterial', { id: b.dataset.dm }); reloadTab(el); });
};
function materialForm(host) {
  const a = S.admin;
  const m = modal('เพิ่มไฟล์ / รูปภาพ', `<form id="mf">
    <div class="row"><div class="field"><label>ประเภท</label><select class="input" name="type" id="mt">${MAT_TYPES.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select></div>
      <div class="field"><label>เปิดให้เห็น</label><select class="input" name="visibility" id="mv">${VIS.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('')}</select></div></div>
    <div class="field"><label>ใช้กับหลักสูตร *</label><select class="input" name="courseId" id="mcs">${courseOpts('')}</select></div>
    <div class="field"><label>เฉพาะรอบ</label><select class="input" name="sessionId" id="mss"></select><span class="hint">เว้นว่าง = ทุกรอบของหลักสูตร (เช่น ไฟล์พรีเซนต์) · รูปภาพงานให้เลือกรอบวันที่ท่านมา</span></div>
    <div class="field"><label>ชื่อที่แสดง</label><input class="input" name="title"></div>
    <div class="field"><label>อัปโหลดไฟล์</label><input class="input" type="file" id="mfile" multiple><span class="hint">รูปภาพเลือกได้หลายไฟล์พร้อมกัน · ไฟล์ใหญ่เกิน 25MB ให้ใส่ลิงก์ Google Drive / YouTube</span></div>
    <div class="field"><label>หรือ ลิงก์</label><input class="input" name="url" placeholder="https://"></div></form>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">${ic('check')} บันทึก</button>`);
  const fillSess = () => { const c = $('#mcs', m.el).value; $('#mss', m.el).innerHTML = '<option value="">— ทุกรอบ —</option>' + a.sessions.filter(s => s.courseId === c).map(s => `<option value="${s.id}">${thDate(s.date)} ${esc(s.title || '')}</option>`).join(''); };
  $('#mcs', m.el).onchange = fillSess; fillSess();
  $('#mt', m.el).onchange = e => { if (e.target.value === 'photo') $('#mv', m.el).value = 'after'; };
  $('#ok', m.el).onclick = async () => {
    const v = formData($('#mf', m.el)); const files = Array.from($('#mfile', m.el).files);
    if (!files.length && !v.url) return toast('กรุณาแนบไฟล์หรือใส่ลิงก์', true);
    if (files.length) {
      let i = 0;
      for (const file of files) {
        i++;
        const data = await readFile(file, v.type === 'photo' ? 1800 : 0, 0.86);
        await run('saveMaterial', { material: Object.assign({}, v, { url: '', title: files.length > 1 ? `${v.title || (v.type === 'photo' ? 'ภาพบรรยากาศ' : file.name)} ${v.title || v.type === 'photo' ? i : ''}`.trim() : (v.title || file.name) }), file: data });
      }
    } else await run('saveMaterial', { material: Object.assign({}, v, { title: v.title || v.url }) });
    toast('บันทึกเรียบร้อย'); m.close(); reloadTab(host);
  };
}

// ---- Users + exports ----
ADMIN.users = async el => {
  el.innerHTML = head('สมาชิก & Export', 'ข้อมูลลูกค้าเก็บในชีต Users (หลังบ้าน)') + `<div class="skeleton" style="height:240px"></div>`;
  const users = await call('listUsers', {});
  const q = (S.params.uq || '').toLowerCase();
  const list = users.filter(u => !q || [u.fullName, u.email, u.company, u.phone].join(' ').toLowerCase().includes(q));
  el.innerHTML = head('สมาชิก & Export', `ทั้งหมด ${users.length} คน · ข้อมูลลูกค้าเก็บหลังบ้าน ดาวน์โหลดได้เฉพาะผู้ดูแล`, `<button class="btn btn-ghost" id="ux">${ic('csv')} ข้อมูลลูกค้าทั้งหมด</button><button class="btn btn-primary" id="ex">${ic('dl')} Export ตามหลักสูตร / รอบ</button>`) + `<div class="card"><div class="toolbar"><input class="input" id="uq" placeholder="ค้นหาชื่อ อีเมล บริษัท" value="${esc(S.params.uq || '')}"></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>สมาชิก</th><th>บริษัท / โทร</th><th>อบรม</th><th>ใบประกาศ</th><th>แต้ม</th><th>เลื่อน/ยกเลิก/ไม่มา</th><th>สิทธิ์</th><th></th></tr></thead><tbody>
    ${list.map(u => `<tr><td><div class="person">${avatar(u)}<div><b>${esc(u.fullName)}</b><div class="tiny muted">${esc(u.email)}</div></div></div></td><td class="small">${esc(u.company || '-')}<div class="tiny muted">${esc(u.phone || '')}</div></td>
      <td>${u.trainings}</td><td>${u.certs}</td><td><b>${money(u.points)}</b></td><td>${u.strikes ? `<span class="chip ${u.strikes >= 2 ? 'warn' : ''}">${u.strikes}</span>` : '0'}${u.bannedUntil && u.bannedUntil >= todayStr() ? ` <span class="chip bad">ระงับถึง ${thDate(u.bannedUntil)}</span>` : ''}</td>
      <td>${u.role === 'admin' ? '<span class="chip gold">ผู้ดูแล</span>' : '<span class="chip">ผู้อบรม</span>'}${u.status === 'disabled' ? ' <span class="chip bad">ปิดบัญชี</span>' : ''}</td>
      <td><button class="icon-btn" data-eu="${u.id}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table></div></div>`;
  const q$ = $('#uq'); q$.oninput = () => { S.params.uq = q$.value; clearTimeout(S.uqT); S.uqT = setTimeout(() => ADMIN.users(el).then(() => { const n = $('#uq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }), 350); };
  $('#ux').onclick = () => csvDownload([['ID', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่ออังกฤษ', 'อีเมล', 'เบอร์โทร', 'บริษัท', 'ตำแหน่ง', 'ประเภทใบเสร็จ', 'ชื่อออกใบเสร็จ', 'เลขผู้เสียภาษี', 'สาขา', 'ที่อยู่', 'จำนวนอบรม', 'ใบประกาศ', 'แต้มปีนี้', 'ครั้งเลื่อน/ยกเลิก', 'ระงับถึง', 'สิทธิ์', 'สมัครเมื่อ', 'เข้าใช้ล่าสุด']]
    .concat(users.map(u => [u.id, u.prefix, u.firstName, u.lastName, u.nameEn, u.email, u.phone, u.company, u.position, u.billingType, u.billingName, u.taxId, u.branch, u.billingAddress, u.trainings, u.certs, u.points, u.strikes, u.bannedUntil, u.role, u.createdAt, u.lastLogin])), `customers_${todayStr()}.csv`);
  $('#ex').onclick = () => exportForm();
  $$('[data-eu]', el).forEach(b => b.onclick = () => userForm(users.find(x => x.id === b.dataset.eu), () => ADMIN.users(el)));
};
function exportForm() {
  const a = S.admin;
  const m = modal('Export รายชื่อผู้อบรม', `<div class="field"><label>หลักสูตร (หัวข้อการอบรม)</label><select class="input" id="ec">${courseOpts('', true)}</select></div>
    <div class="field"><label>รอบการอบรม</label><select class="input" id="es"></select></div>
    <label class="check"><input type="checkbox" id="ei"> รวมรายการที่ยกเลิก</label>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">${ic('dl')} ดาวน์โหลด CSV (Excel)</button>`);
  const fill = () => { const c = $('#ec', m.el).value; $('#es', m.el).innerHTML = '<option value="">ทุกรอบ</option>' + a.sessions.filter(s => !c || s.courseId === c).map(s => `<option value="${s.id}">${esc(s.courseCode)} · ${thDate(s.date)} ${esc(s.title || '')}</option>`).join(''); };
  $('#ec', m.el).onchange = fill; fill();
  $('#ok', m.el).onclick = async () => {
    const p = { courseId: $('#ec', m.el).value, sessionId: $('#es', m.el).value, includeCancelled: $('#ei', m.el).checked };
    const rows = await run('exportRegistrations', p);
    const c = a.courses.find(x => x.id === p.courseId), s = a.sessions.find(x => x.id === p.sessionId);
    csvDownload([['หลักสูตร', 'รอบ', 'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'บริษัท', 'ตำแหน่ง', 'Sale ที่เชิญ', 'รู้จักกิจกรรมจาก', 'สถานะ', 'เช็คอิน', 'เลขที่ใบประกาศ', 'การชำระ', 'ยอดชำระ', 'หัก ณ ที่จ่าย', 'ชื่อออกใบเสร็จ', 'เลขผู้เสียภาษี', 'ที่อยู่', 'ลงทะเบียนเมื่อ', 'เหตุผลยกเลิก']]
      .concat(rows.map(r => [r.course, r.session, r.name, r.email, r.phone, r.company, r.position, r.saleName, r.source, r.status, r.checkedInAt, r.certNo, r.payStatus, r.total, r.wht, r.billingName, r.taxId, r.billingAddress, r.registeredAt, r.cancelReason])),
      `export_${s ? s.courseCode + '_' + s.date : c ? c.code : 'all'}.csv`);
    toast(`ส่งออก ${rows.length} รายการ`); m.close();
  };
}
function userForm(u, done) {
  const m = modal('แก้ไขสมาชิก', `<form id="uf"><div class="row"><div class="field" style="max-width:120px"><label>คำนำหน้า</label><input class="input" name="prefix" value="${esc(u.prefix || '')}"></div><div class="field"><label>ชื่อ</label><input class="input" name="firstName" value="${esc(u.firstName)}"></div><div class="field"><label>นามสกุล</label><input class="input" name="lastName" value="${esc(u.lastName)}"></div></div>
      <div class="row"><div class="field"><label>เบอร์โทร</label><input class="input" name="phone" value="${esc(u.phone || '')}"></div><div class="field"><label>บริษัท</label><input class="input" name="company" value="${esc(u.company || '')}"></div></div>
      <div class="row"><div class="field"><label>สิทธิ์</label><select class="input" name="role"><option value="user" ${u.role !== 'admin' ? 'selected' : ''}>ผู้อบรม</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option></select></div>
      <div class="field"><label>สถานะบัญชี</label><select class="input" name="status"><option value="active">ใช้งาน</option><option value="disabled" ${u.status === 'disabled' ? 'selected' : ''}>ปิดบัญชี</option></select></div>
      <div class="field"><label>ระงับการลงทะเบียนถึง</label><input class="input" type="date" name="bannedUntil" value="${esc(String(u.bannedUntil || '').slice(0, 10))}"><span class="hint">ลบวันที่ = ปลดระงับ</span></div></div>
      <label class="check"><input type="checkbox" id="cs"> ล้างจำนวนครั้งเลื่อน/ยกเลิก/ไม่มา (ปัจจุบัน ${u.strikes || 0})</label></form>
      <fieldset class="fs" style="margin-top:14px"><legend>ปรับแต้ม (ปัจจุบัน ${money(u.points)} แต้ม)</legend><div class="row"><div class="field" style="max-width:140px"><label>+/− แต้ม</label><input class="input" type="number" id="ap"></div><div class="field"><label>หมายเหตุ</label><input class="input" id="an"></div><button type="button" class="btn btn-ghost btn-sm" id="apb">ปรับแต้ม</button></div></fieldset>`,
    `<button class="btn btn-ghost" id="rp" style="margin-right:auto">${ic('key')} รีเซ็ตรหัสผ่าน</button><button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">บันทึก</button>`);
  $('#ok', m.el).onclick = async () => { await run('saveUser', { user: Object.assign({ id: u.id }, formData($('#uf', m.el))), clearStrikes: $('#cs', m.el).checked }, { ok: 'บันทึกแล้ว' }); m.close(); done(); };
  $('#apb', m.el).onclick = async () => { const r = await run('adjustPoints', { userId: u.id, points: Number($('#ap', m.el).value), note: $('#an', m.el).value }, { ok: 'ปรับแต้มแล้ว' }); u.points = r.balance; m.close(); done(); };
  $('#rp', m.el).onclick = async () => { const r = await run('adminResetPassword', { userId: u.id }); modal('รหัสผ่านชั่วคราว', `<p>แจ้งรหัสผ่านนี้ให้ ${esc(u.fullName)}</p><div class="cert-no" style="font-size:22px;padding:8px 14px">${esc(r.tempPassword)}</div>`); };
}

// ---- Rewards admin ----
ADMIN.rewards = async el => {
  const a = S.admin, st = k => (a.settings.find(r => r.key === k) || {}).value;
  el.innerHTML = head('แต้ม & ของรางวัล', 'แต้ม = ชั่วโมงอบรม × แต้มต่อชั่วโมง (ให้อัตโนมัติเมื่อเช็คอิน/เช็กชื่อ) · สะสมรายปี') + `<div class="skeleton" style="height:200px"></div>`;
  const reds = await call('listRedemptions', {});
  const items = a.rewards.filter(r => r.kind !== 'prize'), prizes = a.rewards.filter(r => r.kind === 'prize');
  const tw = prizes.filter(p => isTrue(p.active)).reduce((s, p) => s + Number(p.weight || 0), 0);
  const rows = list => list.map(r => `<tr><td><div class="person">${r.imageUrl ? `<img src="${esc(r.imageUrl)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover">` : `<div class="file" style="padding:0;border:0;background:none"><div class="ic">${ic('gift')}</div></div>`}<div><b>${esc(r.name)}</b><div class="tiny muted">${esc(r.description || '')}</div></div></div></td>
    <td>${r.kind === 'prize' ? `น้ำหนัก ${esc(r.weight || 0)}${tw ? ` <span class="tiny muted">(${Math.round(Number(r.weight || 0) / tw * 100)}%)</span>` : ''}` : `<b>${money(r.points)}</b> แต้ม`}</td><td>${r.stock === '' || r.stock == null ? 'ไม่จำกัด' : esc(r.stock)}</td>
    <td>${isTrue(r.active) ? '<span class="chip ok">แสดง</span>' : '<span class="chip">ซ่อน</span>'}</td><td style="white-space:nowrap"><button class="icon-btn" data-er="${r.id}">${ic('edit')}</button> <button class="icon-btn" data-dr="${r.id}">${ic('trash')}</button></td></tr>`).join('');
  el.innerHTML = head('แต้ม & ของรางวัล', 'แต้ม = ชั่วโมงอบรม × แต้มต่อชั่วโมง (ให้อัตโนมัติเมื่อเช็คอิน/เช็กชื่อ) · สะสมรายปี', `<button class="btn btn-gold" id="nr">${ic('plus')} เพิ่มของรางวัล</button>`) + `
    <div class="card card-b" style="margin-bottom:16px"><form id="rs" class="row" style="align-items:flex-end">
      <div class="field"><label>หน้าแลกของรางวัล</label><select class="input" name="REWARDS_ENABLED"><option value="TRUE" ${isTrue(st('REWARDS_ENABLED')) ? 'selected' : ''}>เปิด · ลูกค้าเห็น</option><option value="FALSE" ${!isTrue(st('REWARDS_ENABLED')) ? 'selected' : ''}>ปิด · ซ่อนจากลูกค้า</option></select></div>
      <div class="field"><label>แต้มต่อชั่วโมงอบรม</label><input class="input" type="number" min="0" name="POINTS_PER_HOUR" value="${esc(st('POINTS_PER_HOUR') || 1)}"></div>
      <div class="field"><label>แต้มต่อการสุ่ม 1 ครั้ง</label><input class="input" type="number" min="0" name="LUCKY_COST" value="${esc(st('LUCKY_COST') || 10)}"></div>
      <button class="btn btn-primary" style="margin-bottom:14px">${ic('check')} บันทึก</button></form></div>
    <div class="card"><div class="card-h"><h3>ของรางวัลแลกตรง (${items.length})</h3></div><div class="table-wrap"><table class="tbl"><thead><tr><th>รางวัล</th><th>ใช้แต้ม</th><th>คงเหลือ</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows(items) || '<tr><td colspan="5"><div class="empty">ยังไม่มี</div></td></tr>'}</tbody></table></div></div>
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>รางวัลในกล่องสุ่ม (${prizes.length})</h3><span class="small muted">โอกาสได้ตามน้ำหนัก</span></div><div class="table-wrap"><table class="tbl"><thead><tr><th>รางวัล</th><th>โอกาส</th><th>คงเหลือ</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows(prizes) || '<tr><td colspan="5"><div class="empty">ยังไม่มี</div></td></tr>'}</tbody></table></div></div>
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>รายการแลก / สุ่ม (${reds.length})</h3><button class="btn btn-ghost btn-sm" id="rx">${ic('csv')} Export</button></div><div class="table-wrap"><table class="tbl"><thead><tr><th>วันที่</th><th>สมาชิก</th><th>รางวัล</th><th>แต้ม</th><th>สถานะ</th></tr></thead><tbody>
      ${reds.map(r => `<tr><td class="small">${thDT(r.createdAt)}</td><td><b>${esc(r.userName)}</b><div class="tiny muted">${esc(r.email || '')} ${esc(r.phone || '')}</div></td><td>${esc(r.rewardName)} <span class="tiny muted">${r.kind === 'lucky' ? '(สุ่ม)' : ''}</span></td><td>${money(r.points)}</td>
        <td><select class="input" data-rd="${r.id}" style="padding:6px 10px;font-size:13px;min-width:150px">${[['pending', 'รอส่งมอบ'], ['delivered', 'ส่งมอบแล้ว'], ['cancelled', 'ยกเลิก (คืนแต้ม)']].map(o => `<option value="${o[0]}" ${r.status === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">ยังไม่มีรายการ</div></td></tr>'}</tbody></table></div></div>`;
  $('#rs').onsubmit = async e => { e.preventDefault(); const v = formData(e.target); await run('saveSettings', { settings: v }, { ok: 'บันทึกแล้ว' }); Object.assign(S.settings, v); reloadTab(el); };
  $('#nr').onclick = () => rewardForm({ kind: 'item', active: true, stock: '' }, el);
  $$('[data-er]', el).forEach(b => b.onclick = () => rewardForm(a.rewards.find(r => r.id === b.dataset.er), el));
  $$('[data-dr]', el).forEach(b => b.onclick = async () => { if (!await confirmBox('ลบของรางวัลนี้?', 'ลบ', true)) return; await run('deleteReward', { id: b.dataset.dr }); reloadTab(el); });
  $$('[data-rd]', el).forEach(s => s.onchange = async () => {
    if (s.value === 'cancelled' && !await confirmBox('ยกเลิกรายการนี้และคืนแต้มให้สมาชิก?', 'ยืนยัน', true)) { reloadTab(el); return; }
    await run('setRedemption', { id: s.dataset.rd, status: s.value }, { ok: 'อัปเดตแล้ว' }); reloadTab(el);
  });
  $('#rx').onclick = () => csvDownload([['วันที่', 'สมาชิก', 'อีเมล', 'โทร', 'รางวัล', 'ประเภท', 'แต้ม', 'สถานะ']].concat(reds.map(r => [r.createdAt, r.userName, r.email, r.phone, r.rewardName, r.kind, r.points, r.status])), 'redemptions.csv');
};
function rewardForm(r, host) {
  const m = modal(r.id ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัล', `<form id="rf">
    <div class="field"><label>ประเภท</label><div class="opt-row"><label class="check"><input type="radio" name="kind" value="item" ${r.kind !== 'prize' ? 'checked' : ''}> แลกตรง (ตัดแต้มตามที่กำหนด)</label><label class="check"><input type="radio" name="kind" value="prize" ${r.kind === 'prize' ? 'checked' : ''}> รางวัลในกล่องสุ่ม</label></div></div>
    <div class="field"><label>ชื่อของรางวัล *</label><input class="input" name="name" value="${esc(r.name || '')}" required></div>
    <div class="field"><label>รายละเอียด</label><input class="input" name="description" value="${esc(r.description || '')}"></div>
    <div class="row"><div class="field k-item"><label>ใช้แต้ม *</label><input class="input" type="number" min="1" name="points" value="${esc(r.points || '')}"></div>
      <div class="field k-prize"><label>น้ำหนักโอกาส *</label><input class="input" type="number" min="0" name="weight" value="${esc(r.weight || '')}"><span class="hint">ยิ่งมาก ยิ่งมีโอกาสได้</span></div>
      <div class="field"><label>จำนวนคงเหลือ</label><input class="input" type="number" min="0" name="stock" value="${esc(r.stock == null ? '' : r.stock)}"><span class="hint">เว้นว่าง = ไม่จำกัด</span></div>
      <div class="field" style="max-width:100px"><label>ลำดับ</label><input class="input" type="number" name="sort" value="${esc(r.sort || '')}"></div></div>
    <div class="field"><label>รูปภาพ <span class="size-hint">800 × 800 px</span></label><input class="input" type="file" id="ri" accept="image/*"></div>
    <label class="check"><input type="checkbox" name="active" ${isTrue(r.active) ? 'checked' : ''}> แสดง</label></form>`,
    `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">บันทึก</button>`);
  const f = $('#rf', m.el);
  const tog = () => { const k = formData(f).kind; $('.k-item', m.el).classList.toggle('hidden', k === 'prize'); $('.k-prize', m.el).classList.toggle('hidden', k !== 'prize'); };
  f.onchange = tog; tog();
  $('#ok', m.el).onclick = async () => {
    if (!f.reportValidity()) return;
    const v = formData(f);
    if (v.kind === 'item' && !Number(v.points)) return toast('กรุณาระบุแต้มที่ใช้แลก', true);
    if (v.kind === 'prize' && !Number(v.weight)) return toast('กรุณาระบุน้ำหนักโอกาส', true);
    const image = await readFile($('#ri', m.el).files[0], 800, 0.86);
    await run('saveReward', { reward: Object.assign({ id: r.id }, v), image }, { ok: 'บันทึกแล้ว' }); m.close(); reloadTab(host);
  };
}

// ---- Settings ----
const MAIL_VARS = [['ชื่อ', 'ชื่อ-นามสกุลผู้อบรม'], ['ชื่อจริง', 'ชื่อจริง'], ['บริษัท', 'บริษัท'], ['หลักสูตร', 'ชื่อหลักสูตร'], ['รหัสหลักสูตร', 'เช่น OM'], ['ชื่อรอบ', 'เช่น รุ่นที่ 3/2569'],
  ['วันที่', 'วันที่อบรม'], ['เวลา', 'เวลาเริ่ม–เลิก'], ['สถานที่', 'สถานที่'], ['แผนที่', 'ลิงก์แผนที่'], ['ชั่วโมง', 'ชั่วโมงอบรม'], ['แต้ม', 'แต้มที่จะได้รับ'], ['อีกกี่วัน', 'จำนวนวันก่อนอบรม'],
  ['เลขที่ลงทะเบียน', 'เลขที่การลงทะเบียน'], ['ยอดชำระ', 'ยอดค่าอบรม'], ['ข้อมูลการชำระเงิน', 'ยอด + บัญชีโอน (แสดงเฉพาะรอบที่มีค่าใช้จ่าย)'], ['Sale', 'Sale ที่เชิญ'], ['ลิงก์เว็บ', 'ลิงก์เว็บไซต์'], ['หน่วยงาน', 'ชื่อหน่วยงาน'], ['ติดต่อ', 'ข้อมูลติดต่อ']];
const MAIL_KINDS = [['REG', 'อีเมลยืนยันการลงทะเบียน', 'ส่งทันทีเมื่อผู้อบรมกดยืนยันการลงทะเบียน พร้อมแนบไฟล์ปฏิทิน .ics'], ['REMIND', 'อีเมลแจ้งเตือนก่อนวันอบรม', 'ส่งอัตโนมัติทุกวันเวลา 08:00 น. ถึงผู้ที่อบรมในอีก N วัน พร้อมแนบไฟล์ปฏิทิน .ics']];
ADMIN.emails = async el => {
  const a = S.admin, get = k => (a.settings.find(r => r.key === k) || {}).value;
  const defs = S.mailDefaults || (S.mailDefaults = await call('emailDefaults', {}));
  const kind = S.params.mk || 'REG', meta = MAIL_KINDS.find(k => k[0] === kind);
  const cur = { subject: get('EMAIL_' + kind + '_SUBJECT') || defs['EMAIL_' + kind + '_SUBJECT'], body: get('EMAIL_' + kind + '_BODY') || defs['EMAIL_' + kind + '_BODY'] };
  const s = a.sessions.filter(x => x.date >= todayStr() && !isTrue(x.archived))[0] || a.sessions[0] || {};
  const c = a.courses.find(x => x.id === s.courseId) || a.courses[0] || {};
  const days = Math.max(1, Math.round((pd(s.date || todayStr()) - pd(todayStr())) / 864e5));
  const sv = { 'ชื่อ': 'นาย สมชาย ใจดี', 'ชื่อจริง': 'สมชาย', 'บริษัท': 'บจก. ตัวอย่าง', 'หลักสูตร': c.title || '', 'รหัสหลักสูตร': c.code || '', 'ชื่อรอบ': s.title || '',
    'วันที่': thDateRange(s.date, s.endDate), 'เวลา': `${s.startTime || '09:00'}–${s.endTime || '16:00'} น.`, 'สถานที่': s.location || '-', 'แผนที่': s.mapUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.location || ''),
    'ชั่วโมง': s.hours || 6, 'แต้ม': Math.round(Number(s.hours || 6) * Number(S.settings.POINTS_PER_HOUR || 1)), 'อีกกี่วัน': kind === 'REMIND' ? (get('REMIND_DAYS') || 5) : days, 'เลขที่ลงทะเบียน': 'R-XXXXXX',
    'ยอดชำระ': '4,280 บาท', 'ข้อมูลการชำระเงิน': `ค่าอบรมที่ต้องชำระ: **4,280 บาท**\n${get('PAY_INFO') || ''}\nกรุณาแนบหลักฐานการโอนที่เมนู “การอบรมของฉัน”`, 'Sale': 'Ms Asamaporn Photim (Nous)',
    'ลิงก์เว็บ': S.settings.APP_URL || appUrl(), 'หน่วยงาน': get('ORG_NAME') || '', 'ติดต่อ': get('CONTACT') || '' };
  el.innerHTML = head('อีเมลแจ้งเตือน', 'แก้ไขข้อความอีเมลที่ส่งถึงผู้อบรม · พิมพ์ข้อความได้อิสระ แล้วกดตัวแปรเพื่อแทรกข้อมูลของแต่ละคนอัตโนมัติ') + `
    <div class="card card-b mail-opts"><label class="check"><input type="checkbox" id="se" ${isTrue(get('SEND_EMAIL')) ? 'checked' : ''}> เปิดการส่งอีเมลอัตโนมัติ</label>
      <label class="row" style="gap:8px;align-items:center">ส่งอีเมลแจ้งเตือนก่อนวันอบรม <input class="input" type="number" min="1" max="30" id="rd" value="${esc(get('REMIND_DAYS') || 5)}" style="width:70px"> วัน</label></div>
    <div class="filters" style="margin:16px 0 12px">${MAIL_KINDS.map(k => `<a class="filter ${k[0] === kind ? 'active' : ''}" data-mk="${k[0]}">${k[1]}</a>`).join('')}</div>
    <div class="mail-grid">
      <div class="card"><div class="card-h" style="display:block"><h3>${meta[1]}</h3><div class="tiny muted" style="margin-top:4px">${meta[2]}</div></div><div class="card-b">
        <div class="field"><label>หัวข้ออีเมล</label><input class="input" id="msub" value="${esc(cur.subject)}"></div>
        <div class="field"><label>เนื้อหา</label><textarea class="input mono" id="mbody" rows="18">${esc(cur.body)}</textarea>
          <span class="hint">ขึ้นบรรทัดใหม่ได้ตามปกติ · ใส่ **ข้อความ** เพื่อทำตัวหนา · ลิงก์ที่ขึ้นต้นด้วย https:// จะกดได้อัตโนมัติ</span></div>
        <div class="tiny muted" style="margin-bottom:6px">ตัวแปร (กดเพื่อแทรกที่ตำแหน่งเคอร์เซอร์)</div>
        <div class="var-chips">${MAIL_VARS.map(v => `<button type="button" class="chip var-chip" data-var="${esc(v[0])}" title="${esc(v[1])}">{${esc(v[0])}}</button>`).join('')}</div>
      </div><div class="modal-f" style="flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="mreset" style="margin-right:auto">${ic('refresh')} คืนค่าเริ่มต้น</button>
        <button class="btn btn-ghost" id="mtest">${ic('mail')} ส่งอีเมลทดสอบถึงฉัน</button><button class="btn btn-primary" id="msave">${ic('check')} บันทึก</button></div></div>
      <div class="card mail-preview"><div class="card-h"><h3>ตัวอย่างอีเมล</h3><span class="tiny muted">ใช้ข้อมูลตัวอย่าง</span></div>
        <div class="mp-head"><div><span class="muted">ถึง:</span> somchai@example.com</div><div><span class="muted">หัวข้อ:</span> <b id="psub"></b></div><div class="tiny muted">${ic('file')} แนบไฟล์ training.ics</div></div>
        <div class="mp-body" id="pbody"></div></div></div>`;
  const sub = $('#msub', el), body = $('#mbody', el);
  const prev = () => { $('#psub', el).textContent = `[${get('ORG_SHORT') || 'Training'}] ` + renderMailTpl(sub.value, sv, false); $('#pbody', el).innerHTML = renderMailTpl(body.value, sv, true); };
  sub.oninput = prev; body.oninput = prev; prev();
  let last = body;
  [sub, body].forEach(x => x.addEventListener('focus', () => { last = x; }));
  $$('[data-var]', el).forEach(b => b.onclick = () => {
    const t = '{' + b.dataset.var + '}', st = last.selectionStart ?? last.value.length, en = last.selectionEnd ?? st;
    last.value = last.value.slice(0, st) + t + last.value.slice(en); last.focus(); last.setSelectionRange(st + t.length, st + t.length); prev();
  });
  $$('[data-mk]', el).forEach(x => x.onclick = () => { S.params.mk = x.dataset.mk; ADMIN.emails(el); });
  $('#mreset', el).onclick = async () => { if (!await confirmBox('คืนค่าข้อความอีเมลนี้เป็นค่าเริ่มต้น? (ยังไม่บันทึกจนกว่าจะกด “บันทึก”)', 'คืนค่า')) return; sub.value = defs['EMAIL_' + kind + '_SUBJECT']; body.value = defs['EMAIL_' + kind + '_BODY']; prev(); };
  $('#mtest', el).onclick = async () => { const r = await run('sendTestEmail', { subject: sub.value, body: body.value }); toast('ส่งอีเมลทดสอบไปที่ ' + r.to + ' แล้ว'); };
  $('#msave', el).onclick = async () => {
    if (!sub.value.trim() || !body.value.trim()) return toast('กรุณากรอกหัวข้อและเนื้อหาอีเมล', true);
    const st = { ['EMAIL_' + kind + '_SUBJECT']: sub.value.trim(), ['EMAIL_' + kind + '_BODY']: body.value, SEND_EMAIL: $('#se', el).checked ? 'TRUE' : 'FALSE', REMIND_DAYS: String(Number($('#rd', el).value) || 5) };
    await run('saveSettings', { settings: st }, { ok: 'บันทึกข้อความอีเมลแล้ว' }); await adminLoad(true); ADMIN.emails(el);
  };
};
const EMAIL_KEYS = /^(EMAIL_|SEND_EMAIL$|REMIND_DAYS$)/;
ADMIN.settings = el => {
  const rows = S.admin.settings.filter(r => !EMAIL_KEYS.test(r.key));
  el.innerHTML = head('ตั้งค่าระบบ', 'ข้อมูลเหล่านี้เก็บในชีต Settings') + `<div class="card"><form class="card-b" id="stf"><div class="grid g2" style="gap:0 18px">
    ${rows.map(r => `<div class="field"><label>${esc(r.description || r.key)} <span class="tiny muted">(${esc(r.key)})</span></label>
      ${/_LIST$/.test(r.key) ? `<textarea class="input" name="${esc(r.key)}" rows="6">${esc(r.value)}</textarea>` : /^(TRUE|FALSE)$/i.test(String(r.value)) ? `<select class="input" name="${esc(r.key)}"><option value="TRUE" ${isTrue(r.value) ? 'selected' : ''}>เปิด (TRUE)</option><option value="FALSE" ${!isTrue(r.value) ? 'selected' : ''}>ปิด (FALSE)</option></select>` : `<input class="input" name="${esc(r.key)}" value="${esc(r.value)}">`}</div>`).join('')}</div>
    <div class="row" style="justify-content:space-between"><span class="small muted">ตัวอย่างเลขที่ใบประกาศ: <b id="ex"></b></span><button class="btn btn-primary">${ic('check')} บันทึกการตั้งค่า</button></div></form></div>`;
  const ex = () => { const v = formData($('#stf')); const y = new Date().getFullYear(); $('#ex').textContent = String(v.CERT_FORMAT || '').replace('{CODE}', 'OM').replace('{YYYY}', y).replace('{YY}', String(y).slice(2)).replace('{MM}', p2(new Date().getMonth() + 1)).replace('{RUN}', '1'.padStart(+v.CERT_RUN_DIGITS || 4, '0')); };
  $('#stf').oninput = ex; ex();
  $('#stf').onsubmit = async e => { e.preventDefault(); await run('saveSettings', { settings: formData(e.target) }, { ok: 'บันทึกการตั้งค่าแล้ว' }); await adminLoad(true); S.settings = Object.assign(S.settings, formData(e.target)); };
};

// ====================== BOOT ======================
async function boot() {
  const B = window.BOOT || {};
  const val = k => B[k] && String(B[k]).indexOf('<?') !== 0 ? String(B[k]) : '';
  const c = cachedHome();
  if (c) { S.settings = Object.assign({}, c.settings); S.banners = c.banners || {}; }
  // โหลดข้อมูลหน้าแรกพร้อมกับข้อมูลผู้ใช้ ไม่ต้องรอทีละอย่าง
  const homeP = fetchHome().catch(() => null);
  try {
    if (S.token) { const d = await call('me', {}); S.user = d.user; S.settings = Object.assign(S.settings, d.settings); }
  } catch (e) { S.token = null; LS.set('tp_token', null); }
  if (!S.settings.ORG_SHORT) await homeP;
  if (val('verify')) return go('verify', { no: val('verify') });
  if (val('checkin')) return go('checkin', { code: val('checkin') });
  if (val('course')) return S.user ? go('book', { courseId: val('course') }) : go('schedule', { course: val('course') });
  go('home');
}
window.TP = { go, S, render, refreshMe };
boot();
})();
</script>
