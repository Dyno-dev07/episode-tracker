import { useState } from 'react';
import { useApp } from '../app-context';
import { Avatar, Badge } from '../components/ui';
import { EPISODE_STATUS_COLORS, OWNERS, STAGES, isOperatorStage } from '../lib/constants';
import { fmtDate } from '../lib/dates';
import { episodeInfo, type EpisodeInfo } from '../lib/derive';
import type { Episode } from '../lib/types';

export interface Filters {
  stage: string;
  owner: string;
  from: string;
  to: string;
}
export const emptyFilters: Filters = { stage: '', owner: '', from: '', to: '' };

type SortKey = 'num' | 'title' | 'stage' | 'owner' | 'record' | 'due' | 'publish' | 'status';
type Row = { e: Episode; I: EpisodeInfo };

const STATUS_ORDER = { Blocked: 0, Overdue: 1, 'On track': 2, Complete: 3 };
const SORT: Record<SortKey, (x: Row) => string | number> = {
  num: (x) => x.e.num,
  title: (x) => x.e.title,
  stage: (x) => x.e.stage,
  owner: (x) => x.I.owner,
  record: (x) => x.e.record,
  due: (x) => x.e.due,
  publish: (x) => x.I.publish || '9999',
  status: (x) => STATUS_ORDER[x.I.status],
};
const HEADERS: [SortKey, string][] = [
  ['num', 'No.'],
  ['title', 'Title'],
  ['stage', 'Stage'],
  ['owner', 'Owner'],
  ['record', 'Record date'],
  ['due', 'Due date'],
  ['publish', 'Publish date'],
  ['status', 'Status'],
];

export function Episodes(props: {
  episodes: Episode[];
  search: string;
  onSearch: (v: string) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  onNew: () => void;
}) {
  const { episodes, search, onSearch, filters: f, onFilters, onNew } = props;
  const { today, open } = useApp();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'num', dir: 'desc' });
  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch });

  const q = search.trim().toLowerCase();
  const rows = episodes
    .map((e) => ({ e, I: episodeInfo(e, today) }))
    .filter(
      ({ e, I }) =>
        (!q || e.title.toLowerCase().includes(q) || ('ep ' + e.num).includes(q) || String(e.num).includes(q)) &&
        (f.stage === '' || e.stage === +f.stage) &&
        (!f.owner || I.owner === f.owner) &&
        (!f.from || e.due >= f.from) &&
        (!f.to || e.due <= f.to),
    );
  const key = SORT[sort.key];
  rows.sort((a, b) => {
    const A = key(a);
    const B = key(b);
    return (A < B ? -1 : A > B ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1);
  });

  return (
    <div className="stack-20">
      <div className="page-head">
        <div>
          <h1>Episodes</h1>
          <div className="sub">
            Showing {rows.length} of {episodes.length} episodes
          </div>
        </div>
        <button className="btn" onClick={onNew}>
          Add episode
        </button>
      </div>

      <div className="card filters">
        <label className="field grow">
          Search
          <input className="input" value={search} onChange={(ev) => onSearch(ev.target.value)} placeholder="Title or episode number" />
        </label>
        <label className="field">
          Stage
          <select className="input" style={{ minWidth: 170 }} value={f.stage} onChange={(ev) => set({ stage: ev.target.value })}>
            <option value="">All stages</option>
            {STAGES.map((s, i) => (
              <option key={s.label} value={String(i)}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Owner
          <select className="input" style={{ minWidth: 130 }} value={f.owner} onChange={(ev) => set({ owner: ev.target.value })}>
            <option value="">All owners</option>
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Due from
          <input type="date" className="input" value={f.from} onChange={(ev) => set({ from: ev.target.value })} />
        </label>
        <label className="field">
          Due to
          <input type="date" className="input" value={f.to} onChange={(ev) => set({ to: ev.target.value })} />
        </label>
        <button
          className="btn-secondary"
          style={{ padding: '0 14px' }}
          onClick={() => {
            onSearch('');
            onFilters(emptyFilters);
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="card scroll-x">
        <div className="ep-table">
          <div className="ep-grid head">
            {HEADERS.map(([k, l]) => (
              <button
                key={k}
                className={sort.key === k ? 'sorted' : ''}
                onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))}
              >
                {l}
                <span>{sort.key === k ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</span>
              </button>
            ))}
          </div>
          {rows.map(({ e, I }) => (
            <div key={e.id} className="ep-grid row row-link" onClick={() => open(e.id)}>
              <span className="ep-num">EP {e.num}</span>
              <span className="ep-title">{e.title}</span>
              <span className="stage-cell">
                <span className="dot" style={{ background: isOperatorStage(e.stage) ? '#C8A951' : '#CDD2DA' }} />
                {STAGES[e.stage].label}
              </span>
              <span className="owner-cell">
                <Avatar owner={I.owner} />
                {I.owner}
              </span>
              <span style={{ color: '#3A4556' }}>{fmtDate(e.record)}</span>
              <span style={{ color: I.overdue ? '#A12B2B' : '#3A4556' }}>{fmtDate(e.due)}</span>
              <span style={{ color: '#3A4556' }}>{fmtDate(I.publish)}</span>
              <span>
                <Badge colors={EPISODE_STATUS_COLORS[I.status]}>{I.status}</Badge>
              </span>
            </div>
          ))}
          {!rows.length && <div className="empty" style={{ padding: '32px 20px' }}>No episodes match these filters.</div>}
        </div>
      </div>
    </div>
  );
}
