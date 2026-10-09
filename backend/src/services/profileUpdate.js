// Only these columns can be edited through the existing profile endpoint.
const columns = ['name', 'annual_income', 'family_size', 'location_zone', 'age', 'gender',
  'occupation', 'social_category', 'disability_status', 'landholding_acres'];
const numeric = new Set(['annual_income', 'family_size', 'age', 'landholding_acres']);

function buildProfileUpdate(body, userId) {
  const assignments = [];
  const values = [];
  for (const column of columns) {
    if (!Object.hasOwn(body, column)) continue;
    let value = body[column];
    if (value === '') value = null;
    if (column === 'name') {
      if (typeof value !== 'string' || !value.trim()) throw new Error('Name is required.');
      value = value.trim();
    } else if (column === 'disability_status') {
      if (typeof value !== 'boolean') throw new Error('Disability status must be a boolean.');
    } else if (numeric.has(column) && value !== null) {
      if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) throw new Error('Invalid numeric profile value.');
      value = Number(value);
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid numeric profile value.');
      if (column === 'family_size' && (!Number.isInteger(value) || value < 1)) throw new Error('Family size must be a positive integer.');
      if (column === 'age' && (!Number.isInteger(value) || value > 120)) throw new Error('Age must be an integer from 0 to 120.');
    } else if (!numeric.has(column) && value !== null) {
      if (typeof value !== 'string') throw new Error('Invalid profile value.');
      value = value.trim() || null;
    }
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  }
  if (!assignments.length) throw new Error('No editable profile details supplied.');
  values.push(userId);
  return {
    sql: `UPDATE users SET ${assignments.join(', ')} WHERE user_id = $${values.length}
      RETURNING user_id, name, email, annual_income, family_size, location_zone, age,
      gender, occupation, social_category, disability_status, landholding_acres, created_at;`,
    values,
  };
}

module.exports = { buildProfileUpdate };
