import { MongoClient, type Db } from 'mongodb';
const globalDB = globalThis as unknown as { mongoPromise?: Promise<MongoClient>; indexesPromise?: Promise<void> };
export async function database(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Use npm run dev or configure your MongoDB replica set.');
  globalDB.mongoPromise ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect().catch(error => { globalDB.mongoPromise = undefined; throw error; });
  const client = await globalDB.mongoPromise;
  const db = client.db(process.env.MONGODB_DB || 'equiptrack');
  globalDB.indexesPromise ??= (async () => {
    await Promise.all([
      db.collection('equipment').createIndex({ code: 1 }, { unique: true }),
      db.collection('loans').createIndex({ equipmentId: 1 }, { unique: true, partialFilterExpression: { returnDate: null }, name: 'one_active_loan_per_item' }),
      db.collection('loans').createIndex({ borrowerId: 1 }),
      db.collection('loans').createIndex({ returnDate: 1, dueDate: 1 }),
    ]);
    await db.collection('control').updateOne({ _id: 'mutations' as never }, { $setOnInsert: { version: 0 } }, { upsert: true });
  })().catch(error => { globalDB.indexesPromise = undefined; throw error; });
  await globalDB.indexesPromise;
  return { client, db };
}
