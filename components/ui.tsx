'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Badge({ value }: { value: string }) { return <span className={`badge ${value === 'Overdue' || value === 'Needs repair' ? 'warning' : value === 'Returned' || value === 'On loan' ? 'neutral' : 'green'}`}>{value}</span>; }
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }} aria-labelledby="dialog-title"><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}
export function Empty({ title, description }: { title: string; description: string }) { return <div className="empty"><h3>{title}</h3><p>{description}</p></div>; }
