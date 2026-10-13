import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { App } from './App';
import { SignIn } from './components/SignIn';
import { supabase } from './data/client';
import { createLocalStore } from './data/localStore';
import { createSupabaseStore } from './data/supabaseStore';
import './styles.css';

function Root() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const store = useMemo(() => (supabase ? createSupabaseStore(supabase) : createLocalStore()), []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) return <App store={store} />;
  if (session === undefined) return <div className="loading">Loading</div>;
  if (!session) return <SignIn sb={supabase} />;
  return <App store={store} userEmail={session.user.email} onSignOut={() => supabase!.auth.signOut()} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
