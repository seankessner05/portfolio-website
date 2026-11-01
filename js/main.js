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
  const phrases = ['financial modeling', 'valuation & equity research', 'building with AI', 'markets & the global economy', 'Division III football'];
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
      stack: 'Netlify, GitHub, Proof.com, Calendly, AI-assisted development'
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
      <h4>Tools</h4><p>${esc(d.stack)}</p>`;
    dialog.showModal();
  };
  $$('.project').forEach(card => {
    const open = () => openCase(card.dataset.case);
    card.addEventListener('click', open);
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

  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  $('#year').textContent = new Date().getFullYear();
})();
