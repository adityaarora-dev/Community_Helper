import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function CategorySelect({ value, onChange, categories }) {
  const { t, label } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);
  const search = useRef({ text: '', time: 0 });
  const id = useId();
  const choices = ['', ...categories];
  const selected = Math.max(0, choices.indexOf(value));
  const title = (category) => category ? label(category) : t('all');
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  const show = () => { setActive(selected); setOpen(true); search.current.text = ''; };
  useEffect(() => {
    if (open) options.current[active]?.focus({ preventScroll: true });
    if (open && active > 0) options.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const keys = (event) => {
    let next;
    if (event.key === 'ArrowDown') next = (active + 1) % choices.length;
    else if (event.key === 'ArrowUp') next = (active - 1 + choices.length) % choices.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = choices.length - 1;
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      search.current.text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase();
      search.current.time = now;
      const match = choices.findIndex((choice) => title(choice).toLocaleLowerCase().startsWith(search.current.text));
      if (match >= 0) next = match;
    }
    if (next !== undefined) { event.preventDefault(); setActive(next); }
  };
  return <div className="category-select" ref={root} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button type="button" ref={trigger} className="category-select-trigger" aria-label={`${t('all')}: ${title(value)}`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => open ? close() : show()} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      }}><span>{title(value)}</span><ChevronDown size={17} aria-hidden="true" /></button>
    {open && <div id={id} className="category-options" role="listbox" aria-label={t('all')} onKeyDown={keys}>
      {choices.map((choice, index) => <button key={choice} type="button" role="option" aria-selected={value === choice}
        className={'category-option' + (index === 0 ? ' category-option-all' : '')}
        ref={(element) => { options.current[index] = element; }} tabIndex={active === index ? 0 : -1}
        onFocus={() => setActive(index)} onClick={() => { onChange(choice); close(true); }}>
        <span>{title(choice)}</span>{value === choice && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
