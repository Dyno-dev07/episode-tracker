-- Episode Tracker schema
-- Stages are stored as an index 0..6:
--   0 Recording and edit (Tyler), 1 Review (Nik), 2 Approval (Wes),
--   3 Social package, 4 Scheduled, 5 Published, 6 Verified (Deanne)

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  num integer not null unique,
  title text not null,
  stage smallint not null default 0 check (stage between 0 and 6),
  record_date date not null,
  due_date date not null,
  entered_date date not null default current_date,
  blocked text not null default '',
  drive_url text not null default '',
  pkg boolean[] not null default array[false, false, false, false, false],
  created_at timestamptz not null default now()
);

create table public.handoffs (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  from_stage smallint not null check (from_stage between 0 and 5),
  to_stage smallint not null check (to_stage between 1 and 6),
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index handoffs_episode_idx on public.handoffs (episode_id);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  name text not null,
  length text not null default '0:00',
  caption text not null default '',
  created_at timestamptz not null default now()
);
create index clips_episode_idx on public.clips (episode_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips (id) on delete cascade,
  platform text not null check (platform in ('yt', 'ig', 'tt', 'li', 'fb')),
  date date not null,
  time time not null default '09:00',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  url text not null default '',
  checks boolean[] not null default array[false, false, false, false, false],
  verified boolean not null default false,
  verified_date date,
  created_at timestamptz not null default now()
);
create index posts_clip_idx on public.posts (clip_id);

-- Access: any signed-in team member can read and write everything.
alter table public.episodes enable row level security;
alter table public.handoffs enable row level security;
alter table public.clips enable row level security;
alter table public.posts enable row level security;

create policy "team access" on public.episodes for all to authenticated using (true) with check (true);
create policy "team access" on public.handoffs for all to authenticated using (true) with check (true);
create policy "team access" on public.clips for all to authenticated using (true) with check (true);
create policy "team access" on public.posts for all to authenticated using (true) with check (true);

-- Moves an episode to the next stage and logs the handoff.
-- An episode leaves Published only when every post is verified.
create or replace function public.hand_off(p_episode uuid, p_note text, p_today date)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage smallint;
  v_unverified integer;
  v_total integer;
begin
  select stage into v_stage from public.episodes where id = p_episode for update;
  if v_stage is null then
    raise exception 'Episode not found';
  end if;
  if v_stage >= 6 then
    raise exception 'Episode is already verified';
  end if;
  if v_stage = 5 then
    select count(*), count(*) filter (where not p.verified)
      into v_total, v_unverified
      from public.posts p join public.clips c on c.id = p.clip_id
     where c.episode_id = p_episode;
    if v_total = 0 or v_unverified > 0 then
      raise exception 'Every post must be verified first';
    end if;
  end if;

  insert into public.handoffs (episode_id, from_stage, to_stage, date, note)
  values (p_episode, v_stage, v_stage + 1, p_today, coalesce(p_note, ''));

  update public.episodes
     set stage = v_stage + 1, entered_date = p_today, blocked = ''
   where id = p_episode;
end;
$$;

-- Marks a post verified once all five checks are ticked.
-- Returns true when this was the last post and the episode moved to Verified.
create or replace function public.verify_post(p_post uuid, p_today date)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_episode uuid;
  v_stage smallint;
  v_left integer;
begin
  update public.posts
     set verified = true, verified_date = p_today
   where id = p_post
     and status = 'published'
     and not verified
     and array_position(checks, false) is null
  returning (select episode_id from public.clips where id = clip_id) into v_episode;

  if v_episode is null then
    raise exception 'Post cannot be verified yet';
  end if;

  select stage into v_stage from public.episodes where id = v_episode;
  select count(*) into v_left
    from public.posts p join public.clips c on c.id = p.clip_id
   where c.episode_id = v_episode and not p.verified;

  if v_stage = 5 and v_left = 0 then
    perform public.hand_off(v_episode, 'All posts verified.', p_today);
    return true;
  end if;
  return false;
end;
$$;

-- Creates an episode with the next episode number.
create or replace function public.create_episode(p_title text, p_record date, p_due date, p_today date)
returns integer
language plpgsql
security invoker
as $$
declare
  v_num integer;
begin
  lock table public.episodes in share row exclusive mode;
  select coalesce(max(num), 0) + 1 into v_num from public.episodes;
  insert into public.episodes (num, title, stage, record_date, due_date, entered_date)
  values (v_num, p_title, 0, p_record, p_due, p_today);
  return v_num;
end;
$$;

-- Live updates for every open browser.
alter publication supabase_realtime add table public.episodes, public.handoffs, public.clips, public.posts;
