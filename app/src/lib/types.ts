export type PlatformKey = 'yt' | 'ig' | 'tt' | 'li' | 'fb';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface Post {
  id: string;
  plat: PlatformKey;
  date: string;
  time: string;
  status: PostStatus;
  url: string;
  checks: boolean[];
  verified: boolean;
  vDate: string;
}

export interface Clip {
  id: string;
  name: string;
  len: string;
  caption: string;
  posts: Post[];
}

export interface Handoff {
  id: string;
  fs: number;
  ts: number;
  date: string;
  note: string;
}

export interface Episode {
  id: string;
  num: number;
  title: string;
  stage: number;
  record: string;
  due: string;
  entered: string;
  blocked: string;
  /** Date the episode was put on hold, or '' when active. */
  holdSince: string;
  holdNote: string;
  drive: string;
  pkg: boolean[];
  handoffs: Handoff[];
  clips: Clip[];
}

/** A post flattened with its clip, as used by most views. */
export interface FlatPost extends Post {
  clipId: string;
  clip: string;
  len: string;
}
