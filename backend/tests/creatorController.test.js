const test = require('node:test');
const assert = require('node:assert/strict');
const Creator = require('../Models/Creator');
const { createCreator } = require('../controller/creatorController');

const validBody = () => ({
  fullName: 'Asha Creator', email: 'asha@example.com', mobile: '9999999999', city: 'Mumbai',
  category: ['Travel'], igLink: 'https://instagram.com/asha',
  consent1: true, consent2: true, consent3: true,
});

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('returns 422 when no social profile is supplied', async () => {
  const body = validBody();
  delete body.igLink;
  const res = response();

  await createCreator({ body }, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.message, /social media profile/i);
});

test('returns 422 unless every consent is accepted', async () => {
  const body = validBody();
  body.consent2 = false;
  const res = response();

  await createCreator({ body }, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.message, /consent/i);
});

test('rejects unsupported analytics file types', async () => {
  const body = validBody();
  body.file_insights = { name: 'payload.svg', type: 'image/svg+xml', data: Buffer.from('svg').toString('base64') };
  const res = response();

  await createCreator({ body }, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.message, /Instagram insights upload must be a JPEG, PNG, WebP, or PDF file/i);
});

test('normalizes uploads and prevents public callers from setting protected fields', async (t) => {
  let saved;
  const originalCreate = Creator.create;
  const originalFindOne = Creator.findOne;
  Creator.create = async (payload) => {
    saved = payload;
    return { _id: 'creator-id' };
  };
  Creator.findOne = () => ({ select: () => ({ lean: async () => null }) });
  t.after(() => { Creator.create = originalCreate; Creator.findOne = originalFindOne; });

  const body = {
    ...validBody(),
    _id: 'injected-id',
    file_demo: { name: 'audience.pdf', type: 'application/pdf', data: Buffer.from('pdf-data').toString('base64') },
  };
  const res = response();

  await createCreator({ body }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { id: 'creator-id', message: 'Application received' });
  assert.equal(saved._id, undefined);
  assert.equal(saved.file_demo.name, 'audience.pdf');
  assert.deepEqual(saved.file_demo.data, Buffer.from('pdf-data'));
});

test('returns 409 when a creator with the same email or mobile already exists', async (t) => {
  let query;
  let created = false;
  const originalCreate = Creator.create;
  const originalFindOne = Creator.findOne;
  Creator.create = async () => { created = true; return { _id: 'new-id' }; };
  Creator.findOne = (q) => {
    query = q;
    return { select: () => ({ lean: async () => ({ email: 'asha@example.com', mobile: '1111111111' }) }) };
  };
  t.after(() => { Creator.create = originalCreate; Creator.findOne = originalFindOne; });

  const res = response();
  await createCreator({ body: { ...validBody(), email: '  ASHA@example.com ' } }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /email already exists/i);
  assert.equal(created, false);
  assert.deepEqual(query.$or, [{ email: 'asha@example.com' }, { mobile: '9999999999' }]);
});
