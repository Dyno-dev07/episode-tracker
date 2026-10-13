import { useEffect, useState } from 'react';

/** A text input that keeps its own draft and saves on blur or Enter, so typing never waits on the network. */
export function CommitInput({
  value,
  onCommit,
  ...rest
}: { value: string; onCommit: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  const commit = () => {
    const v = draft.trim();
    if (v !== value) onCommit(v);
  };
  return (
    <input
      {...rest}
      value={draft}
      onChange={(ev) => setDraft(ev.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter') ev.currentTarget.blur();
      }}
    />
  );
}
