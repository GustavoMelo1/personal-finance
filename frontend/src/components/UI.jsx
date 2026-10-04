import { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  X,
  Plus,
  Inbox,
  ArrowDownLeft,
  ArrowUpLeft,
  Utensils,
  Home,
  Car,
  HeartPulse,
  Sparkles,
  BriefcaseBusiness,
  Repeat2,
  CircleDollarSign,
} from 'lucide-react';
import { brl } from '../lib/finance.js';

export const categoryIcons = {
  Alimentação: Utensils,
  Moradia: Home,
  Transporte: Car,
  Saúde: HeartPulse,
  Lazer: Sparkles,
  Trabalho: BriefcaseBusiness,
  Assinaturas: Repeat2,
};
export function CategoryIcon({ category, type }) {
  const Icon = categoryIcons[category] || CircleDollarSign;
  return (
    <span className={`category-icon ${type === 'Income' ? 'income-icon' : ''}`}>
      <Icon size={18} strokeWidth={1.7} />
    </span>
  );
}
export function Money({ value, hidden = false, className = '' }) {
  return (
    <span className={`money ${className}`} aria-label={hidden ? 'Valor oculto' : undefined}>
      {hidden ? 'R$ •••••' : brl(value)}
    </span>
  );
}
export function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = 'Seu próximo passo começa aqui.',
  text = 'Adicione um lançamento para começar a enxergar seus números.',
  action,
  onAction,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={27} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="btn btn-secondary" onClick={onAction}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}
export function Modal({ title, subtitle, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) {
          const r = ref.current.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header className="modal-header">
        <div>
          <p className="eyebrow">SEU ESPAÇO FINANCEIRO</p>
          <h2 id="modal-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Fechar janela"
          onClick={onClose}
          disabled={busy}
        >
          <X size={21} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Stat({ label, value, hidden, type, note, emphasis }) {
  const Icon = type === 'in' ? ArrowDownLeft : type === 'out' ? ArrowUpRight : ArrowUpLeft;
  return (
    <article className={`stat ${emphasis ? 'stat-emphasis' : ''}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${type || ''}`}>
          <Icon size={17} />
        </span>
      </div>
      <Money value={value} hidden={hidden} className="stat-value" />
      <p>{note}</p>
    </article>
  );
}
