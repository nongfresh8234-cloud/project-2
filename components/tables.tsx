'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Borrower, Entity, Equipment, Item, Loan } from '@/lib/domain';
import { displayDate } from '@/lib/domain';
import { Badge, Empty } from './ui';
export function RecordTable({ entity, items }: { entity: Entity; items: Item[] }) {
  if (!items.length) return <Empty title="No records found" description="Add a record to get started, or adjust your search and filters." />;
  return <div className="table-scroll"><table><thead><tr>{(entity === 'equipment' ? ['Equipment', 'Category', 'Condition', 'Availability', 'Action'] : entity === 'borrowers' ? ['Borrower', 'Contact', 'Department', 'Active loans', 'Action'] : ['Equipment', 'Borrower', 'Borrowed', 'Due date', 'Status', 'Action']).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item._id}>
    {entity === 'equipment' ? <EquipmentCells item={item as Equipment} /> : entity === 'borrowers' ? <BorrowerCells item={item as Borrower} /> : <LoanCells item={item as Loan} />}
    <td><Link href={`/${entity}/${item._id}`} className="button small" aria-label={`View ${entity === 'equipment' ? (item as Equipment).name : entity === 'borrowers' ? (item as Borrower).fullName : (item as Loan).equipment?.name + ' loan'}`}>View</Link></td>
  </tr>)}</tbody></table></div>;
}
function EquipmentCells({ item }: { item: Equipment }) { return <><td><strong>{item.name}</strong><span className="subtext">{item.code}</span></td><td>{item.category}</td><td>{item.condition}</td><td><Badge value={item.available ? 'Available' : 'On loan'} /></td></>; }
function BorrowerCells({ item }: { item: Borrower }) { return <><td><strong>{item.fullName}</strong></td><td>{item.email}<span className="subtext">{item.phone}</span></td><td>{item.department}</td><td>{item.activeLoans ?? 0}</td></>; }
function LoanCells({ item }: { item: Loan }) { return <><td><strong>{item.equipment?.name ?? 'Unknown equipment'}</strong><span className="subtext">{item.equipment?.code}</span></td><td>{item.borrower?.fullName}</td><td>{displayDate(item.borrowingDate)}</td><td>{displayDate(item.dueDate)}</td><td><Badge value={item.status ?? 'On loan'} /></td></>; }
export function LoanPanel({ loans, title = 'Active loans', caption = 'Keep track of equipment currently checked out.', viewAll = false }: { loans: Loan[]; title?: string; caption?: string; viewAll?: boolean }) { return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><p>{caption}</p></div>{viewAll ? <Link href="/loans" className="text-link">View all loans <ArrowRight size={18} /></Link> : null}</div><RecordTable entity="loans" items={loans} /></section>; }
