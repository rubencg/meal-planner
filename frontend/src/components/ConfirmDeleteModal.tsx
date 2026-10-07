import { useState } from 'react';
import { C } from '../theme';
import { Button, Sheet } from './ui';

interface Props {
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDeleteModal({ title, message, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet title={title} onClose={onClose} maxWidth={420} z={200}>
      <p className="text-[14px] mb-7 -mt-3" style={{ color: C.muted }}>
        {message}
      </p>
      <div className="flex gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1"
          style={{ background: C.red, color: C.surface }}
        >
          {loading ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
    </Sheet>
  );
}
