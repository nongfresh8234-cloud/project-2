import { entityName, read, mutate, respond } from '@/lib/api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ entity: string; id: string }> };
export async function GET(_request: Request, context: Context) {
  return respond(async () => { const { entity, id } = await context.params; return read(entityName(entity), id); });
}
async function change(request: Request, context: Context) {
  return respond(async () => { const { entity, id } = await context.params; return mutate(request, entityName(entity), id); });
}
export const PATCH = change;
export const DELETE = change;
