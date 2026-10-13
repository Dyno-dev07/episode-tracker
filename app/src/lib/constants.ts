import type { PlatformKey, PostStatus } from './types';

export const STAGES = [
  { label: 'Recording and edit', owner: 'Tyler' },
  { label: 'Review', owner: 'Nik' },
  { label: 'Approval', owner: 'Wes' },
  { label: 'Social package', owner: 'Deanne' },
  { label: 'Scheduled', owner: 'Deanne' },
  { label: 'Published', owner: 'Deanne' },
  { label: 'Verified', owner: 'Deanne' },
] as const;

export const OWNERS = ['Tyler', 'Nik', 'Wes', 'Deanne'] as const;

/** Muted platform colors matched in lightness. */
export const PLATFORMS: Record<PlatformKey, { label: string; color: string }> = {
  yt: { label: 'YouTube', color: 'oklch(0.52 0.12 28)' },
  ig: { label: 'Instagram', color: 'oklch(0.52 0.12 340)' },
  tt: { label: 'TikTok', color: 'oklch(0.52 0.12 190)' },
  li: { label: 'LinkedIn', color: 'oklch(0.52 0.12 250)' },
  fb: { label: 'Facebook', color: 'oklch(0.52 0.12 140)' },
};
export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];
export const tint = (c: string) => `color-mix(in oklch, ${c} 11%, white)`;

export const CHECKS = ['Post is live', 'Caption correct', 'Video plays', 'Link works', 'Correct account'];
export const PKG = [
  'Clips received in Google Drive',
  'Clips generated',
  'Captions written',
  'Captions approved',
  'Thumbnails ready',
];

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};
export const STATUS_COLORS: Record<PostStatus, [string, string]> = {
  draft: ['#EEF1F5', '#3A4556'],
  scheduled: ['#E6ECF6', '#1B2A4A'],
  published: ['#E7F2EB', '#2B6B43'],
  failed: ['#FBE9E9', '#A12B2B'],
};

export type EpisodeStatus = 'Complete' | 'Blocked' | 'Overdue' | 'On track';
export const EPISODE_STATUS_COLORS: Record<EpisodeStatus, [string, string]> = {
  Complete: ['#E7F2EB', '#2B6B43'],
  Blocked: ['#FBE9E9', '#A12B2B'],
  Overdue: ['#FDF1DE', '#8A5300'],
  'On track': ['#EEF1F5', '#3A4556'],
};

/** Avatar background and text colors. Deanne is the operator, so her stages use gold. */
export const avatarColors = (owner: string): [string, string] =>
  owner === 'Deanne' ? ['#C8A951', '#1B2A4A'] : ['#1B2A4A', '#FFFFFF'];

/** Stages owned by the social media operator, excluding Verified. */
export const isOperatorStage = (stage: number) => stage >= 3 && stage < 6;
