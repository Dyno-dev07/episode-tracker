import { useState } from 'react';
import { useApp } from '../app-context';
import type { Episode } from '../lib/types';

/** Puts an episode on hold until further notice, with an optional reason. */
export function HoldModal({ e, onClose }: { e: Episode; onClose: () => void }) {
  const { today, store, run } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await run(() => store.updateEpisode(e.id, { holdSince: today, holdNote: note.trim() }), `EP ${e.num} is on hold.`);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hold-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="hold-title">Put EP {e.num} on hold?</h2>
        <div style={{ fontSize: 13, color: '#3A4556', lineHeight: 1.5 }}>
          The episode stays in its current stage until someone resumes it. While it is on hold it cannot be handed off, it is not flagged as overdue, and
          it leaves the Needs my action list.
        </div>
        <label className="field">
          Reason (optional)
          <textarea className="input" rows={3} autoFocus value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Why is this episode on hold" />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button className="btn-secondary" style={{ padding: '0 14px' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy} onClick={save}>
            Put on hold
          </button>
        </div>
      </div>
    </div>
  );
}
