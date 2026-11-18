# Sean Kessner — portfolio

Static site (`index.html`). No build step.

```bash
npm install
npm start
```

That serves the folder at <http://127.0.0.1:3000>.

## Tests

```bash
npm test          # unit tests for js/utils.js
npm run test:e2e  # Playwright smoke tests (starts the site on port 4173)
```

Install Chromium once with `npx playwright install chromium`. The browser suite covers page load, hash routes, navigation, sections, internal links, images, and a mobile-width check. See `CLAUDE.md` for what to run after a change.
