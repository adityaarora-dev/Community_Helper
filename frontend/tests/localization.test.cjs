const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Bundle the JSX in memory so these checks need no browser, API keys or network.
const result = buildSync({
  stdin: {
    contents: `export * from './src/i18n.jsx';
      export { default as Fields, EMPTY_DEMOGRAPHICS } from './src/components/DemographicFields.jsx';
      export { default as Login } from './src/components/LoginView.jsx';`,
    resolveDir: path.resolve(__dirname, '..'),
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  define: { 'import.meta.env': '{}' },
  write: false,
});
const compiled = new Module(__filename + '.bundle', module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(result.outputFiles[0].text, __filename);
const { translations, languages, LanguageProvider, Fields, EMPTY_DEMOGRAPHICS, Login } = compiled.exports;

function render(language, component) {
  const priorStorage = global.localStorage;
  global.localStorage = { getItem: () => language };
  try { return renderToStaticMarkup(React.createElement(LanguageProvider, null, component)); }
  finally {
    if (priorStorage === undefined) delete global.localStorage;
    else global.localStorage = priorStorage;
  }
}

test('every interface message is available in all six languages', () => {
  assert.equal(languages.length, 6);
  for (const [key, values] of Object.entries(translations)) {
    assert.equal(values.length, languages.length, key);
    for (const value of values) assert.ok(typeof value === 'string' && value.trim(), key);
  }
});

test('localized forms preserve backend enum values and zero income', () => {
  for (const [index, [language]] of languages.entries()) {
    const html = render(language, React.createElement(Fields, {
      value: { ...EMPTY_DEMOGRAPHICS, annual_income: 0, occupation: 'Farmer', location_zone: 'North Zone' },
      onChange: () => {},
    }));
    assert.ok(html.includes(translations.income[index]));
    assert.ok(html.includes('name="annual_income"') && html.includes('value="0"'));
    assert.ok(html.includes('value="Farmer" selected=""'), language);
    assert.ok(html.includes('value="North Zone" selected=""'), language);
    assert.ok(html.includes(translations.farmer[index]), language);
    assert.ok(html.includes(translations.north[index]), language);
  }
});

test('create-account mode opens registration, sign-in mode opens login', () => {
  for (const [index, [language]] of languages.entries()) {
    const registration = render(language, React.createElement(Login, { initialMode: 'register' }));
    assert.ok(registration.includes('name="name"'), language);
    assert.ok(registration.includes('autoComplete="new-password"'), language);
    assert.ok(registration.includes(translations.sendCode[index]), language);
    assert.match(registration, /name="location_zone" required=""/);
    assert.ok(registration.includes(translations.zoneAlertsHint[index]), language);
    assert.ok(registration.includes('value="North Zone"'), language);
    const login = render(language, React.createElement(Login, { initialMode: 'login' }));
    assert.ok(!login.includes('name="name"'), language);
    assert.ok(login.includes('autoComplete="current-password"'), language);
  }
});

test('an unsupported saved language falls back to English', () => {
  const html = render('unsupported', React.createElement(Fields, { value: EMPTY_DEMOGRAPHICS, onChange: () => {} }));
  assert.ok(html.includes('Annual income'));
});

test('saved profile values outside common presets stay selected in edit mode', () => {
  const html = render('English', React.createElement(Fields, {
    value: { ...EMPTY_DEMOGRAPHICS, social_category: 'OBC', occupation: 'Teacher' },
    onChange: () => {},
  }));
  assert.ok(html.includes('value="OBC" selected=""'));
  assert.ok(html.includes('value="Teacher" selected=""'));
});
