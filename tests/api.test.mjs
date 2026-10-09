import { test } from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const stamp = `${Date.now()}`;
const created = { loans: [], borrowers: [], equipment: [] };
async function request(path, method = 'GET', data) {
  const response = await fetch(`${base}/api/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  return { status: response.status, ...await response.json() };
}
async function create(entity, data) {
  const result = await request(entity, 'POST', data); assert.equal(result.status, 201, result.error); created[entity].push(result.data._id); return result.data;
}
const equipmentData = { name: 'API test camera', code: `TEST-${stamp}`, category: 'Camera', condition: 'Good', description: 'Test fixture' };
const borrowerData = { fullName: 'API test borrower', email: 'test@example.com', phone: '0812345678', department: 'Testing' };
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const before = new Date(`${today}T00:00:00Z`); before.setUTCDate(before.getUTCDate() - 2);
const yesterday = new Date(`${today}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
test('complete CRUD, validation, borrowing invariants and concurrent requests', async t => {
  try {
    assert.equal((await request('health')).status, 200);
    let equipment, borrower, loan;
    await t.test('Equipment CREATE, READ, UPDATE, search and duplicate code', async () => {
      equipment = await create('equipment', equipmentData);
      assert.equal((await request(`equipment/${equipment._id}`)).data.available, true);
      assert.equal((await request(`equipment?q=${encodeURIComponent(equipmentData.code)}`)).data.length, 1);
      assert.equal((await request(`equipment/${equipment._id}`, 'PATCH', { name: 'Updated test camera' })).status, 200);
      assert.equal((await request('equipment', 'POST', { ...equipmentData, code: equipmentData.code.toLowerCase() })).status, 409);
      assert.equal((await request('equipment', 'POST', { ...equipmentData, code: `BAD-${stamp}`, condition: 'Unknown' })).status, 400);
      assert.equal((await request('equipment/invalid')).status, 400);
      assert.equal((await request('equipment/000000000000000000000000')).status, 404);
    });
    await t.test('Borrower CREATE, READ, UPDATE and validation', async () => {
      borrower = await create('borrowers', borrowerData);
      assert.equal((await request(`borrowers/${borrower._id}`)).data.fullName, borrowerData.fullName);
      assert.equal((await request(`borrowers/${borrower._id}`, 'PATCH', { department: 'Updated department' })).status, 200);
      assert.equal((await request('borrowers', 'POST', { ...borrowerData, email: 'invalid' })).status, 400);
    });
    const payload = () => ({ equipmentId: equipment._id, borrowerId: borrower._id, borrowingDate: before.toISOString().slice(0, 10), dueDate: yesterday.toISOString().slice(0, 10), notes: 'API test' });
    await t.test('Loan CREATE, READ, overdue status and availability', async () => {
      loan = await create('loans', payload());
      assert.equal((await request(`loans/${loan._id}`)).data.status, 'Overdue');
      assert.equal((await request(`equipment/${equipment._id}`)).data.available, false);
      assert.equal((await request(`borrowers/${borrower._id}`)).data.activeLoans, 1);
      assert.equal((await request('loans', 'POST', payload())).status, 409);
      assert.equal((await request(`equipment/${equipment._id}`, 'DELETE')).status, 409);
      assert.equal((await request(`borrowers/${borrower._id}`, 'DELETE')).status, 409);
      assert.equal((await request('loans', 'POST', { ...payload(), dueDate: '2020-01-01' })).status, 400);
      assert.equal((await request('loans', 'POST', { ...payload(), borrowingDate: '2026-02-30' })).status, 400);
      assert.equal((await request('loans', 'POST', { ...payload(), borrowerId: '000000000000000000000000' })).status, 400);
    });
    await t.test('Loan UPDATE, return, historical delete protection and DELETE', async () => {
      assert.equal((await request(`loans/${loan._id}`, 'PATCH', { notes: 'Updated notes' })).status, 200);
      assert.equal((await request(`loans/${loan._id}`, 'PATCH', { returnDate: today })).status, 200);
      assert.equal((await request(`loans/${loan._id}`)).data.status, 'Returned');
      assert.equal((await request(`equipment/${equipment._id}`)).data.available, true);
      assert.equal((await request(`equipment/${equipment._id}`, 'DELETE')).status, 409);
      const replacement = await create('loans', payload());
      assert.equal((await request(`loans/${loan._id}`, 'PATCH', { returnDate: null })).status, 409);
      assert.equal((await request(`loans/${replacement._id}`, 'DELETE')).status, 200);
      assert.equal((await request(`loans/${loan._id}`, 'DELETE')).status, 200);
    });
    await t.test('Concurrent loans: exactly one active loan succeeds', async () => {
      const results = await Promise.all(Array.from({ length: 5 }, () => request('loans', 'POST', payload())));
      assert.equal(results.filter(result => result.status === 201).length, 1);
      assert.equal(results.filter(result => result.status === 409).length, 4);
      for (const result of results) if (result.status === 201) { created.loans.push(result.data._id); await request(`loans/${result.data._id}`, 'DELETE'); }
    });
    await t.test('Concurrent loan vs equipment delete cannot leave an orphan', async () => {
      const temporary = await create('equipment', { ...equipmentData, code: `RACE-${stamp}` });
      const [borrowed, deleted] = await Promise.all([request('loans', 'POST', { ...payload(), equipmentId: temporary._id }), request(`equipment/${temporary._id}`, 'DELETE')]);
      assert.ok((borrowed.status === 201 && deleted.status === 409) || (borrowed.status === 400 && deleted.status === 200), JSON.stringify({ borrowed, deleted }));
      if (borrowed.status === 201) {
        created.loans.push(borrowed.data._id);
        assert.equal((await request(`loans/${borrowed.data._id}`, 'DELETE')).status, 200);
      }
    });
    await t.test('Borrower and equipment DELETE, dashboard and missing resources', async () => {
      assert.equal((await request(`borrowers/${borrower._id}`, 'DELETE')).status, 200);
      assert.equal((await request(`equipment/${equipment._id}`, 'DELETE')).status, 200);
      const dashboard = await request('dashboard');
      assert.equal(dashboard.status, 200); assert.ok(dashboard.data.total >= 0);
      assert.equal((await request('unknown')).status, 404);
    });
  } finally {
    for (const entity of ['loans', 'borrowers', 'equipment']) for (const id of created[entity]) await request(`${entity}/${id}`, 'DELETE');
  }
});
