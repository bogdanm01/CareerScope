import { Button, Modal, useOverlayState } from '@heroui/react';

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
  const state = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        onCancel();
      }
    },
  });

  if (!open) {
    return null;
  }

  const confirmClasses =
    confirmTone === 'danger'
      ? 'border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:border-rose-400/40 hover:bg-rose-500/20'
      : 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:-translate-y-0.5';

  return (
    <Modal state={state}>
      <Modal.Backdrop className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm" />
      <Modal.Container className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <Modal.Dialog className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40 outline-none">
          <Modal.Header className="text-xl font-semibold text-white">{title}</Modal.Header>
          <Modal.Body className="mt-3 text-sm leading-6 text-slate-300">{description}</Modal.Body>
          <Modal.Footer className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-progress disabled:opacity-70"
              onPress={onCancel}
              isDisabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-progress disabled:opacity-70 ${confirmClasses}`}
              onPress={onConfirm}
              isDisabled={loading}
            >
              {loading ? 'Working...' : confirmLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
};
