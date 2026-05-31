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

  return (
    <Modal state={state}>
      <Modal.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <Modal.Container className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <Modal.Dialog className="w-full max-w-lg rounded-3xl border border-divider bg-content1 p-6 shadow-medium outline-none">
          <Modal.Header className="text-xl font-semibold text-foreground">{title}</Modal.Header>
          <Modal.Body className="mt-3 text-sm leading-6 text-foreground-500">{description}</Modal.Body>
          <Modal.Footer className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              onPress={onCancel}
              isDisabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmTone === 'danger' ? 'danger' : 'primary'}
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
