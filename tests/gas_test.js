const fs=require('fs'), crypto=require('crypto'), vm=require('vm');
const sheets={};
function mkSheet(name){ const data=[]; const sh={name,data,
  getLastRow:()=>data.length, getLastColumn:()=>data.reduce((m,r)=>Math.max(m,r.length),0),
  getRange:(r,c,nr=1,nc=1)=>({ getValues:()=>{const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++)row.push((data[r-1+i]||[])[c-1+j]??'');o.push(row);}return o;},
    setValues:v=>{v.forEach((row,i)=>{data[r-1+i]=data[r-1+i]||[];row.forEach((x,j)=>data[r-1+i][c-1+j]=typeof x==='string'&&x[0]==="'"?x.slice(1):x)})},
    setValue:x=>{data[r-1]=data[r-1]||[];data[r-1][c-1]=x}, setFontWeight(){return this},setBackground(){return this},setFontColor(){return this}}),
  appendRow:row=>data.push(row.map(x=>typeof x==='string'&&x[0]==="'"?x.slice(1):x)), deleteRow:i=>data.splice(i-1,1), setFrozenRows(){} };
  sheets[name]=sh; return sh;}
mkSheet('ชีต1');
const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>mkSheet(n),getSheets:()=>Object.values(sheets),deleteSheet:s=>delete sheets[s.name]};
const props={}; const cache={}; const SENT=[];
const ctx={ console, Logger:{log:console.log},
  SpreadsheetApp:{openById:()=>ss},
  Utilities:{ getUuid:()=>crypto.randomUUID(), formatDate:(d,tz,f)=>{const p=n=>String(n).padStart(2,'0');return f.replace('yyyy',d.getFullYear()).replace('yyMMdd',String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())).replace('MM',p(d.getMonth()+1)).replace('dd',p(d.getDate())).replace('HH',p(d.getHours())).replace('mm',p(d.getMinutes()))},
    computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()], base64Encode:b=>Buffer.from(b).toString('base64'),
    computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()], base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),
    base64Decode:s=>[...Buffer.from(s,'base64')], newBlob:(b,m,n)=>({b,m,n}),
    DigestAlgorithm:{SHA_256:1}, Charset:{UTF_8:1}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>cache[k]=v,remove:k=>delete cache[k],getAll:ks=>Object.fromEntries(ks.map(k=>[k,cache[k]])),putAll:o=>Object.assign(cache,o)})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Session:{getScriptTimeZone:()=>'Asia/Bangkok'},
  ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/x/exec'}),getProjectTriggers:()=>[],newTrigger:()=>{const t={timeBased:()=>t,everyDays:()=>t,everyMinutes:()=>t,atHour:()=>t,create:()=>console.log('TRIGGER created')};return t;}},
  MailApp:{sendEmail:o=>{SENT.push(o);console.log('MAIL ->',o.to,'|',o.subject)}},
  DriveApp:{ createFolder:n=>({getId:()=>'F1',getFoldersByName:()=>({hasNext:()=>false}),createFolder:()=>({createFile:()=>({getId:()=>'FILE1',setSharing(){}})}),getFoldersByName:()=>({hasNext:()=>false})}), getFolderById:()=>{throw 1}, Access:{},Permission:{} },
  HtmlService:{}, Date, Math, JSON, String, Number, Object, Array, Error, parseInt
};

vm.createContext(ctx); vm.runInContext(fs.readFileSync('app/Code.gs','utf8'),ctx);
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
const A=(a,p,expectErr)=>{const r=ctx.api(a,p); if(!r.ok && !expectErr) console.log('ERR',a,r.error); if(expectErr) return r; return r.data;};
const day=n=>{const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10);};
console.log(ctx.setup());
const adm=A('register',{email:'a@x.com',password:'secret1',firstName:'แอด',lastName:'มิน'}); const AT=adm.token;
const u=A('register',{email:'u@x.com',password:'secret1',firstName:'วสันต์',lastName:'คำเงิน',company:'ACME'}); const T=u.token;
ok(u.user.points && u.user.points.balance===0 && u.user.rules.maxActive===5,'me has points+rules');
const C=A('adminData',{token:AT}).courses;
ok(A('saveSession',{token:AT,session:{courseId:C[0].id,date:day(10)}},true).ok===false,'session requires hours');
const mk=(n,o)=>A('saveSession',{token:AT,session:Object.assign({courseId:C[0].id,date:day(n),startTime:'09:00',endTime:'16:00',hours:6,capacity:30,location:'BKK',speakerName:'อ.สมชาย',speakerEmail:'sp@x.com'},o||{})});
const SS=[mk(10),mk(12),mk(14),mk(16),mk(18),mk(20),mk(1)];
ok(/^\d{6}$/.test(String(SS[0].checkinCode)),'checkinCode generated');
ok(!('checkinCode' in A('listSessions',{token:T}).sessions[0]),'checkinCode hidden from users');
const regs=SS.slice(0,5).map(s=>A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:T,sessionId:s.id}));
const r6=A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:T,sessionId:SS[5].id},true); ok(!r6.ok && /สูงสุด 5/.test(r6.error),'max 5 active bookings: '+r6.error);
// paid session
const paid=mk(25,{courseId:C[2].id,price:3500,fees:[{name:'doc',amount:500}],vat:true,whtAllowed:true});
const u2=A('register',{email:'c@x.com',password:'secret1',firstName:'บ',lastName:'ริษัท'});
const pr=A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u2.token,sessionId:paid.id,billing:{billingType:'company',billingName:'ACME',taxId:'0105'},wht:true,saveBilling:true});
ok(pr.subtotal===4000 && pr.vatAmount===280 && pr.whtAmount===120 && pr.total===4160 && pr.payStatus==='unpaid','fees/VAT/WHT '+JSON.stringify([pr.subtotal,pr.vatAmount,pr.whtAmount,pr.total]));
const up=A('uploadPayment',{token:u2.token,regId:pr.id,slip:{name:'s.jpg',mimeType:'image/jpeg',data:'data:image/jpeg;base64,AAAA'}}); ok(up.payStatus==='review','slip -> review');
A('setPayment',{token:AT,regId:pr.id,status:'paid'}); ok(ctx.findBy_('Registrations','id',pr.id).payStatus==='paid','admin approve payment');
// cancel needs reason, within window
ok(!A('cancelRegistration',{token:T,regId:regs[0].id},true).ok,'cancel requires reason');
const near=A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u2.token,sessionId:SS[6].id});
ok(/3 วัน/.test(A('cancelRegistration',{token:u2.token,regId:near.id,reason:'x'},true).error||''),'cannot cancel within 3 days');
let c1=A('cancelRegistration',{token:T,regId:regs[0].id,reason:'ติดงาน'}); ok(c1.penalty===null,'strike 1 no penalty');
let rs=A('rescheduleRegistration',{token:T,regId:regs[1].id,toSessionId:SS[5].id,reason:'เลื่อน'}); ok(rs.penalty===null,'strike 2 (reschedule) no penalty');
let c3=A('cancelRegistration',{token:T,regId:regs[2].id,reason:'อีก'}); ok(c3.penalty && c3.penalty.bannedUntil,'strike 3 -> banned until '+(c3.penalty&&c3.penalty.bannedUntil));
const me=A('me',{token:T}).user; ok(me.rules.banned && me.rules.active===0,'all bookings cancelled + banned');
const d=new Date(); const exp=new Date(d.getFullYear(),d.getMonth()+2,1); ok(c3.penalty.bannedUntil.slice(0,7)===`${exp.getFullYear()}-${String(exp.getMonth()+1).padStart(2,'0')}`,'ban until 1st of month+2');
ok(/ระงับ/.test(A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:T,sessionId:SS[4].id},true).error||''),'banned user cannot register');
A('saveUser',{token:AT,user:{id:me.id,bannedUntil:''},clearStrikes:true}); const me2=A('me',{token:T}).user; ok(!me2.rules.banned && me2.rules.strikes===0,'admin unban + clear strikes');
// check-in today session
const today=mk(0,{startTime:'00:00',endTime:'23:59'});
const u3=A('register',{email:'d@x.com',password:'secret1',firstName:'ด',lastName:'ด'});
const rr=A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u3.token,sessionId:today.id});
ok(!A('checkin',{token:u3.token,code:'000000'},true).ok,'wrong code rejected');
const ci=A('checkin',{token:u3.token,code:today.id+'.'+today.checkinCode}); ok(ci && !ci.already,'checkin via QR');
const pts=A('me',{token:u3.token}).user.points; ok(pts.balance===6 && pts.earned===6,'6h -> 6 points');
ok(A('checkin',{token:u3.token,code:today.checkinCode}).already,'second checkin = already, code-only works');
ok(A('me',{token:u3.token}).user.points.balance===6,'no double points');
// materials lock
A('saveMaterial',{token:AT,material:{courseId:C[0].id,type:'slide',title:'deck',url:'https://x',visibility:'checkin'}});
A('saveMaterial',{token:AT,material:{courseId:C[0].id,sessionId:today.id,type:'photo',title:'pic',url:'https://p',visibility:'after'}});
const mt=A('myTrainings',{token:u3.token}); const t0=mt.list.find(x=>x.session.id===today.id);
ok(t0.materials.find(m=>m.title==='deck').url==='https://x','checkin material unlocked after checkin & start');
ok(t0.materials.find(m=>m.title==='pic').locked,'photo locked until training ends');
const mtU=A('myTrainings',{token:u2.token}).list.find(x=>x.session.id===SS[6].id); ok(mtU.materials.find(m=>m.title==='deck').locked,'locked before checkin');
// certificate expiry
ctx.insert_('Templates',{id:'T1',name:'t',imageFileId:'x',config:JSON.stringify(ctx.defaultTemplateConfig('#000','#111'))});
ctx.update_('Courses',C[0].id,{defaultTemplateId:'T1'});
const iss=A('issueCerts',{token:AT,regIds:[rr.id]}); ok(iss.length===1,'cert issued '+iss[0].certNo);
ok(/แบบประเมิน/.test(A('getCertificate',{token:u3.token,regId:rr.id},true).error||''),'cert locked until evaluation');
ok(A('myTrainings',{token:u3.token}).list.find(x=>x.reg.id===rr.id).certLocked===true,'myTrainings flags certLocked');
ok(!A('submitEvaluation',{token:u3.token,regId:rr.id,answers:[4,4,3]},true).ok,'evaluation needs all 5 answers');
const ev=A('submitEvaluation',{token:u3.token,regId:rr.id,answers:[4,4,3,4,2],comment:'ดีมาก'}); ok(ev.evaluatedAt,'evaluation saved');
ok(!A('submitEvaluation',{token:u3.token,regId:rr.id,answers:[4,4,4,4,4]},true).ok,'evaluation only once');
const es=A('evaluationSummary',{token:AT,sessionId:today.id}); ok(es.count===1 && es.questions[4].avg===2 && es.comments.length===1,'evaluation summary');
const cert=A('getCertificate',{token:u3.token,regId:rr.id}); ok(cert.expires===day(0).slice(0,4)*1+1+day(0).slice(4),'expires +12 months '+cert.expires);
ok(A('verifyCert',{certNo:iss[0].certNo}).expired===false,'verify not expired');
const old=mk(-400); const u4=A('register',{email:'e@x.com',password:'secret1',firstName:'e',lastName:'e'});
const ro={id:'ROLD',userId:u4.user.id,sessionId:old.id,status:'attended',certNo:'OLD-1',evaluatedAt:'2025-01-01'}; ctx.insert_('Registrations',ro);
ok(/หมดอายุ/.test(A('getCertificate',{token:u4.token,regId:'ROLD'},true).error||''),'expired cert blocked for user');
ok(A('myTrainings',{token:u4.token}).list[0].certExpired===true,'myTrainings flags expired');
const v=A('verifyCert',{certNo:'OLD-1'}); ok(v.valid && v.expired,'verify shows expired but valid record');
ok(A('getCertificate',{token:AT,regId:'ROLD'}).certNo==='OLD-1','admin can still view expired');
// coupons + person no VAT
const ps=mk(30,{courseId:C[1].id,price:1000,vat:true,whtAllowed:true});
ok(!A('saveCoupon',{token:AT,coupon:{code:'x',sessionId:ps.id,kind:'amount',value:100}},true).ok,'coupon code validated');
A('saveCoupon',{token:AT,coupon:{code:'save20',sessionId:ps.id,kind:'percent',value:20,maxUses:1}});
ok(!A('checkCoupon',{token:u4.token,sessionId:SS[0].id,code:'SAVE20'},true).ok,'coupon only for its session');
ok(A('checkCoupon',{token:u4.token,sessionId:ps.id,code:'save20'}).value===20,'coupon check ok');
const pc=A('registerSession',{token:u4.token,sessionId:ps.id,saleName:'x',source:'y',couponCode:'save20',billing:{billingType:'person',billingName:'e'}});
ok(pc.discount===200 && pc.subtotal===800 && pc.vatAmount===0 && pc.total===800,'20% coupon, person no VAT '+JSON.stringify([pc.discount,pc.subtotal,pc.vatAmount,pc.total]));
const u6=A('register',{email:'g@x.com',password:'secret1',firstName:'f',lastName:'f'});
ok(/ครบ/.test(A('registerSession',{token:u6.token,sessionId:ps.id,saleName:'x',source:'y',couponCode:'SAVE20',billing:{billingType:'company',billingName:'co'}},true).error||''),'coupon max uses');
const pco=A('registerSession',{token:u6.token,sessionId:ps.id,saleName:'x',source:'y',billing:{billingType:'company',billingName:'co'},wht:true});
ok(pco.vatAmount===70 && pco.whtAmount===30 && pco.total===1040,'company VAT+WHT unchanged');
ok(A('listCoupons',{token:AT})[0].used===1,'coupon usage counted');
ok(!('speakerEmail' in A('listSessions',{token:u6.token}).sessions[0]),'speaker email hidden from users');
ok(!A('saveSession',{token:AT,session:{courseId:C[0].id,date:day(3),hours:6}},true).ok,'speaker required');
// speaker reminder (3 days before)
const sp=mk(2,{speakerEmail:'speaker@x.com'}); SENT.length=0; ctx.dailyJobs();
ok(SENT.some(m=>m.to==='speaker@x.com' && /แจ้งกำหนดการบรรยาย/.test(m.subject)),'speaker notified before training');
SENT.length=0; ctx.dailyJobs(); ok(!SENT.some(m=>m.to==='speaker@x.com'),'speaker notified only once');
// rewards
A('saveReward',{token:AT,reward:{kind:'item',name:'cup',points:5,stock:1,active:true}});
A('saveReward',{token:AT,reward:{kind:'prize',name:'pb',weight:1,stock:'',active:true}});
const rp=A('rewardsPage',{token:u3.token}); ok(rp.items.length===1 && rp.prizes.length===1,'rewards page');
const rd=A('redeemReward',{token:u3.token,rewardId:rp.items[0].id}); ok(rd.points.balance===1,'redeem deducts');
ok(/หมด/.test(A('redeemReward',{token:u3.token,rewardId:rp.items[0].id},true).error||''),'stock out');
A('adjustPoints',{token:AT,userId:u3.user.id,points:20,note:'bonus'});
const lk=A('luckyDraw',{token:u3.token}); ok(lk.prize.name==='pb' && lk.points.balance===11,'lucky draw -10');
const reds=A('listRedemptions',{token:AT}); A('setRedemption',{token:AT,id:reds[0].id,status:'cancelled'}); ok(A('me',{token:u3.token}).user.points.balance===21,'cancel redemption refunds');
A('saveSettings',{token:AT,settings:{REWARDS_ENABLED:'FALSE'}}); ok(!A('rewardsPage',{token:u3.token},true).ok,'rewards hidden for users');
ok(A('rewardsPage',{token:AT},true).ok,'admin still sees rewards');
// absent strike & export
A('setRegStatus',{token:AT,regIds:[rr.id],status:'absent'}); ok(A('me',{token:u3.token}).user.points.balance===15,'absent revokes 6 points');
const ex=A('exportRegistrations',{token:AT,courseId:C[2].id}); ok(ex.length===1 && ex[0].billingName==='ACME' && ex[0].total===4160,'export by course w/ billing');
ok(A('exportRegistrations',{token:AT,sessionId:SS[5].id}).length===0 && A('exportRegistrations',{token:AT,sessionId:SS[5].id,includeCancelled:true}).length===1,'export by session (+cancelled)');
const users=A('listUsers',{token:AT}); ok(users.find(x=>x.email==='c@x.com').billingName==='ACME','saveBilling stored on user');
// banners
A('saveBanner',{token:AT,banner:{placement:'schedule',title:'S',active:true}}); A('saveBanner',{token:AT,banner:{title:'H',active:true}});
const hb=A('publicHome',{}).banners; ok(hb.schedule && hb.home && hb.home[0].title==='H','banners by placement');
ok(A('publicHome',{}).settings.HERO_SPEED==='6' || A('publicHome',{}).settings.HERO_SPEED===6,'HERO_SPEED public');
// public home cache: served from cache, cleared on writes
const ph1=A('publicHome',{}); A('saveBanner',{token:AT,banner:{title:'H2',active:true}});
ok(A('publicHome',{}).banners.home.some(b=>b.title==='H2') && ph1.banners.home.every(b=>b.title!=='H2'),'publicHome cache cleared on banner save');
A('saveSettings',{token:AT,settings:{HERO_SPEED:'9'}}); ok(String(A('publicHome',{}).settings.HERO_SPEED)==='9','publicHome cache cleared on settings save');
ctx.warmCache(); ok(String(A('publicHome',{}).settings.HERO_SPEED)==='9','warmCache rebuilds publicHome');
A('saveSettings',{token:AT,settings:{HERO_SPEED:'6'}});
// daily jobs: reminder within 5 days + noshow
const soon=mk(4); const u5=A('register',{email:'f@x.com',password:'secret1',firstName:'f',lastName:'f'}); const rsoon=A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u5.token,sessionId:soon.id});
const past=mk(-2); ctx.insert_('Registrations',{id:'RP',userId:u5.user.id,sessionId:past.id,status:'registered'});
ctx.dailyJobs();
ok(!!ctx.findBy_('Registrations','id',rsoon.id).remindedAt,'reminder sent 5 days before');
ok(ctx.findBy_('Registrations','id','RP').status==='absent','auto no-show');
// geofence check-in (100 m from coords parsed out of the Google Maps link)
const gs=mk(0,{startTime:'00:00',endTime:'23:59',mapUrl:'https://www.google.com/maps/place/SSC/@13.70,100.60,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d13.7563!4d100.5018'});
ok(Number(gs.lat)===13.7563 && Number(gs.lng)===100.5018,'coords parsed from map link (!3d!4d preferred over @)');
ok(A('publicHome',{}).sessions.some(x=>x.id===gs.id && Number(x.lat)===13.7563),'coords public');
const u7=A('register',{email:'geo@x.com',password:'secret1',firstName:'g',lastName:'g'});
A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u7.token,sessionId:gs.id});
ok(/ตำแหน่ง/.test(A('checkin',{token:u7.token,code:gs.id+'.'+gs.checkinCode},true).error||''),'checkin without location rejected');
ok(/ห่าง.*1\.1 กม/.test(A('checkin',{token:u7.token,code:gs.id+'.'+gs.checkinCode,lat:13.7663,lng:100.5018,acc:10},true).error||''),'checkin 1.1 km away rejected');
ok(!A('checkin',{token:u7.token,code:gs.id+'.'+gs.checkinCode,lat:13.7577,lng:100.5018,acc:5},true).ok,'checkin 156 m away rejected');
const gok=A('checkin',{token:u7.token,code:gs.id+'.'+gs.checkinCode,lat:13.7570,lng:100.5018,acc:30}); ok(gok && !gok.already,'checkin 78 m away ok');
ok(ctx.findBy_('Registrations','id',gok.regId).checkinDist===78,'distance stored');
ok(A('checkin',{token:u7.token,code:gs.id+'.'+gs.checkinCode}).already,'already checked in needs no location');
A('saveSettings',{token:AT,settings:{CHECKIN_RADIUS_M:'0'}});
const gs2=mk(0,{startTime:'00:00',endTime:'23:59',lat:13.7563,lng:100.5018}); A('registerSession',{saleName:'Mr Teerawat Chatpomarat (Boy)',source:'อื่นๆ: test',token:u7.token,sessionId:gs2.id});
ok(A('checkin',{token:u7.token,code:gs2.id+'.'+gs2.checkinCode}).regId,'radius 0 = no location check');
A('saveSettings',{token:AT,settings:{CHECKIN_RADIUS_M:'100'}});
ok(/พิกัด/.test(A('saveSession',{token:AT,session:Object.assign({},gs2,{lat:200,lng:5})},true).error||''),'bad coords rejected');
console.log(fails?`\n${fails} FAILED`:'\nALL PASS');
