// ============================================================
//  Supabase Configuration
//  Fill in your credentials from:
//  https://supabase.com/dashboard/project/_/settings/api
// ============================================================

export const SUPABASE_URL     = "https://qepiygwbztubyigmfapq.supabase.co";      // e.g. https://xyzcompany.supabase.co
export const SUPABASE_ANON_KEY = "sb_publishable_TGzyFHLUIgOcmAhrDPwIZA_UYVegu6u"; // public anon key

// ── DATABASE SETUP (run in Supabase SQL Editor) ─────────────
//
//  -- Enable UUID support (run once per project)
//  create extension if not exists "uuid-ossp";
//
//  -- Create messages table
//  create table messages (
//    id          uuid primary key default uuid_generate_v4(),
//    student_id  text not null,
//    text        text not null,
//    image       text,
//    created_at  timestamptz default now()
//  );
//
//  -- Row Level Security
//  alter table messages enable row level security;
//
//  create policy "Public reads"
//    on messages for select using (true);
//
//  create policy "Public inserts"
//    on messages for insert with check (true);
//
// ── STORAGE SETUP ────────────────────────────────────────────
//
//  1. Go to Storage → New Bucket
//  2. Name: memories  |  Toggle: Public bucket ON → Save
//  3. Add policies on the "memories" bucket:
//       SELECT → true (public reads)
//       INSERT → true (anyone can upload)
//
//  Or run this SQL:
//  insert into storage.buckets (id, name, public)
//    values ('memories', 'memories', true);
//
//  create policy "Public read memories"   on storage.objects
//    for select using ( bucket_id = 'memories' );
//
//  create policy "Public upload memories" on storage.objects
//    for insert with check ( bucket_id = 'memories' );
//
// ─────────────────────────────────────────────────────────────
