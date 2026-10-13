import { useEffect, useState } from 'react';
import { useApp } from '../../app-context';
import { CommitInput } from '../../components/CommitInput';
import { Checkbox } from '../../components/ui';
import { PKG, PLATFORMS, PLATFORM_KEYS, tint } from '../../lib/constants';
import { addDays } from '../../lib/dates';
import type { Episode, PlatformKey } from '../../lib/types';

const emptyClip = { name: '', len: '', caption: '', plats: [] as PlatformKey[] };

export function PackageTab({ e }: { e: Episode }) {
  const { today, store, run } = useApp();
  const [cf, setCf] = useState(emptyClip);
  const [err, setErr] = useState('');
  useEffect(() => {
    setCf(emptyClip);
    setErr('');
  }, [e.id]);
  const done = e.pkg.filter(Boolean).length;

  const addClip = async () => {
    if (!cf.name.trim()) return setErr('Add a clip name.');
    // New posts start as drafts on the due date, or a week out if that has passed.
    const date = e.due > today ? e.due : addDays(today, 7);
    const ok = await run(
      () =>
        store.addClip(
          e.id,
          { name: cf.name.trim(), len: cf.len.trim() || '0:00', caption: cf.caption.trim() },
          cf.plats.map((plat) => ({ plat, date, time: '09:00', status: 'draft' as const })),
        ),
      cf.plats.length ? `Clip added with ${cf.plats.length} draft posts. Set dates in Scheduling.` : 'Clip added.',
    );
    if (ok) setCf(emptyClip);
  };

  return (
    <div className="two-col w360">
      <div className="stack-20">
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>OpusClip checklist</h2>
            <span className="count metric-note" style={{ marginTop: 0 }}>
              {done} of 5 complete
            </span>
          </div>
          <div className="progress" style={{ margin: '12px 0 6px' }}>
            <div style={{ width: done * 20 + '%' }} />
          </div>
          {PKG.map((label, i) => (
            <div
              key={label}
              className="check-row"
              role="checkbox"
              aria-checked={e.pkg[i]}
              onClick={() => run(() => store.updateEpisode(e.id, { pkg: e.pkg.map((v, j) => (j === i ? !v : v)) }))}
            >
              <Checkbox on={e.pkg[i]} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <h2>Google Drive folder</h2>
          <div className="metric-note" style={{ margin: '4px 0 12px' }}>
            Footage and clips from Tyler
          </div>
          <CommitInput
            className="input"
            style={{ width: '100%' }}
            value={e.drive}
            onCommit={(v) => run(() => store.updateEpisode(e.id, { drive: v }), 'Google Drive folder saved.')}
            placeholder="Paste the Google Drive folder URL"
          />
          {e.drive && (
            <a href={e.drive} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 'bold' }}>
              Open in Google Drive
            </a>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Clips</h2>
          <span className="count">{e.clips.length} clips</span>
        </div>
        {e.clips.map((c) => (
          <div key={c.id} className="clip-row">
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2733' }}>{c.name}</span>
                <span className="metric-note" style={{ marginTop: 0 }}>
                  {c.len}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: '#3A4556', textWrap: 'pretty' }}>{c.caption}</div>
            </div>
            <div>
              <div className="metric-note" style={{ marginTop: 0, marginBottom: 6 }}>
                Target platforms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[...new Set(c.posts.map((p) => p.plat))].map((k) => (
                  <span key={k} className="plat-tag" style={{ background: tint(PLATFORMS[k].color) }}>
                    <span className="sq" style={{ background: PLATFORMS[k].color }} />
                    {PLATFORMS[k].label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {!e.clips.length && (
          <div className="empty" style={{ padding: '20px 20px 4px' }}>
            No clips yet. Add each clip from the Google Drive folder below.
          </div>
        )}

        <div className="form-strip">
          <div className="form-title">Add clip</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 100px', gap: 12 }}>
            <label className="field">
              Clip name
              <input
                className="input sm"
                value={cf.name}
                placeholder="Clip name"
                onChange={(ev) => {
                  setCf({ ...cf, name: ev.target.value });
                  setErr('');
                }}
              />
            </label>
            <label className="field">
              Length
              <input className="input sm" value={cf.len} placeholder="0:45" onChange={(ev) => setCf({ ...cf, len: ev.target.value })} />
            </label>
          </div>
          <label className="field">
            Caption
            <textarea className="input" rows={2} value={cf.caption} placeholder="Caption text" onChange={(ev) => setCf({ ...cf, caption: ev.target.value })} />
          </label>
          <div className="field">
            Target platforms
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORM_KEYS.map((k) => {
                const on = cf.plats.includes(k);
                const c = PLATFORMS[k].color;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    className="chip-toggle"
                    style={on ? { borderColor: c, background: tint(c) } : undefined}
                    onClick={() => setCf({ ...cf, plats: on ? cf.plats.filter((x) => x !== k) : [...cf.plats, k] })}
                  >
                    <span className="sq" style={{ background: c }} />
                    {PLATFORMS[k].label}
                  </button>
                );
              })}
            </div>
          </div>
          {err && <div className="err">{err}</div>}
          <div>
            <button className="btn btn-sm" onClick={addClip}>
              Add clip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
