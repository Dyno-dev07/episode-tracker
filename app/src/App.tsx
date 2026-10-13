import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ctx, type AppCtx, type Screen, type Tab } from './app-context';
import { ExportModal } from './components/ExportModal';
import { NewEpisodeModal } from './components/NewEpisodeModal';
import type { Store } from './data/store';
import { parseDate, today as getToday } from './lib/dates';
import type { Episode } from './lib/types';
import { Calendar } from './screens/Calendar';
import { Dashboard } from './screens/Dashboard';
import { Detail } from './screens/detail/Detail';
import { Episodes, emptyFilters, type Filters } from './screens/Episodes';
import { Verification } from './screens/Verification';

type Route = { screen: Exclude<Screen, 'detail'> } | { screen: 'detail'; num: number; tab: Tab };

const TABS: Tab[] = ['handoffs', 'package', 'scheduling', 'publishing', 'verification'];
const NAV: [Exclude<Screen, 'detail'>, string][] = [
  ['dashboard', 'Dashboard'],
  ['episodes', 'Episodes'],
  ['calendar', 'Calendar'],
  ['verification', 'Verification'],
];

// Routes: #/dashboard, #/episodes, #/episodes/116/scheduling, #/calendar, #/verification
function parseRoute(hash: string): Route {
  const [screen, num, tab] = hash.replace(/^#\/?/, '').split('/');
  if (screen === 'episodes' && num && /^\d+$/.test(num))
    return { screen: 'detail', num: +num, tab: TABS.includes(tab as Tab) ? (tab as Tab) : 'handoffs' };
  if (screen === 'episodes' || screen === 'calendar' || screen === 'verification') return { screen };
  return { screen: 'dashboard' };
}
const routeHash = (r: Route) => (r.screen === 'detail' ? `#/episodes/${r.num}/${r.tab}` : `#/${r.screen}`);

export function App({ store, onSignOut, userEmail }: { store: Store; onSignOut?: () => void; userEmail?: string }) {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [modal, setModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [today, setToday] = useState(getToday);
  const toastTimer = useRef<number>(undefined);

  const reload = useCallback(async () => {
    try {
      setEpisodes(await store.load());
      setLoadErr('');
    } catch (err) {
      setLoadErr(err instanceof Error ? err.message : String(err));
    }
  }, [store]);

  useEffect(() => {
    reload();
    let t: number | undefined;
    const unsub = store.subscribe(() => {
      clearTimeout(t);
      t = window.setTimeout(reload, 250);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [store, reload]);

  // Keep "today" fresh if the tab stays open past midnight.
  useEffect(() => {
    const id = window.setInterval(() => setToday(getToday()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    const h = routeHash(r);
    if (location.hash !== h) location.hash = h;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const showToast = useCallback((text: string, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ text, error });
    toastTimer.current = window.setTimeout(() => setToast(null), error ? 5000 : 2800);
  }, []);

  const epsRef = useRef(episodes);
  epsRef.current = episodes;

  const ctx = useMemo<AppCtx>(
    () => ({
      store,
      today,
      toast: (m) => showToast(m),
      run: async (op, message) => {
        try {
          const r = await op();
          if (message) showToast(typeof message === 'function' ? message(r) : message);
          await reload();
          return true;
        } catch (err) {
          showToast(`Could not save. ${err instanceof Error ? err.message : String(err)}`, true);
          await reload();
          return false;
        }
      },
      go: (screen) => navigate({ screen }),
      open: (id, tab = 'handoffs') => {
        const e = epsRef.current?.find((x) => x.id === id);
        if (e) navigate({ screen: 'detail', num: e.num, tab });
      },
    }),
    [store, today, showToast, reload, navigate],
  );

  const eps = episodes || [];
  const awaiting = eps.flatMap((e) => e.clips.flatMap((c) => c.posts)).filter((p) => p.status === 'published' && !p.verified).length;
  const nextNum = Math.max(0, ...eps.map((e) => e.num)) + 1;
  const detailEp = route.screen === 'detail' ? eps.find((e) => e.num === route.num) : undefined;
  const onSearch = (v: string) => {
    setSearch(v);
    if (v && route.screen !== 'episodes') navigate({ screen: 'episodes' });
  };

  let body: React.ReactNode;
  if (loadErr && !episodes) body = <div className="err">Could not load episodes. {loadErr}</div>;
  else if (!episodes) body = <div className="loading">Loading episodes</div>;
  else if (route.screen === 'dashboard') body = <Dashboard episodes={eps} />;
  else if (route.screen === 'episodes')
    body = <Episodes episodes={eps} search={search} onSearch={onSearch} filters={filters} onFilters={setFilters} onNew={() => setModal(true)} onExport={() => setExporting(true)} />;
  else if (route.screen === 'calendar') body = <Calendar episodes={eps} onExport={() => setExporting(true)} />;
  else if (route.screen === 'verification') body = <Verification episodes={eps} />;
  else if (detailEp && route.screen === 'detail')
    body = (
      <Detail
        e={detailEp}
        tab={route.tab}
        onTab={(tab) => navigate({ screen: 'detail', num: detailEp.num, tab })}
        onBack={() => navigate({ screen: 'episodes' })}
      />
    );
  else body = <div className="empty">EP {route.screen === 'detail' ? route.num : ''} was not found.</div>;

  return (
    <Ctx.Provider value={ctx}>
      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar-head">Episode Tracker</div>
          <nav>
            {NAV.map(([k, label]) => {
              const active = route.screen === k || (k === 'episodes' && route.screen === 'detail');
              return (
                <button key={k} className={'nav-item' + (active ? ' active' : '')} aria-current={active ? 'page' : undefined} onClick={() => navigate({ screen: k })}>
                  <span>{label}</span>
                  {k === 'verification' && awaiting > 0 && <span className="pill-gold">{awaiting}</span>}
                </button>
              );
            })}
          </nav>
          {onSignOut && (
            <div className="sidebar-foot">
              {userEmail && <span>{userEmail}</span>}
              <button onClick={onSignOut}>Sign out</button>
            </div>
          )}
        </aside>

        <div className="main-col">
          <header className="topbar">
            <input className="topbar-search" value={search} onChange={(ev) => onSearch(ev.target.value)} placeholder="Search episodes by title" />
            <div style={{ flex: 1 }} />
            <span className="topbar-date">
              {parseDate(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <button className="btn" onClick={() => setModal(true)}>
              New episode
            </button>
          </header>
          <main>
            {store.kind === 'local' && (
              <div className="demo-note">
                <span style={{ flex: 1 }}>Demo mode. Supabase is not connected, so changes are saved in this browser only.</span>
                <button
                  className="btn-secondary sm"
                  onClick={() => {
                    localStorage.removeItem('episode-tracker-demo');
                    location.reload();
                  }}
                >
                  Reset sample data
                </button>
              </div>
            )}
            {body}
          </main>
        </div>

        {modal && <NewEpisodeModal nextNum={nextNum} onClose={() => setModal(false)} />}
        {exporting && <ExportModal episodes={eps} onClose={() => setExporting(false)} />}
        {toast && (
          <div className={'toast' + (toast.error ? ' error' : '')} role="status">
            {toast.text}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
