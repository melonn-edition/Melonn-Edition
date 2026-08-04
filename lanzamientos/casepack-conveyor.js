// Source: experiments/melonn-wave-grid/conveyor-experiment-v2.js
// Integration: lanzamientos/casepack-transition-test.html hero
// No modificar los archivos originales. Todos los cambios de parámetros
// deben realizarse únicamente en este archivo.

const DEBUG_PATH = false;

const IMG_W = 5338;
const IMG_H = 9971;

const PATH =
  'M 1538,-400 ' +
  'L 1538,7846 ' +
  'C 1538,8491 2076,9014 2739,9014 ' +
  'C 3402,9014 3941,8491 3941,7846 ' +
  'L 3941,2531 ' +
  'C 3941,2344 3978,2161 4051,1990 ' +
  'C 4121,1824 4222,1675 4350,1548 ' +
  'C 4478,1420 4627,1319 4793,1249 ' +
  'C 4965,1177 5148,1140 5337,1140 ' +
  'H 6000';

const PATH_LEN = 20200;

const SPEED    = 1900;
const DURATION = PATH_LEN / SPEED;

const TYPES = [
  { src: '../experiments/melonn-wave-grid/Caja_Pequeña.webp', fallback: '../experiments/melonn-wave-grid/Caja_Pequeña.png', w: 864,  h: 721 },
  { src: '../experiments/melonn-wave-grid/Caja_Mediana.webp', fallback: '../experiments/melonn-wave-grid/Caja_Mediana.png', w: 648,  h: 571 },
  { src: '../experiments/melonn-wave-grid/Caja_Grande.webp',  fallback: '../experiments/melonn-wave-grid/Caja_Grande.png',  w: 1080, h: 800 },
];

const GAP_WIDE   = 1960;
const GAP_NORMAL = 1400;
const GAP_TIGHT  = 1050;
const SEQUENCE = [
  [0, GAP_TIGHT ],  // P  T
  [2, GAP_WIDE  ],  // G  W
  [0, GAP_TIGHT ],  // P  T
  [1, GAP_WIDE  ],  // M  W
  [2, GAP_WIDE  ],  // G  W  ← mandatory after box 4
  [1, GAP_TIGHT ],  // M  T
  [0, GAP_NORMAL],  // P  N
  [1, GAP_NORMAL],  // M  N
  [0, GAP_NORMAL],  // P  N
  [2, GAP_WIDE  ],  // G  W  ← mandatory after box 9
  [0, GAP_NORMAL],  // P  N
  [2, GAP_WIDE  ],  // G  W
  [1, GAP_TIGHT ],  // M  T
  [2, GAP_WIDE  ],  // G  W
  [1, GAP_TIGHT ],  // M  T
  [0, GAP_NORMAL],  // P  N
  [1, GAP_NORMAL],  // M  N
];

const TILTS = [0.8, -0.7, 1.0, -0.9, 0.6, -1.0, 0.7, -0.8, 0.9];

const OFFSET_ROTATE = '0deg';

const CENTER  =   0;
const G_RIGHT =  50;  // cajas grandes zig-zag: alternando CENTER / G_RIGHT

const LANE_OFFSETS = [
  CENTER,   // box 01  P
  CENTER,   // box 02  G  ← quieta
  CENTER,   // box 03  P
  CENTER,   // box 04  M
  G_RIGHT,  // box 05  G  ← 50px derecha
  CENTER,   // box 06  M
  CENTER,   // box 07  P
  CENTER,   // box 08  M
  CENTER,   // box 09  P
  CENTER,   // box 10  G  ← quieta
  CENTER,   // box 11  P
  G_RIGHT,  // box 12  G  ← 50px derecha
  CENTER,   // box 13  M
  CENTER,   // box 14  G  ← quieta
  CENTER,   // box 15  M
  CENTER,   // box 16  P
  CENTER,   // box 17  M
];

const DEBUG_MARKERS = [
  [1538, 7846],
  [1538, 8491],
  [2076, 9014],
  [2739, 9014],
  [3402, 9014],
  [3941, 8491],
  [3941, 7846],
  [3941, 2531],
  [3941, 2344],
  [3978, 2161],
  [4051, 1990],
  [4793, 1249],
  [5337, 1140],
  [6000, 1140],
];

export function initConveyor() {
  const layer = document.getElementById('conveyor-layer');
  if (!layer) return () => {};

  const inner = document.createElement('div');
  inner.style.cssText =
    `position:absolute;top:0;left:0;width:${IMG_W}px;height:${IMG_H}px;` +
    'transform-origin:top left;pointer-events:none;will-change:transform';

  const belt = document.createElement('img');
  belt.src = '../experiments/melonn-wave-grid/Banda.webp';
  belt.onerror = () => { belt.src = '../experiments/melonn-wave-grid/Banda.png'; };
  belt.alt = '';
  belt.draggable = false;
  belt.style.cssText =
    `position:absolute;top:0;left:0;width:${IMG_W}px;height:${IMG_H}px;display:block`;
  inner.appendChild(belt);

  if (DEBUG_PATH) {
    const debugSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    debugSvg.setAttribute('viewBox', `0 0 ${IMG_W} ${IMG_H}`);
    debugSvg.style.cssText =
      `position:absolute;top:0;left:0;width:${IMG_W}px;height:${IMG_H}px;pointer-events:none`;

    const debugLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    debugLine.setAttribute('d', PATH);
    debugLine.setAttribute('fill', 'none');
    debugLine.setAttribute('stroke', '#00DCD6');
    debugLine.setAttribute('stroke-width', '20');
    debugLine.setAttribute('opacity', '0.85');
    debugSvg.appendChild(debugLine);

    DEBUG_MARKERS.forEach(([cx, cy]) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', '40');
      c.setAttribute('fill', '#FF4040');
      c.setAttribute('opacity', '0.75');
      debugSvg.appendChild(c);
    });

    inner.appendChild(debugSvg);
  }

  if (!document.getElementById('conveyor-kf')) {
    const s = document.createElement('style');
    s.id = 'conveyor-kf';
    s.textContent =
      '@keyframes belt-move{from{offset-distance:0%}to{offset-distance:100%}}' +
      '@media(prefers-reduced-motion:reduce){.cbox{animation-play-state:paused!important}}';
    document.head.appendChild(s);
  }

  let cursor = 0;
  const boxes = SEQUENCE.map(([ti, gap], i) => {
    cursor += gap;
    const def = TYPES[ti];
    const phase = cursor / PATH_LEN;
    cursor += def.w;

    const xOff = LANE_OFFSETS[i];
    const tilt  = TILTS[i % TILTS.length];

    const wrapper = document.createElement('div');
    wrapper.className = 'cbox';
    wrapper.style.cssText =
      `position:absolute;top:0;left:0;width:${def.w}px;height:${def.h}px;` +
      'transform-origin:center center;' +
      `offset-path:path('${PATH}');` +
      `offset-rotate:${OFFSET_ROTATE};` +
      `animation:belt-move ${DURATION.toFixed(3)}s linear infinite;` +
      `animation-delay:-${(phase * DURATION).toFixed(3)}s`;

    const lane = document.createElement('div');
    lane.className = 'cbox-lane-offset';
    lane.style.cssText =
      `width:${def.w}px;height:${def.h}px;` +
      'transform-origin:center center;' +
      `transform:translateX(${xOff}px)`;

    const el = document.createElement('img');
    el.src = def.src;
    el.onerror = () => { el.src = def.fallback; };
    el.alt = '';
    el.draggable = false;
    el.className = 'cbox-image';
    el.style.cssText =
      `width:${def.w}px;height:${def.h}px;display:block;` +
      'transform-origin:center center;' +
      `transform:rotate(${tilt}deg)`;

    lane.appendChild(el);
    wrapper.appendChild(lane);
    inner.appendChild(wrapper);
    return wrapper;
  });

  layer.appendChild(inner);

  function applyScale() {
    inner.style.transform = `scale(${layer.offsetWidth / IMG_W})`;
  }
  applyScale();
  const ro = new ResizeObserver(applyScale);
  ro.observe(layer);

  function onVisibility() {
    const state = document.hidden ? 'paused' : 'running';
    boxes.forEach(b => { b.style.animationPlayState = state; });
  }
  document.addEventListener('visibilitychange', onVisibility);

  return function destroy() {
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (inner.parentElement) inner.parentElement.removeChild(inner);
    document.getElementById('conveyor-kf')?.remove();
  };
}
