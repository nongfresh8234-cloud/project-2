// Explicit demo fixtures, never automatically inserted into production.
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
async function api(path, data) {
  const response = await fetch(`${base}/api/${path}`, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result.data;
}
for (const entity of ['equipment', 'borrowers', 'loans']) {
  if ((await api(entity)).length) throw new Error('Seed requires an empty database. Existing records are never overwritten.');
}
const specifications = [
  ['Canon EOS R50', 'CAM-001', 'Camera', 'Excellent'],
  ['Epson EB-X49', 'PRJ-001', 'Projector', 'Good'],
  ['Lenovo ThinkPad', 'LAP-001', 'Laptop', 'Good'],
  ['Sony microphone', 'AUD-001', 'Audio', 'Good'],
  ['Canon EOS R10', 'CAM-002', 'Camera', 'Excellent'],
  ['BenQ projector', 'PRJ-002', 'Projector', 'Good'],
  ['Dell Latitude', 'LAP-002', 'Laptop', 'Good'],
  ['MacBook Air', 'LAP-003', 'Laptop', 'Excellent'],
  ['Logitech presenter', 'ACC-001', 'Accessory', 'Good'],
  ['Manfrotto tripod', 'ACC-002', 'Accessory', 'Good'],
  ['HDMI adapter', 'ACC-003', 'Accessory', 'Fair'],
  ['JBL speaker', 'AUD-002', 'Audio', 'Good'],
];
const equipment = [];
for (const [name, code, category, condition] of specifications) equipment.push(await api('equipment', { name, code, category, condition, description: 'Demo equipment · Science Department equipment room.' }));
const borrowers = [];
for (const [index, fullName] of ['Narin Somchai', 'Mali Srisuk', 'Anan Chai', 'Pim Kanya'].entries()) borrowers.push(await api('borrowers', { fullName, email: `demo${index + 1}@example.com`, phone: `081234567${index}`, department: 'Computer Science' }));
const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function day(offset) { const value = new Date(`${current}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10); }
for (let index = 0; index < 4; index++) await api('loans', { equipmentId: equipment[index]._id, borrowerId: borrowers[index]._id, borrowingDate: day(index ? index - 4 : -8), dueDate: day(index ? index + 3 : -2), notes: 'Demo loan for department coursework.' });
console.log('Created demo fixtures: 12 equipment, 4 borrowers, 4 loans (1 overdue).');
