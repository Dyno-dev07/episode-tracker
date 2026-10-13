const cell = (v: string | number | boolean) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds a CSV string. The byte order mark lets Excel read accents and symbols correctly. */
export const toCsv = (header: string[], rows: (string | number | boolean)[][]) =>
  '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
