import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Admin Security & Auth Endpoints', () => {
  const app = createApp();

  test('unauthenticated GET /admin redirects to /admin/login', async () => {
    const res = await request(app).get('/admin');
    assert.equal(res.status, 302);
    assert.equal(res.header.location, '/admin/login');
  });

  test('GET /admin/login returns 200 with login form', async () => {
    const res = await request(app).get('/admin/login');
    assert.equal(res.status, 200);
    assert.match(res.text, /Admin Email/);
    assert.match(res.text, /Security Key \/ Password/);
  });

  test('unauthenticated access to admin subroutes redirects to login', async () => {
    const subroutes = ['/admin/projects', '/admin/settings', '/admin/sections', '/admin/career', '/admin/messages'];
    for (const route of subroutes) {
      const res = await request(app).get(route);
      assert.equal(res.status, 302);
      assert.equal(res.header.location, '/admin/login');
    }
  });

  test('POST to admin action without CSRF token is rejected with 403 Forbidden', async () => {
    // Attempting a state-changing POST to an admin route without CSRF
    const res = await request(app)
      .post('/admin/login')
      .send({
        email: 'attacker@evil.com',
        password: 'password123',
      });

    // doubleCsrfProtection blocks missing/invalid CSRF tokens on POST requests
    assert.equal(res.status, 403);
  });
});
