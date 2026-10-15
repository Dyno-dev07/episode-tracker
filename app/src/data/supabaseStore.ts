import type { SupabaseClient } from '@supabase/supabase-js';
import type { Episode, PlatformKey, PostStatus } from '../lib/types';
import type { NewPost, PostPatch, Store } from './store';

interface PostRow {
  id: string;
  platform: PlatformKey;
  date: string;
  time: string;
  status: PostStatus;
  url: string;
  checks: boolean[];
  verified: boolean;
  verified_date: string | null;
  created_at: string;
}
interface ClipRow {
  id: string;
  name: string;
  length: string;
  caption: string;
  created_at: string;
  posts: PostRow[];
}
interface EpisodeRow {
  id: string;
  num: number;
  title: string;
  stage: number;
  record_date: string;
  due_date: string;
  entered_date: string;
  blocked: string;
  drive_url: string;
  pkg: boolean[];
  handoffs: { id: string; from_stage: number; to_stage: number; date: string; note: string; created_at: string }[];
  clips: ClipRow[];
}

const byCreated = (a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at);

function toEpisode(r: EpisodeRow): Episode {
  return {
    id: r.id,
    num: r.num,
    title: r.title,
    stage: r.stage,
    record: r.record_date,
    due: r.due_date,
    entered: r.entered_date,
    blocked: r.blocked,
    drive: r.drive_url,
    pkg: r.pkg,
    handoffs: r.handoffs.sort(byCreated).map((h) => ({ id: h.id, fs: h.from_stage, ts: h.to_stage, date: h.date, note: h.note })),
    clips: r.clips.sort(byCreated).map((c) => ({
      id: c.id,
      name: c.name,
      len: c.length,
      caption: c.caption,
      posts: c.posts.sort(byCreated).map((p) => ({
        id: p.id,
        plat: p.platform,
        date: p.date,
        time: p.time.slice(0, 5),
        status: p.status,
        url: p.url,
        checks: p.checks,
        verified: p.verified,
        vDate: p.verified_date || '',
      })),
    })),
  };
}

const postRow = (p: NewPost) => ({ platform: p.plat, date: p.date, time: p.time, status: p.status });

async function check<T>(q: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export function createSupabaseStore(sb: SupabaseClient): Store {
  return {
    kind: 'supabase',
    async load() {
      const rows = await check(
        sb
          .from('episodes')
          .select('*, handoffs(*), clips(*, posts(*))')
          .order('num', { ascending: true }),
      );
      return (rows as EpisodeRow[]).map(toEpisode);
    },
    subscribe(onChange) {
      const ch = sb.channel('episode-tracker');
      for (const table of ['episodes', 'handoffs', 'clips', 'posts'])
        ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange());
      ch.subscribe();
      return () => {
        sb.removeChannel(ch);
      };
    },
    async createEpisode(title, record, due, today) {
      return check(sb.rpc('create_episode', { p_title: title, p_record: record, p_due: due, p_today: today }));
    },
    async handOff(id, note, today) {
      await check(sb.rpc('hand_off', { p_episode: id, p_note: note, p_today: today }));
    },
    async deleteEpisode(id) {
      // Handoffs, clips and posts are removed by the foreign key cascades.
      await check(sb.from('episodes').delete().eq('id', id));
    },
    async updateEpisode(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.num !== undefined) row.num = patch.num;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.record !== undefined) row.record_date = patch.record;
      if (patch.due !== undefined) row.due_date = patch.due;
      if (patch.blocked !== undefined) row.blocked = patch.blocked;
      if (patch.drive !== undefined) row.drive_url = patch.drive;
      if (patch.pkg !== undefined) row.pkg = patch.pkg;
      const { error } = await sb.from('episodes').update(row).eq('id', id);
      if (error?.code === '23505') throw new Error(`EP ${patch.num} already exists.`);
      if (error) throw new Error(error.message);
    },
    async addClip(id, clip, posts) {
      const created = await check(
        sb.from('clips').insert({ episode_id: id, name: clip.name, length: clip.len, caption: clip.caption }).select('id').single(),
      );
      if (posts.length) await check(sb.from('posts').insert(posts.map((p) => ({ clip_id: created!.id, ...postRow(p) }))));
    },
    async updateClip(clipId, patch) {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.len !== undefined) row.length = patch.len;
      if (patch.caption !== undefined) row.caption = patch.caption;
      await check(sb.from('clips').update(row).eq('id', clipId));
    },
    async deleteClip(clipId) {
      // Posts are removed by the foreign key cascade.
      await check(sb.from('clips').delete().eq('id', clipId));
    },
    async deletePost(postId) {
      await check(sb.from('posts').delete().eq('id', postId));
    },
    async addPost(clipId, post) {
      await check(sb.from('posts').insert({ clip_id: clipId, ...postRow(post) }));
    },
    async updatePost(id, patch: PostPatch) {
      const row: Record<string, unknown> = { ...patch };
      if (patch.status && patch.status !== 'published') {
        row.verified = false;
        row.verified_date = null;
      }
      await check(sb.from('posts').update(row).eq('id', id));
    },
    async verifyPost(id, today) {
      return check(sb.rpc('verify_post', { p_post: id, p_today: today }));
    },
  };
}
