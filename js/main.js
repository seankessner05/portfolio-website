(function () {
  const U = window.Utils;
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = root.classList.contains('calm');
  const osReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* Split headline into letters for a staggered entrance */
  (function () {
    const h1 = $('h1'); if (!h1) return;
    const label = h1.textContent.trim().replace(/\s+/g, ' ');
    h1.setAttribute('aria-label', label);
    let i = 0;
    const wrap = (node, grad) => {
      const chars = [...node.textContent];
      const frag = document.createDocumentFragment();
      chars.forEach((c, k) => {
        if (/\s/.test(c)) { frag.appendChild(document.createTextNode(c)); return; }
        const sp = document.createElement('span'); sp.className = 'ch'; sp.setAttribute('aria-hidden', 'true');
        sp.style.setProperty('--i', i++); if (grad) sp.style.setProperty('--p', chars.length > 1 ? k / (chars.length - 1) : 0);
        sp.textContent = c; frag.appendChild(sp);
      });
      node.replaceWith(frag);
    };
    [...h1.childNodes].forEach(n => { if (n.nodeType === 3) wrap(n, false); else if (n.tagName === 'EM') [...n.childNodes].forEach(c => c.nodeType === 3 && wrap(c, true)); });
  })();

  /* Motion toggle: lets visitors override the OS setting (stored per browser) */
  const motionBtn = $('#motionBtn');
  motionBtn.setAttribute('aria-pressed', String(!reduced));
  motionBtn.title = reduced ? 'Animations are off. Click to turn them on.' : 'Animations are on. Click to turn them off.';
  motionBtn.addEventListener('click', () => {
    try { localStorage.setItem('motion', reduced ? 'on' : 'off'); } catch (e) {}
    location.reload();
  });

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
    if (!reduced) {
      root.style.setProperty('--sy', Math.min(scrollY, 1200));
      root.style.setProperty('--hp', Math.min(1, scrollY / (innerHeight * 0.8)).toFixed(3));
      const tl = $('.timeline');
      if (tl) { const r = tl.getBoundingClientRect(); root.style.setProperty('--tl', Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height)).toFixed(3)); }
    }
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
  const fx = ['up', 'zoom', 'left', 'right'];
  $$('.reveal').forEach((el, i) => {
    el.style.setProperty('--d', (i % 4) * 0.08 + 's');
    if (el.matches('.timeline > li')) el.dataset.fx = i % 2 ? 'right' : 'left';
    else if (el.matches('.card, .stat')) el.dataset.fx = 'zoom';
    else if (el.matches('h1, .portrait')) { /* custom entrances */ }
    else el.dataset.fx = fx[i % 2];
    io.observe(el);
  });

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

  /* Portrait tilt */
  const photo = $('.portrait .photo');
  if (photo && matchMedia('(pointer: fine)').matches && !reduced) {
    const box = photo.parentElement;
    box.addEventListener('pointermove', e => {
      const r = box.getBoundingClientRect();
      photo.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
      photo.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
    });
    box.addEventListener('pointerleave', () => { photo.style.setProperty('--rx', '0deg'); photo.style.setProperty('--ry', '0deg'); });
  }

  /* Ripple on buttons */
  $$('.btn').forEach(b => b.addEventListener('pointerdown', e => {
    if (reduced) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const sp = document.createElement('span'); sp.className = 'ripple';
    sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(sp); setTimeout(() => sp.remove(), 800);
  }));

  /* Trailing cursor ring (fine pointers, motion on) */
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    const ring = document.createElement('div'); ring.className = 'cursor-ring'; document.body.appendChild(ring);
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; ring.classList.add('on'); ring.classList.toggle('big', !!e.target.closest('a, button, .card, .filter, input, textarea')); }, { passive: true });
    document.addEventListener('pointerleave', () => ring.classList.remove('on'));
    (function follow() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; ring.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(follow); })();
  }

  /* Interactive particle network in the hero */
  (function () {
    const cv = $('#net'); if (!cv) return;
    const ctx = cv.getContext('2d'); let w = 0, h = 0, dpr = 1, pts = [], mouse = { x: -999, y: -999 }, running = false, c1 = '#d9560b', c2 = '#5b21b6';
    const hero = cv.parentElement;
    const colors = () => { const cs = getComputedStyle(root); c1 = cs.getPropertyValue('--accent').trim(); c2 = cs.getPropertyValue('--accent2').trim(); };
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); w = hero.clientWidth; h = hero.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(95, Math.round((w * h) / 13000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, r: 1.4 + Math.random() * 1.8, k: Math.random() < .5 }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 150 * 150) { const f = (1 - Math.sqrt(d2) / 150) * 1.6; p.vx += (dx / (Math.sqrt(d2) + 1)) * f * .15; p.vy += (dy / (Math.sqrt(d2) + 1)) * f * .15; }
        p.vx *= .985; p.vy *= .985;
        p.x += p.vx + (Math.random() - .5) * .04; p.y += p.vy + (Math.random() - .5) * .04;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 120 * 120) { ctx.globalAlpha = (1 - Math.sqrt(d) / 120) * .35; ctx.strokeStyle = a.k ? c1 : c2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
        if (md < 170 * 170) { ctx.globalAlpha = (1 - Math.sqrt(md) / 170) * .7; ctx.strokeStyle = c1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.globalAlpha = .85; ctx.fillStyle = a.k ? c1 : c2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(frame);
    };
    colors(); size();
    addEventListener('resize', size);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    toggle.addEventListener('click', () => setTimeout(colors, 30));
    if (reduced) { frame(); return; }
    new IntersectionObserver(es => { const vis = es[0].isIntersecting; if (vis && !running) { running = true; requestAnimationFrame(frame); } else if (!vis) running = false; }).observe(hero);
  })();

  /* DCF demo plays itself once when it scrolls into view */
  const dcfEl = $('#dcf');
  if (dcfEl && !reduced) {
    new IntersectionObserver((es, ob) => {
      if (!es[0].isIntersecting) return; ob.disconnect();
      const end = { growth: 8, wacc: 10, tg: 2 }, from = { growth: 0, wacc: 14, tg: 0 }, t0 = performance.now(), dur = 2200;
      (function step(now) {
        const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
        ids.forEach(k => { inp[k].value = (from[k] + (end[k] - from[k]) * e).toFixed(2); });
        renderDcf();
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.4 }).observe(dcfEl);
  }

  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  $('#year').textContent = new Date().getFullYear();
})();
