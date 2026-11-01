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

  return { isValidEmail, buildMailto, validateContact, resolveTheme, toggleTheme, countValue, OWNER_EMAIL };
});
