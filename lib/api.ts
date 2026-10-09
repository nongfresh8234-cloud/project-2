import { ObjectId, MongoServerError, type ClientSession, type Document } from 'mongodb';
import { database } from './db';
import { loanStatus, today, type Entity, type Loan } from './domain';

class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function entityName(value: string): Entity {
  if (!['equipment', 'borrowers', 'loans'].includes(value)) throw new ApiError(404, 'Resource not found.');
  return value as Entity;
}
function id(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) throw new ApiError(400, 'Invalid record ID.');
  return new ObjectId(value);
}
function text(value: unknown, label: string, max = 120, optional = false) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) throw new ApiError(400, `${label} is required and must be at most ${max} characters.`);
  return value.trim();
}
function date(value: unknown, label: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new ApiError(400, `${label} must be a valid date (YYYY-MM-DD).`);
  return value;
}
function validate(entity: Entity, data: Record<string, unknown>): Document {
  if (entity === 'equipment') {
    const condition = text(data.condition, 'Condition');
    if (!['Excellent', 'Good', 'Fair', 'Needs repair'].includes(condition)) throw new ApiError(400, 'Choose a valid equipment condition.');
    return { name: text(data.name, 'Equipment name'), code: text(data.code, 'Equipment code', 50).toUpperCase(), category: text(data.category, 'Category', 80), description: text(data.description, 'Description', 2000, true), condition };
  }
  if (entity === 'borrowers') {
    const email = text(data.email, 'Email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
    const phone = text(data.phone, 'Phone number', 30);
    if (!/^[+()\d\s.-]{5,30}$/.test(phone)) throw new ApiError(400, 'Enter a valid phone number.');
    return { fullName: text(data.fullName, 'Full name'), email, phone, department: text(data.department, 'Department', 120) };
  }
  const borrowingDate = date(data.borrowingDate, 'Borrowing date');
  const dueDate = date(data.dueDate, 'Due date');
  const returnDate = data.returnDate === null || data.returnDate === '' || data.returnDate === undefined ? null : date(data.returnDate, 'Return date');
  if (dueDate < borrowingDate) throw new ApiError(400, 'Due date cannot be before the borrowing date.');
  if (borrowingDate > today()) throw new ApiError(400, 'Borrowing date cannot be in the future.');
  if (returnDate && (returnDate < borrowingDate || returnDate > today())) throw new ApiError(400, 'Return date must be between the borrowing date and today.');
  return { equipmentId: id(data.equipmentId), borrowerId: id(data.borrowerId), borrowingDate, dueDate, returnDate, notes: text(data.notes, 'Notes', 2000, true) };
}
const fields: Record<Entity, string[]> = {
  equipment: ['name', 'code', 'category', 'description', 'condition'],
  borrowers: ['fullName', 'email', 'phone', 'department'],
  loans: ['equipmentId', 'borrowerId', 'borrowingDate', 'dueDate', 'returnDate', 'notes'],
};
async function body(request: Request, entity: Entity) {
  let data;
  try { data = await request.json(); } catch { throw new ApiError(400, 'Request body must be valid JSON.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ApiError(400, 'Request body must be an object.');
  if (Object.keys(data).some(key => !fields[entity].includes(key))) throw new ApiError(400, 'Request contains unsupported fields.');
  if (!Object.keys(data).length) throw new ApiError(400, 'Provide at least one field.');
  return data as Record<string, unknown>;
}
export async function read(entity: Entity, recordId?: string, search = '') {
  const { db } = await database();
  const [equipment, borrowers, loans] = await Promise.all([
    db.collection('equipment').find({}).sort({ createdAt: -1 }).toArray(),
    db.collection('borrowers').find({}).sort({ createdAt: -1 }).toArray(),
    db.collection('loans').find({}).sort({ borrowingDate: -1, createdAt: -1 }).toArray(),
  ]);
  const equipmentMap = new Map(equipment.map(item => [String(item._id), item]));
  const borrowerMap = new Map(borrowers.map(item => [String(item._id), item]));
  const active = loans.filter(loan => loan.returnDate === null);
  let items: Document[] = entity === 'equipment'
    ? equipment.map(item => ({ ...item, available: !active.some(loan => String(loan.equipmentId) === String(item._id)) }))
    : entity === 'borrowers'
      ? borrowers.map(item => ({ ...item, activeLoans: active.filter(loan => String(loan.borrowerId) === String(item._id)).length }))
      : loans.map(loan => ({ ...loan, equipment: equipmentMap.get(String(loan.equipmentId)), borrower: borrowerMap.get(String(loan.borrowerId)), status: loanStatus(loan as unknown as Loan) }));
  if (recordId) {
    id(recordId);
    const item = items.find(item => String(item._id) === recordId);
    if (!item) throw new ApiError(404, 'Record not found.');
    return item;
  }
  if (search) {
    const term = search.toLowerCase();
    items = items.filter(item => entity === 'equipment' ? `${item.name} ${item.code}`.toLowerCase().includes(term) : entity === 'borrowers' ? `${item.fullName} ${item.email} ${item.department}`.toLowerCase().includes(term) : `${item.equipment?.name} ${item.equipment?.code} ${item.borrower?.fullName}`.toLowerCase().includes(term));
  }
  return items;
}
export async function mutate(request: Request, entity: Entity, recordId?: string) {
  const { db, client } = await database();
  const objectId = recordId ? id(recordId) : new ObjectId();
  const data = request.method === 'DELETE' ? null : await body(request, entity);
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      // All mutations write the same document. Transaction retries serialize reference
      // checks and deletes, preventing concurrent orphan creation (write skew).
      await db.collection('control').updateOne({ _id: 'mutations' as never }, { $inc: { version: 1 } }, { session });
      const collection = db.collection(entity);
      const existing = recordId ? await collection.findOne({ _id: objectId }, { session }) : null;
      if (recordId && !existing) throw new ApiError(404, 'Record not found.');
      if (request.method === 'DELETE') {
        if (entity !== 'loans') {
          const reference = entity === 'equipment' ? 'equipmentId' : 'borrowerId';
          if (await db.collection('loans').findOne({ [reference]: objectId }, { session })) throw new ApiError(409, 'This record has loan history and cannot be deleted.');
        }
        await collection.deleteOne({ _id: objectId }, { session });
        return { message: 'Record deleted.' };
      }
      const merged = { ...existing, ...data };
      // ObjectIds are converted back to strings for input validation on PATCH.
      if (existing && entity === 'loans') {
        merged.equipmentId = String(merged.equipmentId);
        merged.borrowerId = String(merged.borrowerId);
      }
      const clean = validate(entity, merged);
      if (entity === 'loans') await validateReferences(clean, session);
      if (recordId) await collection.updateOne({ _id: objectId }, { $set: { ...clean, updatedAt: new Date() } }, { session });
      else await collection.insertOne({ _id: objectId, ...clean, createdAt: new Date() }, { session });
      return { _id: objectId, ...clean, createdAt: existing?.createdAt ?? new Date() };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
  } finally { await session.endSession(); }
  async function validateReferences(loan: Document, session: ClientSession) {
    // MongoDB transactions require operations on the session to run in order.
    const equipment = await db.collection('equipment').findOne({ _id: loan.equipmentId }, { session });
    const borrower = await db.collection('borrowers').findOne({ _id: loan.borrowerId }, { session });
    if (!equipment || !borrower) throw new ApiError(400, 'Equipment and borrower must both exist.');
  }
}
export async function respond(action: () => Promise<unknown>, status = 200) {
  try { return Response.json({ data: await action() }, { status, headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof MongoServerError && error.code === 11000) return Response.json({ error: error.message.includes('one_active_loan') ? 'This equipment already has an active loan.' : 'Equipment code already exists.' }, { status: 409 });
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Database unavailable. Check MongoDB connection and replica set configuration.' }, { status: 503 });
  }
}
