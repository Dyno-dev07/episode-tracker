export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const iso = (d: Date) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const today = () => iso(new Date());
export const addDays = (s: string, n: number) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const diffDays = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 864e5);
export const fmtDate = (s?: string) =>
  s ? parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not set';
export const fmtTime = (t: string) => {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
};
export const daysText = (n: number) => n + (n === 1 ? ' day' : ' days');
export const monday = (s: string) => addDays(s, -((parseDate(s).getDay() + 6) % 7));
