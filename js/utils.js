/* Small pure helpers, kept separate so they can be unit tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Utils = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const OWNER_EMAIL = 'seankessner05@gmail.com';

  function isValidEmail(value) {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  /** Build a mailto: link from the contact form fields. */
  function buildMailto({ name = '', email = '', message = '' } = {}, to = OWNER_EMAIL) {
    const subject = `Hello from ${name.trim() || 'your website'}`;
    const body = `${message.trim()}\n\n— ${name.trim()}${email.trim() ? ` (${email.trim()})` : ''}`;
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /** Validate the contact form; returns { ok, errors }. */
  function validateContact({ name = '', email = '', message = '' } = {}) {
    const errors = {};
    if (!name.trim()) errors.name = 'Please enter your name.';
    if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
    if (message.trim().length < 10) errors.message = 'Please write at least a short message.';
    return { ok: Object.keys(errors).length === 0, errors };
  }

  /** Theme helpers: stored value wins, otherwise follow the OS preference. */
  function resolveTheme(stored, prefersDark) {
    if (stored === 'light' || stored === 'dark') return stored;
    return prefersDark ? 'dark' : 'light';
  }

  function toggleTheme(current) {
    return current === 'dark' ? 'light' : 'dark';
  }

  /** Value of a count-up animation at progress t (0..1), eased out. */
  function countValue(target, t, decimals = 0) {
    const clamped = Math.min(1, Math.max(0, t));
    const eased = 1 - Math.pow(1 - clamped, 3);
    const v = target * eased;
    return Number(v.toFixed(decimals));
  }

  /**
   * Simple illustrative DCF: grow `fcf0` at `growth` for `years`, discount at `wacc`,
   * add a Gordon-growth terminal value. Rates are decimals (0.08 = 8%).
   * Returns null when the inputs make the model undefined (wacc <= terminalGrowth).
   */
  function dcfValue({ fcf0, growth, wacc, terminalGrowth, years = 5 }) {
    if (![fcf0, growth, wacc, terminalGrowth].every(Number.isFinite) || wacc <= terminalGrowth) return null;
    const flows = [];
    let pvFcf = 0, fcf = fcf0;
    for (let t = 1; t <= years; t++) {
      fcf *= 1 + growth;
      flows.push(fcf);
      pvFcf += fcf / Math.pow(1 + wacc, t);
    }
    const terminal = (flows[years - 1] * (1 + terminalGrowth)) / (wacc - terminalGrowth);
    const pvTerminal = terminal / Math.pow(1 + wacc, years);
    return { flows, pvFcf, pvTerminal, enterpriseValue: pvFcf + pvTerminal, terminalShare: pvTerminal / (pvFcf + pvTerminal) };
  }

  /** Filter a list of timeline categories: 'all' shows everything. */
  function matchesFilter(itemCats, filter) {
    return filter === 'all' || String(itemCats || '').split(/\s+/).includes(filter);
  }

  /** Case-insensitive subsequence-friendly search for the command palette. */
  function filterCommands(commands, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => c.label.toLowerCase().includes(q) || (c.keywords || '').toLowerCase().includes(q));
  }

  return { dcfValue, matchesFilter, filterCommands, isValidEmail, buildMailto, validateContact, resolveTheme, toggleTheme, countValue, OWNER_EMAIL };
});
