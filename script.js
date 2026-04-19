// script.js — Melonn Edition

// --- Supabase: datos dinámicos ---
(async function () {
  try {
  const SUPABASE_URL = 'https://vbizdvysjuhhdxpwhmgz.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_68fyA5MzemogWPRgCNkcaQ_-aiLgA_V'
  const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

  // Ecosystem logos
  const grid = document.getElementById('ecosystem-grid')
  if (grid) {
    const { data: logos } = await db
      .from('ecosystem_logos')
      .select('name, logo_url')
      .eq('is_visible', true)
      .order('order_index')
    if (logos && logos.length > 0) {
      grid.innerHTML = logos.map(l =>
        `<div class="ecosystem__logo-item"><img src="${l.logo_url}" alt="${l.name}" loading="lazy" /></div>`
      ).join('')
    }
  }

  // Upcoming items
  const pipeline = document.getElementById('upcoming-pipeline')
  if (pipeline) {
    const { data: items } = await db
      .from('upcoming_items')
      .select('title, description')
      .eq('is_visible', true)
      .order('order_index')
    if (items && items.length > 0) {
      const stepClasses = ['upcoming__step--1', 'upcoming__step--2', 'upcoming__step--3', 'upcoming__step--4', 'upcoming__step--5']
      pipeline.innerHTML = items.map((item, i) => `
        <div class="upcoming__step ${stepClasses[i] || ''}">
          <div class="upcoming__connector">
            <span class="upcoming__num">${String(i + 1).padStart(2, '0')}</span>
            <div class="upcoming__node"></div>
          </div>
          <div class="upcoming__card">
            <h3 class="upcoming__card-title">${item.title}</h3>
            <p class="upcoming__card-text">${item.description || ''}</p>
          </div>
        </div>`
      ).join('')
    }
  }
  } catch (e) { console.warn('Supabase load error:', e) }
})()

// --- Ecosystem comet ---
(function () {
  const section = document.querySelector('.ecosystem');
  const head = document.querySelector('.ecosystem__comet-head');
  const tail = document.querySelector('.ecosystem__comet-tail');
  if (!section || !head || !tail) return;

  function move(e) {
    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    head.style.transform = `translate(${x}px, ${y}px)`;
    tail.style.transform = `translate(${x}px, ${y}px)`;
    head.style.opacity = '1';
    tail.style.opacity = '1';
  }

  function leave() {
    head.style.opacity = '0';
    tail.style.opacity = '0';
  }

  section.addEventListener('mousemove', move, { passive: true });
  section.addEventListener('mouseleave', leave, { passive: true });
})();

(function () {
  const canvas = document.getElementById('hero-canvas');
  const hero = canvas.closest('.hero');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  const COUNT_SMALL = 110;
  const COUNT_LARGE = 50;
  const COUNT_ACCENT = 50;
  const COUNT_GRAY = 50;
  const COUNT_GRAY2 = 0;
  const INFLUENCE_RADIUS = 180;   // px — zona de influencia del cursor
  const PUSH_STRENGTH = 0.06;    // cuánto se desvían (muy bajo = sobrio)
  const RETURN_EASE = 0.032;      // velocidad de regreso a reposo
  const VELOCITY_DAMP = 0.78;     // amortiguación de la velocidad

  let W, H, dpr;
  let mouse = { x: -9999, y: -9999 };
  let particles = [];


  // --- Resize ---
  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    initParticles();
  }

  // --- Partículas ---
  function initParticles() {
    particles = [];
    if (W > 768) {
      for (let i = 0; i < COUNT_SMALL; i++) {
        const ox = Math.random() * W;
        const oy = Math.random() * H;
        particles.push({
          ox, oy, x: ox, y: oy, vx: 0, vy: 0,
          r: Math.random() * 0.8 + 0.6,
          alpha: 0.85,
          color: 'white',
        });
      }
    }
    for (let i = 0; i < COUNT_LARGE; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      particles.push({
        ox, oy, x: ox, y: oy, vx: 0, vy: 0,
        r: Math.random() * 1.6 + 1.2,
        alpha: Math.random() * 0.10 + 0.06,
        color: 'white',
      });
    }
    for (let i = 0; i < COUNT_ACCENT; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      particles.push({
        ox, oy, x: ox, y: oy, vx: 0, vy: 0,
        r: Math.random() * 1.0 + 0.8,
        alpha: Math.random() * 0.25 + 0.55,
        color: 'accent',
      });
    }
    for (let i = 0; i < COUNT_GRAY; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      particles.push({
        ox, oy, x: ox, y: oy, vx: 0, vy: 0,
        r: Math.random() * 2.0 + 2.0,
        alpha: Math.random() * 0.20 + 0.25,
        color: 'gray',
      });
    }
    for (let i = 0; i < COUNT_GRAY2; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      particles.push({
        ox, oy, x: ox, y: oy, vx: 0, vy: 0,
        r: Math.random() * 1.4 + 1.0,        // radio 1–2.4 px
        alpha: Math.random() * 0.20 + 0.30,  // opacidad 30–50%
        color: 'gray',
      });
    }
  }

  // --- Loop ---
  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perturbación suave si el cursor está cerca
      if (dist < INFLUENCE_RADIUS && dist > 0) {
        const force = (1 - dist / INFLUENCE_RADIUS) * PUSH_STRENGTH;
        // Repulsión leve: aleja la partícula del cursor
        p.vx -= dx * force;
        p.vy -= dy * force;
      }

      // Fuerza de retorno al punto de reposo (spring)
      p.vx += (p.ox - p.x) * RETURN_EASE;
      p.vy += (p.oy - p.y) * RETURN_EASE;

      // Amortiguación
      p.vx *= VELOCITY_DAMP;
      p.vy *= VELOCITY_DAMP;

      p.x += p.vx;
      p.y += p.vy;

      // Dibujar
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color === 'accent'
        ? `rgba(96, 78, 233, ${p.alpha})`
        : p.color === 'gray'
          ? `rgba(136, 136, 153, ${p.alpha})`
          : `rgba(245, 245, 245, ${p.alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  // --- Eventos de mouse (solo dentro del hero) ---
  function onMouseMove(e) {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  // --- Launches carousel ---
  (function () {
    const track = document.getElementById('launches-track');
    const btnPrev = document.getElementById('launches-prev');
    const btnNext = document.getElementById('launches-next');
    if (!track || !btnPrev || !btnNext) return;

    const cards = track.querySelectorAll('.launch-card');
    const GAP = 20;
    let index = 0;

    function cardWidth() {
      return cards[0].getBoundingClientRect().width + GAP;
    }

    function maxIndex() {
      const viewportW = track.parentElement.getBoundingClientRect().width;
      const totalW = cards.length * cardWidth() - GAP;
      return Math.max(0, Math.ceil((totalW - viewportW) / cardWidth()));
    }

    function update() {
      track.style.transform = `translateX(-${index * cardWidth()}px)`;
      btnPrev.disabled = index === 0;
      btnNext.disabled = index >= maxIndex();
    }

    btnPrev.addEventListener('click', () => { if (index > 0) { index--; update(); } });
    btnNext.addEventListener('click', () => { if (index < maxIndex()) { index++; update(); } });
    window.addEventListener('resize', () => { index = Math.min(index, maxIndex()); update(); });

    const viewport = track.parentElement;
    let hoverInterval = null;
    let hoverZone = null;

    function clearHover() {
      if (hoverInterval) { clearInterval(hoverInterval); hoverInterval = null; }
    }

    viewport.addEventListener('mousemove', (e) => {
      const rect = viewport.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const zone = ratio > 0.75 ? 'right' : ratio < 0.25 ? 'left' : null;

      if (zone === hoverZone) return;
      hoverZone = zone;
      clearHover();

      if (zone === 'right' && index < maxIndex()) {
        index++; update();
        hoverInterval = setInterval(() => {
          if (index < maxIndex()) { index++; update(); } else { clearHover(); }
        }, 900);
      } else if (zone === 'left' && index > 0) {
        index--; update();
        hoverInterval = setInterval(() => {
          if (index > 0) { index--; update(); } else { clearHover(); }
        }, 900);
      }
    });

    viewport.addEventListener('mouseleave', () => { clearHover(); hoverZone = null; });

    // Touch swipe
    let touchStartX = 0;
    let touchStartY = 0;
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0 && index < maxIndex()) { index++; update(); }
      else if (dx > 0 && index > 0) { index--; update(); }
    }, { passive: true });

    update();
  })();

  // --- Init ---
  resize();
  hero.addEventListener('mousemove', onMouseMove, { passive: true });
  hero.addEventListener('mouseleave', onMouseLeave, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  tick();
})();

// --- Stars background ---
(function () {
  const targets = [
    { el: document.querySelector('.launches'),               count: 225, launches: true },
    { el: document.querySelector('.grandes-logros'),         count: 200, upper: true },
    { el: document.querySelector('.lanzamientos-destacados'), count: 120 },
    { el: document.querySelector('.ecosystem'),              count: 180 },
    { el: document.querySelector('.upcoming'),               count: 360 },
    { el: document.querySelector('.footer'),                 count: 169 }
  ];

  function createStars(container, count, launches, upper) {
    if (!container) return;
    const bg = document.createElement('div');
    bg.className = 'stars-bg';
    bg.setAttribute('aria-hidden', 'true');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      let top;
      if (launches) {
        top = Math.random() < 0.5 ? Math.random() * 22 : 78 + Math.random() * 22;
      } else if (upper) {
        top = Math.random() < 0.75
          ? Math.random() * 45
          : 45 + Math.random() * 55;
      } else {
        const inLower = Math.random() < 0.70;
        top = inLower ? 55 + Math.random() * 45 : 20 + Math.random() * 35;
      }
      const left = Math.random() * 100;
      const isLarge = Math.random() < 0.40;
      const size = isLarge
        ? (1.8 + Math.random() * 0.7).toFixed(1)
        : (1.0 + Math.random() * 0.5).toFixed(1);
      const isBlue = Math.random() > 0.6;
      const delay = (Math.random() * 6).toFixed(1);
      const duration = (1 + Math.random() * 2).toFixed(1);
      star.style.cssText = `top:${top}%;left:${left}%;width:${size}px;height:${size}px;animation-delay:-${delay}s;animation-duration:${duration}s${isBlue ? ';background:rgba(140,200,255,0.7)' : ''}`;
      frag.appendChild(star);
    }
    bg.appendChild(frag);
    container.insertBefore(bg, container.firstChild);
  }

  targets.forEach(({ el, count, launches, upper }) => createStars(el, count, launches, upper));
})();

// --- Scroll limpio sin hash ---
(function () {
  document.querySelectorAll('[data-scroll]').forEach(function (el) {
    function activate() {
      var target = document.getElementById(el.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    el.addEventListener('click', activate);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
})();

// --- Upcoming scroll reveal ---
(function () {
  const targets = document.querySelectorAll('.upcoming__header, .upcoming__step, .launches__header, .launch-card, .launches__footer');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => observer.observe(el));
})();
