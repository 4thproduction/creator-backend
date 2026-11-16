const test = require('node:test');
const assert = require('node:assert/strict');
const creatorRoutes = require('../Routes/creatorRoutes');

test('manual creator creation requires the create_creator permission', () => {
  const route = creatorRoutes.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.post)?.route;
  assert.ok(route, 'manual creation route should exist');

  const permissionMiddleware = route.stack[0].handle;
  const response = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;

  permissionMiddleware({ user: { permissions: ['read_creator'] } }, response, () => { continued = true; });
  assert.equal(response.code, 403);
  assert.equal(continued, false);

  permissionMiddleware({ user: { permissions: ['create_creator'] } }, response, () => { continued = true; });
  assert.equal(continued, true);
});

test('creator update requires the update_creator permission', () => {
  const route = creatorRoutes.stack.find((layer) => layer.route?.path === '/:id' && layer.route.methods.put)?.route;
  assert.ok(route, 'creator update route should exist');
  const permissionMiddleware = route.stack[0].handle;
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let continued = false;
  permissionMiddleware({ user: { permissions: ['read_creator'] } }, response, () => { continued = true; });
  assert.equal(response.code, 403);
  assert.equal(continued, false);
  permissionMiddleware({ user: { permissions: ['update_creator'] } }, response, () => { continued = true; });
  assert.equal(continued, true);
});
