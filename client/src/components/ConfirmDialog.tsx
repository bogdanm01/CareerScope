import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@heroui/react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close confirmation dialog"
        className="absolute inset-0 bg-black/40"
        type="button"
        disabled={loading}
        onClick={onCancel}
      />
      <div
        aria-modal="true"
        role="dialog"
        className="relative z-10 w-full max-w-lg rounded-xl border border-divider bg-content1 p-6 shadow-2xl outline-none"
      >
        <h2 className="text-2xl text-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground-500">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button className="rounded-lg" variant="outline" onPress={onCancel} isDisabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            className="rounded-lg"
            variant={confirmTone === 'danger' ? 'danger' : 'primary'}
            onPress={onConfirm}
            isDisabled={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
