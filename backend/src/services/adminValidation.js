const zones = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];
const fail = (message) => { const error = new Error(message); error.status = 400; throw error; };
function text(value, name, max, required = false) {
  if (value == null || value === '') { if (required) fail(`${name} is required.`); return null; }
  if (typeof value !== 'string' || value.trim().length > max) fail(`Invalid ${name}.`);
  const result = value.trim();
  if (!result && required) fail(`${name} is required.`);
  return result || null;
}
function number(value, name, { required = false, integer = false, min = 0, max = 1e12 } = {}) {
  if (value == null || value === '') { if (required) fail(`${name} is required.`); return null; }
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) fail(`Invalid ${name}.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max || (integer && !Number.isInteger(result))) fail(`Invalid ${name}.`);
  return result;
}
function zone(value, required = false) {
  const result = text(value, 'zone', 100, required);
  if (result && !zones.includes(result)) fail('Choose a valid zone.');
  return result;
}
function scheme(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Invalid scheme.');
  const result = {
    scheme_name: text(body.scheme_name, 'scheme name', 255, true),
    description: text(body.description, 'description', 10000, true),
    category: text(body.category, 'category', 100, true),
    total_benefit_value: number(body.total_benefit_value, 'benefit value', { required: true }),
    required_documents: text(body.required_documents, 'documents', 10000),
    official_url: text(body.official_url, 'official URL', 500),
    location_zone: zone(body.location_zone),
  };
  if (result.official_url) {
    let parsed; try { parsed = new URL(result.official_url); } catch { fail('Enter a valid official URL.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) fail('Official URL must use http or https without credentials.');
  }
  if (!Array.isArray(body.rules) || !body.rules.length || body.rules.length > 20) fail('Provide 1 to 20 eligibility rule sets.');
  result.rules = body.rules.map((rule) => {
    if (!rule || typeof rule !== 'object') fail('Invalid eligibility rule.');
    const r = {
      max_income: number(rule.max_income, 'income limit'),
      min_age: number(rule.min_age, 'minimum age', { integer: true, max: 120 }),
      max_age: number(rule.max_age, 'maximum age', { integer: true, max: 120 }),
      min_family_size: number(rule.min_family_size, 'minimum family size', { integer: true, min: 1, max: 1000 }),
      target_gender: text(rule.target_gender, 'gender', 50),
      target_occupation: text(rule.target_occupation, 'occupation', 100),
      target_social_category: text(rule.target_social_category, 'social category', 50),
      max_landholding: number(rule.max_landholding, 'land limit'),
      requires_disability: rule.requires_disability ?? false,
    };
    if (typeof r.requires_disability !== 'boolean') fail('Disability requirement must be a boolean.');
    if (r.min_age != null && r.max_age != null && r.min_age > r.max_age) fail('Minimum age cannot exceed maximum age.');
    return r;
  });
  return result;
}
function center(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Invalid service center.');
  return {
    name: text(body.name, 'center name', 255, true), address: text(body.address, 'address', 10000, true),
    location_zone: zone(body.location_zone, true), contact_phone: text(body.contact_phone, 'phone', 50),
    operating_hours: text(body.operating_hours, 'opening hours', 100),
  };
}
module.exports = { scheme, center };
