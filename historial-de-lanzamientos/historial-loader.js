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

  var PAIS_MAP = {
    'both':     'colombia mexico',
    'mx':       'mexico',
    'co':       'colombia',
    'colombia': 'colombia',
    'mexico':   'mexico',
    'méxico':   'mexico'
  };

  function normalizePais(country) {
    var key = (country || '').toLowerCase().trim();
    return PAIS_MAP[key] || key.replace(/méxico/g, 'mexico').replace(/[,;]+\s*/g, ' ').trim() || 'colombia mexico';
  }

  var STATIC_SLUGS = new Set([
    'vista-ordenes-d2c', 'crea-material-empaque', 'api-melonn-v2',
    'empaque-b2b', 'checkout-inteligente', 'visualizador-cargos',
    'trazabilidad-avanzada-b2b', 'sistema-notificaciones-whatsapp',
    'gestion-orden-ingreso-destinatarios-verificados',
    'vas-etiquetado-codigo-barras-qr-b2b', 'orbi-ai',
    'promesas-logisticas', 'tiktok-shop', 'liverpool-melonn',
    'reporte-cargos-orbita', 'comprobante-entrega-orbita', 'prueba-interna'
  ]);

  var SLUG_IMAGES = {
    'vista-ordenes-d2c':                              '../IMAGE/LANZAMIENTOS/CAMBIOS_ORDENES_ORBITA/banner 3.png',
    'crea-material-empaque':                          '../IMAGE/LANZAMIENTOS/CREA_MATERIAL_EMPAQUE/banner 3.png',
    'api-melonn-v2':                                  '../IMAGE/LANZAMIENTOS/API_MELONN_V2/API_banner-landign.png',
    'empaque-b2b':                                    '../IMAGE/LANZAMIENTOS/EMPAQUE_B2B/b2b-2-vas-2.jpg',
    'checkout-inteligente':                           '../IMAGE/LANZAMIENTOS/CHECKOUT_INTELIGENTE/news-BANNER-LANDING-CHECKOUT-INTERNOcuadro.jpg',
    'visualizador-cargos':                            '../IMAGE/LANZAMIENTOS/VISULIZADOR_CARGOS_ORBITA/cargos-factura.png',
    'trazabilidad-avanzada-b2b':                      '../IMAGE/LANZAMIENTOS/TRAZABILIDAD_AVANZADA_B2B/banner-92ss.jpg',
    'sistema-notificaciones-whatsapp':                '../IMAGE/LANZAMIENTOS/SISTEMA_NOTIFICACIONES_WHATSAPP/banner-sistema-notificaciones_banner-landing-sistema-de-notificaciones.jpg',
    'gestion-orden-ingreso-destinatarios-verificados':'../IMAGE/LANZAMIENTOS/GESTION_ORDENES_DESTINO_VERIFICADO/news-Gestion-ordenes-verificadascuadro-1-1.png',
    'vas-etiquetado-codigo-barras-qr-b2b':            '../IMAGE/LANZAMIENTOS/ETQ_CODIGO_BARRASA_QR_B2B/Vas-con-el-vas-final.png',
    'orbi-ai':                                        '../IMAGE/LANZAMIENTOS/ORBI.AI/Portada-Agente-Orbi.jpg',
    'promesas-logisticas':                            '../IMAGE/LANZAMIENTOS/PROMESAS_LOGISTICAS/Portada-Promesas.jpg',
    'tiktok-shop':                                    '../IMAGE/LANZAMIENTOS/TIKTOK_SHOP/Portada-Tiktok-shops.jpg',
    'liverpool-melonn':                               '../IMAGE/LANZAMIENTOS/LIVERPOOL/Portada-Liverpool.jpg',
    'comprobante-entrega-orbita':                     '../IMAGE/LANZAMIENTOS/COMPROBANTE_ENTREGA_DESDE_ORBITA/Evidencia_Entrega_Orbita.png',
    'reporte-cargos-orbita':                          '../IMAGE/LANZAMIENTOS/REPORTE_CARGOS_ORBITA/reporte-cargos-orbita-hero-Melonn-Editions-2.png'
  };

  var PINNED_CARDS = [
    {
      slug: 'reporte-cargos-orbita',
      title: 'Reporte de Cargos en Órbita',
      category: 'Administrativo · Contable · B2B/D2C',
      description: 'Visualiza, filtra y descarga el detalle de tu operación antes de facturar, desde el módulo de Cargos en Órbita.',
      banner_url: null,
      country: 'both',
      launch_type: 'operaciones',
      index_order: 0,
      is_featured: true
    },
    {
      slug: 'comprobante-entrega-orbita',
      title: 'Evidencia de entrega en Órbita',
      category: 'Servicio · B2C / B2B',
      description: 'Consulta o solicita la evidencia de una entrega sin salir del detalle de la orden.',
      banner_url: null,
      country: 'both',
      launch_type: 'b2c',
      index_order: 1,
      is_featured: true
    }
  ];

  function buildCard(launch, i) {
    var pais     = normalizePais(launch.country);
    var CAT_MAP = {
      'b2c': 'b2c', 'b2b': 'b2b',
      'integración': 'integracion', 'integracion': 'integracion',
      'canales de venta': 'canales', 'canales': 'canales',
      'operaciones': 'operaciones',
      'notificaciones': 'notificaciones'
    };
    var category = CAT_MAP[(launch.category || '').toLowerCase()] || (launch.launch_type || '').toLowerCase();
    var featured = launch.is_featured ? ' launch-card--featured' : '';
    var idx      = String(i + 1).padStart(2, '0');
    var slug     = launch.slug || '';
    var href     = STATIC_SLUGS.has(slug)
      ? '../lanzamientos/' + encodeURIComponent(slug) + '.html'
      : '../lanzamientos/ver?slug=' + encodeURIComponent(slug);
    var imgSrc   = launch.banner_url || SLUG_IMAGES[slug] || '';
    var imgHtml  = imgSrc
      ? '<img src="' + esc(imgSrc) + '" alt="" loading="lazy" />'
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

    var supabase = Array.isArray(data) ? data : [];
    var supabaseSlugs = supabase.map(function (d) { return d.slug; });
    var pinned = PINNED_CARDS.filter(function (p) {
      return supabaseSlugs.indexOf(p.slug) === -1;
    });
    var merged = pinned.concat(supabase);

    if (merged.length === 0) return;

    // Eliminar cards estáticas
    grid.querySelectorAll('.launch-card').forEach(function (c) { c.remove(); });

    // Insertar cards dinámicas + pinned antes del mensaje de vacío
    emptyEl.insertAdjacentHTML('beforebegin', merged.map(buildCard).join(''));

    // Re-inicializar filtros / búsqueda / paginación
    if (window.__historialBoot) window.__historialBoot();
  })
  .catch(function () {
    clearTimeout(fallbackTimer);
    // fallback: las cards estáticas ya están renderizadas
  });
})();
