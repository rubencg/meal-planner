import { useState } from 'react';
import { C } from '../theme';

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
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[400px] rounded-t-2xl md:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border2}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>

        <div className="p-6 md:p-7">
          <div className="mb-1.5 text-[17px] font-bold" style={{ color: C.text }}>
            {title}
          </div>
          <div className="text-[13px] mb-6" style={{ color: C.muted }}>
            {message}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[10px] text-[14px] font-medium cursor-pointer"
              style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[10px] text-[14px] font-bold cursor-pointer"
              style={{ background: `${C.red}18`, border: `1px solid ${C.red}44`, color: C.red, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
