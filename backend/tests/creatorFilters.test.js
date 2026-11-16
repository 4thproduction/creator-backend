const test = require('node:test');
const assert = require('node:assert/strict');
const { creatorFilters } = require('../utils/creatorFilters');

test('combines filters and treats search punctuation literally', () => {
  const result = creatorFilters({ search: ' a+b@example.com ', category: 'Fashion', city: 'Delhi', platform: 'Instagram' });
  assert.equal(result.$or[0].fullName.$regex, 'a\\+b@example\\.com');
  assert.equal(result.$or[1].email.$options, 'i');
  assert.equal(result.category.$regex, '^Fashion$');
  assert.equal(result.city.$regex, '^Delhi$');
  assert.equal(result.igLink.$regex, '\\S');
});
test('preset periods include today and use an exclusive next-day boundary', () => {
  for (const period of ['7', '30', '90']) {
    const { createdAt } = creatorFilters({ period }, new Date('2026-09-21T13:45:00Z'));
    assert.equal(createdAt.$lt.toISOString(), '2026-09-21T18:30:00.000Z');
    assert.equal((createdAt.$lt - createdAt.$gte) / 86400000, Number(period));
  }
});
test('custom range includes the whole final day and permits a single day', () => {
  const { createdAt } = creatorFilters({ period: 'custom', from: '2026-09-16', to: '2026-09-16' });
  assert.equal(createdAt.$gte.toISOString(), '2026-09-15T18:30:00.000Z');
  assert.equal(createdAt.$lt.toISOString(), '2026-09-16T18:30:00.000Z');
});
test('invalid, missing, and reversed custom dates fail validation', () => {
  for (const [from, to] of [['2026-02-30', '2026-03-01'], ['', '2026-09-21'], ['2026-09-22', '2026-09-21']]) {
    assert.throws(() => creatorFilters({ period: 'custom', from, to }));
  }
  assert.throws(() => creatorFilters({ period: '15' }));
  assert.throws(() => creatorFilters({ platform: 'Unknown' }));
});
test('all dates leaves older records available', () => {
  assert.deepEqual(creatorFilters({ period: 'all' }), {});
  assert.deepEqual(creatorFilters(), {});
});

test('preset dates roll over at IST midnight before UTC midnight', () => {
  const { createdAt } = creatorFilters({ period: '7' }, new Date('2026-09-21T18:30:00Z'));
  assert.equal(createdAt.$gte.toISOString(), '2026-09-15T18:30:00.000Z');
  assert.equal(createdAt.$lt.toISOString(), '2026-09-22T18:30:00.000Z');
});
