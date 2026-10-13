import { useApp } from '../../app-context';
import { CommitInput } from '../../components/CommitInput';
import { PLATFORMS, STATUS_LABEL } from '../../lib/constants';
import { fmtDate, fmtTime } from '../../lib/dates';
import { byDateTime, flatPosts } from '../../lib/derive';
import type { Episode, PostStatus } from '../../lib/types';

const OPTIONS: PostStatus[] = ['scheduled', 'published', 'failed'];

export function PublishingTab({ e }: { e: Episode }) {
  const { store, run } = useApp();
  const all = flatPosts(e).sort(byDateTime);
  const posts = all.filter((p) => p.status !== 'draft');
  const cnt = (st: PostStatus) => all.filter((p) => p.status === st).length;

  return (
    <div className="card scroll-x">
      <div className="pub-table">
        <div className="card-head">
          <h2>Publish status</h2>
          <span className="count">
            {cnt('published')} published, {cnt('scheduled')} scheduled, {cnt('failed')} failed
            {cnt('draft') ? `. ${cnt('draft')} drafts not shown` : ''}
          </span>
        </div>
        <div className="pub-grid grid-head">
          <span>Clip</span>
          <span>Platform</span>
          <span>Scheduled for</span>
          <span>Status</span>
          <span>Live post URL</span>
        </div>
        {posts.map((p) => {
          const published = p.status === 'published';
          return (
            <div key={p.id} className="pub-grid">
              <span className="flag-title">{p.clip}</span>
              <span className="plat-cell">
                <span className="sq" style={{ background: PLATFORMS[p.plat].color }} />
                {PLATFORMS[p.plat].label}
              </span>
              <span style={{ color: '#3A4556' }}>{`${fmtDate(p.date)}, ${fmtTime(p.time)}`}</span>
              <div className="segmented" role="radiogroup">
                {OPTIONS.map((k) => (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={p.status === k}
                    className={(p.status === k ? 'on' : '') + (k === 'failed' ? ' fail' : '')}
                    onClick={() => p.status !== k && run(() => store.updatePost(p.id, { status: k }))}
                  >
                    {STATUS_LABEL[k]}
                  </button>
                ))}
              </div>
              <div>
                <CommitInput
                  className="input sm"
                  style={{ width: '100%' }}
                  value={p.url}
                  disabled={!published}
                  placeholder={published ? 'Paste the live post URL' : 'Available once published'}
                  onCommit={(v) => run(() => store.updatePost(p.id, { url: v }), 'Live post URL saved.')}
                />
                {p.status === 'failed' && (
                  <div style={{ fontSize: 12, color: '#A12B2B', marginTop: 5 }}>Republish on the platform, then set status to published.</div>
                )}
              </div>
            </div>
          );
        })}
        {!posts.length && <div className="empty">Nothing scheduled yet. Posts appear here once they are scheduled.</div>}
      </div>
    </div>
  );
}
