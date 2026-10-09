import { entityName, read, mutate, respond } from '@/lib/api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ entity: string }> };
export async function GET(request: Request, context: Context) {
  return respond(async () => read(entityName((await context.params).entity), undefined, new URL(request.url).searchParams.get('q') || ''));
}
export async function POST(request: Request, context: Context) {
  return respond(async () => mutate(request, entityName((await context.params).entity)), 201);
}
