
create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('student', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.note_status as enum ('submitted', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.note_visibility as enum ('community', 'department');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.note_origin as enum ('student', 'ai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.study_kind as enum ('reviewer', 'summary', 'quiz', 'exam', 'keywords');
exception when duplicate_object then null; end $$;

-- Upgrade path for projects created before exam mode was added.
alter type public.study_kind add value if not exists 'exam';

do $$ begin
  create type public.suggestion_kind as enum ('course', 'subject', 'lesson', 'correction', 'platform');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.suggestion_status as enum ('open', 'under_review', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

-- ── Taxonomy ────────────────────────────────────────────────────────────────
create table if not exists public.departments (
  id text primary key,
  name text not null,
  short_name text not null,
  color text not null default '#FFD34D',
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  department_id text not null references public.departments(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (department_id, code)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  department_id text not null references public.departments(id) on delete cascade,
  code text not null default '',
  name text not null,
  year_level integer check (year_level between 1 and 6),
  semester integer check (semester in (1, 2)),
  description text,
  is_community boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists subjects_department_idx on public.subjects(department_id);
create index if not exists subjects_program_idx on public.subjects(program_id);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

create index if not exists topics_subject_idx on public.topics(subject_id);

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key,
  full_name text not null default 'New student',
  role public.user_role not null default 'student',
  department_id text references public.departments(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  year_level integer check (year_level between 1 and 6),
  semester integer check (semester in (1, 2)),
  bio text,
  avatar_color text not null default '#FFD34D',
  notifications_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path for projects created before these columns existed.
alter table public.profiles add column if not exists notifications_seen_at timestamptz not null default now();

create index if not exists profiles_department_idx on public.profiles(department_id);

-- ── Generated helpers ───────────────────────────────────────────────────────
-- array_to_string() is only STABLE because it can format any element type.
-- Keywords are always text[], so this narrow wrapper is safe to mark immutable
-- and use inside the generated search vector below.
create or replace function public.keywords_to_text(words text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select array_to_string(coalesce(words, '{}'::text[]), ' ');
$$;

-- ── Notes ───────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  department_id text not null references public.departments(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null check (char_length(title) between 4 and 200),
  summary text not null default '',
  content text,
  content_text text,
  visibility public.note_visibility not null default 'community',
  status public.note_status not null default 'verified',
  origin public.note_origin not null default 'student',
  year_level integer check (year_level between 1 and 6),
  semester integer check (semester in (1, 2)),
  keywords text[] not null default '{}',
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  views integer not null default 0,
  downloads integer not null default 0,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  moderator_note text,
  source_url text,
  revision_of uuid references public.notes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(content_text, '') || ' ' ||
      coalesce(public.keywords_to_text(keywords), '')
    )
  ) stored
);

create index if not exists notes_status_idx on public.notes(status);
create index if not exists notes_department_idx on public.notes(department_id);
create index if not exists notes_subject_idx on public.notes(subject_id);
create index if not exists notes_topic_idx on public.notes(topic_id);
create index if not exists notes_author_idx on public.notes(author_id);
create index if not exists notes_created_idx on public.notes(created_at desc);
create index if not exists notes_search_idx on public.notes using gin(search_vector);

-- Upgrade path for projects created before these columns existed.
alter table public.notes add column if not exists source_url text;
alter table public.notes add column if not exists revision_of uuid references public.notes(id) on delete set null;
create index if not exists notes_revision_of_idx on public.notes(revision_of);

-- ── Library & contributions ─────────────────────────────────────────────────
create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.topic_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.suggestion_kind not null default 'lesson',
  title text not null,
  details text not null default '',
  subject_id uuid references public.subjects(id) on delete set null,
  status public.suggestion_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suggestions_status_idx on public.suggestions(status);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.study_kind not null,
  title text not null,
  content text not null default '',
  payload jsonb not null default '{}'::jsonb,
  source_note_ids uuid[] not null default '{}',
  department_id text references public.departments(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_idx on public.ai_generations(user_id, created_at desc);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid not null references public.ai_generations(id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, created_at desc);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  note_id uuid references public.notes(id) on delete cascade,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_created_idx on public.activity(created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create unique index if not exists reports_one_open_per_user_note
  on public.reports(reporter_id, note_id)
  where status = 'open';

-- ── Moderation audit trail ──────────────────────────────────────────────────
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 2 and 40),
  note_id uuid references public.notes(id) on delete set null,
  suggestion_id uuid references public.suggestions(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_created_idx on public.moderation_actions(created_at desc);
create index if not exists moderation_actions_actor_idx on public.moderation_actions(actor_id);

-- ── Search telemetry (powers "no results" admin insight) ────────────────────
create table if not exists public.search_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  query text not null check (char_length(query) between 1 and 120),
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_created_idx on public.search_logs(created_at desc);
create index if not exists search_logs_query_idx on public.search_logs(lower(query));

-- ── Helper functions ────────────────────────────────────────────────────────
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'student'::public.user_role);
$$;

create or replace function public.is_moderator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role in ('moderator', 'admin') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_department()
returns text
language sql stable security definer set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_deleted_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

create or replace function public.log_note_activity()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity (actor_id, kind, note_id)
    values (new.author_id, 'note_submitted', new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity (actor_id, kind, note_id)
    values (
      coalesce(new.verified_by, new.author_id),
      case new.status
        when 'verified' then 'note_verified'
        when 'rejected' then 'note_rejected'
        else 'note_submitted'
      end,
      new.id
    );
  end if;
  return new;
end;
$$;

create or replace function public.record_note_download(target_note uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  next_count integer;
begin
  update public.notes n
     set downloads = downloads + 1
   where n.id = target_note
     and (
       n.status = 'verified'
       or n.author_id = auth.uid()
       or public.is_moderator()
     )
  returning n.downloads into next_count;
  return coalesce(next_count, 0);
end;
$$;

create or replace function public.record_note_view(target_note uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  next_count integer;
begin
  update public.notes n
     set views = views + 1
   where n.id = target_note
     and (
       n.status = 'verified'
       or n.author_id = auth.uid()
       or public.is_moderator()
     )
  returning n.views into next_count;
  return coalesce(next_count, 0);
end;
$$;

-- Moderation actions can only be written through this guard so the audit
-- trail cannot be forged or edited by non-moderators.
create or replace function public.log_moderation_action(
  p_action text,
  p_note uuid default null,
  p_suggestion uuid default null,
  p_report uuid default null,
  p_detail text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_moderator() then
    raise exception 'Moderator access required.' using errcode = '42501';
  end if;

  insert into public.moderation_actions (actor_id, action, note_id, suggestion_id, report_id, detail)
  values (auth.uid(), left(p_action, 40), p_note, p_suggestion, p_report, left(p_detail, 400));
end;
$$;

-- Aggregated search insight for the admin console.
create or replace function public.top_searches(p_limit integer default 8)
returns table (query text, hits bigint, zero_hits bigint)
language sql stable security definer set search_path = public
as $$
  select
    lower(l.query) as query,
    count(*) as hits,
    count(*) filter (where l.result_count = 0) as zero_hits
  from public.search_logs l
  where l.created_at > now() - interval '90 days'
    and public.is_admin()
  group by lower(l.query)
  order by zero_hits desc, hits desc
  limit greatest(1, least(coalesce(p_limit, 8), 25));
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists suggestions_updated_at on public.suggestions;
create trigger suggestions_updated_at
  before update on public.suggestions
  for each row execute function public.set_updated_at();

drop trigger if exists notes_activity on public.notes;
create trigger notes_activity
  after insert or update of status on public.notes
  for each row execute function public.log_note_activity();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.departments enable row level security;
alter table public.programs enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.topic_bookmarks enable row level security;
alter table public.suggestions enable row level security;
alter table public.ai_generations enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.activity enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.search_logs enable row level security;

-- Taxonomy: readable by everyone signed in, curated by admins.
drop policy if exists "taxonomy read" on public.departments;
create policy "taxonomy read" on public.departments for select to authenticated using (true);
drop policy if exists "departments admin write" on public.departments;
create policy "departments admin write" on public.departments for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "programs read" on public.programs;
create policy "programs read" on public.programs for select to authenticated using (true);
drop policy if exists "programs admin write" on public.programs;
create policy "programs admin write" on public.programs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subjects read" on public.subjects;
create policy "subjects read" on public.subjects for select to authenticated using (true);
drop policy if exists "subjects admin write" on public.subjects;
create policy "subjects admin write" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "topics read" on public.topics;
create policy "topics read" on public.topics for select to authenticated using (true);
drop policy if exists "topics admin write" on public.topics;
create policy "topics admin write" on public.topics for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);

drop policy if exists "profile self insert" on public.profiles;
create policy "profile self insert" on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'student');

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());

drop policy if exists "profile admin update" on public.profiles;
create policy "profile admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profile admin delete" on public.profiles;
create policy "profile admin delete" on public.profiles for delete to authenticated using (public.is_admin());

-- Notes
drop policy if exists "notes read" on public.notes;
create policy "notes read" on public.notes for select to authenticated
  using (
    (status = 'verified' and (visibility = 'community' or department_id = public.current_department()))
    or author_id = auth.uid()
    or public.is_moderator()
  );

-- Notes publish immediately. Only moderators may stamp verification metadata.
drop policy if exists "notes insert own" on public.notes;
create policy "notes insert own" on public.notes for insert to authenticated
  with check (
    author_id = auth.uid()
    and origin = 'student'
    and (public.current_department() is null or department_id = public.current_department())
    and (
      public.is_moderator()
      or (status in ('submitted', 'verified') and verified_by is null)
    )
  );

drop policy if exists "notes update" on public.notes;
create policy "notes update" on public.notes for update to authenticated
  using (public.is_moderator() or author_id = auth.uid())
  with check (
    public.is_moderator()
    or (
      author_id = auth.uid()
      and origin = 'student'
      and status in ('submitted', 'verified')
      and verified_by is null
    )
  );

drop policy if exists "notes delete" on public.notes;
create policy "notes delete" on public.notes for delete to authenticated
  using (public.is_moderator() or author_id = auth.uid());

-- Bookmarks
drop policy if exists "bookmarks read own" on public.bookmarks;
create policy "bookmarks read own" on public.bookmarks for select to authenticated using (user_id = auth.uid());
drop policy if exists "bookmarks insert own" on public.bookmarks;
create policy "bookmarks insert own" on public.bookmarks for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.notes n where n.id = note_id)
  );
drop policy if exists "bookmarks delete own" on public.bookmarks;
create policy "bookmarks delete own" on public.bookmarks for delete to authenticated using (user_id = auth.uid());

drop policy if exists "topic bookmarks read own" on public.topic_bookmarks;
create policy "topic bookmarks read own" on public.topic_bookmarks for select to authenticated using (user_id = auth.uid());
drop policy if exists "topic bookmarks insert own" on public.topic_bookmarks;
create policy "topic bookmarks insert own" on public.topic_bookmarks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "topic bookmarks delete own" on public.topic_bookmarks;
create policy "topic bookmarks delete own" on public.topic_bookmarks for delete to authenticated using (user_id = auth.uid());

-- Suggestions
drop policy if exists "suggestions read" on public.suggestions;
create policy "suggestions read" on public.suggestions for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
drop policy if exists "suggestions insert own" on public.suggestions;
create policy "suggestions insert own" on public.suggestions for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');
drop policy if exists "suggestions moderator update" on public.suggestions;
create policy "suggestions moderator update" on public.suggestions for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- AI generations
drop policy if exists "generations read own" on public.ai_generations;
create policy "generations read own" on public.ai_generations for select to authenticated using (user_id = auth.uid());
drop policy if exists "generations insert own" on public.ai_generations;
create policy "generations insert own" on public.ai_generations for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "generations update own" on public.ai_generations;
create policy "generations update own" on public.ai_generations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "generations delete own" on public.ai_generations;
create policy "generations delete own" on public.ai_generations for delete to authenticated using (user_id = auth.uid());

-- Quiz attempts
drop policy if exists "attempts read own" on public.quiz_attempts;
create policy "attempts read own" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
drop policy if exists "attempts insert own" on public.quiz_attempts;
create policy "attempts insert own" on public.quiz_attempts for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.ai_generations g where g.id = generation_id and g.user_id = auth.uid())
  );

-- Activity feed
drop policy if exists "activity read" on public.activity;
create policy "activity read" on public.activity for select to authenticated using (true);

-- Reports
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'open'
    and exists (select 1 from public.notes n where n.id = note_id)
  );
drop policy if exists "reports read moderator" on public.reports;
create policy "reports read moderator" on public.reports for select to authenticated using (public.is_moderator());
drop policy if exists "reports update moderator" on public.reports;
create policy "reports update moderator" on public.reports for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- Audit trail: moderators can read it, only the guard function writes it.
drop policy if exists "moderation actions read" on public.moderation_actions;
create policy "moderation actions read" on public.moderation_actions for select to authenticated
  using (public.is_moderator());

-- Search telemetry: users log their own searches; admins read aggregates
-- through public.top_searches().
drop policy if exists "search logs insert own" on public.search_logs;
create policy "search logs insert own" on public.search_logs for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "search logs read admin" on public.search_logs;
create policy "search logs read admin" on public.search_logs for select to authenticated
  using (public.is_admin());

-- Function grants
-- Postgres grants EXECUTE to PUBLIC by default. Keep the counter functions
-- limited to signed-in users so anonymous visitors cannot inflate views.
revoke all on function public.record_note_download(uuid) from public;
revoke all on function public.record_note_view(uuid) from public;
revoke all on function public.log_moderation_action(text, uuid, uuid, uuid, text) from public;
revoke all on function public.top_searches(integer) from public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_moderator() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_department() to authenticated;
grant execute on function public.record_note_download(uuid) to authenticated;
grant execute on function public.record_note_view(uuid) to authenticated;
grant execute on function public.log_moderation_action(text, uuid, uuid, uuid, text) to authenticated;
grant execute on function public.top_searches(integer) to authenticated;

-- ── Storage ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-files',
  'note-files',
  false,
  15728640,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

drop policy if exists "note files read" on storage.objects;
create policy "note files read" on storage.objects for select to authenticated
  using (
    bucket_id = 'note-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_moderator()
      or exists (
        select 1 from public.notes n
        where n.file_path = name
          and (
            n.author_id = auth.uid()
            or (n.status = 'verified' and (n.visibility = 'community' or n.department_id = public.current_department()))
            or public.is_moderator()
          )
      )
    )
  );

drop policy if exists "note files upload" on storage.objects;
create policy "note files upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'note-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "note files delete" on storage.objects;
create policy "note files delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'note-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_moderator()
    )
  );

-- Done. Run supabase/seed.sql next for demo content.
