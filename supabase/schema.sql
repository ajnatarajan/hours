-- Hours MVP Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  created_at timestamp with time zone default now()
);

-- Room state (timer sync + shared settings)
create table if not exists room_state (
  room_id uuid primary key references rooms(id) on delete cascade,
  started_at timestamp with time zone,
  running boolean default false,
  timer_seconds int default 1500,  -- Default 25 minutes in seconds
  background_id text default 'video-1'
);

-- Participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  is_active boolean default true,
  do_not_disturb boolean default false,
  last_seen timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Migration: Add do_not_disturb column if it doesn't exist
-- Run this in Supabase SQL Editor for existing databases:
-- ALTER TABLE participants ADD COLUMN IF NOT EXISTS do_not_disturb boolean DEFAULT false;

-- Migration: Add background_id column if it doesn't exist
-- Run this in Supabase SQL Editor for existing databases:
-- ALTER TABLE room_state ADD COLUMN IF NOT EXISTS background_id text DEFAULT 'video-1';

-- Migration: Remove focus/break system and simplify to single timer
-- Run this in Supabase SQL Editor for existing databases:
-- ALTER TABLE room_state ADD COLUMN IF NOT EXISTS timer_minutes int DEFAULT 25;
-- UPDATE room_state SET timer_minutes = focus_minutes WHERE timer_minutes IS NULL;
-- ALTER TABLE room_state DROP COLUMN IF EXISTS phase;
-- ALTER TABLE room_state DROP COLUMN IF EXISTS focus_minutes;
-- ALTER TABLE room_state DROP COLUMN IF EXISTS break_minutes;

-- Migration: Change timer_minutes to timer_seconds for HH:MM:SS support
-- Run this in Supabase SQL Editor for existing databases:
-- ALTER TABLE room_state ADD COLUMN timer_seconds int DEFAULT 1500;
-- UPDATE room_state SET timer_seconds = timer_minutes * 60;
-- ALTER TABLE room_state DROP COLUMN timer_minutes;

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  content text not null,
  done boolean default false,
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Messages (chat)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  content text not null,
  message_type text default 'user' check (message_type in ('user', 'system')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_participants_room_id on participants(room_id);
create index if not exists idx_tasks_room_id on tasks(room_id);
create index if not exists idx_tasks_participant_id on tasks(participant_id);
create index if not exists idx_messages_room_id on messages(room_id);
create index if not exists idx_messages_created_at on messages(created_at);

-- ============================================
-- ENABLE REALTIME
-- ============================================

alter publication supabase_realtime add table room_state;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table rooms;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table rooms enable row level security;
alter table room_state enable row level security;
alter table participants enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;

-- Permissive policies for private/personal use
-- (In production, you'd want more restrictive policies)

create policy "Allow all operations on rooms" on rooms
  for all using (true) with check (true);

create policy "Allow all operations on room_state" on room_state
  for all using (true) with check (true);

create policy "Allow all operations on participants" on participants
  for all using (true) with check (true);

create policy "Allow all operations on tasks" on tasks
  for all using (true) with check (true);

create policy "Allow all operations on messages" on messages
  for all using (true) with check (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create a room with its initial state
create or replace function create_room_with_state(
  p_code text,
  p_name text default null
)
returns uuid
language plpgsql
as $$
declare
  v_room_id uuid;
begin
  -- Create the room
  insert into rooms (code, name)
  values (p_code, p_name)
  returning id into v_room_id;
  
  -- Create the initial room state
  insert into room_state (room_id)
  values (v_room_id);
  
  return v_room_id;
end;
$$;

