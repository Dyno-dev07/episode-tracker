import { useState } from 'react';
import { useApp } from '../../app-context';
import type { Episode } from '../../lib/types';

/** Inline form for the episode's own details. Stage and owner change only through handoffs. */
export function EditEpisodeForm({ e, onDone }: { e: Episode; onDone: () => void }) {
  const { store, run } = useApp();
  const [f, setF] = useState({ num: String(e.num), title: e.title, record: e.record, due: e.due });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof f>) => {
    setF({ ...f, ...patch });
    setErr('');
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const num = Number(f.num);
    if (!Number.isInteger(num) || num < 1) return setErr('Episode number must be a whole number above 0.');
    if (!f.title.trim()) return setErr('Add a title.');
    if (!f.record || !f.due) return setErr('Add a record date and a due date.');
    setBusy(true);
    const ok = await run(
      async () => {
        await store.updateEpisode(e.id, { num, title: f.title.trim(), record: f.record, due: f.due });
        // The page address uses the episode number, so follow the episode to its new number.
        if (num !== e.num) location.hash = location.hash.replace(/^#\/episodes\/\d+/, `#/episodes/${num}`);
      },
      `EP ${num} details saved.`,
    );
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', gap: 12 }}>
        <label className="field">
          Episode number
          <input className="input" inputMode="numeric" value={f.num} onChange={(ev) => set({ num: ev.target.value })} />
        </label>
        <label className="field">
          Title
          <input className="input" autoFocus value={f.title} onChange={(ev) => set({ title: ev.target.value })} />
        </label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <label className="field">
          Record date
          <input type="date" className="input" style={{ padding: '0 8px' }} value={f.record} onChange={(ev) => set({ record: ev.target.value })} />
        </label>
        <label className="field">
          Due date
          <input type="date" className="input" style={{ padding: '0 8px' }} value={f.due} onChange={(ev) => set({ due: ev.target.value })} />
        </label>
      </div>
      <div className="metric-note" style={{ marginTop: 0 }}>
        Stage and owner change when the episode is handed off.
      </div>
      {err && <div className="err">{err}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn" disabled={busy}>
          Save details
        </button>
        <button type="button" className="btn-secondary" style={{ padding: '0 14px' }} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
