import { useApp, type Tab } from '../app-context';
import { Avatar, Badge } from '../components/ui';
import { EPISODE_STATUS_COLORS, STAGES, isOperatorStage } from '../lib/constants';
import { addDays, daysText, fmtDate, monday } from '../lib/dates';
import { byDateTime, episodeInfo, flatPosts } from '../lib/derive';
import type { Episode } from '../lib/types';

export function Dashboard({ episodes }: { episodes: Episode[] }) {
  const { today, go, open } = useApp();
  const all = episodes.flatMap((e) => flatPosts(e).map((p) => ({ e, p })));
  const awaiting = all.filter((x) => x.p.status === 'published' && !x.p.verified);
  const ws = monday(today);
  const we = addDays(ws, 6);
  const schedWeek = all.filter((x) => x.p.status === 'scheduled' && x.p.date >= ws && x.p.date <= we).length;

  // Episodes on hold are paused, so they count as neither in progress nor waiting.
  const active = episodes.filter((e) => !e.holdSince);
  const onHold = episodes.filter((e) => e.holdSince && e.stage < 6).length;
  const summary = [
    {
      label: 'Episodes in progress',
      value: active.filter((e) => e.stage < 6).length,
      note: onHold ? `Not yet verified. ${onHold} on hold` : 'Not yet verified',
      onClick: () => go('episodes'),
    },
    { label: 'Waiting on someone else', value: active.filter((e) => e.stage < 3).length, note: 'With Tyler, Nik, or Wes', onClick: () => go('episodes') },
    { label: 'Scheduled this week', value: schedWeek, note: `${fmtDate(ws)} to ${fmtDate(we)}`, onClick: () => go('calendar') },
    {
      label: 'Published awaiting verification',
      value: awaiting.length,
      note: `Across ${new Set(awaiting.map((x) => x.e.id)).size} episodes`,
      onClick: () => go('verification'),
    },
  ];

  const actions = episodes
    .filter((e) => isOperatorStage(e.stage) && !e.holdSince)
    .sort((a, b) => b.stage - a.stage)
    .map((e) => {
      const I = episodeInfo(e, today);
      let detail: string;
      let tab: Tab;
      if (e.stage === 3) {
        const left = e.pkg.filter((x) => !x).length;
        detail = left ? `${left} of 5 checklist items left` : 'Checklist complete. Ready to schedule';
        tab = 'package';
      } else if (e.stage === 4) {
        const sc = I.posts.filter((p) => p.status === 'scheduled').sort(byDateTime);
        const aw = I.posts.filter((p) => p.status === 'published' && !p.verified).length;
        detail = `${sc.length} posts scheduled, next ${fmtDate(sc[0]?.date)}` + (aw ? `. ${aw} live awaiting verification` : '');
        tab = 'scheduling';
      } else {
        const aw = I.posts.filter((p) => p.status === 'published' && !p.verified).length;
        const f = I.posts.filter((p) => p.status === 'failed').length;
        detail = `${aw} awaiting verification` + (f ? `, ${f} failed` : '');
        tab = 'verification';
      }
      return { e, detail, tab, days: daysText(I.days) + ' in stage' };
    });

  return (
    <div className="stack-24">
      <div>
        <h1>Dashboard</h1>
        <div className="sub">Every episode from handoff to verified posts</div>
      </div>

      <div className="summary-grid">
        {summary.map((m) => (
          <button key={m.label} className="metric" onClick={m.onClick}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-note">{m.note}</div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="action-head">
          <h2>Needs my action</h2>
          <span className="pill-gold">{actions.length}</span>
          <span className="hint">Episodes in social package, scheduled, and published</span>
        </div>
        {actions.map((a) => (
          <div key={a.e.id} className="action-row row-link" onClick={() => open(a.e.id, a.tab)}>
            <span className="ep-num">EP {a.e.num}</span>
            <span className="ep-title">{a.e.title}</span>
            <span className="stage-cell">
              <span className="dot" style={{ background: '#C8A951' }} />
              {STAGES[a.e.stage].label}
            </span>
            <span style={{ color: '#3A4556' }}>{a.detail}</span>
            <span className="muted">{a.days}</span>
            <span className="open-link">Open</span>
          </div>
        ))}
        {!actions.length && <div className="empty">Nothing waiting on you right now.</div>}
      </div>

      <div>
        <div className="pipeline-head">
          <h2>Pipeline</h2>
          <span className="metric-note" style={{ marginTop: 0 }}>
            {episodes.length} episodes
          </span>
        </div>
        <div className="pipeline-wrap">
          <div className="pipeline">
            {STAGES.map((st, i) => {
              const cards = episodes.filter((e) => e.stage === i);
              return (
                <div key={st.label} className={'col' + (isOperatorStage(i) ? ' mine' : '')}>
                  <div className="col-head">
                    <div className="col-title">
                      <span>{st.label}</span>
                      <span>{cards.length}</span>
                    </div>
                    <div className="col-owner">{st.owner === 'Deanne' ? 'Deanne (you)' : st.owner}</div>
                  </div>
                  {cards.map((e) => (
                    <PipelineCard key={e.id} e={e} />
                  ))}
                  {!cards.length && <div className="col-empty">No episodes</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ e }: { e: Episode }) {
  const { today, open } = useApp();
  const I = episodeInfo(e, today);
  const flag = I.status === 'On hold' || I.status === 'Blocked' || I.status === 'Overdue' ? I.status : '';
  return (
    <div className={'ep-card' + (e.holdSince ? ' held' : '')} onClick={() => open(e.id)}>
      <div className="ep-card-top">
        <span>EP {e.num}</span>
        {flag && (
          <Badge small colors={EPISODE_STATUS_COLORS[flag]}>
            {flag}
          </Badge>
        )}
      </div>
      <div className="ep-card-title">{e.title}</div>
      <div className="ep-card-owner">
        <Avatar owner={I.owner} />
        {I.owner}
      </div>
      <div className="ep-card-meta">
        <span style={{ color: I.overdue ? '#A12B2B' : '#5F6876' }}>Due {fmtDate(e.due)}</span>
        <span>{e.stage === 6 ? 'Done' : daysText(I.days)}</span>
      </div>
    </div>
  );
}
