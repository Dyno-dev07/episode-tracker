import { CHECKS, PKG } from '../lib/constants';
import { addDays } from '../lib/dates';
import type { Episode, PlatformKey, PostStatus } from '../lib/types';

// Sample episodes for demo mode and supabase/seed.sql.
// Dates are written as MM-DD in 2026. Verification is 'V' (verified) or the number of checks ticked.

type SeedPost = [PlatformKey, string, string, PostStatus, 'V' | number];
type SeedClip = [string, string, string, SeedPost[]];

const PLATFORM_URL: Record<PlatformKey, string> = {
  yt: 'youtube.com/shorts/',
  ig: 'instagram.com/reel/',
  tt: 'tiktok.com/@wsc/video/',
  li: 'linkedin.com/feed/update/',
  fb: 'facebook.com/wsc/videos/',
};

const D = (s: string) => '2026-' + s;

export function seedEpisodes(): Episode[] {
  let pid = 0;
  function mk(
    num: number,
    title: string,
    stage: number,
    record: string,
    doneDates: string[],
    due: string,
    o: { notes?: string[]; clips?: SeedClip[]; blocked?: string; pkg?: boolean[]; entered?: string } = {},
  ): Episode {
    const done = doneDates.map(D);
    const notes = o.notes || [];
    return {
      id: 'ep' + num,
      num,
      title,
      stage,
      record: D(record),
      due: D(due),
      entered: o.entered ? D(o.entered) : done[stage - 1] || D(record),
      blocked: o.blocked || '',
      drive: stage >= 1 ? 'https://drive.google.com/drive/folders/wsc-ep' + num : '',
      pkg: o.pkg || PKG.map(() => stage >= 4),
      handoffs: done.map((date, i) => ({ id: `h${num}-${i}`, fs: i, ts: i + 1, date, note: notes[i] || '' })),
      clips: (o.clips || []).map(([name, len, caption, posts], ci) => ({
        id: `c${num}-${ci}`,
        name,
        len,
        caption,
        posts: posts.map(([plat, date, time, status, v]) => {
          pid++;
          return {
            id: 'p' + pid,
            plat,
            date: D(date),
            time,
            status,
            url: status === 'published' ? 'https://' + PLATFORM_URL[plat] + 'wsc' + num + 'x' + (1000 + pid * 37) : '',
            checks: CHECKS.map((_, i) => v === 'V' || i < v),
            verified: v === 'V',
            vDate: v === 'V' ? addDays(D(date), 2) : '',
          };
        }),
      })),
    };
  }

  return [
    mk(108, 'Pricing for repeat clients', 6, '09-01', ['09-04', '09-08', '09-10', '09-17', '09-21', '09-29'], '09-29', {
      notes: ['Final cut is in the shared folder. Color pass done.', 'Two small trims at 12:40 and 31:05. Otherwise good.', 'Approved.', 'Package built. 5 posts across 4 platforms.', '', ''],
      clips: [
        ['Raise prices without losing clients', '0:48', 'Most clients expect a price increase. What they do not expect is silence. Here is how we tell repeat clients about new rates.', [['yt', '09-23', '09:00', 'published', 'V'], ['li', '09-23', '12:00', 'published', 'V']]],
        ['The anchor number', '0:32', 'Lead with the outcome, then the number. Our approach to quoting repeat work.', [['ig', '09-24', '11:00', 'published', 'V'], ['tt', '09-24', '18:00', 'published', 'V']]],
        ['Annual rate reviews', '0:55', 'One meeting a year that keeps pricing honest on both sides.', [['li', '09-26', '08:30', 'published', 'V']]],
      ],
    }),
    mk(109, 'When to say no to a project', 5, '09-08', ['09-11', '09-15', '09-17', '09-25', '10-06'], '10-06', {
      notes: ['Edit is ready. Guest asked us to cut the client name at 18:20, done.', 'Looks good. Audio dips slightly in the second half.', 'Approved. Audio fix not needed for socials.', 'Package ready. 5 posts across 4 platforms.', 'First posts went live.'],
      clips: [
        ['The polite no', '0:41', 'Saying no is a service. A short script for turning down work without burning the bridge.', [['yt', '10-06', '09:00', 'published', 'V'], ['ig', '10-06', '12:00', 'published', 'V']]],
        ['Scope creep warning signs', '0:37', 'Three phrases in a kickoff call that tell us a project will grow without the budget.', [['tt', '10-07', '18:00', 'published', 3], ['li', '10-08', '08:30', 'published', 0]]],
        ['Protecting your calendar', '0:52', 'If every project is a yes, nothing gets our best work. How we decide what to take on.', [['ig', '10-08', '12:00', 'failed', 0]]],
      ],
    }),
    mk(110, 'Building a referral engine', 4, '09-15', ['09-18', '09-22', '09-24', '10-09'], '10-13', {
      notes: ['Cut is in the folder. 38 minutes.', 'Reviewed. Suggest a tighter intro.', 'Approved with the tighter intro.', 'Package built. 8 posts, starting Oct 12.'],
      clips: [
        ['Ask at the right moment', '0:44', 'The best time to ask for a referral is right after a client says thank you. Here is the exact line we use.', [['yt', '10-12', '09:00', 'published', 0], ['li', '10-12', '12:00', 'published', 2]]],
        ['Make it easy to refer', '0:29', 'Give clients a one sentence description of what you do. They will use it.', [['ig', '10-14', '11:00', 'scheduled', 0], ['tt', '10-14', '18:00', 'scheduled', 0]]],
        ['Thank you notes that work', '0:51', 'A handwritten note still beats every automated follow up we have tried.', [['fb', '10-15', '10:00', 'scheduled', 0], ['li', '10-16', '08:30', 'scheduled', 0]]],
        ['The referral follow up', '0:35', 'What to do in the first 48 hours after someone sends you a lead.', [['ig', '10-17', '12:00', 'scheduled', 0], ['yt', '10-19', '09:00', 'scheduled', 0]]],
      ],
    }),
    mk(111, 'Cash flow in the slow season', 3, '09-22', ['09-26', '10-01', '10-06'], '10-20', {
      notes: ['Edit done. Includes the whiteboard segment.', 'Reviewed. No changes.', 'Approved. Prioritize the runway clip.'],
      pkg: [true, true, true, false, false],
      clips: [
        ['Plan for the dip', '0:46', 'Every service business has a slow season. The ones that last plan for it in the busy months.', [['yt', '10-21', '09:00', 'draft', 0], ['li', '10-21', '12:00', 'draft', 0]]],
        ['Three months of runway', '0:38', 'Why we keep three months of expenses in reserve, and how we got there.', [['ig', '10-22', '11:00', 'draft', 0], ['tt', '10-22', '18:00', 'draft', 0]]],
        ['Invoicing habits', '0:33', 'Invoice on the day the work ships. Every day you wait is a day added to your payment terms.', [['li', '10-23', '08:30', 'draft', 0]]],
      ],
    }),
    mk(112, 'Running a tight weekly meeting', 2, '09-29', ['10-02', '10-07'], '10-10', {
      notes: ['Edit ready for review.', 'Reviewed. Guest title in the lower third needs a check.'],
      blocked: 'Waiting on the guest to confirm their job title for the lower third.',
    }),
    mk(113, 'Onboarding new clients well', 1, '10-02', ['10-09'], '10-27', { notes: ['First cut ready. 41 minutes.'] }),
    mk(114, 'What we learned from a bad quarter', 0, '10-08', [], '11-03'),
    mk(115, 'Delegating without losing quality', 0, '10-15', [], '11-10', { entered: '10-12' }),
  ];
}
