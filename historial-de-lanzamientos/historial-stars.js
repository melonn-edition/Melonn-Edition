(function () {
  const container = document.querySelector('.historial-page');
  if (!container) return;

  const bg = document.createElement('div');
  bg.className = 'stars-bg';
  bg.setAttribute('aria-hidden', 'true');

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 350; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    const top      = (Math.random() * 100).toFixed(2);
    const left     = (Math.random() * 100).toFixed(2);
    const isLarge  = Math.random() < 0.40;
    const size     = isLarge
      ? (1.8 + Math.random() * 0.7).toFixed(1)
      : (1.0 + Math.random() * 0.5).toFixed(1);
    const isBlue   = Math.random() > 0.6;
    const delay    = (Math.random() * 6).toFixed(1);
    const duration = (1 + Math.random() * 2).toFixed(1);
    star.style.cssText =
      `top:${top}%;left:${left}%;width:${size}px;height:${size}px;` +
      `animation-delay:-${delay}s;animation-duration:${duration}s` +
      (isBlue ? ';background:rgba(140,200,255,0.7)' : '');
    frag.appendChild(star);
  }

  bg.appendChild(frag);
  container.insertBefore(bg, container.firstChild);
})();
