import { useState } from 'react';
import { useApp } from '../../app-context';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PLATFORMS, PLATFORM_KEYS, tint } from '../../lib/constants';
import { addDays } from '../../lib/dates';
import type { Clip, Episode, PlatformKey } from '../../lib/types';

const linkBtn: React.CSSProperties = { background: 'none', border: 0, padding: 0, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' };

export function ClipRow({ e, c }: { e: Episode; c: Clip }) {
  const { store, run } = useApp();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const plats = [...new Set(c.posts.map((p) => p.plat))];

  return (
    <div className="clip-row">
      {editing ? (
        <ClipEditForm e={e} c={c} current={plats} onDone={() => setEditing(false)} />
      ) : (
        <>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2733' }}>{c.name}</span>
              <span className="metric-note" style={{ marginTop: 0 }}>
                {c.len}
              </span>
              <span style={{ flex: 1 }} />
              <button style={{ ...linkBtn, color: '#1B2A4A' }} onClick={() => setEditing(true)}>
                Edit
              </button>
              <button style={{ ...linkBtn, color: '#A12B2B' }} onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: '#3A4556', textWrap: 'pretty' }}>{c.caption}</div>
          </div>
          <div>
            <div className="metric-note" style={{ marginTop: 0, marginBottom: 6 }}>
              Target platforms
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {plats.map((k) => (
                <span key={k} className="plat-tag" style={{ background: tint(PLATFORMS[k].color) }}>
                  <span className="sq" style={{ background: PLATFORMS[k].color }} />
                  {PLATFORMS[k].label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this clip?"
          confirmLabel="Delete clip"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await run(() => store.deleteClip(c.id), 'Clip deleted.');
            setConfirmDelete(false);
          }}
        >
          {`"${c.name}" and its ${c.posts.length} ${c.posts.length === 1 ? 'post' : 'posts'} will be removed from EP ${e.num}, including any schedule, live URL and verification. This cannot be undone.`}
        </ConfirmModal>
      )}
    </div>
  );
}

function ClipEditForm({ e, c, current, onDone }: { e: Episode; c: Clip; current: PlatformKey[]; onDone: () => void }) {
  const { today, store, run } = useApp();
  const [f, setF] = useState({ name: c.name, len: c.len, caption: c.caption, plats: current });
  const [err, setErr] = useState('');
  const removed = current.filter((k) => !f.plats.includes(k));
  const added = f.plats.filter((k) => !current.includes(k));
  const removedPosts = c.posts.filter((p) => removed.includes(p.plat));
  const removedLive = removedPosts.filter((p) => p.status === 'published' || p.status === 'failed').length;

  const save = async () => {
    if (!f.name.trim()) return setErr('Add a clip name.');
    // New platforms start as draft posts, dated like posts from Add clip.
    const date = e.due > today ? e.due : addDays(today, 7);
    const ok = await run(async () => {
      await store.updateClip(c.id, { name: f.name.trim(), len: f.len.trim() || '0:00', caption: f.caption.trim() });
      for (const p of removedPosts) await store.deletePost(p.id);
      for (const plat of added) await store.addPost(c.id, { plat, date, time: '09:00', status: 'draft' });
    }, added.length ? `Clip saved. ${added.length} draft ${added.length === 1 ? 'post' : 'posts'} added in Scheduling.` : 'Clip saved.');
    if (ok) onDone();
  };

  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 100px', gap: 12 }}>
        <label className="field">
          Clip name
          <input
            className="input sm"
            autoFocus
            value={f.name}
            onChange={(ev) => {
              setF({ ...f, name: ev.target.value });
              setErr('');
            }}
          />
        </label>
        <label className="field">
          Length
          <input className="input sm" value={f.len} placeholder="0:45" onChange={(ev) => setF({ ...f, len: ev.target.value })} />
        </label>
      </div>
      <label className="field">
        Caption
        <textarea className="input" rows={3} value={f.caption} onChange={(ev) => setF({ ...f, caption: ev.target.value })} />
      </label>
      <div className="field">
        Target platforms
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PLATFORM_KEYS.map((k) => {
            const on = f.plats.includes(k);
            const col = PLATFORMS[k].color;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                className="chip-toggle"
                style={on ? { borderColor: col, background: tint(col) } : undefined}
                onClick={() => setF({ ...f, plats: on ? f.plats.filter((x) => x !== k) : [...f.plats, k] })}
              >
                <span className="sq" style={{ background: col }} />
                {PLATFORMS[k].label}
              </button>
            );
          })}
        </div>
      </div>
      {removedPosts.length > 0 && (
        <div className="gate" style={{ marginTop: 0, color: removedLive ? '#A12B2B' : '#3A4556' }}>
          {`Saving removes ${removedPosts.length} ${removedPosts.length === 1 ? 'post' : 'posts'} for ${removed.map((k) => PLATFORMS[k].label).join(' and ')}`}
          {removedLive ? `, including ${removedLive} already posted.` : '.'}
        </div>
      )}
      {err && <div className="err">{err}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-sm" onClick={save}>
          Save clip
        </button>
        <button className="btn-secondary" style={{ height: 34, padding: '0 14px' }} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
