import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { query } from '../src/db.js';
import { generateFormTimestampSignature } from '../src/routes/public.js';

describe('Public Endpoints', () => {
  const app = createApp();

  test('GET /healthz returns 200 and health status', async () => {
    const res = await request(app).get('/healthz');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('GET / returns 200 with seeded name and section landmarks', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Nahid Hasan/);
    assert.match(res.text, /id="hero"/);
    assert.match(res.text, /id="skills"/);
    assert.match(res.text, /id="projects"/);
    assert.match(res.text, /id="career"/);
    assert.match(res.text, /id="contact"/);
  });

  test('POST /contact validation: invalid request returns 400 with field errors', async () => {
    const res = await request(app)
      .post('/contact')
      .send({
        name: '',
        email: 'bad-email',
        message: 'short',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.ok, false);
    assert.ok(res.body.errors);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.message);
  });

  test('POST /contact honeypot: filled bot trap returns fake 200 and no message stored', async () => {
    const beforeCount = await query('SELECT COUNT(*) as count FROM contact_messages');

    const res = await request(app)
      .post('/contact')
      .send({
        name: 'Spam Bot',
        email: 'spambot@example.com',
        message: 'This is spam payload message that is long enough.',
        hp_field: 'http://spam-link.ru', // honeypot triggered
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);

    const afterCount = await query('SELECT COUNT(*) as count FROM contact_messages');
    assert.equal(afterCount[0][0].count, beforeCount[0][0].count);
  });

  test('POST /contact valid submission stores row in contact_messages', async () => {
    const validTime = Date.now() - 5000; // 5 seconds ago
    const sig = generateFormTimestampSignature(validTime);

    const res = await request(app)
      .post('/contact')
      .send({
        name: 'Test Visitor',
        email: 'visitor@example.com',
        subject: 'Engineering Consultation',
        message: 'Hello, this is a test transmission for the portfolio system.',
        form_time: String(validTime),
        form_sig: sig,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);

    const [rows] = await query('SELECT * FROM contact_messages WHERE email = ? ORDER BY id DESC LIMIT 1', ['visitor@example.com']);
    assert.ok(rows.length > 0);
    assert.equal(rows[0].name, 'Test Visitor');
    assert.equal(rows[0].subject, 'Engineering Consultation');
  });
});
