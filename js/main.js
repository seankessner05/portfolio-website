(function () {
  const U = window.Utils;
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle */
  const toggle = $('#themeToggle');
  const syncToggle = () => toggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  syncToggle();
  toggle.addEventListener('click', () => {
    root.dataset.theme = U.toggleTheme(root.dataset.theme);
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    syncToggle();
  });

  /* Mobile menu */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

  /* Scroll progress + nav state */
  const nav = $('#nav'), bar = $('#progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', scrollY > 10);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Active nav link */
  const links = $$('#menu a[href^="#"]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* Reveal on scroll (staggered inside groups) + count-up */
  const countUp = el => {
    const target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10), suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target.toFixed(dec) + suffix; return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const t = (now - start) / dur;
      el.textContent = U.countValue(target, t, dec).toFixed(dec) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      const c = $('[data-count]', en.target);
      if (c) countUp(c);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); io.observe(el); });

  /* Typing effect */
  const phrases = ['financial modeling', 'valuation & equity research', 'markets & the global economy', 'building businesses', 'Division III football'];
  const typed = $('#typed');
  if (reduced) typed.textContent = phrases[0];
  else {
    let p = 0, c = 0, del = false;
    (function step() {
      const word = phrases[p];
      typed.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(step, 1600); }
      if (del && c === 0) { del = false; p = (p + 1) % phrases.length; }
      c += del ? -1 : 1;
      setTimeout(step, del ? 35 : 70);
    })();
  }

  /* Cursor glow (only for fine pointers) */
  const glow = $('.glow');
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    addEventListener('pointermove', e => {
      document.body.classList.add('has-pointer');
      glow.style.transform = `translate(${e.clientX - 230}px, ${e.clientY - 230}px)`;
    }, { passive: true });
  }

  /* Case study dialog */
  const cases = {
    notary: {
      tag: 'Entrepreneurship · Web', title: 'Deb & Kess Notary',
      challenge: 'Start a real, licensed notary business from zero and make it easy for clients to book and get answers without back-and-forth.',
      did: ['Independently completed all required state credentialing for a mobile and remote online notary (RON) business.',
        'Run in-person mobile notarizations through Proof.com, with scheduling in Calendly and a custom job tracker and operating wiki for case tracking.',
        'Designed and deployed the client-facing website using AI-assisted development tools, GitHub and Netlify.',
        'Built a custom AI chat assistant to handle routine client inquiries.'],
      stack: 'Netlify, GitHub, Proof.com, Calendly, AI-assisted development',
      url: 'https://debandkessnotary.com'
    },
    model: {
      tag: 'Finance · Valuation', title: '3-Statement Model & DCF',
      challenge: 'Learn how analysts actually value companies by building the full model myself, not filling in a template.',
      did: ['Built an integrated 3-statement financial model from scratch in Excel.',
        'Layered on a discounted cash flow (DCF) valuation and a comparable company analysis.',
        'Completed through the Wall Street Prep Financial Modeling Bootcamp (Aug–Dec 2025).',
        'Apply the same modeling and stock-pitch workflow in the HWS Investment Club.'],
      stack: 'Excel, DCF, comparable company analysis'
    },
    ief: {
      tag: 'Research · International', title: 'Economic Analysis Paper, Prague',
      challenge: 'Upcoming (Spring 2027): produce an economic analysis paper as part of the Certificate in International Economics and Finance.',
      did: ['Selected for the IEF certificate at Charles University & CERGE-EI, the top-ranked economics research institution in Central and Eastern Europe.',
        'Will take coursework in international economics and finance and attend guest lectures from visiting economists.',
        'Bringing statistics and data analytics coursework, plus Stata, R and Python, to the research.'],
      stack: 'Economics research, Stata, R, Python'
    }
  };
  const dialog = $('#caseDialog'), body = $('#caseBody');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const openCase = key => {
    const d = cases[key]; if (!d) return;
    body.innerHTML = `<span class="tag">${esc(d.tag)}</span><h3 id="caseTitle">${esc(d.title)}</h3>
      <h4>The goal</h4><p>${esc(d.challenge)}</p>
      <h4>What I did</h4><ul>${d.did.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4>Tools</h4><p>${esc(d.stack)}</p>
      ${d.url ? `<p><a class="btn primary" href="${esc(d.url)}" target="_blank" rel="noopener">Visit live site ↗</a></p>` : ''}`;
    dialog.showModal();
  };
  $$('.project').forEach(card => {
    const open = () => openCase(card.dataset.case);
    card.addEventListener('click', e => { if (!e.target.closest('a')) open(); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === card) open(); });
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  /* Contact form → mailto */
  const form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const { ok, errors } = U.validateContact(data);
    $$('.err', form).forEach(el => { el.textContent = errors[el.dataset.for] || ''; });
    if (!ok) return;
    note.textContent = 'Opening your email app… if nothing happens, email me directly at ' + U.OWNER_EMAIL + '.';
    location.href = U.buildMailto(data);
  });


  /* Spotlight, tilt and magnetic buttons (fine pointers only) */
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    $$('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (card.classList.contains('project')) {
          card.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg');
          card.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
        }
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
    $$('.btn.primary').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* Experience filters */
  const filterBtns = $$('.filter');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
    $$('.timeline > li').forEach(li => li.classList.toggle('is-hidden', !U.matchesFilter(li.dataset.cat, btn.dataset.filter)));
  }));

  /* Interactive DCF */
  const ids = ['growth', 'wacc', 'tg'];
  const inp = Object.fromEntries(ids.map(k => [k, $('#in-' + k)]));
  const money = n => '$' + Math.round(n).toLocaleString('en-US') + 'M';
  const renderDcf = () => {
    const v = k => parseFloat(inp[k].value);
    ids.forEach(k => { $('#o-' + k).textContent = v(k).toFixed(k === 'tg' ? 2 : 1) + '%'; });
    const r = U.dcfValue({ fcf0: 100, growth: v('growth') / 100, wacc: v('wacc') / 100, terminalGrowth: v('tg') / 100 });
    $('#dcfWarn').hidden = !!r;
    if (!r) { $('#ev').textContent = '—'; return; }
    $('#ev').textContent = money(r.enterpriseValue);
    $('#splitFcf').style.width = (1 - r.terminalShare) * 100 + '%';
    $('#splitTv').style.width = r.terminalShare * 100 + '%';
    $('#pvFcf').textContent = money(r.pvFcf);
    $('#pvTv').textContent = money(r.pvTerminal) + ' (' + Math.round(r.terminalShare * 100) + '%)';
    const max = Math.max(...r.flows);
    $('#bars').innerHTML = r.flows.map((f, i) => `<div style="height:${Math.max(4, (f / max) * 100)}%" data-l="Y${i + 1} ${Math.round(f)}"></div>`).join('');
    // sensitivity grid: WACC +/-1% by terminal growth +/-0.5%
    const waccs = [v('wacc') - 1, v('wacc'), v('wacc') + 1], tgs = [v('tg') - 0.5, v('tg'), v('tg') + 0.5];
    const vals = waccs.map(w => tgs.map(g => U.dcfValue({ fcf0: 100, growth: v('growth') / 100, wacc: w / 100, terminalGrowth: g / 100 })));
    const flat = vals.flat().filter(Boolean).map(x => x.enterpriseValue), lo = Math.min(...flat), hi = Math.max(...flat);
    const tint = x => { const t = hi === lo ? 0.5 : (x - lo) / (hi - lo); return `color-mix(in srgb, var(--accent) ${Math.round(t * 38)}%, color-mix(in srgb, var(--accent2) 14%, transparent))`; };
    $('#sens').innerHTML = '<tr><th>WACC \\ TG</th>' + tgs.map(g => `<th>${g.toFixed(2)}%</th>`).join('') + '</tr>' +
      waccs.map((w, i) => `<tr><th>${w.toFixed(1)}%</th>` + tgs.map((g, j) => {
        const c = vals[i][j];
        return c ? `<td class="${i === 1 && j === 1 ? 'base' : ''}" style="background:${tint(c.enterpriseValue)}">${Math.round(c.enterpriseValue).toLocaleString('en-US')}</td>` : '<td>n/a</td>';
      }).join('') + '</tr>').join('');
  };
  ids.forEach(k => inp[k].addEventListener('input', renderDcf));
  renderDcf();

  /* Quick navigation palette (Cmd/Ctrl+K) */
  const palette = $('#palette'), pInput = $('#paletteInput'), pList = $('#paletteList');
  const go = id => () => { const el = $('#' + id); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };
  const commands = [
    { label: 'Go to About', keywords: 'bio intro', hint: 'Section', run: go('about') },
    { label: 'Go to Experience', keywords: 'timeline jobs education', hint: 'Section', run: go('experience') },
    { label: 'Go to Projects', keywords: 'work notary case studies', hint: 'Section', run: go('projects') },
    { label: 'Try the DCF demo', keywords: 'valuation finance model slider', hint: 'Interactive', run: go('dcf') },
    { label: 'Go to Skills', keywords: 'excel python', hint: 'Section', run: go('skills') },
    { label: 'Go to Contact', keywords: 'email message hire', hint: 'Section', run: go('contact') },
    { label: 'Visit Deb & Kess Notary site', keywords: 'live website', hint: 'External', run: () => window.open('https://debandkessnotary.com', '_blank', 'noopener') },
    { label: 'Book a 15-minute chat', keywords: 'calendly schedule meeting call networking', hint: 'External', run: () => window.open('https://calendly.com/seankessner05', '_blank', 'noopener') },
    { label: 'Open LinkedIn', keywords: 'connect profile', hint: 'External', run: () => window.open('https://www.linkedin.com/in/sean-kessner-8090b9318', '_blank', 'noopener') },
    { label: 'Download résumé (PDF)', keywords: 'cv', hint: 'Download', run: () => { const a = document.createElement('a'); a.href = 'assets/Sean-Kessner-Resume.pdf'; a.download = ''; a.click(); } },
    { label: 'Email Sean', keywords: 'mail contact', hint: 'Action', run: () => { location.href = 'mailto:' + U.OWNER_EMAIL; } },
    { label: 'Toggle light / dark theme', keywords: 'dark mode light', hint: 'Action', run: () => toggle.click() }
  ];
  let shown = commands, sel = 0;
  const drawPalette = () => {
    shown = U.filterCommands(commands, pInput.value); sel = Math.min(sel, Math.max(0, shown.length - 1));
    pList.innerHTML = shown.length ? shown.map((c, i) => `<li role="option" data-i="${i}" class="${i === sel ? 'sel' : ''}" aria-selected="${i === sel}">${esc(c.label)}<small>${esc(c.hint)}</small></li>`).join('') : '<li>No matches</li>';
  };
  const runSel = i => { const c = shown[i]; if (!c) return; palette.close(); c.run(); };
  const openPalette = () => { pInput.value = ''; sel = 0; drawPalette(); palette.showModal(); pInput.focus(); };
  $('#paletteBtn').addEventListener('click', openPalette);
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('#kbdHint').textContent = 'Ctrl K';
  addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : openPalette(); } });
  pInput.addEventListener('input', () => { sel = 0; drawPalette(); });
  pInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); drawPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); drawPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(sel); }
  });
  pList.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) runSel(+li.dataset.i); });
  palette.addEventListener('click', e => { if (e.target === palette) palette.close(); });

  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  $('#year').textContent = new Date().getFullYear();
})();
