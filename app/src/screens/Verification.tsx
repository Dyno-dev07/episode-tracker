import { useApp } from '../app-context';
import { PLATFORMS } from '../lib/constants';
import { daysText, diffDays, fmtDate, fmtTime } from '../lib/dates';
import { flatPosts } from '../lib/derive';
import type { Episode } from '../lib/types';

export function Verification({ episodes }: { episodes: Episode[] }) {
  const { today, open } = useApp();
  const all = episodes.flatMap((e) => flatPosts(e).map((p) => ({ e, p })));
  const awaiting = all.filter((x) => x.p.status === 'published' && !x.p.verified).sort((x, y) => x.p.date.localeCompare(y.p.date));
  const failed = all.filter((x) => x.p.status === 'failed');
  const summary = [
    { label: 'Awaiting verification', value: awaiting.length },
    { label: 'Failed posts', value: failed.length },
    { label: 'Verified posts', value: all.filter((x) => x.p.verified).length },
  ];

  return (
    <div className="stack-20">
      <div>
        <h1>Verification</h1>
        <div className="sub">Published posts still awaiting verification</div>
      </div>
      <div className="summary-grid three">
        {summary.map((m) => (
          <div key={m.label} className="metric">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card scroll-x">
        <div style={{ minWidth: 960 }}>
          <div className="card-head">
            <h2>Awaiting verification</h2>
          </div>
          <div className="rep-grid grid-head">
            <span>Episode</span>
            <span>Clip</span>
            <span>Platform</span>
            <span>Published</span>
            <span>Waiting</span>
            <span>Checks</span>
            <span />
          </div>
          {awaiting.map(({ e, p }) => {
            const w = diffDays(p.date, today);
            return (
              <div key={p.id} className="rep-grid row-link" onClick={() => open(e.id, 'verification')}>
                <EpisodeCell e={e} />
                <span style={{ color: '#3A4556' }}>{p.clip}</span>
                <PlatformCell plat={p.plat} />
                <span style={{ color: '#3A4556' }}>{`${fmtDate(p.date)}, ${fmtTime(p.time)}`}</span>
                <span style={{ color: w >= 3 ? '#A12B2B' : '#1F2733', fontWeight: 'bold' }}>{daysText(w)}</span>
                <span style={{ color: '#3A4556' }}>{p.checks.filter(Boolean).length} of 5</span>
                <span className="open-link">Verify</span>
              </div>
            );
          })}
          {!awaiting.length && <div className="empty">Every published post is verified.</div>}
        </div>
      </div>

      {failed.length > 0 && (
        <div className="card scroll-x">
          <div style={{ minWidth: 860 }}>
            <div className="card-head">
              <h2 style={{ color: '#A12B2B' }}>Failed posts</h2>
            </div>
            {failed.map(({ e, p }) => (
              <div key={p.id} className="rep-grid failed row-link" onClick={() => open(e.id, 'publishing')}>
                <EpisodeCell e={e} />
                <span style={{ color: '#3A4556' }}>{p.clip}</span>
                <PlatformCell plat={p.plat} />
                <span style={{ color: '#3A4556' }}>{`${fmtDate(p.date)}, ${fmtTime(p.time)}`}</span>
                <span className="open-link">Fix</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EpisodeCell({ e }: { e: Episode }) {
  return (
    <span>
      <strong style={{ color: '#5F6876' }}>EP {e.num}</strong> <span className="ep-title">{e.title}</span>
    </span>
  );
}

function PlatformCell({ plat }: { plat: keyof typeof PLATFORMS }) {
  return (
    <span className="plat-cell">
      <span className="sq" style={{ background: PLATFORMS[plat].color }} />
      {PLATFORMS[plat].label}
    </span>
  );
}
