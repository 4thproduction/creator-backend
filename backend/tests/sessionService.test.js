const test = require('node:test');
const assert = require('node:assert/strict');
const Session = require('../Models/Session');
const User = require('../Models/User');
const sessions = require('../services/sessionService');
const { protect } = require('../middleware/authMiddleware');
const { sessionSecurity } = require('../middleware/sessionSecurity');
const controller = require('../controller/authController');

const response = () => ({
  code: 200, status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; }, sendStatus(code) { this.code = code; return this; },
  cookie(name, value, options) { this.cookieValue = { name, value, options }; },
  clearCookie(name) { this.cleared = name; },
});
const request = (token = 'a'.repeat(64)) => ({ headers: { cookie: `portal_session=${token}` } });

// A small query-aware store exercises expiry and compare-and-set behavior without a live DB.
const store = (t, initial) => {
  let record = initial;
  const matches = (q) => record && Object.entries(q).every(([key, value]) => {
    if (key === '$expr') return +record.confirmAt <= +value.$lte[1];
    if (value?.$gt) return +record[key] > +value.$gt;
    if (value instanceof Date) return +record[key] === +value;
    return String(record[key]) === String(value);
  });
  t.mock.method(Session, 'findOne', async (query) => matches(query) ? { ...record } : null);
  t.mock.method(Session, 'findOneAndUpdate', async (query, update) => {
    if (!matches(query)) return null;
    record = { ...record, ...update.$set };
    return { ...record };
  });
  t.mock.method(Session, 'deleteOne', async (query) => { if (matches(query)) record = null; });
  return () => record;
};
const recordAt = (now) => ({ _id: 'session1', user: 'user1', tokenHash: sessions.hash('a'.repeat(64)), ...sessions.timing(now) });

test('login creates a hashed, user-linked 24-hour session and HttpOnly cookie', async (t) => {
  t.mock.method(Session, 'create', async (data) => ({ _id: 'session1', ...data }));
  const res = response();
  const session = await sessions.create('user1', { headers: {} }, res);
  assert.equal(session.user, 'user1');
  assert.equal(session.tokenHash, sessions.hash(res.cookieValue.value));
  assert.notEqual(session.tokenHash, res.cookieValue.value);
  assert.equal(+session.expiresAt - +session.confirmAt, 23 * sessions.HOUR);
  assert.equal(+session.deadline - +session.confirmAt, 30000);
  assert.equal(res.cookieValue.options.httpOnly, true);
  assert.equal(res.cookieValue.options.sameSite, 'lax');
  assert.equal(+res.cookieValue.options.expires, +session.expiresAt);
  assert.equal(Session.schema.indexes().some(([fields, options]) => fields.deadline === 1 && options.expireAfterSeconds === 0), true);
});

test('missed confirmation is rejected at exactly 30 seconds even before TTL cleanup', async (t) => {
  const start = Date.UTC(2026, 8, 21);
  const record = recordAt(start);
  store(t, record);
  assert.ok(await sessions.find(request(), +record.confirmAt));
  assert.ok(await sessions.find(request(), +record.deadline - 1));
  assert.equal(await sessions.find(request(), +record.deadline), null);
  assert.equal(await sessions.confirm(record, +record.deadline), null);
});

test('continue advances one hour, preserves absolute expiry, and is idempotent across tabs', async (t) => {
  const initial = recordAt(Date.UTC(2026, 8, 21));
  store(t, initial);
  const now = +initial.confirmAt + 10000;
  const [first, second] = await Promise.all([sessions.confirm(initial, now), sessions.confirm(initial, now + 1000)]);
  assert.equal(+first.expiresAt, +initial.expiresAt);
  assert.equal(+first.confirmAt, now + sessions.HOUR);
  assert.equal(+first.deadline, now + sessions.HOUR + sessions.GRACE);
  assert.equal(+second.confirmAt, +first.confirmAt);
});

test('early continue does not extend a session and 24-hour expiry cannot be extended', async (t) => {
  const initial = recordAt(Date.UTC(2026, 8, 21));
  const current = store(t, initial);
  await sessions.confirm(initial, +initial.confirmAt - 1);
  assert.equal(+current().confirmAt, +initial.confirmAt);
  current().confirmAt = new Date(+initial.expiresAt - 20000);
  current().deadline = initial.expiresAt;
  const final = await sessions.confirm(current(), +initial.expiresAt - 10000);
  assert.equal(+final.deadline, +initial.expiresAt);
  assert.equal(await sessions.find(request(), +initial.expiresAt), null);
  assert.equal(await sessions.confirm(final, +initial.expiresAt), null);
});

test('logout revokes the server record and clears the cookie', async (t) => {
  const current = store(t, recordAt(Date.now()));
  const res = response();
  await controller.logout(request(), res);
  assert.equal(current(), null);
  assert.equal(res.code, 204);
  assert.equal(res.cleared, 'portal_session');
  assert.equal(await sessions.find(request()), null);
});

test('legacy bearer tokens cannot authenticate', async () => {
  const res = response();
  await protect({ headers: { authorization: 'Bearer old-jwt' } }, res, () => assert.fail('must not authenticate'));
  assert.equal(res.code, 401);
});

test('protected requests use current user permissions and reject deleted users', async (t) => {
  store(t, recordAt(Date.now()));
  t.mock.method(User, 'findById', () => ({ populate: async () => ({ _id: 'user1', role: { permissions: ['read_creator'] } }) }));
  const req = request();
  let passed = false;
  await protect(req, response(), () => { passed = true; });
  assert.ok(passed);
  assert.deepEqual(req.user.permissions, ['read_creator']);
  User.findById.mock.mockImplementation(() => ({ populate: async () => null }));
  const res = response();
  await protect(request(), res, () => assert.fail('deleted user'));
  assert.equal(res.code, 401);
});

test('database failures fail closed without pretending signout succeeded', async (t) => {
  t.mock.method(Session, 'findOne', async () => { throw new Error('offline'); });
  t.mock.method(Session, 'deleteOne', async () => { throw new Error('offline'); });
  const res = response();
  await protect(request(), res, () => assert.fail('offline'));
  assert.equal(res.code, 503);
  const logout = response();
  await controller.logout(request(), logout);
  assert.equal(logout.code, 503);
  assert.equal(logout.cleared, undefined);
});

test('CSRF guard requires custom headers and trusted origins; public intake remains accessible', () => {
  for (const [header, origin, allowed] of [['1', 'http://localhost:5173', true], ['1', 'http://localhost:5174', true], ['1', 'http://127.0.0.1:5174', true], ['', 'http://localhost:5173', false], ['1', 'https://foreign.example', false]]) {
    const req = { method: 'POST', path: '/api/auth/logout', get: (name) => name === 'Origin' ? origin : header };
    let passed = false;
    sessionSecurity(req, response(), () => { passed = true; });
    assert.equal(passed, allowed);
  }
  let passed = false;
  sessionSecurity({ method: 'POST', path: '/api/creators/applications' }, response(), () => { passed = true; });
  assert.ok(passed);
});

test('a new login rotates the old session and uses Secure cookies in production', async (t) => {
  const current = store(t, recordAt(Date.now()));
  t.mock.method(Session, 'create', async (data) => ({ _id: 'new-session', ...data }));
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const res = response();
    await sessions.create('user1', request(), res);
    assert.equal(current(), null);
    assert.equal(res.cookieValue.options.secure, true);
    assert.notEqual(res.cookieValue.value, 'a'.repeat(64));
    assert.equal(res.cookieValue.options.path, '/api');
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('login returns session timing and user, never a bearer token or stored hash', async (t) => {
  const auth = require('../services/authService');
  t.mock.method(auth, 'login', async () => ({ user: { _id: 'user1', name: 'Test' } }));
  t.mock.method(Session, 'create', async (data) => ({ _id: 'session1', ...data }));
  const res = response();
  await controller.login({ headers: {}, body: { email: 'test@example.com', password: 'test' } }, res);
  assert.equal(res.body.user._id, 'user1');
  assert.equal(typeof res.body.session.confirmAt, 'number');
  assert.equal(typeof res.body.session.serverNow, 'number');
  assert.equal(res.body.token, undefined);
  assert.equal(res.body.session.tokenHash, undefined);
});
