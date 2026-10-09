const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildProfileUpdate } = require('./profileUpdate');

test('profile edits preserve zero/false and explicitly clear optional values', () => {
  const { sql, values } = buildProfileUpdate({ annual_income: 0, age: null, occupation: '', disability_status: false }, 'user-id');
  assert.deepEqual(values, [0, null, null, false, 'user-id']);
  assert.ok(sql.includes('annual_income = $1'));
  assert.ok(!sql.includes('COALESCE'));
  assert.ok(!sql.includes('email ='));
});

test('partial edits leave omitted fields unchanged and bind text as parameters', () => {
  const { sql, values } = buildProfileUpdate({ name: "  O'Connor  ", email: 'not-editable@example.com', password_hash: 'ignored' }, 'user-id');
  assert.deepEqual(values, ["O'Connor", 'user-id']);
  assert.ok(sql.includes('SET name = $1 WHERE user_id = $2'));
  assert.ok(!sql.includes("O'Connor"));
});

test('invalid numbers, empty names and non-boolean flags are rejected', () => {
  for (const body of [{ age: 'abc' }, { age: 121 }, { age: 2.5 }, { family_size: 0 },
    { annual_income: -1 }, { annual_income: true }, { name: '  ' }, { disability_status: 'false' }]) {
    assert.throws(() => buildProfileUpdate(body, 'user-id'));
  }
});
