(function () {
  var SUPABASE_URL = 'https://vbizdvysjuhhdxpwhmgz.supabase.co';
  var ANON_KEY = 'sb_publishable_68fyA5MzemogWPRgCNkcaQ_-aiLgA_V';
  var TIMEOUT_MS = 3000;

  var grid = document.getElementById('historial-grid');
  var emptyEl = document.getElementById('historial-empty');
  if (!grid || !emptyEl) return;

  var booted = false;

  var fallbackTimer = setTimeout(function () {
    booted = true; // static cards already rendered — nothing to do
  }, TIMEOUT_MS);

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function normalizePais(country) {
    return (country || '')
      .toLowerCase()
      .replace(/méxico/g, 'mexico')
      .replace(/[,;]+\s*/g, ' ')
      .trim() || 'colombia mexico';
  }

  function buildCard(launch, i) {
    var pais     = normalizePais(launch.country);
    var category = (launch.launch_type || '').toLowerCase();
    var featured = launch.is_featured ? ' launch-card--featured' : '';
    var idx      = String(launch.index_order || i + 1).padStart(2, '0');
    var href     = '../lanzamientos/' + (launch.slug || '') + '.html';
    var imgHtml  = launch.banner_url
      ? '<img src="' + esc(launch.banner_url) + '" alt="" loading="lazy" />'
      : '';

    return '<article class="launch-card' + featured + '" data-category="' + esc(category) + '" data-pais="' + esc(pais) + '">'
      + '<a href="' + esc(href) + '" class="launch-card__image-link">'
      + '<figure class="launch-card__image">' + imgHtml + '<span class="launch-card__index">' + esc(idx) + '</span></figure>'
      + '</a>'
      + '<div class="launch-card__body">'
      + '<h3 class="launch-card__name">' + esc(launch.title) + '</h3>'
      + '<p class="launch-card__category">' + esc(launch.category) + '</p>'
      + '<p class="launch-card__benefit">' + esc(launch.description) + '</p>'
      + '</div>'
      + '<a href="' + esc(href) + '" class="launch-card__cta">Ver lanzamiento &#8594;</a>'
      + '</article>';
  }

  fetch(
    SUPABASE_URL + '/rest/v1/launches?is_published=eq.true&order=index_order.asc'
    + '&select=title,slug,category,description,banner_url,country,launch_type,index_order,is_featured',
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY
      }
    }
  )
  .then(function (r) { return r.json(); })
  .then(function (data) {
    clearTimeout(fallbackTimer);
    if (booted) return;
    booted = true;

    if (!Array.isArray(data) || data.length === 0) return;

    // Eliminar cards estáticas
    grid.querySelectorAll('.launch-card').forEach(function (c) { c.remove(); });

    // Insertar cards dinámicas antes del mensaje de vacío
    emptyEl.insertAdjacentHTML('beforebegin', data.map(buildCard).join(''));

    // Re-inicializar filtros / búsqueda / paginación
    if (window.__historialBoot) window.__historialBoot();
  })
  .catch(function () {
    clearTimeout(fallbackTimer);
    // fallback: las cards estáticas ya están renderizadas
  });
})();
