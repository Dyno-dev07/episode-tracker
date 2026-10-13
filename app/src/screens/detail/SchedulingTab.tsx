import { useEffect, useState } from 'react';
import { useApp } from '../../app-context';
import { Badge } from '../../components/ui';
import { PLATFORMS, PLATFORM_KEYS, STATUS_COLORS, STATUS_LABEL } from '../../lib/constants';
import { addDays, fmtDate } from '../../lib/dates';
import { byDateTime, flatPosts } from '../../lib/derive';
import type { Episode, PlatformKey } from '../../lib/types';

type Draftable = 'draft' | 'scheduled';

export function SchedulingTab({ e, onGoPackage }: { e: Episode; onGoPackage: () => void }) {
  const { today, store, run } = useApp();
  const [pf, setPf] = useState({ clipId: '', plat: 'yt' as PlatformKey, date: '', time: '09:00', status: 'scheduled' as Draftable });
  useEffect(() => setPf((f) => ({ ...f, clipId: '', date: '' })), [e.id]);

  const posts = flatPosts(e).sort(byDateTime);
  const cnt = (st: string) => posts.filter((p) => p.status === st).length;
  const clipId = pf.clipId && e.clips.some((c) => c.id === pf.clipId) ? pf.clipId : e.clips[0]?.id || '';

  const addPost = async () => {
    const date = pf.date || (e.due > today ? e.due : addDays(today, 7));
    const ok = await run(
      () => store.addPost(clipId, { plat: pf.plat, date, time: pf.time || '09:00', status: pf.status }),
      `${PLATFORMS[pf.plat].label} post added for ${fmtDate(date)}.`,
    );
    if (ok) setPf((f) => ({ ...f, date: '' }));
  };

  return (
    <div className="card scroll-x">
      <div className="sched-table">
        <div className="card-head">
          <h2>Post schedule</h2>
          <span className="count">
            {cnt('scheduled')} scheduled, {cnt('draft')} draft, {cnt('published') + cnt('failed')} already posted
          </span>
        </div>
        <div className="sched-grid grid-head">
          <span>Clip</span>
          <span>Platform</span>
          <span>Date</span>
          <span>Time</span>
          <span>Status</span>
        </div>
        {posts.map((p) => {
          const editable = p.status === 'draft' || p.status === 'scheduled';
          return (
            <div key={p.id} className="sched-grid">
              <div>
                <div className="flag-title">{p.clip}</div>
                <div className="metric-note" style={{ marginTop: 2 }}>
                  {p.len}
                </div>
              </div>
              <span className="plat-cell">
                <span className="sq" style={{ background: PLATFORMS[p.plat].color }} />
                {PLATFORMS[p.plat].label}
              </span>
              <input
                type="date"
                className="input sm"
                style={{ padding: '0 8px' }}
                value={p.date}
                disabled={!editable}
                onChange={(ev) => ev.target.value && run(() => store.updatePost(p.id, { date: ev.target.value }))}
              />
              <input
                type="time"
                className="input sm"
                style={{ padding: '0 8px' }}
                value={p.time}
                disabled={!editable}
                onChange={(ev) => ev.target.value && run(() => store.updatePost(p.id, { time: ev.target.value }))}
              />
              {editable ? (
                <select
                  className="input sm"
                  value={p.status}
                  onChange={(ev) => run(() => store.updatePost(p.id, { status: ev.target.value as Draftable }))}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              ) : (
                <span>
                  <Badge colors={STATUS_COLORS[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </span>
              )}
            </div>
          );
        })}
        {!posts.length && (
          <div className="empty" style={{ padding: '20px 20px 4px' }}>
            No posts yet. Add a post below, or add clips with target platforms in the Social package tab.
          </div>
        )}

        {e.clips.length > 0 ? (
          <div className="form-strip" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-title" style={{ width: '100%' }}>
              Add post
            </div>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              Clip
              <select className="input sm" style={{ padding: '0 10px' }} value={clipId} onChange={(ev) => setPf({ ...pf, clipId: ev.target.value })}>
                {e.clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Platform
              <select
                className="input sm"
                style={{ padding: '0 10px', minWidth: 130 }}
                value={pf.plat}
                onChange={(ev) => setPf({ ...pf, plat: ev.target.value as PlatformKey })}
              >
                {PLATFORM_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {PLATFORMS[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Date
              <input type="date" className="input sm" value={pf.date} onChange={(ev) => setPf({ ...pf, date: ev.target.value })} />
            </label>
            <label className="field">
              Time
              <input type="time" className="input sm" value={pf.time} onChange={(ev) => setPf({ ...pf, time: ev.target.value })} />
            </label>
            <label className="field">
              Status
              <select
                className="input sm"
                style={{ padding: '0 10px' }}
                value={pf.status}
                onChange={(ev) => setPf({ ...pf, status: ev.target.value as Draftable })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <button className="btn btn-sm" onClick={addPost}>
              Add post
            </button>
          </div>
        ) : (
          <div
            style={{ padding: '16px 20px 20px', borderTop: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#3A4556' }}
          >
            Add a clip before scheduling posts.
            <button className="btn-secondary sm" onClick={onGoPackage}>
              Go to social package
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
