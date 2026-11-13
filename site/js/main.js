/* Construmac — interações (sem dependências) */
(() => {
  'use strict';

  const WHATSAPP = '5513997582104';
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  $('#ano').textContent = new Date().getFullYear();

  /* ---------- header: fundo ao rolar, esconde ao descer ---------- */
  const header = $('.header');
  const fab = $('.fab');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-stuck', y > 40);
    const hide = y > 700 && y > lastY && !root.classList.contains('menu-open');
    header.classList.toggle('is-hidden', hide);
    fab.classList.toggle('is-on', y > innerHeight * 0.6);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menu mobile ---------- */
  const burger = $('.burger');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) header.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  matchMedia('(min-width: 1081px)').addEventListener('change', (e) => e.matches && setMenu(false));

  /* ---------- reveal com escalonamento entre irmãos ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    revealIO.observe(el);
  });

  /* ---------- contadores ---------- */
  const fmt = new Intl.NumberFormat('pt-BR');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target;
      const end = +el.dataset.count;
      const plain = el.hasAttribute('data-plain');
      const start = plain ? end - 30 : 0;
      if (reduced) return;
      const t0 = performance.now();
      const dur = 1600;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const v = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 4)));
        el.textContent = plain ? v : fmt.format(v);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- manifesto: palavras acendem conforme a rolagem ---------- */
  const manifesto = $('#manifesto');
  if (manifesto) {
    const HL = /^(história|futuro\.?|Construmac,?|realização)$/i;
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.setAttribute('aria-label', manifesto.textContent.trim());
    manifesto.innerHTML = words
      .map((w) => `<span class="w${HL.test(w) ? ' hl' : ''}" aria-hidden="true">${w}</span>`)
      .join(' ');
    const spans = $$('.w', manifesto);
    const paint = () => {
      const r = manifesto.getBoundingClientRect();
      const p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.15);
      const n = Math.round(Math.max(0, Math.min(1, p)) * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    if (reduced) spans.forEach((s) => s.classList.add('on'));
    else { addEventListener('scroll', paint, { passive: true }); addEventListener('resize', paint); paint(); }
  }

  /* ---------- parallax suave no hero ---------- */
  const archImg = $('.arch img');
  if (archImg && !reduced) {
    addEventListener('scroll', () => {
      if (scrollY < innerHeight * 1.2) archImg.style.setProperty('--py', `${scrollY * -0.06}px`);
    }, { passive: true });
  }

  /* ---------- filtros ---------- */
  const chips = $$('.chip');
  const cards = $$('#grade .card');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    const apply = () => cards.forEach((card) => {
      const cat = card.dataset.cat;
      card.hidden = !(f === 'todos' || cat === f || cat === 'cta');
      card.classList.add('is-in');
    });
    if (document.startViewTransition && !reduced) document.startViewTransition(apply); else apply();
  }));

  /* ---------- modal de empreendimento ---------- */
  const modal = $('#modal');
  const icon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('dormit')) return 'i-bed';
    if (l.includes('vaga')) return 'i-car';
    if (l.includes('gás')) return 'i-flame';
    if (l.includes('água')) return 'i-drop';
    return 'i-check';
  };
  const openModal = (card) => {
    const d = card.dataset;
    const imgs = d.gallery.split(',').map((f) => `assets/img/${f}`);
    const main = $('#m-img');
    const setImg = (src, i) => {
      main.src = src;
      main.alt = `${d.name} — foto ${i + 1}`;
      $$('#m-thumbs button').forEach((b, j) => b.classList.toggle('is-on', j === i));
    };
    $('#m-thumbs').innerHTML = imgs.length > 1
      ? imgs.map((src, i) => `<button type="button" aria-label="Foto ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('')
      : '';
    $$('#m-thumbs button').forEach((b, i) => b.addEventListener('click', () => setImg(imgs[i], i)));
    setImg(imgs[0], 0);
    $('#m-status').textContent = d.status;
    $('#m-title').textContent = d.name;
    $('#m-place').textContent = d.place;
    $('#m-desc').textContent = d.desc;
    $('#m-specs').innerHTML = d.specs.split('|')
      .map((s) => `<li><svg aria-hidden="true"><use href="#${icon(s)}"/></svg>${s}</li>`).join('');
    const sold = card.dataset.cat === 'vendido';
    const waBtn = $('#m-wa');
    waBtn.href = wa(sold
      ? `Olá! Vi o ${d.name} no site e quero conhecer os imóveis disponíveis da Construmac.`
      : `Olá! Tenho interesse no ${d.name}. Pode me passar mais informações?`);
    waBtn.lastChild.textContent = sold ? 'Ver disponíveis' : 'Tenho interesse';
    const map = $('#m-map');
    map.hidden = !d.map;
    if (d.map) map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.map)}`;
    modal.showModal();
  };
  cards.forEach((card) => {
    const btn = $('.card__btn', card);
    if (btn) btn.addEventListener('click', () => openModal(card));
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) modal.close();
  });

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('#form-contato');
  const note = $('#form-msg');
  const tel = $('#f-tel');
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length > 6
      ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
      : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const fone = tel.value.replace(/\D/g, '');
    const bad = [[form.nome, nome.length < 2], [tel, fone.length < 10]];
    bad.forEach(([el, isBad]) => el.closest('.field').classList.toggle('is-bad', isBad));
    const first = bad.find(([, b]) => b);
    if (first) {
      note.textContent = 'Confira seu nome e telefone com DDD para continuar.';
      note.classList.add('is-bad');
      first[0].focus();
      return;
    }
    const msg = form.msg.value.trim();
    const text = [
      `Olá! Meu nome é ${nome}.`,
      `Tenho interesse em: ${form.interesse.value}.`,
      `Meu telefone: ${tel.value}.`,
      msg && `Mensagem: ${msg}`,
    ].filter(Boolean).join('\n');
    note.classList.remove('is-bad');
    note.textContent = 'Abrindo o WhatsApp com a sua mensagem…';
    window.open(wa(text), '_blank', 'noopener');
  });

  /* ---------- mapa sob demanda ---------- */
  const mapFrame = $('.map iframe');
  if (mapFrame) {
    new IntersectionObserver((entries, io) => {
      if (!entries[0].isIntersecting) return;
      mapFrame.src = mapFrame.dataset.src;
      io.disconnect();
    }, { rootMargin: '400px' }).observe(mapFrame);
  }
})();
