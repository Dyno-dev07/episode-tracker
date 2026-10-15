import type { Episode, PlatformKey, PostStatus } from '../lib/types';

export interface PostPatch {
  date?: string;
  time?: string;
  status?: PostStatus;
  url?: string;
  checks?: boolean[];
}

export interface EpisodePatch {
  num?: number;
  title?: string;
  record?: string;
  due?: string;
  blocked?: string;
  drive?: string;
  pkg?: boolean[];
}

export interface NewPost {
  plat: PlatformKey;
  date: string;
  time: string;
  status: 'draft' | 'scheduled';
}

/** Everything the app reads and writes. Implemented by Supabase and by a local demo store. */
export interface Store {
  kind: 'supabase' | 'local';
  load(): Promise<Episode[]>;
  /** Calls onChange whenever data changes elsewhere. Returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void;
  createEpisode(title: string, record: string, due: string, today: string): Promise<number>;
  handOff(episodeId: string, note: string, today: string): Promise<void>;
  /** Removes the episode with its handoffs, clips and posts. */
  deleteEpisode(episodeId: string): Promise<void>;
  updateEpisode(episodeId: string, patch: EpisodePatch): Promise<void>;
  addClip(episodeId: string, clip: { name: string; len: string; caption: string }, posts: NewPost[]): Promise<void>;
  updateClip(clipId: string, patch: { name?: string; len?: string; caption?: string }): Promise<void>;
  /** Removes the clip and all of its posts. */
  deleteClip(clipId: string): Promise<void>;
  addPost(clipId: string, post: NewPost): Promise<void>;
  deletePost(postId: string): Promise<void>;
  /** Setting a status other than published clears verification. */
  updatePost(postId: string, patch: PostPatch): Promise<void>;
  /** Returns true when the episode moved to Verified. */
  verifyPost(postId: string, today: string): Promise<boolean>;
}
