import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Email sign-in link via Supabase Auth. */
export function SignIn({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState('');

  const send = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) return setErr('Enter your email address.');
    setState('sending');
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname, shouldCreateUser: false },
    });
    if (error) {
      setErr(error.message);
      setState('idle');
    } else setState('sent');
  };

  return (
    <div className="signin">
      <form className="card" onSubmit={send}>
        <h1 style={{ fontSize: 20 }}>Episode Tracker</h1>
        {state === 'sent' ? (
          <div className="sub" style={{ marginTop: 0, lineHeight: 1.5 }}>
            Check your inbox. We sent a sign-in link to {email.trim()}.
          </div>
        ) : (
          <>
            <div className="sub" style={{ marginTop: 0 }}>
              Sign in with your work email. We will send you a link.
            </div>
            <label className="field">
              Email
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                  setErr('');
                }}
              />
            </label>
            {err && <div className="err">{err}</div>}
            <button className="btn" type="submit" disabled={state === 'sending'}>
              Send sign-in link
            </button>
          </>
        )}
      </form>
    </div>
  );
}
