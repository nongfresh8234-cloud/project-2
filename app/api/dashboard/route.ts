import { read, respond } from '@/lib/api';
import type { Equipment, Loan } from '@/lib/domain';
export const dynamic = 'force-dynamic';
export async function GET() {
  return respond(async () => {
    const [equipment, loans] = await Promise.all([read('equipment') as Promise<Equipment[]>, read('loans') as Promise<Loan[]>]);
    return { total: equipment.length, available: equipment.filter(item => item.available).length, onLoan: loans.filter(item => !item.returnDate).length, overdue: loans.filter(item => item.status === 'Overdue').length };
  });
}
