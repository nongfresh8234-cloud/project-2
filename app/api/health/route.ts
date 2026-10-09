import { database } from '@/lib/db';
import { respond } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() { return respond(async () => { const { db } = await database(); await db.command({ ping: 1 }); return { status: 'ok' }; }); }
