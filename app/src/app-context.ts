import { createContext, useContext } from 'react';
import type { Store } from './data/store';

export type Screen = 'dashboard' | 'episodes' | 'calendar' | 'verification' | 'detail';
export type Tab = 'handoffs' | 'package' | 'scheduling' | 'publishing' | 'verification';

export interface AppCtx {
  store: Store;
  today: string;
  /** Runs a write, shows its confirmation, reloads, and reports errors as a toast. Resolves to true on success. */
  run: <T>(op: () => Promise<T>, message?: string | ((r: T) => string)) => Promise<boolean>;
  toast: (m: string) => void;
  go: (screen: Exclude<Screen, 'detail'>) => void;
  open: (episodeId: string, tab?: Tab) => void;
}

export const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('App context missing');
  return c;
};
