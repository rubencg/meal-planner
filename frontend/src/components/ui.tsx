import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { C, FONT } from '../theme';

/* ─── Below Tailwind's md breakpoint (for sizes inline styles can't make responsive) ─── */
export function useIsMobile() {
  const query = '(max-width: 767px)';
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

/* ─── Button ─── */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

const BUTTON_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary:   { background: C.primary, color: C.primaryText, border: '1px solid transparent' },
  accent:    { background: C.accent, color: C.accentInk, border: '1px solid transparent' },
  secondary: { background: C.surface, color: C.text, border: `1px solid ${C.border2}` },
  ghost:     { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
  danger:    { background: C.redSoft, color: C.red, border: '1px solid transparent' },
};

export function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', style, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: ReactNode;
}) {
  const iconOnly = !children;
  const sizing = size === 'md'
    ? `min-h-[44px] text-[14px] ${iconOnly ? 'w-[44px]' : 'px-5'}`
    : `min-h-[36px] text-[13px] ${iconOnly ? 'w-[36px]' : 'px-3.5'}`;
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${sizing} ${className}`}
      style={{ ...BUTTON_STYLES[variant], ...style }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── Card ─── */
type CardTone = 'surface' | 'accent' | 'ink';

const CARD_TONES: Record<CardTone, CSSProperties> = {
  surface: { background: C.surface, color: C.text },
  accent:  { background: C.accent, color: C.accentInk },
  ink:     { background: C.ink, color: C.inkText },
};

export function Card({
  tone = 'surface', className = '', style, children,
}: { tone?: CardTone; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <section className={`rounded-[22px] md:rounded-[28px] ${className}`} style={{ ...CARD_TONES[tone], ...style }}>
      {children}
    </section>
  );
}

/* ─── Delta pill (▲/▼ vs previous record) ─── */
export function DeltaPill({
  delta, unit, lowerIsBetter, onAccent,
}: { delta: number; unit?: string; lowerIsBetter?: boolean; onAccent?: boolean }) {
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  const style: CSSProperties = onAccent
    ? { background: 'rgba(18,20,16,0.1)', color: C.accentInk }
    : better
      ? { background: C.accentSoft, color: C.accentText }
      : { background: C.redSoft, color: C.red };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold tabular whitespace-nowrap" style={style}>
      {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta)}{unit ? ` ${unit}` : ''}
    </span>
  );
}

/* ─── Big display number with unit ─── */
export function BigNumber({
  value, unit, size = 56, unitColor,
}: { value: ReactNode; unit?: string; size?: number; unitColor?: string }) {
  return (
    <div
      className="tabular"
      style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: size, lineHeight: 0.9, letterSpacing: `${-size / 28}px` }}
    >
      {value}
      {unit && (
        <span style={{ fontSize: Math.max(14, Math.round(size * 0.32)), letterSpacing: 0, marginLeft: 4, color: unitColor ?? 'inherit', opacity: unitColor ? 1 : 0.7 }}>
          {unit}
        </span>
      )}
    </div>
  );
}

/* ─── Page header ─── */
export function PageHeader({
  eyebrow, title, subtitle, actions,
}: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap justify-between items-end gap-4 mb-6 md:mb-8">
      <div className="flex flex-col gap-1.5 min-w-0">
        {eyebrow && <div className="text-[13px] md:text-[14px] flex items-center gap-1.5" style={{ color: C.muted }}>{eyebrow}</div>}
        <h1
          className="m-0 text-[34px] md:text-[48px]"
          style={{ fontFamily: FONT.display, fontWeight: 800, lineHeight: 1, letterSpacing: '-1.2px', color: C.text }}
        >
          {title}
        </h1>
        {subtitle && <div className="text-[13px] md:text-[14px] mt-1" style={{ color: C.muted }}>{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

/* ─── Segmented control / tabs ─── */
export function Segmented<T extends string>({
  options, value, onChange, size = 'sm',
}: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto gap-1 p-1 rounded-full" style={{ background: C.surface3, scrollbarWidth: 'none' }} role="tablist">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full cursor-pointer border-none whitespace-nowrap shrink-0 ${size === 'sm' ? 'px-3 min-h-[32px] text-[13px]' : 'px-4 min-h-[40px] text-[14px]'}`}
            style={{
              background: active ? C.primary : 'transparent',
              color:      active ? C.primaryText : C.muted,
              fontWeight: active ? 600 : 500,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Form field ─── */
export const inputStyle: CSSProperties = {
  background: C.surface2,
  border:     `1px solid ${C.border2}`,
  color:      C.text,
};

export const inputClass = 'w-full rounded-2xl px-4 min-h-[48px] text-[15px]';

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{label}</span>
      {children}
      {hint && <span className="text-[12px]" style={{ color: C.muted }}>{hint}</span>}
    </label>
  );
}

/* ─── Bottom sheet on mobile, centered dialog on desktop ─── */
export function Sheet({
  title, onClose, children, maxWidth = 520, z = 100,
}: { title: ReactNode; onClose: () => void; children: ReactNode; maxWidth?: number; z?: number }) {
  return (
    <div
      className="fixed inset-0 flex items-end md:items-center justify-center md:p-5"
      style={{ background: C.overlay, zIndex: z }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px]"
        style={{ background: C.surface, maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border2 }} />
        </div>
        <div className="p-5 pb-8 md:p-8">
          <h2
            className="m-0 mb-6 text-[26px]"
            style={{ fontFamily: FONT.display, fontWeight: 800, letterSpacing: '-0.6px', color: C.text }}
          >
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Small uppercase-free section label ─── */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 mb-3">
      <div className="text-[14px] font-semibold" style={{ color: C.muted }}>{children}</div>
      {right}
    </div>
  );
}
