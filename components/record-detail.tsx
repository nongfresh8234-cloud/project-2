'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCheck, Pencil, Trash2 } from 'lucide-react';
import { displayDate, today, type Borrower, type Entity, type Equipment, type Item, type Loan } from '@/lib/domain';
import { Badge, Dialog } from './ui';
import { LoanPanel } from './tables';
import { writeRecord } from './record-form';
export default function RecordDetail({ entity, item, loans, onSaved }: { entity: Entity; item: Item; loans: Loan[]; onSaved: (message: string) => void }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<'delete' | 'return' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const equipment = item as Equipment; const borrower = item as Borrower; const loan = item as Loan;
  const history = entity === 'loans' ? [] : loans.filter(record => entity === 'equipment' ? record.equipmentId === item._id : record.borrowerId === item._id);
  async function action(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (dialog === 'delete') {
        await writeRecord(entity, 'DELETE', undefined, item._id); onSaved('Record deleted successfully.'); router.push(`/${entity}`);
      } else {
        const returnDate = new FormData(event.currentTarget).get('returnDate');
        await writeRecord('loans', 'PATCH', { returnDate }, item._id); onSaved('Return recorded. Equipment is available again.');
      }
      setDialog(null);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  const values: [string, React.ReactNode][] = entity === 'equipment' ? [
    ['Equipment code', equipment.code], ['Category', equipment.category], ['Condition', equipment.condition], ['Availability', <Badge key="status" value={equipment.available ? 'Available' : 'On loan'} />], ['Description', equipment.description || 'No description'], ['Created', displayDate(equipment.createdAt)],
  ] : entity === 'borrowers' ? [
    ['Full name', borrower.fullName], ['Email', <a key="email" href={`mailto:${borrower.email}`}>{borrower.email}</a>], ['Phone number', borrower.phone], ['Department', borrower.department], ['Active loans', borrower.activeLoans ?? 0], ['Created', displayDate(borrower.createdAt)],
  ] : [
    ['Equipment', <Link key="equipment" href={`/equipment/${loan.equipmentId}`}>{loan.equipment?.name} · {loan.equipment?.code}</Link>], ['Borrower', <Link key="borrower" href={`/borrowers/${loan.borrowerId}`}>{loan.borrower?.fullName}</Link>], ['Borrowing date', displayDate(loan.borrowingDate)], ['Due date', displayDate(loan.dueDate)], ['Return date', displayDate(loan.returnDate)], ['Status', <Badge key="status" value={loan.status ?? 'On loan'} />], ['Notes', loan.notes || 'No notes'], ['Created', displayDate(loan.createdAt)],
  ];
  return <>
    <section className="panel"><div className="panel-heading"><div><h2>{entity === 'loans' ? 'Loan details' : entity === 'equipment' ? 'Equipment details' : 'Borrower details'}</h2><p>{entity === 'loans' ? 'Borrowing, return and handover information.' : 'Information and linked borrowing history.'}</p></div><div className="actions">
      {entity === 'loans' && !loan.returnDate ? <button className="button primary" onClick={() => { setError(''); setDialog('return'); }}><CheckCheck size={17} />Record return</button> : null}
      <Link href={`/${entity}/${item._id}/edit`} className="button"><Pencil size={16} />Edit</Link><button className="button danger-quiet" onClick={() => { setError(''); setDialog('delete'); }}><Trash2 size={16} />Delete</button>
    </div></div><dl className="detail-grid">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    {entity !== 'loans' ? <LoanPanel loans={history} title="Loan history" caption="All borrowing records linked to this record." /> : null}
    {dialog ? <Dialog title={dialog === 'delete' ? 'Delete this record?' : 'Record equipment return'} onClose={() => { if (!busy) setDialog(null); }}><form onSubmit={action}>
      <p className="dialog-description">{dialog === 'delete' ? entity === 'loans' ? 'This permanently removes the borrowing record. If active, the equipment becomes available again.' : 'This permanently removes the record. Records with linked loan history cannot be deleted.' : `Confirm when ${loan.equipment?.name} was returned.`}</p>
      {dialog === 'return' ? <label>Return date *<input name="returnDate" type="date" defaultValue={today()} min={loan.borrowingDate} max={today()} required /></label> : null}
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="form-footer"><button type="button" className="button" onClick={() => setDialog(null)} disabled={busy}>Cancel</button><button type="submit" className={`button ${dialog === 'delete' ? 'danger' : 'primary'}`} disabled={busy}>{busy ? 'Working…' : dialog === 'delete' ? 'Delete record' : 'Confirm return'}</button></div>
    </form></Dialog> : null}
  </>;
}
