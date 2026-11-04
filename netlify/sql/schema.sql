-- ฐานข้อมูล SSC Training Portal บน Supabase
-- แต่ละชีตเก็บเป็น JSON 2 มิติ (แถวแรกเป็นหัวคอลัมน์) เหมือนใน Google Sheet เดิม
create table if not exists tp_sheets (name text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists tp_props (k text primary key, v text);
create table if not exists tp_meta (k text primary key, v bigint not null);
-- เข้าถึงจากฝั่งเซิร์ฟเวอร์ (Netlify Functions) เท่านั้น: เปิด RLS โดยไม่มี policy สาธารณะ
alter table tp_sheets enable row level security;
alter table tp_props enable row level security;
alter table tp_meta enable row level security;
-- สำรองข้อมูลอัตโนมัติ: เก็บสำเนาชีตก่อนถูกแก้ ชั่วโมงละไม่เกิน 1 ชุดต่อชีต เก็บไว้ 14 วัน (ย้อนกลับได้)
create table if not exists tp_history (id bigserial primary key, name text not null, data jsonb not null, saved_at timestamptz not null default now());
create index if not exists tp_history_name_at on tp_history (name, saved_at);
alter table tp_history enable row level security;
create or replace function tp_keep_history() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from tp_history where name = old.name and saved_at > now() - interval '1 hour') then
    insert into tp_history (name, data) values (old.name, old.data);
    delete from tp_history where saved_at < now() - interval '14 days';
  end if;
  return new;
end $$;
drop trigger if exists tp_sheets_history on tp_sheets;
create trigger tp_sheets_history before update on tp_sheets for each row execute function tp_keep_history();
revoke all on tp_sheets, tp_props, tp_meta, tp_history from anon, authenticated;
-- ผู้ใช้ฐานข้อมูลสำหรับ Netlify Functions (ตั้งรหัสผ่านแยก ใส่ใน DATABASE_URL บน Netlify เท่านั้น):
--   create role tp_app login password '<รหัสผ่าน>';
--   grant usage on schema public to tp_app;
--   grant select, insert, update, delete on tp_sheets, tp_props, tp_meta, tp_history to tp_app;
--   grant usage on sequence tp_history_id_seq to tp_app;
--   create policy tp_app_all on tp_sheets for all to tp_app using (true) with check (true);  (ทำแบบเดียวกันกับ tp_props tp_meta tp_history)
