
// ====================== CERTIFICATES ======================
const TPL_IMG = {};
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('โหลดรูปเทมเพลตไม่สำเร็จ')); i.src = src; });
}
async function templateImg(tplId) {
  if (TPL_IMG[tplId]) return TPL_IMG[tplId];
  const src = await call('templateImage', { templateId: tplId });
  return (TPL_IMG[tplId] = await loadImg(src));
}
async function ensureFonts(cfg) {
  if (!document.fonts) return;
  const f = Object.values((cfg && cfg.fields) || {}).filter(x => x.show !== false && x.font);
  await Promise.all(f.map(x => document.fonts.load(`${x.weight || 400} 40px "${x.font || 'Kanit'}"`, 'กขabc123').catch(() => { })));
}
function certValues(data, cfg) {
  const lang = cfg.dateLang || 'en';
  return { name: data.name, nameEn: data.nameEn || '', certNo: data.certNo, date: certDate(data.date, lang), course: data.course || '', expires: data.expires ? certDate(data.expires, lang) : '' };
}
function drawCert(canvas, img, cfg, data, opt) {
  opt = opt || {};
  const W = img.naturalWidth, H = img.naturalHeight, k = opt.scale || 1;
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const vals = certValues(data, cfg);
  const mark = (x, y, w, h) => { ctx.strokeStyle = '#2b7bff'; ctx.lineWidth = Math.max(2, canvas.width / 600); ctx.setLineDash([10, 6]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]); };
  Object.entries(cfg.fields || {}).forEach(([key, f]) => {
    if (f.show === false) return;
    if (key === 'qr') {
      const size = f.size * canvas.height, x = f.x * canvas.width - size / 2, y = f.y * canvas.height - size / 2;
      if (data.verifyUrl) drawQR(ctx, data.verifyUrl, x, y, size, f.color);
      if (opt.highlight === key) mark(x - 6, y - 6, size + 12, size + 12);
      return;
    }
    const raw = vals[key] || ''; if (!raw) return;
    const text = (f.prefix || '') + raw;
    let size = f.size * canvas.height;
    const font = s => `${f.weight || 400} ${s}px "${f.font || 'Kanit'}", "IBM Plex Sans Thai", sans-serif`;
    ctx.font = font(size);
    const maxW = (f.maxWidth || 0.9) * canvas.width;
    while (ctx.measureText(text).width > maxW && size > 8) { size -= 1; ctx.font = font(size); }
    ctx.fillStyle = f.color || '#000'; ctx.textAlign = f.align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, f.x * canvas.width, f.y * canvas.height);
    if (opt.highlight === key) {
      const w = ctx.measureText(text).width, x0 = f.align === 'left' ? f.x * canvas.width : f.align === 'right' ? f.x * canvas.width - w : f.x * canvas.width - w / 2;
      mark(x0 - 10, f.y * canvas.height - size * 0.75, w + 20, size * 1.5);
    }
  });
}
async function renderCertCanvas(data, scale) {
  await needQr().catch(() => { });
  const img = await templateImg(data.template.id);
  await ensureFonts(data.template.config);
  const c = document.createElement('canvas');
  drawCert(c, img, data.template.config, data, { scale: scale || 1 });
  return c;
}
async function certPdf(data) {
  const [c] = await Promise.all([renderCertCanvas(data, 1), needPdf()]);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'Certificate ' + data.certNo, subject: data.course, author: S.settings.ORG_NAME || '' });
  pdf.addImage(c.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 210);
  pdf.save(`Certificate_${data.certNo}.pdf`);
}
async function certPng(data) {
  const c = await renderCertCanvas(data, 1);
  downloadBlob(c.toDataURL('image/png'), `Certificate_${data.certNo}.png`);
}
async function openCert(regId) {
  const data = await run('getCertificate', { regId });
  loading(true);
  let c; try { c = await renderCertCanvas(data, 0.6); } finally { loading(false); }
  const m = modal('ใบประกาศนียบัตร', `<div id="cp"></div><div class="row" style="margin-top:14px;justify-content:space-between">
      <div class="small muted">เลขที่ <span class="cert-no">${esc(data.certNo)}</span> · ใช้ได้ถึง <b style="color:var(--ink)">${thDate(data.expires, true)}</b></div>
      <a class="small" href="${esc(data.verifyUrl)}" target="_blank" rel="noopener">${icS('shield')} ลิงก์ตรวจสอบ</a></div>`,
    `<button class="btn btn-ghost" id="png">${ic('image')} PNG</button><button class="btn btn-gold" id="pdf">${ic('dl')} ดาวน์โหลด PDF</button>`, { wide: true });
  c.className = 'cert-preview'; $('#cp', m.el).appendChild(c);
  $('#pdf', m.el).onclick = async () => { loading(true); try { await certPdf(data); } finally { loading(false); } };
  $('#png', m.el).onclick = async () => { loading(true); try { await certPng(data); } finally { loading(false); } };
}
VIEWS.certs = async el => {
  el.innerHTML = `<div class="wrap page"><div class="skeleton" style="height:320px"></div></div>`;
  const all0 = (await call('myTrainings', {})).list, all = all0.filter(t => t.hasCert && !t.certLocked), waitEval = all0.filter(t => t.needEval);
  const valid = all.filter(t => !t.certExpired), expired = all.filter(t => t.certExpired);
  el.innerHTML = `<div class="wrap page">
    <div class="page-head"><div><div class="eyebrow">Certificates</div><h1>ใบประกาศนียบัตรของฉัน</h1><div class="muted">ใบประกาศมีอายุ ${esc(S.settings.CERT_VALID_MONTHS || 12)} เดือนนับจากวันอบรม · ดาวน์โหลดเป็น PDF (A4) หรือ PNG · สแกน QR บนใบประกาศเพื่อตรวจสอบ</div></div></div>
    ${waitEval.length ? `<div class="rules warn" style="margin-bottom:18px">${ic('star')}<div><b>มี ${waitEval.length} หลักสูตรที่รอทำแบบประเมินวิทยากร</b><div class="small">ทำแบบประเมิน (เช็คเอาท์) ที่เมนู “การอบรมของฉัน” เพื่อรับใบประกาศ</div></div><button class="btn btn-gold btn-sm" data-go="my" style="margin-left:auto">ไปทำแบบประเมิน</button></div>` : ''}
    ${valid.length ? `<div class="grid g3">${valid.map(t => `<div class="card cert-card"><div class="cert-thumb" data-thumb="${t.reg.id}"><div class="ph">กำลังสร้างตัวอย่าง…</div></div>
      <div class="cert-meta"><span class="cert-no">${esc(t.reg.certNo)}</span><h3 style="font-size:16px;margin-top:6px">${esc(t.course.title)}</h3><div class="small muted">อบรมวันที่ ${thDateRange(t.session.date, t.session.endDate)}</div>
        <div class="small">ใช้ได้ถึง <b>${thDate(t.certExpires, true)}</b></div></div>
      <div class="cert-actions"><button class="btn btn-ghost btn-sm" data-view="${t.reg.id}">${ic('eye')} ดู</button><button class="btn btn-gold btn-sm" data-pdf="${t.reg.id}">${ic('dl')} PDF</button></div></div>`).join('')}</div>`
      : `<div class="card empty">${ic('award')}<div>ยังไม่มีใบประกาศนียบัตรที่ใช้งานได้</div><div class="small">ใบประกาศจะปรากฏที่นี่หลังจากผู้จัดยืนยันการเข้าร่วมอบรม</div></div>`}
    ${expired.length ? `<div class="list-label" style="margin-top:34px">ใบประกาศที่หมดอายุ (${expired.length})</div>
      <div class="grid g3">${expired.map(t => `<div class="card cert-card expired"><div class="cert-thumb"><div class="ph">${icS('lock', 22)}<br>หมดอายุแล้ว</div></div>
        <div class="cert-meta"><span class="cert-no">${esc(t.reg.certNo)}</span><h3 style="font-size:16px;margin-top:6px">${esc(t.course.title)}</h3><div class="small muted">เข้าอบรมเมื่อ ${thDateRange(t.session.date, t.session.endDate)}</div>
          <div class="small"><span class="chip bad">หมดอายุ ${thDate(t.certExpires, true)}</span></div></div>
        <div class="cert-actions"><span class="small muted">เปิดดู/ดาวน์โหลดไม่ได้ · <a data-go="book" data-p='${JSON.stringify({ courseId: t.course.id })}' style="cursor:pointer">อบรมซ้ำเพื่อต่ออายุ</a></span></div></div>`).join('')}</div>` : ''}
  </div>`;
  $$('[data-view]', el).forEach(b => b.onclick = () => openCert(b.dataset.view));
  $$('[data-pdf]', el).forEach(b => b.onclick = async () => {
    const data = await run('getCertificate', { regId: b.dataset.pdf });
    loading(true); try { await certPdf(data); } finally { loading(false); }
  });
  for (const t of valid) {
    try {
      const data = await call('getCertificate', { regId: t.reg.id });
      const c = await renderCertCanvas(data, 0.3);
      const box = $(`[data-thumb="${t.reg.id}"]`, el); if (box) { box.innerHTML = ''; box.appendChild(c); }
    } catch (e) { const box = $(`[data-thumb="${t.reg.id}"]`, el); if (box) box.innerHTML = `<div class="ph">${esc(e.message)}</div>`; }
  }
};

// ====================== REWARDS ======================
const rdStatus = st => ({ pending: '<span class="chip warn">รอรับของรางวัล</span>', delivered: '<span class="chip ok">ได้รับแล้ว</span>', cancelled: '<span class="chip">ยกเลิก (คืนแต้ม)</span>' }[st] || esc(st));
VIEWS.rewards = async el => {
  el.innerHTML = `<div class="wrap page"><div class="skeleton" style="height:320px"></div></div>`;
  if (!rewardsOn()) { el.innerHTML = `<div class="wrap page"><div class="card empty">${ic('gift')}<div>หน้าแลกของรางวัลปิดอยู่ในขณะนี้</div></div></div>`; return; }
  const [d] = await Promise.all([call('rewardsPage', {}), getBanners()]);
  const pts = d.points, bal = pts.balance;
  el.innerHTML = `${bannerBlock('rewards')}<div class="wrap page">
    <div class="page-head"><div><div class="eyebrow">Rewards</div><h1>แลกของรางวัล</h1><div class="muted">สะสมแต้มจากการอบรม 1 ชั่วโมง = ${esc(S.settings.POINTS_PER_HOUR || 1)} แต้ม · แต้มสะสมรายปี ใช้ได้ถึง ${thDate(pts.expiresAt, true)}</div></div></div>
    ${S.user.role === 'admin' && !isTrue(S.settings.REWARDS_ENABLED) ? `<div class="rules warn">${ic('eye')}<div>หน้านี้ <b>ซ่อนจากลูกค้าอยู่</b> (เห็นเฉพาะผู้ดูแล) · เปิดได้ที่ แอดมิน → ของรางวัล</div></div>` : ''}
    <div class="grid g3 pts-stats">
      <div class="card stat pts-big"><div class="ic">${ic('coin')}</div><div class="n">${money(bal)}</div><div class="l">แต้มคงเหลือ ปี ${pts.year + 543}</div></div>
      <div class="card stat"><div class="ic">${ic('sparkle')}</div><div class="n">${money(pts.earned)}</div><div class="l">แต้มที่ได้รับทั้งปี</div></div>
      ${d.prizes.length ? `<div class="card stat lucky"><div class="ic">${ic('dice')}</div><div class="n">${money(d.luckyCost)}</div><div class="l">แต้มต่อการสุ่ม 1 ครั้ง</div><button class="btn btn-gold btn-sm" id="spin" ${bal < d.luckyCost ? 'disabled' : ''}>${ic('dice')} สุ่มรางวัล</button></div>` : `<div class="card stat"><div class="ic">${ic('gift')}</div><div class="n">${d.history.length}</div><div class="l">รายการที่แลกแล้ว</div></div>`}
    </div>
    <div class="section" style="margin-top:30px"><div class="section-head"><div><h2>ของรางวัล</h2></div></div>
      ${d.items.length ? `<div class="grid g4 rw-grid">${d.items.map(x => { const out = x.stock !== '' && x.stock != null && Number(x.stock) <= 0; return `<div class="card reward">
        <div class="rw-img">${x.imageUrl ? `<img src="${esc(x.imageUrl)}" alt="">` : ic('gift')}</div>
        <div class="rw-b"><h3>${esc(x.name)}</h3><div class="small muted">${esc(x.description || '')}</div>
          <div class="rw-f"><span class="pts-n">${icS('coin', 15)} ${money(x.points)}</span>${x.stock !== '' && x.stock != null ? `<span class="tiny muted">เหลือ ${esc(x.stock)}</span>` : ''}</div>
          <button class="btn ${bal >= Number(x.points) && !out ? 'btn-primary' : 'btn-ghost'} btn-sm btn-block" data-redeem="${x.id}" ${bal < Number(x.points) || out ? 'disabled' : ''}>${out ? 'หมดแล้ว' : bal < Number(x.points) ? `ขาดอีก ${money(Number(x.points) - bal)} แต้ม` : 'แลกของรางวัล'}</button></div></div>`; }).join('')}</div>`
        : `<div class="card empty">${ic('gift')}<div>ยังไม่มีของรางวัล</div></div>`}</div>
    ${d.prizes.length ? `<div class="section"><div class="section-head"><div><h2>กล่องสุ่มรางวัล</h2><div class="small muted">ใช้ ${money(d.luckyCost)} แต้มต่อครั้ง ลุ้นรับรางวัลต่อไปนี้</div></div></div>
      <div class="prize-row">${d.prizes.map(x => `<div class="prize">${x.imageUrl ? `<img src="${esc(x.imageUrl)}" alt="">` : `<div class="rw-ph">${ic('gift')}</div>`}<span>${esc(x.name)}</span></div>`).join('')}</div></div>` : ''}
    <div class="section grid g2">
      <div class="card"><div class="card-h"><h3>ประวัติการแลก</h3></div>${d.history.length ? `<div class="table-wrap"><table class="tbl"><tbody>${d.history.map(h => `<tr><td><b>${esc(h.rewardName)}</b><div class="tiny muted">${thDT(h.createdAt)} · ${h.kind === 'lucky' ? 'สุ่มรางวัล' : 'แลกตรง'}</div></td><td style="white-space:nowrap">−${money(h.points)}</td><td>${rdStatus(h.status)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty small">ยังไม่มีประวัติ</div>`}</div>
      <div class="card"><div class="card-h"><h3>ความเคลื่อนไหวแต้ม ปี ${pts.year + 543}</h3></div>${d.ledger.length ? `<div class="table-wrap"><table class="tbl"><tbody>${d.ledger.map(l => `<tr><td>${esc(l.note || l.type)}<div class="tiny muted">${thDT(l.createdAt)}</div></td><td style="text-align:right;white-space:nowrap;color:${Number(l.points) >= 0 ? 'var(--ok)' : 'var(--bad)'}"><b>${Number(l.points) >= 0 ? '+' : ''}${money(l.points)}</b></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty small">ยังไม่มีแต้ม เข้าอบรมเพื่อเริ่มสะสม</div>`}</div>
    </div>
  </div>`;
  bindBanners(el, () => VIEWS.rewards(el));
  $$('[data-redeem]', el).forEach(b => b.onclick = async () => {
    const x = d.items.find(i => i.id === b.dataset.redeem);
    if (!await confirmBox(`ใช้ <b>${money(x.points)} แต้ม</b> แลก “${esc(x.name)}”?<br><span class="small muted">เจ้าหน้าที่จะติดต่อเพื่อส่งมอบของรางวัล</span>`, 'แลกของรางวัล')) return;
    await run('redeemReward', { rewardId: x.id }, { ok: 'แลกของรางวัลเรียบร้อย' }); await refreshMe(); render();
  });
  const sp = $('#spin'); if (sp) sp.onclick = () => luckySpin(d, () => { refreshMe().then(render); });
};
function luckySpin(d, done) {
  const m = modal('สุ่มรางวัล', `<div class="spin-box"><div class="spin-reel" id="reel"><span>?</span></div>
    <p class="small muted" style="margin:14px 0 0">ใช้ ${money(d.luckyCost)} แต้มต่อครั้ง · คงเหลือ <b id="bal">${money(d.points.balance)}</b> แต้ม</p></div>`,
    `<button class="btn btn-ghost" data-x>ปิด</button><button class="btn btn-gold" id="go">${ic('dice')} สุ่มเลย</button>`, { onClose: done });
  const reel = $('#reel', m.el), names = d.prizes.map(p => p.name);
  $('#go', m.el).onclick = async () => {
    const btn = $('#go', m.el); btn.disabled = true;
    let i = 0, t = setInterval(() => { reel.innerHTML = `<span>${esc(names[i++ % names.length])}</span>`; }, 80);
    let r;
    try { r = await call('luckyDraw', {}); } catch (e) { clearInterval(t); reel.innerHTML = '<span>?</span>'; btn.disabled = false; return toast(e.message, true); }
    await new Promise(x => setTimeout(x, 1500)); clearInterval(t);
    reel.classList.add('win');
    reel.innerHTML = `${r.prize.imageUrl ? `<img src="${esc(r.prize.imageUrl)}" alt="">` : ''}<span>${esc(r.prize.name)}</span>`;
    $('#bal', m.el).textContent = money(r.points.balance);
    toast('ยินดีด้วย! ท่านได้รับ ' + r.prize.name);
    btn.disabled = r.points.balance < d.luckyCost; d.points = r.points;
    btn.innerHTML = `${ic('dice')} สุ่มอีกครั้ง`;
    setTimeout(() => reel.classList.remove('win'), 1200);
  };
}

// ====================== PROFILE ======================
VIEWS.profile = async el => {
  await refreshMe();
  const u = S.user, pts = u.points || { balance: 0, earned: 0, year: new Date().getFullYear() }, rules = u.rules || {};
  el.innerHTML = `<div class="wrap page">
    <div class="page-head"><div><div class="eyebrow">My Profile</div><h1>ข้อมูลส่วนตัว</h1></div></div>
    <div class="profile-grid">
      <div class="grid" style="gap:16px;align-content:start">
        <div class="card profile-side"><div class="photo-pick">${avatar(u, 'lg')}<label for="ph">${ic('camera')}</label><input type="file" id="ph" accept="image/*" hidden></div>
          <h3>${esc(u.fullName)}</h3><div class="small muted">${esc(u.position || '')}${u.position && u.company ? ' · ' : ''}${esc(u.company || '')}</div>
          <div class="divider-gold" style="margin:18px 0"></div>
          <div class="small" style="text-align:left;display:grid;gap:8px">
            <div class="meta"><span>${ic('mail')}${esc(u.email)}</span></div><div class="meta"><span>${ic('phone')}${esc(u.phone || '-')}</span></div>
            <div class="meta"><span>${ic('building')}${esc(u.company || '-')}</span></div></div>
          <button class="btn btn-ghost btn-block" style="margin-top:18px" id="pw">${ic('key')} เปลี่ยนรหัสผ่าน</button></div>
        <div class="card pts-card"><div class="pts-ic">${ic('coin')}</div><div><div class="tiny">แต้มสะสม ปี ${pts.year + 543}</div><div class="pts-n">${money(pts.balance)} <span>แต้ม</span></div>
          <div class="tiny">ได้รับทั้งปี ${money(pts.earned)} แต้ม · ใช้ได้ถึง ${thDate(pts.expiresAt || (pts.year + '-12-31'))}</div></div>
          ${rewardsOn() ? `<button class="btn btn-gold btn-sm" data-go="rewards">${ic('gift')} แลกของรางวัล</button>` : ''}</div>
        <div class="card card-b"><h3 style="font-size:16px;margin-bottom:10px">สิทธิ์การลงทะเบียน</h3>
          <dl class="kv kv-sm"><dt>จองล่วงหน้า</dt><dd>${rules.active || 0} / ${rules.maxActive || 5} รอบ</dd><dt>เลื่อน/ยกเลิก/ไม่มา</dt><dd>${rules.strikes || 0} / ${rules.strikeLimit || 2} ครั้ง</dd>
          <dt>สถานะ</dt><dd>${rules.banned ? `<span class="chip bad">ระงับถึง ${thDate(rules.bannedUntil)}</span>` : '<span class="chip ok">ปกติ</span>'}</dd></dl></div>
      </div>
      <div class="card"><div class="card-h"><h3>แก้ไขข้อมูล</h3></div><form class="card-b" id="pf">
        <div class="row"><div class="field" style="max-width:150px"><label>คำนำหน้า</label><select class="input" name="prefix">${['นาย', 'นาง', 'นางสาว', 'ดร.', ''].map(p => `<option value="${p}" ${u.prefix === p ? 'selected' : ''}>${p || 'ไม่ระบุ'}</option>`).join('')}</select></div>
          <div class="field"><label>ชื่อ *</label><input class="input" name="firstName" value="${esc(u.firstName)}" required></div><div class="field"><label>นามสกุล *</label><input class="input" name="lastName" value="${esc(u.lastName)}" required></div></div>
        <div class="field"><label>ชื่อ–นามสกุล ภาษาอังกฤษ</label><input class="input" name="nameEn" value="${esc(u.nameEn || '')}" placeholder="Mr. Wasan Khamngoen"><span class="hint">ใช้กับใบประกาศที่กำหนดให้พิมพ์ชื่อภาษาอังกฤษ</span></div>
        <div class="row"><div class="field"><label>เบอร์โทร</label><input class="input" name="phone" value="${esc(u.phone || '')}"></div><div class="field"><label>อีเมล</label><input class="input" value="${esc(u.email)}" disabled></div></div>
        <div class="row"><div class="field"><label>บริษัท / หน่วยงาน</label><input class="input" name="company" value="${esc(u.company || '')}"></div><div class="field"><label>ตำแหน่ง</label><input class="input" name="position" value="${esc(u.position || '')}"></div></div>
        <fieldset class="fs"><legend>ข้อมูลออกใบเสร็จ / ใบกำกับภาษี (สำหรับหลักสูตรที่มีค่าใช้จ่าย)</legend>
          <div class="row"><div class="field" style="max-width:200px"><label>ประเภท</label><select class="input" name="billingType"><option value="person" ${u.billingType !== 'company' ? 'selected' : ''}>บุคคลธรรมดา</option><option value="company" ${u.billingType === 'company' ? 'selected' : ''}>นิติบุคคล</option></select></div>
            <div class="field"><label>ชื่อออกใบเสร็จ</label><input class="input" name="billingName" value="${esc(u.billingName || '')}"></div></div>
          <div class="row"><div class="field"><label>เลขผู้เสียภาษี</label><input class="input" name="taxId" value="${esc(u.taxId || '')}" maxlength="13"></div><div class="field" style="max-width:180px"><label>สาขา</label><input class="input" name="branch" value="${esc(u.branch || '')}"></div></div>
          <div class="field"><label>ที่อยู่</label><textarea class="input" name="billingAddress" style="min-height:64px">${esc(u.billingAddress || '')}</textarea></div></fieldset>
        <div class="row" style="justify-content:space-between;margin-top:14px"><span class="small muted">ชื่อบนใบประกาศ: <b id="cn" style="color:var(--ink)">${esc(u.fullName)}</b></span><button class="btn btn-primary">${ic('check')} บันทึกข้อมูล</button></div>
      </form></div></div></div>`;
  const f = $('#pf');
  f.oninput = () => { const v = formData(f); $('#cn').textContent = [v.prefix, v.firstName, v.lastName].filter(Boolean).join(' '); };
  f.onsubmit = async e => { e.preventDefault(); S.user = await run('updateProfile', formData(f), { ok: 'บันทึกข้อมูลเรียบร้อย' }); render(); };
  $('#ph').onchange = async e => {
    const photo = await readFile(e.target.files[0], 480, 0.86);
    S.user = await run('updateProfile', { photo }, { ok: 'อัปเดตรูปโปรไฟล์แล้ว' }); render();
  };
  $('#pw').onclick = () => {
    const m = modal('เปลี่ยนรหัสผ่าน', `<form id="cpf"><div class="field"><label>รหัสผ่านเดิม</label><input class="input" type="password" name="oldPassword" required></div>
      <div class="field"><label>รหัสผ่านใหม่</label><input class="input" type="password" name="newPassword" minlength="6" required></div></form>`,
      `<button class="btn btn-ghost" data-x>ยกเลิก</button><button class="btn btn-primary" id="ok">บันทึก</button>`);
    $('#ok', m.el).onclick = async () => { await run('changePassword', formData($('#cpf', m.el)), { ok: 'เปลี่ยนรหัสผ่านแล้ว' }); m.close(); };
  };
};

// ====================== VERIFY ======================
VIEWS.verify = async el => {
  const no = S.params.no || '';
  el.innerHTML = `<div class="wrap page"><div class="page-head" style="justify-content:center;text-align:center"><div><div class="eyebrow" style="justify-content:center">Certificate Verification</div><h1>ตรวจสอบใบประกาศนียบัตร</h1><div class="muted">ยืนยันว่าผู้ถือใบประกาศเข้าอบรมจริง</div></div></div>
    <form class="row verify-card" id="vf" style="margin-bottom:22px"><input class="input" name="no" value="${esc(no)}" placeholder="กรอกเลขที่ใบประกาศ" style="flex:1;min-width:0"><button class="btn btn-primary">${ic('search')} ตรวจสอบ</button></form><div id="vr"></div></div>`;
  $('#vf').onsubmit = e => { e.preventDefault(); S.params.no = e.target.no.value.trim(); VIEWS.verify(el); };
  if (!no) return;
  const r = await run('verifyCert', { certNo: no });
  if (!r.valid) {
    $('#vr').innerHTML = `<div class="card card-b verify-card verify-bad"><div class="success" style="padding:10px"><div class="seal" style="background:radial-gradient(circle at 30% 30%,#f19aa1,var(--bad))">${ic('x')}</div><h2>ไม่พบใบประกาศนียบัตรเลขที่นี้</h2><p class="muted">กรุณาตรวจสอบเลขที่อีกครั้ง หรือติดต่อผู้จัดอบรม</p></div></div>`;
    return;
  }
  $('#vr').innerHTML = `<div class="card card-b verify-card ${r.expired ? 'verify-warn' : 'verify-ok'}"><div class="success" style="padding:10px">
      <div class="seal" style="background:radial-gradient(circle at 30% 30%,${r.expired ? '#f3cf8a,var(--warn)' : '#7fd1a2,var(--ok)'})">${ic(r.expired ? 'clock' : 'check')}</div>
      <h2>${r.expired ? 'เข้าอบรมจริง · ใบประกาศหมดอายุแล้ว' : 'ใบประกาศนียบัตรถูกต้อง'}</h2><p class="muted">ออกโดย ${esc(S.settings.ORG_NAME || '')}</p></div>
    <dl class="kv" style="text-align:left;max-width:460px;margin:0 auto"><dt>เลขที่</dt><dd>${esc(r.certNo)}</dd><dt>ผู้ได้รับ</dt><dd>${esc(r.name)}</dd>${r.company ? `<dt>บริษัท</dt><dd>${esc(r.company)}</dd>` : ''}
      <dt>หลักสูตร</dt><dd>${esc(r.course)}</dd><dt>วันที่อบรม</dt><dd>${thDateRange(r.date, r.endDate)}</dd><dt>เวลา</dt><dd>${esc(r.startTime || '-')}–${esc(r.endTime || '-')} น.${r.hours ? ` (${esc(r.hours)} ชั่วโมง)` : ''}</dd>
      ${r.location ? `<dt>สถานที่</dt><dd>${esc(r.location)}</dd>` : ''}${r.checkedInAt ? `<dt>เช็คอิน</dt><dd>${thDT(r.checkedInAt)}</dd>` : ''}
      <dt>วันหมดอายุ</dt><dd>${r.expired ? `<span class="chip bad">หมดอายุ ${thDate(r.expiresAt, true)}</span>` : thDate(r.expiresAt, true)}</dd></dl></div>`;
};
