# Agent notes

Static personal portfolio: one page (`index.html`), styled by `css/styles.css`, with behavior in `js/main.js`. Shared helpers live in `js/utils.js` and have Node unit tests. There is no framework and no backend. Sections are hash routes on that page: `#about`, `#experience`, `#projects`, `#skills`, `#beyond`, `#contact`.

## Run this after every change

```bash
npm test
npm run test:e2e
```

`npm test` runs the unit tests. `npm run test:e2e` starts a local static server at `http://127.0.0.1:4173` (via `npm run preview`) and runs the Playwright smoke suite in Chromium. Do not screenshot the site by hand when this suite covers the change.

First time on a machine, install the browser once:

```bash
npm install
npx playwright install chromium
```

Preview the site yourself with `npm start` (port 3000) or `npm run preview` (port 4173). The e2e command starts preview on its own.

## What the smoke suite checks

- `/` and each hash route load with no page errors, console errors, or failed same-origin requests
- Primary nav links, the logo, “Let’s connect”, and back-to-top reach the right place
- Hero, highlights, about, experience, projects, skills, beyond, and contact render
- Internal links (including the résumé PDF), stylesheets, scripts, and images resolve; images decode
- External `https` links are present but not opened
- Mobile width (390px): the menu opens and closes, and the hero and contact form fit
- Theme toggle, experience filters, the case-study dialog, quick nav, and contact-form validation — all local, no mailto submission

Tests force `prefers-reduced-motion: reduce` and a dark color scheme so animations do not make visibility checks flaky. Google Fonts are stubbed; do not point tests at Calendly, LinkedIn, or other external services.

Prefer the `data-testid` attributes on the header, nav, sections, portrait, filters, and contact form. Do not restyle the site to make a test pass.

## Do not commit

`.env` files, secrets, `node_modules/`, `test-results/`, or `playwright-report/`.
