import { useState, useEffect } from 'react';
import { C } from '../theme';
import * as api from '../api';
import type { Protein } from '../types';
import type { PageProps } from '../App';

function ProteinModal({ protein, onSave, onClose }: { protein: Protein | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm]   = useState<Omit<Protein, 'id'>>({
    name:        protein?.name        ?? '',
    lossPercent: protein?.lossPercent ?? 20,
    notes:       protein?.notes       ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const examples = [100, 150, 200, 250, 300];

  const handleSave = async () => {
    setSaving(true);
    try {
      if (protein?.id) await api.updateProtein(protein.id, form);
      else await api.createProtein(form);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border2}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>

        <div className="p-5 md:p-7">
          <div className="text-[17px] font-bold mb-5" style={{ color: C.text }}>
            {protein ? 'Editar' : 'Nueva'} Proteína
          </div>

          <div className="flex flex-col gap-3.5 mb-5">
            {/* Name */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>
                Nombre de la proteína
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ej. Pechuga de Pollo"
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
              />
            </div>

            {/* Loss percent */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>
                % de pérdida al cocinar{' '}
                <span className="font-normal" style={{ color: C.dim }}>(peso crudo → cocido)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0} max={40} step={1}
                  value={form.lossPercent}
                  onChange={e => set('lossPercent', parseInt(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: C.accent }}
                />
                <div
                  className="text-[18px] font-bold min-w-[48px] text-right"
                  style={{ fontFamily: "'DM Mono', monospace", color: C.accent }}
                >
                  {form.lossPercent}%
                </div>
              </div>
              <div className="text-[12px] mt-1" style={{ color: C.muted }}>
                100g crudo → <span className="font-semibold" style={{ color: C.accent }}>{100 - form.lossPercent}g cocido</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: C.muted }}>Notas (opcional)</label>
              <input
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="ej. Sin piel, marinado…"
                className="w-full rounded-[9px] px-3.5 py-2.5 text-[14px]"
                style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Conversion table */}
          {form.lossPercent > 0 && (
            <div
              className="rounded-[10px] p-3.5 mb-5"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            >
              <div
                className="text-[11px] uppercase tracking-[0.06em] mb-2"
                style={{ color: C.muted }}
              >
                Tabla de conversión
              </div>
              <div
                className="flex rounded-lg overflow-hidden"
                style={{ border: `1px solid ${C.border}` }}
              >
                <div className="flex-1" style={{ background: C.surface3 }}>
                  <div
                    className="px-2.5 py-1.5 text-[10px] text-center"
                    style={{ color: C.dim, borderBottom: `1px solid ${C.border}` }}
                  >
                    CRUDO (g)
                  </div>
                  {examples.map(g => (
                    <div
                      key={g}
                      className="px-2.5 py-1.5 text-[12px] text-center"
                      style={{ color: C.muted, fontFamily: "'DM Mono', monospace", borderTop: `1px solid ${C.border}` }}
                    >
                      {g}g
                    </div>
                  ))}
                </div>
                <div
                  className="w-7 flex flex-col items-center"
                  style={{ background: C.surface3, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}
                >
                  <div
                    className="py-1.5 text-[10px] w-full text-center"
                    style={{ color: C.dim, borderBottom: `1px solid ${C.border}` }}
                  >
                    →
                  </div>
                  {examples.map(g => (
                    <div
                      key={g}
                      className="text-[10px] py-1.5 w-full text-center"
                      style={{ color: C.dim, borderTop: `1px solid ${C.border}` }}
                    >
                      →
                    </div>
                  ))}
                </div>
                <div className="flex-1" style={{ background: C.surface3 }}>
                  <div
                    className="px-2.5 py-1.5 text-[10px] text-center"
                    style={{ color: C.accent, borderBottom: `1px solid ${C.border}` }}
                  >
                    COCIDO (g)
                  </div>
                  {examples.map(g => (
                    <div
                      key={g}
                      className="px-2.5 py-1.5 text-[12px] font-semibold text-center"
                      style={{ color: C.accent, fontFamily: "'DM Mono', monospace", borderTop: `1px solid ${C.border}` }}
                    >
                      {Math.round(g * (1 - form.lossPercent / 100))}g
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[9px] text-[14px] cursor-pointer min-h-[44px]"
              style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="px-5 py-2.5 rounded-[9px] text-[14px] font-bold cursor-pointer min-h-[44px]"
              style={{
                border:   'none',
                background: C.accent,
                color:    '#000',
                opacity:  !form.name.trim() ? 0.5 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProteinCard({ protein, onEdit, onDelete }: { protein: Protein; onEdit: () => void; onDelete: () => void }) {
  const examples = [100, 150, 200];
  return (
    <div
      className="rounded-[14px] p-4 flex flex-col gap-3"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="text-[15px] font-bold" style={{ color: C.text }}>{protein.name}</div>
          {protein.notes && (
            <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{protein.notes}</div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
            style={{ border: `1px solid ${C.border2}`, background: 'none', color: C.muted }}
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-2.5 py-1.5 rounded-[7px] text-[12px] cursor-pointer min-h-[36px]"
            style={{ border: `1px solid ${C.red}33`, background: 'none', color: C.red }}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div
          className="px-3 py-1.5 rounded-full text-[13px] font-bold"
          style={{ background: C.accent + '18', color: C.accent, fontFamily: "'DM Mono', monospace" }}
        >
          -{protein.lossPercent}%
        </div>
        <div className="text-[12px]" style={{ color: C.muted }}>pérdida al cocinar</div>
      </div>

      <div className="flex gap-1.5">
        {examples.map(g => (
          <div
            key={g}
            className="flex-1 rounded-[9px] p-2 text-center"
            style={{ background: C.surface3, border: `1px solid ${C.border}` }}
          >
            <div className="text-[11px] mb-0.5" style={{ color: C.muted }}>{g}g crudo</div>
            <div
              className="text-[14px] font-bold"
              style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}
            >
              {Math.round(g * (1 - protein.lossPercent / 100))}g
            </div>
            <div className="text-[10px]" style={{ color: C.dim }}>cocido</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProteinsPage(_props: PageProps) {
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [modal,    setModal]    = useState<Protein | null | 'new'>(null);

  const reload = () => api.getProteins().then(setProteins).catch(() => {});
  useEffect(() => { reload(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta proteína?')) return;
    await api.deleteProtein(id);
    reload();
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-7 max-w-[900px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 gap-3">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-[-0.4px] m-0" style={{ color: C.text }}>
            Proteínas
          </h1>
          <div className="text-[13px] mt-1" style={{ color: C.muted }}>
            {proteins.length} fuentes · Conversión crudo → cocido automática
          </div>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-bold cursor-pointer shrink-0 min-h-[44px]"
          style={{ border: 'none', background: C.accent, color: '#000' }}
        >
          + Nueva
        </button>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl p-3.5 mb-5 text-[13px] flex gap-2.5 items-start"
        style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted }}
      >
        <span className="text-[18px] shrink-0">💡</span>
        <span>
          Al cocinar, las proteínas pierden peso. Registra el{' '}
          <strong style={{ color: C.text }}>% de pérdida</strong> de cada fuente. El planificador mostrará
          el peso <strong style={{ color: C.text }}>cocido</strong> en el plan y el peso{' '}
          <strong style={{ color: C.text }}>crudo</strong> en la lista de compras.
        </span>
      </div>

      {proteins.length === 0 ? (
        <div className="text-center py-12 text-[14px]" style={{ color: C.muted }}>
          Sin proteínas registradas. ¡Agrega la primera!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {proteins.map(p => (
            <ProteinCard
              key={p.id}
              protein={p}
              onEdit={() => setModal(p)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      {modal !== null && (
        <ProteinModal
          protein={modal === 'new' ? null : modal}
          onSave={() => { reload(); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
