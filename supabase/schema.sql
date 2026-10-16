-- เตรียมไว้สำหรับ Phase 2 (ย้ายจาก localStorage ไป Supabase) — ยังไม่ได้ใช้ใน MVP
create table profiles (
  id uuid primary key default gen_random_uuid(),
  google_sub text unique not null,
  name text, email text,
  consent_at timestamptz,
  pilot_audio_consent boolean default false,
  created_at timestamptz default now()
);

create table progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  level int not null default 1 check (level between 1 and 3),
  stage int not null default 1 check (stage between 1 and 5),
  fail_streak int not null default 0,
  completed boolean not null default false,
  repeat_item_ids text[] not null default '{}',
  updated_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  kind text not null check (kind in ('placement','practice')),
  level int, stage int, pct numeric, passed boolean,
  started_at timestamptz default now()
);

create table item_results (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  item_id text not null,
  status text not null check (status in ('correct','wrong','skipped','practiced')),
  cues int not null default 0,
  attempts int not null default 1,
  transcript text
);
