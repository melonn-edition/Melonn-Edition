/* ─── wave grid vertex ──────────────────────────────────────────────────── */

export const waveVertex = /* glsl */`
attribute vec2  aOffset;
attribute float aBlinkIntensity;

uniform sampler2D uTrail;
uniform int       uTrailCount;
uniform float     uAmplitude;
uniform float     uSpacingX;
uniform float     uSpacingY;
uniform float     uSigmaCells;
uniform float     uModuleHalfD;

varying float vHeight;
varying float vShadow;
varying vec3  vWorldPos;
varying float vBlinkIntensity;

void main() {
  vec3  transformed = position;

  /* only front-face vertices (+Z half of box) receive elevation */
  float isFront = step(0.001, position.z);

  float contrib = 0.0;
  for (int i = 0; i < 64; i++) {
    if (i >= uTrailCount) break;

    vec4 pt = texture2D(uTrail, vec2((float(i) + 0.5) / 64.0, 0.5));

    /* distance in cell units — uniform circular radius regardless of aspect */
    vec2  cellDelta = vec2(
      (aOffset.x - pt.x) / uSpacingX,
      (aOffset.y - pt.y) / uSpacingY
    );
    float dCells    = length(cellDelta);
    float gauss     = exp(-(dCells * dCells) / (2.0 * uSigmaCells * uSigmaCells));
    float decay     = 1.0 - smoothstep(0.0, 1.0, pt.z);   /* pt.z = age_norm 0→1 */
    float influence = gauss * decay * pt.w;                 /* pt.w = intensity */

    /* max() prevents saturation when multiple trail points overlap */
    contrib = max(contrib, influence);
  }

  float waveZ    = clamp(contrib, 0.0, 1.0) * uAmplitude;
  transformed.z += waveZ * isFront;
  vHeight        = waveZ / uAmplitude;   /* 0→1 for fragment color ramp */
  vShadow        = contrib;              /* localized shadow approx */

  /* world position: identity model matrix + instance XY offset + depth lift */
  vec4 wp4  = modelMatrix * vec4(transformed, 1.0);
  wp4.x    += aOffset.x;
  wp4.y    += aOffset.y;
  wp4.z    += uModuleHalfD;   /* back face at z=0, front face at z=moduleD */
  vWorldPos   = wp4.xyz;

  vBlinkIntensity = aBlinkIntensity;
  gl_Position = projectionMatrix * viewMatrix * wp4;
}
`;

/* ─── wave grid fragment ─────────────────────────────────────────────────── */

export const waveFragment = /* glsl */`
uniform vec3  uLightDir;

varying float vHeight;
varying float vShadow;
varying vec3  vWorldPos;
varying float vBlinkIntensity;

void main() {
  /* flat per-fragment normal from screen-space derivatives */
  vec3 dx = dFdx(vWorldPos);
  vec3 dy = dFdy(vWorldPos);
  vec3 N  = normalize(cross(dx, dy));
  N = faceforward(N, normalize(vWorldPos - cameraPosition), N);

  /* 3-stop height gradient */
  vec3 cA = vec3(0.976, 0.976, 0.990);   /* near-white resting — reduced ~50% contrast vs bg */
  vec3 cB = vec3(0.862, 0.966, 0.964);   /* barely cyan — ~12% toward #00DCD6 */
  vec3 cC = vec3(0.441, 0.916, 0.905);   /* clearly cyan — ~55% toward #00DCD6 */
  vec3 cD = vec3(0.0,   0.863, 0.839);   /* #00DCD6 — Cian Melonn peak */

  vec3 col;
  if (vHeight < 0.55) {
    col = mix(cA, cB, smoothstep(0.00, 0.55, vHeight));
  } else if (vHeight < 0.90) {
    col = mix(cB, cC, smoothstep(0.55, 0.90, vHeight));
  } else {
    col = mix(cC, cD, smoothstep(0.90, 1.00, vHeight));
  }

  /* lighting — high ambient, low diffuse, near-zero specular */
  vec3  L    = normalize(uLightDir);
  float diff = max(dot(N, L), 0.0) * 0.20;
  float amb  = 0.84;
  vec3  V    = normalize(cameraPosition - vWorldPos);
  float spec = pow(max(dot(normalize(L + V), N), 0.0), 32.0) * 0.025;
  vec3  lit  = col * (amb + diff) + vec3(spec);

  /* localized ambient shadow under raised modules */
  float shadowStr = vShadow * (1.0 - vHeight) * 0.07;
  lit *= (1.0 - shadowStr);

  /* cyan blink — subtle signal at 15% max intensity */
  lit = mix(lit, vec3(0.0, 0.863, 0.839), vBlinkIntensity * 0.10);

  gl_FragColor = vec4(lit, 1.0);
}
`;

/* ─── vignette post-pass ─────────────────────────────────────────────────── */

export const vignetteVertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const vignetteFragment = /* glsl */`
uniform sampler2D tDiffuse;
uniform float     uStrength;
varying vec2 vUv;

void main() {
  vec4  color = texture2D(tDiffuse, vUv);
  vec2  uv    = vUv - 0.5;
  float vign  = 1.0 - smoothstep(0.28, 0.88, length(uv) * 1.5);
  vign = mix(1.0, vign, uStrength);
  gl_FragColor = vec4(color.rgb * vign, color.a);
}
`;

/* ─── chromatic aberration post-pass ─────────────────────────────────────── */

export const caVertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const caFragment = /* glsl */`
uniform sampler2D tDiffuse;
uniform vec2      uResolution;
varying vec2 vUv;

void main() {
  vec2 pixel  = 1.0 / uResolution;
  vec2 dir    = normalize(vec2(1.0, 1.0));
  vec2 offset = dir * pixel * 0.5;   /* max 1 px total across R–B */

  float r = texture2D(tDiffuse, vUv + offset).r;
  float g = texture2D(tDiffuse, vUv).g;
  float b = texture2D(tDiffuse, vUv - offset).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;
