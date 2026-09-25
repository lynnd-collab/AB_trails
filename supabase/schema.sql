-- Run this in your Supabase SQL editor
-- https://supabase.com/dashboard/project/usukvxqbeokypwsueazo/sql

create table if not exists trailheads (
  id          uuid primary key default gen_random_uuid(),
  longitude   double precision not null,
  latitude    double precision not null,
  note        text,
  trail_name  text,
  created_at  timestamptz default now()
);

alter table trailheads enable row level security;

drop policy if exists "Public read"   on trailheads;
drop policy if exists "Public insert" on trailheads;
drop policy if exists "Public update" on trailheads;
drop policy if exists "Public delete" on trailheads;

create policy "Public read"   on trailheads for select using (true);
create policy "Public insert" on trailheads for insert with check (true);
create policy "Public update" on trailheads for update using (true) with check (true);
create policy "Public delete" on trailheads for delete using (true);

-- Photos table
create table if not exists pin_photos (
  id          uuid primary key default gen_random_uuid(),
  pin_id      uuid not null references trailheads(id) on delete cascade,
  photo_url   text not null,
  created_at  timestamptz default now()
);

alter table pin_photos enable row level security;

drop policy if exists "Public read"   on pin_photos;
drop policy if exists "Public insert" on pin_photos;
drop policy if exists "Public delete" on pin_photos;

create policy "Public read"   on pin_photos for select using (true);
create policy "Public insert" on pin_photos for insert with check (true);
create policy "Public delete" on pin_photos for delete using (true);
