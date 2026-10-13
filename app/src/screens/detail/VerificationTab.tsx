import { useApp } from '../../app-context';
import { Checkbox } from '../../components/ui';
import { CHECKS, PLATFORMS } from '../../lib/constants';
import { fmtDate, fmtTime } from '../../lib/dates';
import { byDateTime, flatPosts } from '../../lib/derive';
import type { Episode } from '../../lib/types';

export function VerificationTab({ e }: { e: Episode }) {
  const { today, store, run } = useApp();
  const all = flatPosts(e).sort(byDateTime);
  const pubs = all.filter((p) => p.status === 'published');
  const verified = all.filter((p) => p.verified).length;

  return (
    <div className="stack-16">
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1B2A4A' }}>
            {all.length ? `${verified} of ${all.length} posts verified` : 'No posts yet'}
          </div>
          <div className="sub" style={{ marginTop: 4 }}>
            The episode moves to Verified only when every post is verified.
          </div>
        </div>
        <div className="ver-bar">
          <div style={{ width: all.length ? Math.round((verified / all.length) * 100) + '%' : '0%' }} />
        </div>
      </div>

      {pubs.map((p) => {
        const ready = p.checks.every(Boolean) && !p.verified;
        return (
          <div key={p.id} className="card ver-card">
            <div>
              <div className="plat-cell" style={{ fontSize: 12, color: '#3A4556' }}>
                <span className="sq" style={{ background: PLATFORMS[p.plat].color }} />
                {PLATFORMS[p.plat].label}
                <span className="muted">{`${fmtDate(p.date)}, ${fmtTime(p.time)}`}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2733', marginTop: 5 }}>{p.clip}</div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: 'inline-block', marginTop: 4, wordBreak: 'break-all' }}>
                  {p.url.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            <div className="ver-checks">
              {CHECKS.map((label, i) => (
                <div
                  key={label}
                  role="checkbox"
                  aria-checked={p.checks[i]}
                  className={'ver-check' + (p.verified ? ' locked' : '')}
                  onClick={() => !p.verified && run(() => store.updatePost(p.id, { checks: p.checks.map((v, j) => (j === i ? !v : v)) }))}
                >
                  <Checkbox on={p.checks[i]} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              {p.verified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 'bold', color: '#1B2A4A' }}>
                  <span className="dot" style={{ width: 8, height: 8, background: '#C8A951' }} />
                  Verified {fmtDate(p.vDate)}
                </span>
              ) : (
                <button
                  className="btn"
                  style={{ padding: '0 14px' }}
                  disabled={!ready}
                  onClick={() =>
                    ready && run(() => store.verifyPost(p.id, today), (moved) => (moved ? `All posts verified. EP ${e.num} moved to Verified.` : 'Post marked verified.'))
                  }
                >
                  Mark verified
                </button>
              )}
            </div>
          </div>
        );
      })}
      {all.length > pubs.length && (
        <div className="sub" style={{ marginTop: 0 }}>
          {all.length - pubs.length} posts are not published yet. They appear here once published.
        </div>
      )}
    </div>
  );
}
