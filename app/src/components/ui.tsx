import { avatarColors } from '../lib/constants';

export function Avatar({ owner }: { owner: string }) {
  const [bg, fg] = avatarColors(owner);
  return (
    <span className="avatar" style={{ background: bg, color: fg }}>
      {owner[0]}
    </span>
  );
}

export function Badge({ colors, children, small }: { colors: [string, string]; children: React.ReactNode; small?: boolean }) {
  return (
    <span className={'badge' + (small ? ' sm' : '')} style={{ background: colors[0], color: colors[1] }}>
      {children}
    </span>
  );
}

export function Checkbox({ on }: { on: boolean }) {
  return <span className={'check' + (on ? ' on' : '')}>{on && <span className="tick" />}</span>;
}

export function PlatformDot({ color, size = 8 }: { color: string; size?: number }) {
  return <span className="sq" style={{ background: color, width: size, height: size }} />;
}
