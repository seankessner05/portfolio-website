const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../js/utils.js');

test('isValidEmail accepts normal addresses and rejects junk', () => {
  assert.equal(U.isValidEmail('a@b.co'), true);
  assert.equal(U.isValidEmail('  a@b.com '), true);
  assert.equal(U.isValidEmail('nope'), false);
  assert.equal(U.isValidEmail('a@b'), false);
  assert.equal(U.isValidEmail(null), false);
});

test('buildMailto encodes subject and body and targets the owner', () => {
  const link = U.buildMailto({ name: 'Ada L', email: 'ada@x.com', message: 'Hi & hello?' });
  assert.ok(link.startsWith(`mailto:${U.OWNER_EMAIL}?subject=`));
  assert.ok(link.includes(encodeURIComponent('Hello from Ada L')));
  assert.ok(link.includes(encodeURIComponent('Hi & hello?')));
  assert.ok(link.includes(encodeURIComponent('ada@x.com')));
  assert.ok(!link.includes(' '));
});

test('buildMailto falls back gracefully with empty fields', () => {
  assert.ok(U.buildMailto().includes(encodeURIComponent('Hello from your website')));
});

test('validateContact reports every invalid field', () => {
  const bad = U.validateContact({ name: '', email: 'x', message: 'short' });
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(bad.errors).sort(), ['email', 'message', 'name']);
  const good = U.validateContact({ name: 'Ada', email: 'ada@x.com', message: 'A real message here.' });
  assert.equal(good.ok, true);
});

test('resolveTheme prefers stored value, else OS preference', () => {
  assert.equal(U.resolveTheme('light', true), 'light');
  assert.equal(U.resolveTheme('dark', false), 'dark');
  assert.equal(U.resolveTheme(null, true), 'dark');
  assert.equal(U.resolveTheme('garbage', false), 'light');
});

test('toggleTheme flips between dark and light', () => {
  assert.equal(U.toggleTheme('dark'), 'light');
  assert.equal(U.toggleTheme('light'), 'dark');
});

test('countValue eases from 0 to target and clamps', () => {
  assert.equal(U.countValue(10, 0), 0);
  assert.equal(U.countValue(10, 1), 10);
  assert.equal(U.countValue(10, 2), 10);
  assert.equal(U.countValue(10, -1), 0);
  const mid = U.countValue(10, 0.5);
  assert.ok(mid > 5 && mid < 10);
  assert.equal(U.countValue(3.5, 1, 1), 3.5);
});

test('dcfValue matches a hand-computed case', () => {
  // fcf0=100, g=0, wacc=10%, tg=0%, 5y: PV(flows)=100*3.790787=379.0787; TV=100/0.1=1000 -> /1.1^5=620.9213
  const r = U.dcfValue({ fcf0: 100, growth: 0, wacc: 0.1, terminalGrowth: 0 });
  assert.ok(Math.abs(r.pvFcf - 379.0787) < 0.001);
  assert.ok(Math.abs(r.pvTerminal - 620.9213) < 0.001);
  assert.ok(Math.abs(r.enterpriseValue - 1000) < 0.001);
  assert.equal(r.flows.length, 5);
});

test('dcfValue grows cash flows and rejects undefined models', () => {
  const r = U.dcfValue({ fcf0: 100, growth: 0.1, wacc: 0.1, terminalGrowth: 0.02 });
  assert.ok(Math.abs(r.flows[0] - 110) < 1e-9);
  assert.ok(r.terminalShare > 0 && r.terminalShare < 1);
  assert.equal(U.dcfValue({ fcf0: 100, growth: 0.1, wacc: 0.03, terminalGrowth: 0.03 }), null);
  assert.equal(U.dcfValue({ fcf0: NaN, growth: 0.1, wacc: 0.1, terminalGrowth: 0.02 }), null);
});

test('higher WACC lowers enterprise value', () => {
  const lo = U.dcfValue({ fcf0: 100, growth: 0.08, wacc: 0.08, terminalGrowth: 0.02 });
  const hi = U.dcfValue({ fcf0: 100, growth: 0.08, wacc: 0.12, terminalGrowth: 0.02 });
  assert.ok(lo.enterpriseValue > hi.enterpriseValue);
});

test('matchesFilter handles all and multi-category items', () => {
  assert.equal(U.matchesFilter('finance campus', 'all'), true);
  assert.equal(U.matchesFilter('finance campus', 'campus'), true);
  assert.equal(U.matchesFilter('finance', 'founder'), false);
  assert.equal(U.matchesFilter(undefined, 'finance'), false);
});

test('filterCommands searches labels and keywords', () => {
  const cmds = [{ label: 'Go to Projects', keywords: 'work' }, { label: 'Toggle theme', keywords: 'dark light' }];
  assert.equal(U.filterCommands(cmds, '').length, 2);
  assert.equal(U.filterCommands(cmds, 'proj').length, 1);
  assert.equal(U.filterCommands(cmds, 'DARK')[0].label, 'Toggle theme');
  assert.equal(U.filterCommands(cmds, 'zzz').length, 0);
});
