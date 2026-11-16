const test = require('node:test');
const assert = require('node:assert/strict');
const Creator = require('../Models/Creator');

const validApplication = () => ({
  fullName: 'Asha Creator',
  email: 'ASHA@EXAMPLE.COM',
  mobile: '+91 98765 43210',
  city: 'Mumbai',
  category: ['Travel', 'Food'],
  igLink: 'https://instagram.com/asha',
  consent1: true,
  consent2: true,
  consent3: true,
});

test('accepts a valid creator application and applies defaults', () => {
  const creator = new Creator(validApplication());

  assert.equal(creator.validateSync(), undefined);
  assert.equal(creator.email, 'asha@example.com');
  assert.deepEqual(creator.category, ['Travel', 'Food']);
});

test('capitalizes every part of a creator name before saving', () => {
  const creator = new Creator({ ...validApplication(), fullName: "  mANISH   kuMAR o'NEIL-singh  " });

  assert.equal(creator.fullName, "Manish Kumar O'Neil-Singh");
});

test('requires the basic details, category, and three consents', () => {
  const error = new Creator({}).validateSync();

  assert.ok(error);
  for (const field of ['fullName', 'email', 'mobile', 'city', 'category', 'consent1', 'consent2', 'consent3']) {
    assert.ok(error.errors[field], `${field} should be required`);
  }
});

test('rejects values outside the form options', () => {
  const creator = new Creator({
    ...validApplication(),
    ageGroup: ['Under 18'],
    gender: 'Unknown',
    apparelSize: 'XXXL',
  });
  const error = creator.validateSync();

  assert.ok(error.errors['ageGroup.0']);
  assert.ok(error.errors.gender);
  assert.ok(error.errors.apparelSize);
});

test('accepts metadata and binary data for an analytics upload', () => {
  const creator = new Creator({
    ...validApplication(),
    file_insights: { name: 'insights.png', type: 'image/png', data: Buffer.from('image') },
  });

  assert.equal(creator.validateSync(), undefined);
  assert.equal(creator.file_insights.name, 'insights.png');
  assert.ok(Buffer.isBuffer(creator.file_insights.data));
});
