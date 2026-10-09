'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Box, ChartNoAxesColumnIncreasing, CircleAlert, CircleCheck, Clock3, FileText, Landmark, Plus, Search, Users, X } from 'lucide-react';
import type { Borrower, Entity, Equipment, Item, Loan } from '@/lib/domain';
import { Empty } from './ui';
import { LoanPanel, RecordTable } from './tables';
import RecordForm from './record-form';
import RecordDetail from './record-detail';
const titles = { equipment: 'Equipment', borrowers: 'Borrowers', loans: 'Loans' };
const singular = { equipment: 'equipment', borrowers: 'borrower', loans: 'loan' };
type Data = { equipment: Equipment[]; borrowers: Borrower[]; loans: Loan[] };
export default function Workspace({ path }: { path: string[] }) {
  const pathname = usePathname();
  const entity = path[0] as Entity | undefined;
  const [data, setData] = useState<Data>({ equipment: [], borrowers: [], loans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all((['equipment', 'borrowers', 'loans'] as const).map(async entity => {
      const response = await fetch(`/api/${entity}`, { signal: controller.signal, cache: 'no-store' });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); return [entity, result.data];
    })).then(entries => { setData(Object.fromEntries(entries) as Data); setLoading(false); }).catch(error => { if (error.name !== 'AbortError') { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [pathname, refresh]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 6000); return () => clearTimeout(timer); }, [toast]);
  function saved(message: string) { setToast(message); setRefresh(value => value + 1); }
  const item = entity ? data[entity].find(item => item._id === path[1]) : undefined;
  const isNew = path[1] === 'new'; const editing = path[2] === 'edit'; const detail = Boolean(path[1] && !isNew && !editing);
  const title = !entity ? 'Dashboard' : isNew ? `Add ${singular[entity]}` : editing ? `Edit ${singular[entity]}` : detail ? entity === 'equipment' ? (item as Equipment)?.name ?? 'Equipment' : entity === 'borrowers' ? (item as Borrower)?.fullName ?? 'Borrower' : 'Loan record' : titles[entity];
  return <div className="app-shell"><a href="#main" className="skip-link">Skip to content</a><aside className="sidebar">
    <Link href="/" className="brand"><Box size={43} strokeWidth={1.6} /><div><strong>Project 2</strong><span>Equipment management</span></div></Link>
    <nav aria-label="Main navigation">{[{ href: '/', label: 'Dashboard', icon: ChartNoAxesColumnIncreasing }, { href: '/equipment', label: 'Equipment', icon: Box }, { href: '/borrowers', label: 'Borrowers', icon: Users }, { href: '/loans', label: 'Loans', icon: FileText }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${href === '/' ? !entity ? 'selected' : '' : pathname.startsWith(href) ? 'selected' : ''}`} aria-current={(href === '/' ? !entity : pathname.startsWith(href)) ? 'page' : undefined}><Icon size={23} strokeWidth={1.7} /><span>{label}</span></Link>)}</nav>
    <div className="workspace-label"><Landmark size={23} strokeWidth={1.6} /><div>Science Department<span>Department workspace</span></div></div>
  </aside><div className="main-shell"><header className="topbar"><div><span>Workspace</span><b>/</b>{entity ? <Link href={`/${entity}`}>{titles[entity]}</Link> : 'Dashboard'}{path[1] ? <><b>/</b><span>{isNew ? 'New record' : editing ? 'Edit' : 'Details'}</span></> : null}</div><span className="avatar" aria-label="Pongpisit Arjnarong">PA</span></header>
    <main id="main"><div className="page-heading"><div>{path[1] ? <Link className="back-link" href={`/${entity}`}><ArrowLeft size={15} />Back to {entity}</Link> : null}<h1>{title}</h1><p>{!entity ? 'An overview of your equipment and borrowing activity.' : path[1] ? isNew || editing ? 'Keep your department records accurate and up to date.' : 'Manage this record and its borrowing activity.' : entity === 'equipment' ? 'Manage your inventory, one physical item at a time.' : entity === 'borrowers' ? 'The people borrowing equipment from your department.' : 'Track borrowing, due dates and equipment returns.'}</p></div>{!path[1] ? <Link href={!entity ? '/loans/new' : `/${entity}/new`} className="button primary"><Plus size={20} />{!entity ? 'New loan' : `Add ${singular[entity]}`}</Link> : null}</div>
    {toast ? <div className="toast" role="status"><CircleCheck size={19} />{toast}<button className="icon-button" aria-label="Dismiss message" onClick={() => setToast('')}><X size={17} /></button></div> : null}
    {error ? <div className="error-state" role="alert"><CircleAlert size={24} /><h2>Unable to load your workspace</h2><p>{error}</p><button className="button" onClick={() => setRefresh(value => value + 1)}>Try again</button></div> : loading ? <div className="loading" role="status"><span className="spinner" />Loading workspace…</div> : !entity ? <Dashboard data={data} /> : path[1] ? isNew || editing ? !isNew && !item ? <Empty title="Record not found" description="The record may have been deleted." /> : <RecordForm key={pathname} entity={entity} existing={editing ? item : undefined} equipment={data.equipment} borrowers={data.borrowers} onSaved={saved} /> : item ? <RecordDetail key={pathname} entity={entity} item={item} loans={data.loans} onSaved={saved} /> : <Empty title="Record not found" description="The record may have been deleted." /> : <RecordList key={entity} entity={entity} items={data[entity]} />}
    </main></div></div>;
}
function Dashboard({ data }: { data: Data }) {
  const active = data.loans.filter(loan => !loan.returnDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const stats = [{ label: 'Total equipment', value: data.equipment.length, icon: Box }, { label: 'Available', value: data.equipment.filter(item => item.available).length, icon: CircleCheck }, { label: 'On loan', value: active.length, icon: Clock3 }, { label: 'Overdue', value: active.filter(loan => loan.status === 'Overdue').length, icon: CircleAlert }];
  return <><section className="stats" aria-label="Equipment overview">{stats.map(({ label, value, icon: Icon }, index) => <div className="stat" key={label}><Icon size={29} strokeWidth={1.7} className={index === 3 ? 'orange-icon' : index === 1 ? 'green-icon' : ''} /><div><p>{label}</p><strong>{value}</strong></div></div>)}</section><LoanPanel loans={active.slice(0, 6)} viewAll /><section className="quick-actions"><div><h2>Borrow. Return. Keep things moving.</h2><p>Manage individual items, borrowers and loan history in one place.</p></div><div className="actions"><Link href="/equipment/new" className="button"><Box size={23} />Add equipment</Link><Link href="/borrowers/new" className="button"><Users size={23} />Add borrower</Link></div></section></>;
}
function RecordList({ entity, items }: { entity: Entity; items: Item[] }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All');
  const filters = entity === 'equipment' ? ['All', 'Available', 'On loan'] : entity === 'loans' ? ['All', 'On loan', 'Overdue', 'Returned'] : ['All'];
  const visible = items.filter(item => {
    const value = entity === 'equipment' ? `${(item as Equipment).name} ${(item as Equipment).code}` : entity === 'borrowers' ? `${(item as Borrower).fullName} ${(item as Borrower).email} ${(item as Borrower).department}` : `${(item as Loan).equipment?.name} ${(item as Loan).equipment?.code} ${(item as Loan).borrower?.fullName}`;
    const status = entity === 'equipment' ? (item as Equipment).available ? 'Available' : 'On loan' : (item as Loan).status;
    return value.toLowerCase().includes(query.toLowerCase().trim()) && (filter === 'All' || filter === status);
  });
  return <section className="panel"><div className="list-toolbar"><div className="filters" aria-label="Filter records">{filters.map(value => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div><label className="search"><Search size={18} /><input aria-label={`Search ${entity}`} placeholder={entity === 'equipment' ? 'Search name or equipment code…' : `Search ${entity}…`} value={query} onChange={event => setQuery(event.target.value)} />{query ? <button className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button> : null}</label></div><RecordTable entity={entity} items={visible} /><div className="table-footer">{visible.length} of {items.length} records<span>Equipment management, kept simple.</span></div></section>;
}
