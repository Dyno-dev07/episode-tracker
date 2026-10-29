import { useState } from 'react';
import { useApp } from '../../app-context';
import { STAGES } from '../../lib/constants';
import { daysText, diffDays, fmtDate } from '../../lib/dates';
import { episodeInfo } from '../../lib/derive';
import type { Episode } from '../../lib/types';

export function HandoffsTab(props: { e: Episode; note: string; onNote: (v: string) => void; canHandOff: boolean; onHandOff: () => void }) {
  const { e, note, onNote, canHandOff, onHandOff } = props;
  const { today, store, run } = useApp();
  const [blockDraft, setBlockDraft] = useState('');
  const I = episodeInfo(e, today);
  const next = STAGES[e.stage + 1];
  const unverified = I.posts.filter((p) => !p.verified).length;
  const allVerified = I.posts.length > 0 && unverified === 0;

  const gate = e.holdSince
    ? 'This episode is on hold. Resume it at the top of the page to hand off.'
    : e.stage === 6
      ? 'This episode is verified. No further handoffs.'
      : e.stage === 5 && !allVerified
        ? `${unverified} of ${I.posts.length} posts still need verification. The episode moves to Verified when every post is verified.`
        : e.stage === 3 && e.pkg.some((x) => !x)
          ? 'Some checklist items are still open. You can still hand off if the package is ready.'
          : '';

  const overdueText =
    e.holdSince
      ? `On hold, so not flagged. Due ${fmtDate(e.due)}.`
      : e.stage >= 5
      ? 'Published. The due date no longer applies.'
      : I.overdue
        ? `Overdue by ${daysText(diffDays(e.due, today))}. Due ${fmtDate(e.due)}.`
        : e.due === today
          ? 'Due today.'
          : `On schedule. Due ${fmtDate(e.due)}.`;

  const log = e.handoffs.slice().reverse();

  return (
    <div className="two-col w400">
      <div className="stack-20">
        <div className="card card-pad">
          <h2 style={{ marginBottom: 16 }}>Hand off</h2>
          <div className="ho-boxes">
            <div className="ho-box">
              <div className="k">From</div>
              <div className="v">{STAGES[e.stage].label}</div>
              <div className="o">{I.owner}</div>
            </div>
            <div className="ho-box">
              <div className="k">To</div>
              <div className="v">{next ? next.label : 'None'}</div>
              <div className="o">{next ? next.owner : 'Complete'}</div>
            </div>
          </div>
          <label className="field" style={{ gap: 6, marginTop: 16 }}>
            {next ? `Note for ${next.owner} (optional)` : 'Note (optional)'}
            <textarea className="input" rows={3} value={note} onChange={(ev) => onNote(ev.target.value)} />
          </label>
          {gate && <div className="gate">{gate}</div>}
          <button className="btn" style={{ marginTop: 16, width: '100%', height: 38 }} disabled={!canHandOff} onClick={onHandOff}>
            Mark complete and hand off
          </button>
        </div>

        <div className="card card-pad">
          <h2 style={{ marginBottom: 14 }}>Flags</h2>
          <div className="flag-row" style={{ paddingBottom: 14, borderBottom: '1px solid #EEF0F3' }}>
            <span className="dot" style={{ background: I.overdue ? '#A12B2B' : '#CDD2DA' }} />
            <div>
              <div className="flag-title">Overdue</div>
              <div style={{ color: '#3A4556', marginTop: 3 }}>{overdueText}</div>
            </div>
          </div>
          <div className="flag-row" style={{ paddingTop: 14 }}>
            <span className="dot" style={{ background: e.blocked ? '#A12B2B' : '#CDD2DA' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="flag-title">Blocked</div>
              {e.blocked ? (
                <>
                  <div style={{ color: '#A12B2B', lineHeight: 1.45 }}>{e.blocked}</div>
                  <button
                    className="btn-secondary sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => run(() => store.updateEpisode(e.id, { blocked: '' }), 'Blocked flag cleared.')}
                  >
                    Clear flag
                  </button>
                </>
              ) : (
                <>
                  <input
                    className="input"
                    style={{ height: 34 }}
                    value={blockDraft}
                    onChange={(ev) => setBlockDraft(ev.target.value)}
                    placeholder="What is blocking this handoff"
                  />
                  <button
                    className="btn-danger"
                    onClick={async () => {
                      const reason = blockDraft.trim() || 'Blocked, no reason given.';
                      if (await run(() => store.updateEpisode(e.id, { blocked: reason }), `EP ${e.num} flagged as blocked.`)) setBlockDraft('');
                    }}
                  >
                    Flag as blocked
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Handoff log</h2>
          <span className="count">{log.length} handoffs</span>
        </div>
        {log.map((h) => (
          <div key={h.id} className="log-row">
            <span className="muted">{fmtDate(h.date)}</span>
            <div>
              <div className="flag-title">
                {STAGES[h.fs].owner} to {STAGES[h.ts].owner}
              </div>
              <div className="muted" style={{ marginTop: 3 }}>
                {STAGES[h.fs].label} to {STAGES[h.ts].label}
              </div>
              {h.note && <div className="note-box">{h.note}</div>}
            </div>
          </div>
        ))}
        {!log.length && <div className="empty">No handoffs yet. The first handoff happens when Tyler finishes the edit.</div>}
      </div>
    </div>
  );
}
