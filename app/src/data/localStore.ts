import { CHECKS, PKG } from '../lib/constants';
import type { Episode, Post } from '../lib/types';
import { seedEpisodes } from './seed';
import type { Store } from './store';

const KEY = 'episode-tracker-demo';

/** Browser-only store used when Supabase is not configured. Data stays in this browser. */
export function createLocalStore(): Store {
  let data: Episode[] = read();
  const subs = new Set<() => void>();
  let seq = Date.now();
  const uid = (p: string) => p + (seq++).toString(36);

  function read(): Episode[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through to seed */
    }
    return seedEpisodes();
  }
  function write(fn: (eps: Episode[]) => void) {
    const next: Episode[] = structuredClone(data);
    fn(next);
    data = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable, keep in memory */
    }
  }
  const ep = (eps: Episode[], id: string) => {
    const e = eps.find((x) => x.id === id);
    if (!e) throw new Error('Episode not found');
    return e;
  };
  const findPost = (eps: Episode[], id: string): [Episode, Post] => {
    for (const e of eps) for (const c of e.clips) for (const p of c.posts) if (p.id === id) return [e, p];
    throw new Error('Post not found');
  };
  const advance = (e: Episode, note: string, today: string) => {
    e.handoffs.push({ id: uid('h'), fs: e.stage, ts: e.stage + 1, date: today, note });
    e.stage++;
    e.entered = today;
    e.blocked = '';
  };
  const blankPost = () => ({ url: '', checks: CHECKS.map(() => false), verified: false, vDate: '' });

  return {
    kind: 'local',
    async load() {
      return structuredClone(data);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    async createEpisode(title, record, due, today) {
      const num = Math.max(0, ...data.map((x) => x.num)) + 1;
      write((eps) =>
        eps.push({ id: uid('ep'), num, title, stage: 0, record, due, entered: today, blocked: '', drive: '', pkg: PKG.map(() => false), handoffs: [], clips: [] }),
      );
      return num;
    },
    async handOff(id, note, today) {
      write((eps) => {
        const e = ep(eps, id);
        const posts = e.clips.flatMap((c) => c.posts);
        if (e.stage >= 6) throw new Error('Episode is already verified');
        if (e.stage === 5 && (!posts.length || posts.some((p) => !p.verified))) throw new Error('Every post must be verified first');
        advance(e, note, today);
      });
    },
    async deleteEpisode(id) {
      write((eps) => {
        ep(eps, id);
        eps.splice(
          eps.findIndex((x) => x.id === id),
          1,
        );
      });
    },
    async updateEpisode(id, patch) {
      write((eps) => Object.assign(ep(eps, id), patch));
    },
    async addClip(id, clip, posts) {
      write((eps) =>
        ep(eps, id).clips.push({ id: uid('c'), ...clip, posts: posts.map((p) => ({ id: uid('p'), ...p, ...blankPost() })) }),
      );
    },
    async addPost(clipId, post) {
      write((eps) => {
        const clip = eps.flatMap((e) => e.clips).find((c) => c.id === clipId);
        if (!clip) throw new Error('Clip not found');
        clip.posts.push({ id: uid('p'), ...post, ...blankPost() });
      });
    },
    async updatePost(id, patch) {
      write((eps) => {
        const [, p] = findPost(eps, id);
        Object.assign(p, patch);
        if (patch.status && patch.status !== 'published') {
          p.verified = false;
          p.vDate = '';
        }
      });
    },
    async verifyPost(id, today) {
      let moved = false;
      write((eps) => {
        const [e, p] = findPost(eps, id);
        if (p.status !== 'published' || p.verified || p.checks.some((c) => !c)) throw new Error('Post cannot be verified yet');
        p.verified = true;
        p.vDate = today;
        if (e.stage === 5 && e.clips.every((c) => c.posts.every((x) => x.verified))) {
          advance(e, 'All posts verified.', today);
          moved = true;
        }
      });
      return moved;
    },
  };
}
