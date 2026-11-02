(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Topbar: sólida após o hero, esconde ao descer e volta ao subir */
  const bar = $('#topbar');
  const wa = $('#wa');
  const hero = $('.hero');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const pastHero = y > hero.offsetHeight - 80;
    bar.classList.toggle('is-solid', y > 40);
    bar.classList.toggle('is-hidden', y > lastY && y > 400 && !menu.classList.contains('is-open'));
    wa.classList.toggle('is-on', y > window.innerHeight * 0.6);
    lastY = y;
    updateSteps();
  };

  /* Menu mobile */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) menu.hidden = false;
    requestAnimationFrame(() => menu.classList.toggle('is-open', open));
    document.body.style.overflow = open ? 'hidden' : '';
    bar.classList.toggle('is-solid', open || scrollY > 40);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Revelar elementos ao rolar */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-anim]:not(.hero [data-anim]), .reveal-img').forEach(el => io.observe(el));

  /* Link ativo no menu */
  const links = $$('.nav a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => navIO.observe(s));

  /* Linha de progresso das etapas */
  const steps = $('#steps');
  function updateSteps() {
    if (!steps) return;
    const r = steps.getBoundingClientRect();
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
    steps.style.setProperty('--p', p.toFixed(3));
  }

  /* Contadores */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* Serviços: lista que troca a imagem */
  const rows = $$('.svc__row');
  const imgs = $$('.svc__img');
  const label = $('#svcLabel');
  let front = 0;
  const activate = (row, i) => {
    if (row.classList.contains('is-active')) {
      if (matchMedia('(max-width: 960px)').matches) { row.classList.remove('is-active'); row.setAttribute('aria-expanded', 'false'); }
      return;
    }
    rows.forEach(r => { r.classList.remove('is-active'); r.setAttribute('aria-expanded', 'false'); });
    row.classList.add('is-active');
    row.setAttribute('aria-expanded', 'true');
    const back = 1 - front;
    imgs[back].src = row.dataset.img;
    imgs[back].classList.add('is-on');
    imgs[front].classList.remove('is-on');
    front = back;
    label.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(rows.length).padStart(2, '0');
  };
  rows.forEach((row, i) => {
    row.addEventListener('click', () => activate(row, i));
    row.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover) and (min-width: 961px)').matches && !row.classList.contains('is-active')) activate(row, i); });
  });
  rows.forEach(r => { const im = new Image(); im.src = r.dataset.img; });

  /* Formulário -> WhatsApp */
  const form = $('#form');
  const tel = $('#f-tel');
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    tel.value = v;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#formErr');
    const nome = form.nome.value.trim();
    const fone = form.tel.value.replace(/\D/g, '');
    $$('.field', form).forEach(f => f.classList.remove('has-error'));
    if (!nome) { form.nome.parentElement.classList.add('has-error'); err.textContent = 'Informe seu nome.'; form.nome.focus(); return; }
    if (fone.length < 10) { form.tel.parentElement.classList.add('has-error'); err.textContent = 'Informe um telefone com DDD.'; form.tel.focus(); return; }
    err.textContent = '';
    const tipo = (form.querySelector('input[name="tipo"]:checked') || {}).value;
    const msg = form.msg.value.trim();
    const text = [
      `Olá! Meu nome é ${nome}.`,
      tipo ? `Tenho interesse em uma obra ${tipo.toLowerCase()}.` : 'Gostaria de um orçamento.',
      msg && `\n${msg}`,
      `\nTelefone: ${form.tel.value}`
    ].filter(Boolean).join(' ');
    window.open('https://wa.me/5521995012717?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  $('#year').textContent = new Date().getFullYear();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', updateSteps);
  onScroll();
})();
