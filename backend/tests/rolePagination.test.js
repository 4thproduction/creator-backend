const test = require('node:test');
const assert = require('node:assert/strict');
const roleService = require('../services/roleService');
const { getRoles } = require('../controller/roleController');

const response = () => ({
  body: undefined,
  json(value) { this.body = value; return this; },
  status() { return this; },
});

test('returns a paginated role result for the Roles table', async (t) => {
  const original = roleService.getAllRoles;
  t.after(() => { roleService.getAllRoles = original; });
  roleService.getAllRoles = async (page, limit) => ({ roles: [{ name: 'Editor' }], total: 21, page, limit });
  const res = response();

  await getRoles({ query: { page: '2', limit: '20' } }, res);

  assert.deepEqual(res.body, { roles: [{ name: 'Editor' }], total: 21, page: 2, limit: 20 });
});

test('keeps the full role list for user role selectors', async (t) => {
  const original = roleService.getAllRoles;
  t.after(() => { roleService.getAllRoles = original; });
  roleService.getAllRoles = async (page, limit) => {
    assert.equal(page, undefined);
    assert.equal(limit, undefined);
    return [{ name: 'Admin' }, { name: 'Editor' }];
  };
  const res = response();

  await getRoles({ query: {} }, res);

  assert.deepEqual(res.body, [{ name: 'Admin' }, { name: 'Editor' }]);
});
