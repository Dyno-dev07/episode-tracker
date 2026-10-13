import { useState } from 'react';
import { useApp } from '../app-context';
import { CHECKS, PLATFORMS, STAGES, STATUS_LABEL } from '../lib/constants';
import { downloadFile, toCsv } from '../lib/csv';
import { addDays, fmtDate, iso, monday, parseDate } from '../lib/dates';
import { byDateTime, episodeInfo, flatPosts } from '../lib/derive';
import type { Episode } from '../lib/types';

type Data = 'posts' | 'episodes' | 'handoffs';
type Period = 'week' | 'month' | 'range';

const DATA: [Data, string, string][] = [
  ['posts', 'Posts', 'Every scheduled, published and failed post with a post date in the period. Drafts are left out.'],
  ['episodes', 'Episodes', 'Episodes with a record, due or first publish date in the period.'],
  ['handoffs', 'Handoffs', 'Every handoff made in the period, with notes.'],
];
const PERIODS: [Period, string][] = [
  ['week', 'Week'],
  ['month', 'Month'],
  ['range', 'Date range'],
];

const yes = (b: boolean) => (b ? 'Yes' : 'No');

export function ExportModal({ episodes, onClose }: { episodes: Episode[]; onClose: () => void }) {
  const { today, toast } = useApp();
  const [data, setData] = useState<Data>('posts');
  const [period, setPeriod] = useState<Period>('week');
  const [week, setWeek] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [range, setRange] = useState({ from: monday(today), to: addDays(monday(today), 6) });

  let from: string;
  let to: string;
  if (period === 'week') {
    from = monday(week || today);
    to = addDays(from, 6);
  } else if (period === 'month') {
    const [y, m] = (month || today.slice(0, 7)).split('-').map(Number);
    from = iso(new Date(y, m - 1, 1));
    to = iso(new Date(y, m, 0));
  } else {
    from = range.from;
    to = range.to;
  }
  const valid = !!from && !!to && from <= to;
  const inRange = (d: string) => !!d && d >= from && d <= to;
  const rangeLabel = valid
    ? `${fmtDate(from)} to ${fmtDate(to)}, ${parseDate(to).getFullYear()}`
    : from && to
      ? 'The end date is before the start date.'
      : 'Choose a start and end date.';

  const build = (): { header: string[]; rows: (string | number)[][] } => {
    if (data === 'posts') {
      const rows = episodes
        .flatMap((e) => flatPosts(e).map((p) => ({ e, p })))
        .filter(({ p }) => p.status !== 'draft' && inRange(p.date))
        .sort((a, b) => byDateTime(a.p, b.p))
        .map(({ e, p }) => [
          e.num,
          e.title,
          p.clip,
          p.len,
          PLATFORMS[p.plat].label,
          p.date,
          p.time,
          STATUS_LABEL[p.status],
          p.url,
          `${p.checks.filter(Boolean).length} of ${CHECKS.length}`,
          yes(p.verified),
          p.vDate,
        ]);
      return {
        header: ['Episode', 'Episode title', 'Clip', 'Length', 'Platform', 'Post date', 'Time', 'Status', 'Live post URL', 'Checks', 'Verified', 'Verified date'],
        rows,
      };
    }
    if (data === 'episodes') {
      const rows = episodes
        .map((e) => ({ e, I: episodeInfo(e, today) }))
        .filter(({ e, I }) => inRange(e.record) || inRange(e.due) || inRange(I.publish))
        .sort((a, b) => a.e.num - b.e.num)
        .map(({ e, I }) => [
          e.num,
          e.title,
          STAGES[e.stage].label,
          I.owner,
          e.record,
          e.due,
          I.publish,
          I.status,
          e.blocked,
          e.clips.length,
          I.posts.length,
          I.posts.filter((p) => p.status === 'published').length,
          I.posts.filter((p) => p.verified).length,
          e.drive,
        ]);
      return {
        header: ['Episode', 'Title', 'Stage', 'Owner', 'Record date', 'Due date', 'First publish date', 'Status', 'Blocked reason', 'Clips', 'Posts', 'Published posts', 'Verified posts', 'Google Drive folder'],
        rows,
      };
    }
    const rows = episodes
      .flatMap((e) => e.handoffs.map((h) => ({ e, h })))
      .filter(({ h }) => inRange(h.date))
      .sort((a, b) => a.h.date.localeCompare(b.h.date) || a.e.num - b.e.num)
      .map(({ e, h }) => [h.date, e.num, e.title, STAGES[h.fs].owner, STAGES[h.ts].owner, STAGES[h.fs].label, STAGES[h.ts].label, h.note]);
    return { header: ['Date', 'Episode', 'Episode title', 'From', 'To', 'From stage', 'To stage', 'Note'], rows };
  };

  const result = valid ? build() : null;
  const count = result?.rows.length ?? 0;
  const noun = data === 'posts' ? 'post' : data === 'episodes' ? 'episode' : 'handoff';

  const download = () => {
    if (!result || !count) return;
    const span = period === 'month' ? from.slice(0, 7) : `${from}-to-${to}`;
    downloadFile(`episode-tracker-${data}-${span}.csv`, toCsv(result.header, result.rows));
    toast(`Exported ${count} ${noun}${count === 1 ? '' : 's'}.`);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="export-title">Export data</h2>
        <div className="field">
          Data
          <div className="segmented views" role="radiogroup">
            {DATA.map(([k, l]) => (
              <button key={k} role="radio" aria-checked={data === k} className={data === k ? 'on' : ''} onClick={() => setData(k)}>
                {l}
              </button>
            ))}
          </div>
          <span style={{ lineHeight: 1.45 }}>{DATA.find((d) => d[0] === data)![2]}</span>
        </div>
        <div className="field">
          Period
          <div className="segmented views" role="radiogroup">
            {PERIODS.map(([k, l]) => (
              <button key={k} role="radio" aria-checked={period === k} className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {period === 'week' && (
          <label className="field">
            Any day in the week
            <input type="date" className="input" style={{ padding: '0 8px' }} value={week} onChange={(ev) => setWeek(ev.target.value)} />
          </label>
        )}
        {period === 'month' && (
          <label className="field">
            Month
            <input type="month" className="input" style={{ padding: '0 8px' }} value={month} onChange={(ev) => setMonth(ev.target.value)} />
          </label>
        )}
        {period === 'range' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              From
              <input type="date" className="input" style={{ padding: '0 8px' }} value={range.from} onChange={(ev) => setRange({ ...range, from: ev.target.value })} />
            </label>
            <label className="field">
              To
              <input type="date" className="input" style={{ padding: '0 8px' }} value={range.to} onChange={(ev) => setRange({ ...range, to: ev.target.value })} />
            </label>
          </div>
        )}
        <div className="gate" style={{ marginTop: 0 }}>
          {valid ? `${count} ${noun}${count === 1 ? '' : 's'} from ${rangeLabel}.` : rangeLabel}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button className="btn-secondary" style={{ padding: '0 14px' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={!count} onClick={download}>
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
