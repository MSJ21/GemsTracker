import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm,
  title   = 'Confirm action',
  message = 'Are you sure you want to continue? This action cannot be undone.',
  loading,
}: Readonly<Props>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="danger"  size="sm" loading={loading} onClick={onConfirm}>Confirm</Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <p className="pt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  );
}
