import { useState } from 'react';

/** Confirmation dialog for destructive actions. */
export function ConfirmModal(props: {
  title: string;
  confirmLabel: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const { title, confirmLabel, children, onCancel, onConfirm } = props;
  const [busy, setBusy] = useState(false);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <div style={{ fontSize: 13, color: '#3A4556', lineHeight: 1.5 }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button className="btn-secondary" style={{ padding: '0 14px' }} onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button
            className="btn btn-destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
