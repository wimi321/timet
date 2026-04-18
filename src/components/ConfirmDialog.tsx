import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onCancel();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-backdrop"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            ref={cancelRef}
            className="confirm-cancel-btn"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="confirm-ok-btn"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
