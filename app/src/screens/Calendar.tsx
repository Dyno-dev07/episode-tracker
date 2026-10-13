import { useState } from 'react';
import { useApp } from '../app-context';
import { PLATFORMS, tint } from '../lib/constants';
import { addDays, fmtDate, fmtTime, iso, monday, parseDate } from '../lib/dates';
import { flatPosts } from '../lib/derive';
import type { Episode, FlatPost } from '../lib/types';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalPost {
  e: Episode;
  p: FlatPost;
}

export function Calendar({ episodes, onExport }: { episodes: Episode[]; onExport: () => void }) {
  const { today } = useApp();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [anchor, setAnchor] = useState(today);

  const posts = episodes.flatMap((e) => flatPosts(e).filter((p) => p.status !== 'draft').map((p) => ({ e, p })));
  const onDay = (day: string) => posts.filter((x) => x.p.date === day).sort((a, b) => a.p.time.localeCompare(b.p.time));

  const weekStart = monday(anchor);
  const a = parseDate(anchor);
  const monthStart = monday(iso(new Date(a.getFullYear(), a.getMonth(), 1)));
  const lastDay = new Date(a.getFullYear(), a.getMonth() + 1, 0);
  const weeks = Math.ceil((Math.round((lastDay.getTime() - parseDate(monthStart).getTime()) / 864e5) + 1) / 7);
  const isWeek = view === 'week';
  const range = isWeek
    ? `${fmtDate(weekStart)} to ${fmtDate(addDays(weekStart, 6))}, ${parseDate(addDays(weekStart, 6)).getFullYear()}`
    : a.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const shift = (dir: number) =>
    setAnchor((cur) => {
      if (isWeek) return addDays(cur, 7 * dir);
      const b = parseDate(cur);
      return iso(new Date(b.getFullYear(), b.getMonth() + dir, 1));
    });

  return (
    <div className="stack-18">
      <div className="page-head">
        <div>
          <h1>Content calendar</h1>
          <div className="sub">{range}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => shift(-1)}>
            Previous
          </button>
          <button className="btn-secondary" onClick={() => setAnchor(today)}>
            Today
          </button>
          <button className="btn-secondary" onClick={() => shift(1)}>
            Next
          </button>
        </div>
        <button className="btn-secondary" onClick={onExport}>
          Export
        </button>
        <div className="segmented views">
          {(['week', 'month'] as const).map((k) => (
            <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>
              {k === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        {Object.values(PLATFORMS).map((p) => (
          <span key={p.label} className="plat-cell">
            <span className="sq" style={{ background: p.color }} />
            {p.label}
          </span>
        ))}
        <span className="muted">Drafts are not shown</span>
      </div>

      {isWeek ? (
        <div className="card week">
          {DOW.map((w, i) => {
            const day = addDays(weekStart, i);
            const t = day === today;
            return (
              <div key={day} className={'week-day' + (t ? ' today' : '')}>
                <div className="week-day-head">
                  <span className="metric-note" style={{ marginTop: 0 }}>
                    {w}
                  </span>
                  <span className={'day-num' + (t ? ' today' : '')}>{parseDate(day).getDate()}</span>
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {onDay(day).map((x) => (
                    <WeekChip key={x.p.id} {...x} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="month-grid" style={{ background: '#F7F8FA', borderBottom: '1px solid #E2E5EA' }}>
            {DOW.map((w) => (
              <div key={w} className="month-dow">
                {w}
              </div>
            ))}
          </div>
          <div className="month-grid">
            {Array.from({ length: weeks * 7 }, (_, i) => {
              const day = addDays(monthStart, i);
              const inMonth = parseDate(day).getMonth() === a.getMonth();
              const ps = onDay(day);
              return (
                <div key={day} className={'month-day' + (inMonth ? '' : ' out')}>
                  <span className={'day-num' + (day === today ? ' today' : '')}>{parseDate(day).getDate()}</span>
                  {ps.slice(0, 3).map((x) => (
                    <MonthChip key={x.p.id} {...x} />
                  ))}
                  {ps.length > 3 && <span style={{ fontSize: 11, color: '#5F6876', paddingLeft: 4 }}>{ps.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function chipStyle(p: FlatPost) {
  const c = PLATFORMS[p.plat].color;
  return { borderLeftColor: c, background: tint(c) };
}

function WeekChip({ e, p }: CalPost) {
  const { open } = useApp();
  const st = p.status === 'published' ? (p.verified ? 'Verified' : 'Live') : p.status === 'failed' ? 'Failed' : '';
  return (
    <div className="cal-chip" style={chipStyle(p)} onClick={() => open(e.id, 'scheduling')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontWeight: 'bold', color: '#1F2733' }}>{fmtTime(p.time)}</span>
        <span style={{ color: p.status === 'failed' ? '#A12B2B' : '#2B6B43', fontWeight: 'bold' }}>{st}</span>
      </div>
      <div style={{ color: '#3A4556' }}>{PLATFORMS[p.plat].label}</div>
      <div style={{ color: '#1F2733', marginTop: 3 }}>
        <strong>EP {e.num}</strong> {p.clip}
      </div>
    </div>
  );
}

function MonthChip({ e, p }: CalPost) {
  const { open } = useApp();
  return (
    <div className="month-chip" style={chipStyle(p)} onClick={() => open(e.id, 'scheduling')}>
      {fmtTime(p.time)} EP {e.num} {PLATFORMS[p.plat].label}
    </div>
  );
}
