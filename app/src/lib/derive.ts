import { STAGES, type EpisodeStatus } from './constants';
import { diffDays } from './dates';
import type { Episode, FlatPost } from './types';

export const flatPosts = (e: Episode): FlatPost[] =>
  e.clips.flatMap((c) => c.posts.map((p) => ({ ...p, clipId: c.id, clip: c.name, len: c.len })));

export interface EpisodeInfo {
  posts: FlatPost[];
  overdue: boolean;
  status: EpisodeStatus;
  owner: string;
  publish: string;
  days: number;
}

export function episodeInfo(e: Episode, today: string): EpisodeInfo {
  const posts = flatPosts(e);
  const overdue = e.stage < 5 && e.due < today;
  const status: EpisodeStatus = e.stage === 6 ? 'Complete' : e.blocked ? 'Blocked' : overdue ? 'Overdue' : 'On track';
  const dated = posts.filter((p) => p.status !== 'draft').map((p) => p.date).sort();
  return { posts, overdue, status, owner: STAGES[e.stage].owner, publish: dated[0] || '', days: diffDays(e.entered, today) };
}

export const byDateTime = (a: { date: string; time: string }, b: { date: string; time: string }) =>
  (a.date + a.time).localeCompare(b.date + b.time);
