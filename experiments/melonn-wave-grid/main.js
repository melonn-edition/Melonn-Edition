import * as THREE from 'three';
import { buildComposer } from './postprocessing.js';
import { waveVertex, waveFragment } from './shaders.js';

// ─── CONFIG ────────────────────────────────────────────────────────────────

const VIEW_H = 10.0;

const CONFIG = {
  tiers: {
    desktop_high: { cols: 52, rows: 24, maxTrailPts: 40 },
    desktop_std:  { cols: 52, rows: 24, maxTrailPts: 32 },
    tablet:       { cols: 38, rows: 20, maxTrailPts: 24 },
    mobile:       { cols: 24, rows: 16, maxTrailPts: 14 },
  },
  trailCapacity: 64,    // must match loop bound in waveVertex shader
  moduleGap:     0.90,
  moduleD:       0.04,
  sigmaCells:    2.0,
  waveMaxAge:    1.6,
  minTrailDist:  0.12,
  sampleMaxHz:   35,
  maxPixelRatio: 2.0,
};

// ─── FACTORY ───────────────────────────────────────────────────────────────

export function createWaveGrid(canvasEl, { container = null } = {}) {
  const ptrContainer  = container || document.body;
  const isEmbedded    = ptrContainer !== document.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse      = matchMedia('(pointer: coarse)').matches;

  // ─── STATE ───────────────────────────────────────────────────────────────

  let renderer, camera, scene, composer, caPass;
  let gridMesh, gridMat, trailTex;
  let spacingX, spacingY, amplitude;

  const trail       = [];
  let   lastPos     = null;
  let   lastSampleT = 0;
  let   prevTime    = 0;
  let   animId      = null;
  let   currentTier;
  let   ptrMoveHandler  = null;
  let   cursorMoveHandler = null;
  let   cursorHideHandler = null;

  let blinkAttr    = null;
  let blinkStates  = [];
  let blinkExtCols = 0;
  let blinkTarget  = 0.04;
  let blinkTargetT = 0;

  let cursorDot   = null;
  let cursorRing  = null;
  let cursorReady = false;

  // ─── UTILITIES ───────────────────────────────────────────────────────────

  function detectTier() {
    const w = window.innerWidth;
    if (w >= 1400) return 'desktop_high';
    if (w >= 900)  return 'desktop_std';
    if (w >= 480)  return 'tablet';
    return 'mobile';
  }

  function pointerToWorld(clientX, clientY) {
    const rect = canvasEl.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width)  *  2 - 1;
    const ndcY = ((clientY - rect.top)  / rect.height) * -2 + 1;
    return new THREE.Vector2(ndcX * camera.right, ndcY * camera.top);
  }

  // ─── GRID CONSTRUCTION ───────────────────────────────────────────────────

  function buildGrid(cam) {
    const tier = detectTier();
    currentTier = tier;
    const { cols, rows } = CONFIG.tiers[tier];

    const visW = cam.right - cam.left;
    const visH = VIEW_H;

    spacingX  = visW / (cols - 1);
    spacingY  = visH / (rows - 1);
    amplitude = Math.min(spacingX, spacingY) * 0.8;

    const moduleW = spacingX * CONFIG.moduleGap;
    const moduleH = spacingY * CONFIG.moduleGap;

    const baseGeo = new THREE.BoxGeometry(moduleW, moduleH, CONFIG.moduleD);
    const geo     = new THREE.InstancedBufferGeometry();
    geo.copy(baseGeo);
    baseGeo.dispose();

    const extCols = cols + 2;
    const extRows = rows + 2;
    const count   = extCols * extRows;
    const offsets = new Float32Array(count * 2);
    const blinks  = new Float32Array(count);
    let   idx     = 0;
    for (let r = -1; r <= rows; r++) {
      for (let c = -1; c <= cols; c++) {
        offsets[idx++] = cam.left   + c * spacingX;
        offsets[idx++] = cam.bottom + r * spacingY;
      }
    }
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 2));
    blinkAttr = new THREE.InstancedBufferAttribute(blinks, 1);
    geo.setAttribute('aBlinkIntensity', blinkAttr);
    geo.instanceCount = count;

    initBlinkStates(count, extCols);

    return geo;
  }

  // ─── SHADER MATERIAL ─────────────────────────────────────────────────────

  function buildMaterial() {
    const data = new Float32Array(CONFIG.trailCapacity * 4);
    trailTex = new THREE.DataTexture(
      data,
      CONFIG.trailCapacity,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    trailTex.minFilter       = THREE.NearestFilter;
    trailTex.magFilter       = THREE.NearestFilter;
    trailTex.wrapS           = THREE.ClampToEdgeWrapping;
    trailTex.wrapT           = THREE.ClampToEdgeWrapping;
    trailTex.generateMipmaps = false;

    return new THREE.ShaderMaterial({
      vertexShader:   waveVertex,
      fragmentShader: waveFragment,
      uniforms: {
        uTrail:       { value: trailTex },
        uTrailCount:  { value: 0 },
        uAmplitude:   { value: amplitude },
        uSpacingX:    { value: spacingX },
        uSpacingY:    { value: spacingY },
        uSigmaCells:  { value: CONFIG.sigmaCells },
        uModuleHalfD: { value: CONFIG.moduleD / 2 },
        uLightDir:    { value: new THREE.Vector3(0.5, 2.5, 1.5).normalize() },
      },
    });
  }

  // ─── TRAIL ───────────────────────────────────────────────────────────────

  function pushPoint(wx, wy, intensity) {
    const maxActive = CONFIG.tiers[currentTier || detectTier()].maxTrailPts;
    if (trail.length >= maxActive) trail.shift();
    trail.push({ x: wx, y: wy, age: 0, intensity });
  }

  function ageTrail(dt) {
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age += dt;
      if (trail[i].age > CONFIG.waveMaxAge) trail.splice(i, 1);
    }
  }

  function writeTrailTexture() {
    const data  = trailTex.image.data;
    const count = trail.length;

    for (let i = 0; i < count; i++) {
      const pt   = trail[i];
      const base = i * 4;
      data[base + 0] = pt.x;
      data[base + 1] = pt.y;
      data[base + 2] = pt.age / CONFIG.waveMaxAge;
      data[base + 3] = pt.intensity;
    }
    for (let i = count; i < CONFIG.trailCapacity; i++) {
      const base = i * 4;
      data[base] = data[base+1] = data[base+2] = data[base+3] = 0;
    }

    gridMat.uniforms.uTrailCount.value = count;
    trailTex.needsUpdate = true;
  }

  // ─── BLINK SYSTEM ────────────────────────────────────────────────────────

  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function initBlinkStates(count, extCols) {
    blinkExtCols = extCols;
    blinkStates  = Array.from({ length: count }, () => ({
      opacity:  0,
      phase:    'idle',
      elapsed:  0,
      fadeDur:  0,
      holdDur:  0,
      cooldown: Math.random() * 3,
    }));
    blinkTarget  = rand(0.03, 0.06);
    blinkTargetT = rand(3, 7);
  }

  function hasActiveNeighbor(idx) {
    const extRows = Math.ceil(blinkStates.length / blinkExtCols);
    const col     = idx % blinkExtCols;
    const row     = Math.floor(idx / blinkExtCols);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr < 0 || nr >= extRows || nc < 0 || nc >= blinkExtCols) continue;
        const ni = nr * blinkExtCols + nc;
        if (blinkStates[ni].phase !== 'idle') return true;
      }
    }
    return false;
  }

  function activateCandidates(needed) {
    const pool = [];
    for (let i = 0; i < blinkStates.length; i++) {
      const s = blinkStates[i];
      if (s.phase === 'idle' && s.cooldown <= 0) pool.push(i);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let activated = 0;
    for (let i = 0; i < pool.length && activated < needed; i++) {
      const idx = pool[i];
      if (!hasActiveNeighbor(idx)) {
        const s   = blinkStates[idx];
        s.phase   = 'in';
        s.elapsed = 0;
        s.fadeDur = rand(0.50, 0.80);
        s.opacity = 0;
        activated++;
      }
    }
  }

  function tickBlink(dt) {
    if (!blinkAttr) return;

    const count = blinkStates.length;
    let activeCount = 0;

    for (let i = 0; i < count; i++) {
      const s = blinkStates[i];
      switch (s.phase) {
        case 'in':
          s.elapsed += dt;
          s.opacity  = Math.min(1, s.elapsed / s.fadeDur);
          if (s.elapsed >= s.fadeDur) {
            s.phase   = 'hold';
            s.elapsed = 0;
            s.holdDur = rand(0.15, 0.30);
          }
          activeCount++;
          break;
        case 'hold':
          s.elapsed += dt;
          if (s.elapsed >= s.holdDur) {
            s.phase   = 'out';
            s.elapsed = 0;
            s.fadeDur = rand(0.70, 1.10);
          }
          activeCount++;
          break;
        case 'out':
          s.elapsed += dt;
          s.opacity  = Math.max(0, 1 - s.elapsed / s.fadeDur);
          if (s.elapsed >= s.fadeDur) {
            s.opacity  = 0;
            s.phase    = 'idle';
            s.cooldown = rand(1.5, 4.0);
          }
          break;
        case 'idle':
          if (s.cooldown > 0) s.cooldown -= dt;
          break;
      }
    }

    blinkTargetT -= dt;
    if (blinkTargetT <= 0) {
      blinkTarget  = rand(0.03, 0.06);
      blinkTargetT = rand(3, 7);
    }

    const targetCount = Math.round(blinkTarget * count);
    if (activeCount < targetCount) activateCandidates(targetCount - activeCount);

    const arr = blinkAttr.array;
    for (let i = 0; i < count; i++) arr[i] = blinkStates[i].opacity;
    blinkAttr.needsUpdate = true;
  }

  // ─── INPUT ───────────────────────────────────────────────────────────────

  function onPointerMove(clientX, clientY) {
    const now = performance.now();
    if (now - lastSampleT < 1000 / CONFIG.sampleMaxHz) return;

    const wp   = pointerToWorld(clientX, clientY);
    const dist = lastPos ? wp.distanceTo(lastPos) : Infinity;
    if (dist < CONFIG.minTrailDist) return;

    const elapsed   = Math.max((now - lastSampleT) / 1000, 0.001);
    const speed     = dist / elapsed;
    const intensity = Math.min(1.0, speed / 8.0);

    const MAX_STEP = CONFIG.minTrailDist * 3;
    if (lastPos && dist > MAX_STEP) {
      const steps = Math.min(Math.floor(dist / MAX_STEP), 8);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        pushPoint(
          lastPos.x + (wp.x - lastPos.x) * t,
          lastPos.y + (wp.y - lastPos.y) * t,
          intensity * (1.0 - t * 0.3),
        );
      }
    }

    pushPoint(wp.x, wp.y, intensity);
    lastPos     = wp.clone();
    lastSampleT = now;
  }

  // ─── RESIZE ──────────────────────────────────────────────────────────────

  function onResize() {
    const w      = window.innerWidth;
    const h      = window.innerHeight;
    const aspect = w / h;

    camera.left   = -VIEW_H * aspect / 2;
    camera.right  =  VIEW_H * aspect / 2;
    camera.top    =  VIEW_H / 2;
    camera.bottom = -VIEW_H / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    composer.setSize(w, h);
    if (caPass) caPass.uniforms.uResolution.value.set(w, h);

    scene.remove(gridMesh);
    gridMesh.geometry.dispose();

    const geo = buildGrid(camera);

    gridMat.uniforms.uSpacingX.value    = spacingX;
    gridMat.uniforms.uSpacingY.value    = spacingY;
    gridMat.uniforms.uAmplitude.value   = amplitude;
    gridMat.uniforms.uModuleHalfD.value = CONFIG.moduleD / 2;

    gridMesh = new THREE.Mesh(geo, gridMat);
    gridMesh.frustumCulled = false;
    scene.add(gridMesh);

    if (reducedMotion) composer.render();
  }

  // ─── CURSOR ──────────────────────────────────────────────────────────────

  function setupCursor() {
    if (isCoarse || reducedMotion) return;

    cursorDot  = document.createElement('div');
    cursorRing = document.createElement('div');
    cursorDot.setAttribute('aria-hidden', 'true');
    cursorRing.setAttribute('aria-hidden', 'true');

    // Embedded: position:absolute confined to hero; fullPage: position:fixed
    const pos = isEmbedded ? 'absolute' : 'fixed';
    Object.assign(cursorDot.style, {
      position: pos, top: '0', left: '0',
      width: '6px', height: '6px',
      background: '#00DCD6', borderRadius: '50%',
      pointerEvents: 'none', zIndex: '200', opacity: '0',
      willChange: 'transform', transition: 'opacity 0.2s ease',
    });
    Object.assign(cursorRing.style, {
      position: pos, top: '0', left: '0',
      width: '28px', height: '28px',
      border: '1.5px solid #00DCD6', borderRadius: '50%',
      boxShadow: '0 0 10px rgba(0,220,214,0.18)',
      pointerEvents: 'none', zIndex: '200', opacity: '0',
      willChange: 'transform', transition: 'transform 0.12s ease-out, opacity 0.2s ease',
    });

    // Inject into hero for embedded, body for fullPage
    const parent = isEmbedded ? ptrContainer : document.body;
    parent.appendChild(cursorDot);
    parent.appendChild(cursorRing);

    cursorMoveHandler = e => {
      // Embedded: coords relative to container (hero = position:fixed;inset:0 = same as viewport)
      const rect = isEmbedded ? ptrContainer.getBoundingClientRect() : { left: 0, top: 0 };
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!cursorReady) {
        cursorRing.style.transition = 'none';
        cursorRing.style.transform  = `translate(${x - 14}px,${y - 14}px)`;
        cursorRing.offsetWidth;      // force reflow before re-enabling transition
        cursorRing.style.transition = '';
        cursorDot.style.transform   = `translate(${x - 3}px,${y - 3}px)`;
        cursorDot.style.opacity     = '1';
        cursorRing.style.opacity    = '1';
        cursorReady = true;
      } else {
        cursorDot.style.transform  = `translate(${x - 3}px,${y - 3}px)`;
        cursorRing.style.transform = `translate(${x - 14}px,${y - 14}px)`;
      }
    };

    cursorHideHandler = () => {
      if (cursorDot)  cursorDot.style.opacity  = '0';
      if (cursorRing) cursorRing.style.opacity = '0';
      cursorReady = false;
    };

    ptrContainer.addEventListener('pointermove',  cursorMoveHandler, { passive: true });
    if (isEmbedded) {
      ptrContainer.addEventListener('pointerleave', cursorHideHandler);
    } else {
      document.addEventListener('pointerleave', cursorHideHandler);
    }
  }

  // ─── INIT ────────────────────────────────────────────────────────────────

  function init() {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 required');
    } catch (_) {
      canvasEl.style.display = 'none';
      if (!isEmbedded) document.body.classList.add('webgl-fallback');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace    = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F8FC);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      -VIEW_H * aspect / 2,
       VIEW_H * aspect / 2,
       VIEW_H / 2,
      -VIEW_H / 2,
      0.1, 100
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const geo = buildGrid(camera);
    gridMat   = buildMaterial();
    gridMesh  = new THREE.Mesh(geo, gridMat);
    gridMesh.frustumCulled = false;
    scene.add(gridMesh);

    const built = buildComposer(renderer, scene, camera, window.innerWidth, window.innerHeight);
    composer    = built.composer;
    caPass      = built.caPass;

    ptrMoveHandler = e => {
      if (reducedMotion) return;
      onPointerMove(e.clientX, e.clientY);
    };
    ptrContainer.addEventListener('pointermove', ptrMoveHandler, { passive: true });
    window.addEventListener('resize', onResize);

    setupCursor();

    if (reducedMotion) composer.render();
    // RAF not auto-started — caller must call start()
  }

  // ─── ANIMATION LOOP ──────────────────────────────────────────────────────

  function tick(timestamp) {
    animId = requestAnimationFrame(tick);

    if (document.hidden) {
      prevTime = timestamp;   // prevent dt spike on resume
      return;
    }

    const dt = Math.min((timestamp - prevTime) / 1000, 0.1);
    prevTime = timestamp;

    ageTrail(dt);
    writeTrailTexture();
    tickBlink(dt);
    composer.render();
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────

  function start() {
    if (animId || reducedMotion || !renderer) return;
    prevTime = performance.now();
    animId   = requestAnimationFrame(tick);
  }

  function pause() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    // Hide cursor so it doesn't persist at last position when hero is hidden
    if (cursorDot)  { cursorDot.style.opacity  = '0'; }
    if (cursorRing) { cursorRing.style.opacity = '0'; }
    cursorReady = false;
  }

  function resize() { onResize(); }

  function destroy() {
    pause();
    window.removeEventListener('resize', onResize);
    if (ptrMoveHandler)    ptrContainer.removeEventListener('pointermove', ptrMoveHandler);
    if (cursorMoveHandler) ptrContainer.removeEventListener('pointermove', cursorMoveHandler);
    if (cursorHideHandler) {
      if (isEmbedded) ptrContainer.removeEventListener('pointerleave', cursorHideHandler);
      else            document.removeEventListener('pointerleave', cursorHideHandler);
    }
    if (gridMesh)  { scene.remove(gridMesh); gridMesh.geometry.dispose(); }
    if (gridMat)   gridMat.dispose();
    if (trailTex)  trailTex.dispose();
    if (renderer)  renderer.dispose();
    if (cursorDot  && cursorDot.parentElement)  cursorDot.parentElement.removeChild(cursorDot);
    if (cursorRing && cursorRing.parentElement) cursorRing.parentElement.removeChild(cursorRing);
  }

  init();
  return { start, pause, resize, destroy };
}
