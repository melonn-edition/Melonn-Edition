import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { vignetteVertex, vignetteFragment, caVertex, caFragment } from './shaders.js';

export function buildComposer(renderer, scene, camera, w, h) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  /* chromatic aberration — max 1px shift, update uResolution on resize */
  const caPass = new ShaderPass({
    uniforms: {
      tDiffuse:    { value: null },
      uResolution: { value: new THREE.Vector2(w, h) },
    },
    vertexShader:   caVertex,
    fragmentShader: caFragment,
  });
  composer.addPass(caPass);

  /* vignette — subtle, strength 0.07 */
  const vigPass = new ShaderPass({
    uniforms: {
      tDiffuse:  { value: null },
      uStrength: { value: 0.07 },
    },
    vertexShader:   vignetteVertex,
    fragmentShader: vignetteFragment,
  });
  composer.addPass(vigPass);

  return { composer, caPass };
}
