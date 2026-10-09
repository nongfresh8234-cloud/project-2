import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1505, height: 1045 } });
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource:.*409/.test(message.text())) errors.push(message.text()); });
const cleanup = [];
const stamp = Date.now();
const equipmentName = `UI camera ${stamp}`;
const borrowerName = `UI borrower ${stamp}`;
async function ready() { await page.getByRole('status').filter({ hasText: 'Loading workspace' }).waitFor({ state: 'hidden' }); }
async function details(entity) { await page.waitForURL(new RegExp(`/${entity}/[a-f0-9]{24}$`)); await ready(); const id = page.url().split('/').pop(); cleanup.push([entity, id]); return id; }
async function screenshot(name) { if (process.env.CAPTURE_SCREENSHOTS === '1') { await mkdir(resolve('docs/screenshots'), { recursive: true }); await page.screenshot({ path: resolve(`docs/screenshots/${name}.png`), fullPage: true }); } }
try {
  await page.goto(base); await ready();
  assert.equal(await page.title(), 'Project 2 | Equipment management');
  assert.equal(await page.getByRole('heading', { name: 'Dashboard', exact: true }).count(), 1);
  await screenshot('dashboard');
  await page.goto(`${base}/equipment`); await ready(); await screenshot('equipment');
  await page.getByRole('link', { name: 'Add equipment', exact: true }).click(); await ready();
  await page.getByLabel('Equipment name').fill(equipmentName);
  await page.getByLabel('Equipment code').fill(`UI-${stamp}`);
  await page.getByLabel('Category').fill('Camera');
  await page.getByRole('button', { name: 'Create record' }).click();
  const equipmentId = await details('equipment');
  assert.ok(await page.getByRole('heading', { name: equipmentName, exact: true }).isVisible());
  await page.getByRole('link', { name: 'Edit', exact: true }).click(); await ready();
  await page.getByLabel('Description').fill('Changed through the equipment edit form');
  await page.getByRole('button', { name: 'Save changes' }).click(); await page.waitForURL(`${base}/equipment/${equipmentId}`); await ready();
  assert.ok(await page.getByText('Changed through the equipment edit form', { exact: true }).isVisible());
  await page.goto(`${base}/borrowers/new`); await ready();
  await page.getByLabel('Full name').fill(borrowerName);
  await page.getByLabel('Email', { exact: false }).fill('ui-test@example.com');
  await page.getByLabel('Phone number').fill('0812345678');
  await page.getByLabel('Department', { exact: false }).fill('Computer Science');
  await page.getByRole('button', { name: 'Create record' }).click();
  const borrowerId = await details('borrowers');
  await page.goto(`${base}/loans/new`); await ready();
  await page.getByRole('combobox', { name: /^Equipment \*/ }).selectOption(equipmentId);
  await page.getByRole('combobox', { name: /^Borrower \*/ }).selectOption(borrowerId);
  await page.getByLabel('Notes').fill('End-to-end browser workflow');
  await page.getByRole('button', { name: 'Create record' }).click();
  await details('loans');
  assert.ok(await page.getByRole('button', { name: 'Record return' }).isVisible());
  await page.getByRole('button', { name: 'Record return' }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Confirm return' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' }); await ready();
  assert.ok(await page.getByText('Returned', { exact: true }).isVisible());
  await page.goto(`${base}/equipment`); await ready();
  await page.getByRole('textbox', { name: 'Search equipment' }).fill(`UI-${stamp}`);
  assert.equal(await page.locator('tbody tr').count(), 1);
  assert.ok(await page.locator('tbody').getByText('Available', { exact: true }).isVisible());
  await page.getByRole('link', { name: `View ${equipmentName}`, exact: true }).click(); await ready();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete record', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'loan history' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/equipment', '/borrowers', '/loans', '/equipment/new', '/borrowers/new', '/loans/new']) {
    await page.goto(`${base}${route}`); await ready();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Horizontal page overflow: ${route}`);
    assert.ok(await page.locator('h1').isVisible());
    if (route === '/') await screenshot('mobile');
    if (route === '/loans/new') await screenshot('mobile-form');
  }
  assert.deepEqual(errors, [], 'Browser console should be free of runtime errors');
  console.log('PASS: desktop create/edit equipment, create borrower, create loan, record return, search, linked-delete protection; 7 mobile routes; no console errors.');
} finally {
  for (const entity of ['loans', 'borrowers', 'equipment']) for (const [name, id] of cleanup) if (name === entity) await fetch(`${base}/api/${name}/${id}`, { method: 'DELETE' });
  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    await page.setViewportSize({ width: 1505, height: 1045 });
    await page.goto(base); await ready(); await screenshot('dashboard');
    const sampleLoan = page.getByRole('link', { name: 'View Canon EOS R50 loan', exact: true });
    if (await sampleLoan.count()) {
      await sampleLoan.click(); await ready(); await screenshot('loan-detail');
      await page.getByRole('button', { name: 'Record return' }).click();
      await page.getByRole('dialog').waitFor(); await screenshot('return-dialog');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base); await ready(); await screenshot('mobile');
  }
  await browser.close();
}
