import { useState } from 'react';
import { useApp } from '../app-context';
import { addDays } from '../lib/dates';

export function NewEpisodeModal({ nextNum, onClose }: { nextNum: number; onClose: () => void }) {
  const { today, store, run } = useApp();
  const [nf, setNf] = useState({ title: '', record: today, due: addDays(today, 28) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!nf.title.trim()) return setErr('Add a title to create the episode.');
    if (!nf.due) return setErr('Add a due date.');
    setBusy(true);
    const ok = await run(
      () => store.createEpisode(nf.title.trim(), nf.record || today, nf.due, today),
      (num) => `EP ${num} added to Recording and edit. Tyler is the owner.`,
    );
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-ep-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="new-ep-title">New episode</h2>
        <div className="sub" style={{ marginTop: 0 }}>
          EP {nextNum} starts in Recording and edit with Tyler as owner.
        </div>
        <label className="field">
          Title
          <input
            className="input"
            autoFocus
            value={nf.title}
            placeholder="Episode title"
            onChange={(ev) => {
              setNf({ ...nf, title: ev.target.value });
              setErr('');
            }}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field">
            Record date
            <input type="date" className="input" style={{ padding: '0 8px' }} value={nf.record} onChange={(ev) => setNf({ ...nf, record: ev.target.value })} />
          </label>
          <label className="field">
            Due date
            <input type="date" className="input" style={{ padding: '0 8px' }} value={nf.due} onChange={(ev) => setNf({ ...nf, due: ev.target.value })} />
          </label>
        </div>
        {err && <div className="err">{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button className="btn-secondary" style={{ padding: '0 14px' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={create} disabled={busy}>
            Create episode
          </button>
        </div>
      </div>
    </div>
  );
}
