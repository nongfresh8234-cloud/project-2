'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { today, type Borrower, type Entity, type Equipment, type Item, type Loan } from '@/lib/domain';
type Props = { entity: Entity; existing?: Item; equipment: Equipment[]; borrowers: Borrower[]; onSaved: (message: string) => void };
export async function writeRecord(entity: Entity, method: string, data?: unknown, id?: string) {
  const response = await fetch(`/api/${entity}${id ? '/' + id : ''}`, { method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Something went wrong. Please try again.');
  return result.data;
}
function defaultDue() { const date = new Date(`${today()}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 7); return date.toISOString().slice(0, 10); }
export default function RecordForm({ entity, existing, equipment, borrowers, onSaved }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loan = existing as Loan | undefined;
  const initial = (key: string, fallback = '') => String((existing as unknown as Record<string, unknown>)?.[key] ?? fallback);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const record = await writeRecord(entity, existing ? 'PATCH' : 'POST', data, existing?._id);
      onSaved(`${entity === 'equipment' ? 'Equipment' : entity === 'borrowers' ? 'Borrower' : 'Loan'} ${existing ? 'updated' : 'created'} successfully.`);
      router.push(`/${entity}/${record._id}`);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <form className="panel record-form" onSubmit={save}>
    <div className="panel-heading"><div><h2>{entity === 'equipment' ? 'Equipment information' : entity === 'borrowers' ? 'Borrower information' : 'Loan information'}</h2><p>Fields marked with * are required.</p></div></div>
    <div className="form-grid">
      {entity === 'equipment' ? <>
        <Field label="Equipment name" name="name" defaultValue={initial('name')} placeholder="e.g. Canon EOS R50" />
        <Field label="Equipment code" name="code" maxLength={50} defaultValue={initial('code')} placeholder="e.g. CAM-001" />
        <Field label="Category" name="category" maxLength={80} defaultValue={initial('category')} placeholder="e.g. Camera" />
        <label>Condition *<select name="condition" defaultValue={initial('condition', 'Good')} required>{['Excellent', 'Good', 'Fair', 'Needs repair'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="wide">Description<textarea name="description" maxLength={2000} defaultValue={initial('description')} placeholder="Details, accessories, or storage location" rows={4} /></label>
      </> : entity === 'borrowers' ? <>
        <Field label="Full name" name="fullName" defaultValue={initial('fullName')} placeholder="e.g. Narin Somchai" />
        <Field label="Email" name="email" type="email" maxLength={254} defaultValue={initial('email')} placeholder="name@university.ac.th" />
        <Field label="Phone number" name="phone" type="tel" maxLength={30} defaultValue={initial('phone')} placeholder="e.g. 0812345678" />
        <Field label="Department" name="department" defaultValue={initial('department')} placeholder="e.g. Computer Science" />
      </> : <>
        <label>Equipment *<select name="equipmentId" defaultValue={initial('equipmentId')} required><option value="">Select available equipment</option>{equipment.filter(item => item.available || item._id === loan?.equipmentId).map(item => <option key={item._id} value={item._id}>{item.name} · {item.code}</option>)}</select><small>Each item can have only one active loan.</small></label>
        <label>Borrower *<select name="borrowerId" defaultValue={initial('borrowerId')} required><option value="">Select a borrower</option>{borrowers.map(item => <option key={item._id} value={item._id}>{item.fullName} · {item.department}</option>)}</select></label>
        <Field label="Borrowing date" name="borrowingDate" type="date" max={today()} defaultValue={initial('borrowingDate', today())} />
        <Field label="Due date" name="dueDate" type="date" defaultValue={initial('dueDate', defaultDue())} />
        {existing ? <label>Return date<input name="returnDate" type="date" min={loan?.borrowingDate} max={today()} defaultValue={initial('returnDate')} /><small>Leave empty for an active loan.</small></label> : null}
        <label className="wide">Notes<textarea name="notes" maxLength={2000} defaultValue={initial('notes')} placeholder="Purpose of borrowing or handover notes" rows={4} /></label>
      </>}
    </div>
    {entity === 'loans' && (!borrowers.length || !equipment.some(item => item.available || item._id === loan?.equipmentId)) ? <div className="notice">You need an available item and a borrower to create a loan. <Link href="/equipment/new">Add equipment</Link> or <Link href="/borrowers/new">add a borrower</Link>.</div> : null}
    {error ? <p className="error-message" role="alert">{error}</p> : null}
    <div className="form-footer"><Link className="button" href={existing ? `/${entity}/${existing._id}` : `/${entity}`}>Cancel</Link><button type="submit" className="button primary" disabled={busy}>{busy ? 'Saving…' : <><Save size={17} />{existing ? 'Save changes' : 'Create record'}</>}</button></div>
  </form>;
}
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label>{label} *<input maxLength={120} required {...props} /></label>; }
