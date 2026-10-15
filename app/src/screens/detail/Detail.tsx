import { useEffect, useState } from 'react';
import { useApp, type Tab } from '../../app-context';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EditEpisodeForm } from './EditEpisodeForm';
import { Avatar, Badge } from '../../components/ui';
import { EPISODE_STATUS_COLORS, STAGES } from '../../lib/constants';
import { daysText, fmtDate } from '../../lib/dates';
import { episodeInfo } from '../../lib/derive';
import type { Episode } from '../../lib/types';
import { HandoffsTab } from './HandoffsTab';
import { PackageTab } from './PackageTab';
import { PublishingTab } from './PublishingTab';
import { SchedulingTab } from './SchedulingTab';
import { VerificationTab } from './VerificationTab';

export function Detail({ e, tab, onTab, onBack }: { e: Episode; tab: Tab; onTab: (t: Tab) => void; onBack: () => void }) {
  const { today, store, run } = useApp();
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setNote('');
    setConfirmDelete(false);
    setEditing(false);
  }, [e.id]);

  const I = episodeInfo(e, today);
  const flag = e.stage === 6 ? '' : e.blocked ? 'Blocked' : I.overdue ? 'Overdue' : '';
  const allVerified = I.posts.length > 0 && I.posts.every((p) => p.verified);
  const canHandOff = e.stage < 5 || (e.stage === 5 && allVerified);
  const next = STAGES[e.stage + 1];

  const handOff = async () => {
    if (!canHandOff) return;
    const ok = await run(() => store.handOff(e.id, note.trim(), today), `EP ${e.num} moved to ${next.label}. ${next.owner} is now the owner.`);
    if (ok) setNote('');
  };

  const verifiedCount = I.posts.filter((p) => p.verified).length;
  const published = I.posts.some((p) => p.status === 'published');
  const tabs: [Tab, string, string][] = [
    ['handoffs', 'Handoffs', ''],
    ['package', 'Social package', e.clips.length ? `${e.pkg.filter(Boolean).length}/5` : ''],
    ['scheduling', 'Scheduling', I.posts.length ? String(I.posts.length) : ''],
    ['publishing', 'Publishing', ''],
    ['verification', 'Verification', published ? `${verifiedCount}/${I.posts.length}` : ''],
  ];

  return (
    <div className="stack-20">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back" onClick={onBack}>
          Back to episodes
        </button>
        <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
          Delete episode
        </button>
      </div>

      <div className="card detail-head">
        {editing ? (
          <EditEpisodeForm e={e} onDone={() => setEditing(false)} />
        ) : (
        <div className="detail-top">
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13 }} className="ep-num">
                EP {e.num}
              </span>
              {flag && <Badge colors={EPISODE_STATUS_COLORS[flag]}>{flag}</Badge>}
            </div>
            <h1 className="detail-title">{e.title}</h1>
            <div className="facts">
              <Fact label="Current stage">
                <span className="dot" style={{ width: 8, height: 8, background: '#C8A951' }} />
                <span style={{ color: '#1B2A4A' }}>{STAGES[e.stage].label}</span>
              </Fact>
              <Fact label="Owner">
                <Avatar owner={I.owner} />
                {I.owner}
              </Fact>
              <Fact label="Days in stage">{e.stage === 6 ? 'Complete' : daysText(I.days)}</Fact>
              <Fact label="Record date">{fmtDate(e.record)}</Fact>
              <Fact label="Due date">
                <span style={{ color: I.overdue ? '#A12B2B' : '#1F2733' }}>{fmtDate(e.due)}</span>
              </Fact>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
            <button className="btn-secondary" style={{ height: 38, padding: '0 14px' }} onClick={() => setEditing(true)}>
              Edit details
            </button>
            <button className="btn" style={{ height: 38, padding: '0 18px' }} disabled={!canHandOff} onClick={handOff}>
              Mark complete and hand off
            </button>
          </div>
        </div>
        )}

        <div className="timeline-wrap">
          <div className="timeline">
            {STAGES.map((st, i) => {
              const done = i < e.stage || e.stage === 6;
              const cur = i === e.stage && e.stage < 6;
              const h = e.handoffs.find((x) => x.fs === i);
              // Verified has no outgoing handoff; it completes when Published hands off.
              const date = h?.date || (i === 6 ? e.handoffs.find((x) => x.ts === 6)?.date : '');
              const meta = done ? `${fmtDate(date)} by ${st.owner}` : cur ? `${st.owner}, ${daysText(I.days)} so far` : `${st.owner}, not started`;
              return (
                <div key={st.label} className="tl-step">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={'tl-dot' + (done ? ' done' : cur ? ' current' : '')}>{done && <span className="tick" />}</span>
                    <span className={'tl-line' + (i === 6 ? ' last' : i < e.stage ? ' done' : '')} />
                  </div>
                  <div className={'tl-label' + (done || cur ? ' active' : '')}>{st.label}</div>
                  <div className="tl-meta">{meta}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map(([k, label, count]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => onTab(k)}>
            {label}
            {count && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'handoffs' && <HandoffsTab e={e} note={note} onNote={setNote} canHandOff={canHandOff} onHandOff={handOff} />}
      {tab === 'package' && <PackageTab e={e} />}
      {tab === 'scheduling' && <SchedulingTab e={e} onGoPackage={() => onTab('package')} />}
      {tab === 'publishing' && <PublishingTab e={e} />}
      {tab === 'verification' && <VerificationTab e={e} />}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete EP ${e.num}?`}
          confirmLabel="Delete episode"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            if (await run(() => store.deleteEpisode(e.id), `EP ${e.num} deleted.`)) onBack();
            else setConfirmDelete(false);
          }}
        >
          {`"${e.title}" will be removed for everyone, along with its handoff log, ${e.clips.length} clips and ${I.posts.length} posts. This cannot be undone.`}
        </ConfirmModal>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="fact-label">{label}</div>
      <div className="fact-value">{children}</div>
    </div>
  );
}
