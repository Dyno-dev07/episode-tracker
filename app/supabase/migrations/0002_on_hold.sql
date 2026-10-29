-- Episodes can be put on hold until further notice.
-- While on hold an episode cannot be handed off, and verifying its last post
-- does not move it to Verified until it is resumed.

alter table public.episodes
  add column hold_since date,
  add column hold_note text not null default '';

create or replace function public.hand_off(p_episode uuid, p_note text, p_today date)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage smallint;
  v_hold date;
  v_unverified integer;
  v_total integer;
begin
  select stage, hold_since into v_stage, v_hold from public.episodes where id = p_episode for update;
  if v_stage is null then
    raise exception 'Episode not found';
  end if;
  if v_hold is not null then
    raise exception 'Episode is on hold. Resume it before handing off';
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

create or replace function public.verify_post(p_post uuid, p_today date)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_episode uuid;
  v_stage smallint;
  v_hold date;
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

  select stage, hold_since into v_stage, v_hold from public.episodes where id = v_episode;
  select count(*) into v_left
    from public.posts p join public.clips c on c.id = p.clip_id
   where c.episode_id = v_episode and not p.verified;

  if v_stage = 5 and v_left = 0 and v_hold is null then
    perform public.hand_off(v_episode, 'All posts verified.', p_today);
    return true;
  end if;
  return false;
end;
$$;
