const { test, expect } = require('@playwright/test');

const HASH_ROUTES = ['#about', '#experience', '#projects', '#skills', '#beyond', '#contact'];

const SECTIONS = [
  { testid: 'section-hero', level: 1, heading: 'Sean Kessner', text: /Summer 2027 finance internships/ },
  { testid: 'section-highlights', text: /GPA, B\.S\. Economics/ },
  { testid: 'section-about', level: 2, heading: 'About', text: /Hobart and William Smith/ },
  { testid: 'section-experience', level: 2, heading: 'Experience & education', text: /Deb & Kess Notary/ },
  { testid: 'section-projects', level: 2, heading: 'Projects & case studies', text: /3-Statement Model/ },
  { testid: 'section-skills', level: 2, heading: 'Skills', text: /Financial modeling/ },
  { testid: 'section-beyond', level: 2, heading: 'Beyond the résumé', text: /Division III Football/ },
  { testid: 'section-contact', level: 2, heading: "Let's talk", text: /seankessner05@gmail.com/ },
];

const NAV = [
  { name: 'About', id: 'about' },
  { name: 'Experience', id: 'experience' },
  { name: 'Projects', id: 'projects' },
  { name: 'Skills', id: 'skills' },
  { name: 'Beyond', id: 'beyond' },
  { name: 'Contact', id: 'contact' },
];

const errorsByPage = new WeakMap();

function classifyHref(href) {
  if (!href || href.startsWith('data:') || href.startsWith('javascript:')) return 'skip';
  if (href.startsWith('mailto:')) return 'mailto';
  if (href.startsWith('#')) return 'hash';
  if (/^https?:\/\//i.test(href)) return 'external';
  return 'internal';
}

async function open(page, path = '/') {
  await page.goto(path, { waitUntil: 'load' });
  await expect(page.getByTestId('section-hero')).toBeAttached();
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  errorsByPage.set(page, errors);
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Google Fonts are stubbed below; ignore them if a request still logs.
    if (/fonts\.(googleapis|gstatic)\.com/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    const text = request.failure()?.errorText || '';
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return;
    // Navigation cancels in-flight image and font requests. That is not a broken asset.
    if (text.includes('ERR_ABORTED')) return;
    errors.push(`requestfailed: ${url} ${text}`.trim());
  });
  await page.route(/https?:\/\/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/css; charset=utf-8',
      body: '/* e2e: third-party fonts stubbed */',
    }),
  );
});

test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page) || [], 'unexpected browser errors').toEqual([]);
});

test('home and hash routes load', async ({ page }) => {
  await open(page, '/');
  await expect(page).toHaveTitle('Sean Kessner | Economics & Finance');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Sean Kessner' })).toBeVisible();

  for (const hash of HASH_ROUTES) {
    await open(page, `/${hash}`);
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(page.locator(hash)).toBeInViewport();
  }
});

test('key sections render', async ({ page }) => {
  await open(page, '/');
  for (const section of SECTIONS) {
    const root = page.getByTestId(section.testid);
    await expect(root).toBeVisible();
    if (section.heading) {
      await expect(root.getByRole('heading', { level: section.level, name: section.heading })).toBeVisible();
    }
    await expect(root).toContainText(section.text);
  }
  await expect(page.getByTestId('portrait')).toBeVisible();
  await expect(page.getByTestId('contact-form').locator('input[name="name"]')).toBeVisible();
  await expect(page.getByTestId('contact-form').locator('textarea[name="message"]')).toBeVisible();
});

test('primary navigation reaches each section', async ({ page }) => {
  await open(page, '/');
  const nav = page.getByTestId('primary-nav');
  await expect(nav).toBeVisible();
  await expect(page.getByTestId('menu-toggle')).toBeHidden();

  for (const item of NAV) {
    await nav.getByRole('link', { name: item.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
    await expect(page.locator(`#${item.id}`)).toBeInViewport();
  }

  await page.getByRole('link', { name: 'Sean Kessner, home' }).click();
  await expect(page).toHaveURL(/#top$/);
  await expect(page.getByTestId('section-hero')).toBeInViewport();

  await page.getByRole('link', { name: "Let's connect" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await page.getByRole('button', { name: /Back to top/ }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(40);
});

test('internal links and images resolve', async ({ page }) => {
  await open(page, '/');

  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')),
  );
  expect(hrefs.length).toBeGreaterThan(0);

  const hashes = new Set();
  const internal = new Set();
  const external = new Set();
  const mailto = new Set();

  for (const href of hrefs) {
    const kind = classifyHref(href);
    if (kind === 'hash') hashes.add(href);
    else if (kind === 'internal') internal.add(href);
    else if (kind === 'external') external.add(href);
    else if (kind === 'mailto') mailto.add(href);
    else if (kind !== 'skip') throw new Error(`unclassified href: ${href}`);
  }

  expect(internal.size).toBeGreaterThan(0);
  expect(external.size).toBeGreaterThan(0);

  for (const hash of hashes) {
    expect(hash.length, `empty hash link`).toBeGreaterThan(1);
    await expect(page.locator(hash), `missing target for ${hash}`).toHaveCount(1);
  }

  for (const href of internal) {
    const response = await page.request.get(href);
    expect(response.ok(), `${href} returned ${response.status()}`).toBeTruthy();
    expect((await response.body()).length, href).toBeGreaterThan(0);
  }

  for (const href of external) {
    expect(href, 'external links stay absolute so the suite does not call them').toMatch(/^https:\/\//);
  }
  const blankTargets = page.locator('a[target="_blank"]');
  const blankCount = await blankTargets.count();
  expect(blankCount).toBeGreaterThan(0);
  for (let i = 0; i < blankCount; i++) {
    await expect(blankTargets.nth(i)).toHaveAttribute('rel', /noopener/);
  }

  for (const href of mailto) {
    expect(href).toMatch(/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/);
  }

  const assets = await page.locator('link[rel="stylesheet"][href], script[src]').evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute('href') || node.getAttribute('src'))
      .filter((url) => url && !/^(https?:|data:)/.test(url)),
  );
  expect(assets).toEqual(expect.arrayContaining(['css/styles.css', 'js/utils.js', 'js/main.js']));
  for (const href of new Set(assets)) {
    const response = await page.request.get(href);
    expect(response.ok(), `${href} returned ${response.status()}`).toBeTruthy();
  }

  const images = page.locator('img');
  const imageCount = await images.count();
  expect(imageCount).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const src = await img.getAttribute('src');
    expect(src, 'img is missing src').toBeTruthy();
    const alt = await img.getAttribute('alt');
    expect(alt, `${src} is missing alt text`).toBeTruthy();
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => img.evaluate((el) => el.complete && el.naturalWidth > 0), {
        message: `image failed to decode: ${src}`,
      })
      .toBe(true);
    const response = await page.request.get(src);
    expect(response.ok(), `${src} returned ${response.status()}`).toBeTruthy();
    expect(response.headers()['content-type'] || '', src).toMatch(/^image\//);
  }
});

test('local interactions work without leaving the page', async ({ page }) => {
  await open(page, '/#experience');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-label', 'Switch to dark mode');

  const founder = page.locator('#experience .timeline > li[data-cat="founder"]');
  await expect(founder).toBeVisible();
  await page.getByTestId('experience-filters').getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(founder).toBeHidden();
  await expect(page.locator('#experience .timeline > li[data-cat="education"]')).toHaveCount(2);
  await expect(page.locator('#experience .timeline > li[data-cat="education"]').first()).toBeHidden();
  await expect(page.locator('#experience .timeline > li[data-cat="finance"]:not(.is-hidden)')).toHaveCount(3);
  await page.getByTestId('experience-filters').getByRole('button', { name: 'All', exact: true }).click();
  await expect(founder).toBeVisible();

  await page.getByTestId('section-projects').locator('button[data-open="notary"]').click();
  const dialog = page.locator('#caseDialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Deb & Kess Notary' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close case study' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Open quick navigation' }).click();
  const palette = page.locator('#palette');
  await expect(palette).toBeVisible();
  await page.locator('#paletteInput').fill('skills');
  await palette.getByRole('option', { name: /Go to Skills/ }).click();
  await expect(palette).toBeHidden();
  await expect(page.getByTestId('section-skills')).toBeInViewport();

  await open(page, '/#contact');
  const form = page.getByTestId('contact-form');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.locator('.err[data-for="name"]')).toHaveText(/name/i);
  await expect(form.locator('.err[data-for="email"]')).toHaveText(/email/i);
  await expect(form.locator('.err[data-for="message"]')).toHaveText(/message/i);
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#formNote')).toHaveText(/opens your email app/i);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('menu opens, navigates, and the page still fits', async ({ page }) => {
    await open(page, '/');
    const menu = page.getByTestId('primary-nav');
    const toggle = page.getByTestId('menu-toggle');

    await expect(toggle).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(page.getByTestId('portrait')).toBeVisible();

    const heroFits = await page.getByRole('heading', { level: 1, name: 'Sean Kessner' }).evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
    });
    expect(heroFits).toBe(true);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.getByTestId('section-contact')).toBeInViewport();
    await expect(page.getByTestId('contact-form')).toBeVisible();

    const formFits = await page.getByTestId('contact-form').evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.left >= -1 && box.right <= window.innerWidth + 1;
    });
    expect(formFits).toBe(true);
  });
});
