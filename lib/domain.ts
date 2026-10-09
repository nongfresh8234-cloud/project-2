export type Entity = 'equipment' | 'borrowers' | 'loans';
export type Equipment = { _id: string; name: string; code: string; category: string; description: string; condition: string; createdAt: string; available?: boolean };
export type Borrower = { _id: string; fullName: string; email: string; phone: string; department: string; createdAt: string; activeLoans?: number };
export type Loan = { _id: string; equipmentId: string; borrowerId: string; borrowingDate: string; dueDate: string; returnDate: string | null; notes: string; createdAt: string; equipment?: Equipment; borrower?: Borrower; status?: string };
export type Item = Equipment | Borrower | Loan;
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function loanStatus(loan: Pick<Loan, 'returnDate' | 'dueDate'>) { return loan.returnDate ? 'Returned' : loan.dueDate < today() ? 'Overdue' : 'On loan'; }
export function displayDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}
