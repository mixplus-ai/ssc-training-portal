// งานประจำวัน 08:00 น. เวลาไทย (01:00 UTC): อีเมลเตือนก่อนวันอบรม + บันทึก “ไม่มา” อัตโนมัติ
import { purgeCache } from '@netlify/functions';
import { run, sendMails } from '../lib/runtime.mjs';

export default async () => {
  if (!process.env.DATABASE_URL) return;
  const out = await run(null, {}, { fn: 'dailyJobs' });
  await sendMails(out.mails);
  if (out.homeChanged) await purgeCache({ tags: ['home'] }).catch(() => { });
  console.log('dailyJobs', JSON.stringify(out.result), 'mails', out.mails.length);
};

export const config = { schedule: '0 1 * * *' };
