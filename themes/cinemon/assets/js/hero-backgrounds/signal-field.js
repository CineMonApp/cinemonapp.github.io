/*
 * Hero background: a slow-drifting "signal field" — a grid of points
 * undulating like a waveform monitor trace, rendered with Three.js.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  attribute float aSeed;
  varying float vGlow;

  void main() {
    vec3 p = position;

    // Layered travelling waves — the "signal"
    float w1 = sin(p.x * 0.55 + uTime * 0.6) * 0.45;
    float w2 = sin(p.x * 1.7 - uTime * 0.35 + p.z * 0.8) * 0.18;
    float w3 = sin(p.z * 0.9 + uTime * 0.5 + aSeed * 6.2831) * 0.22;
    p.y += w1 + w2 + w3;

    // Gentle pointer parallax
    p.x += uPointer.x * 0.35;
    p.y += uPointer.y * 0.2;

    vGlow = smoothstep(-0.6, 0.9, w1 + w3);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.6 + vGlow * 2.2) * (14.0 / -mv.z);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, d);
    vec3 color = mix(uColorA, uColorB, vGlow);
    gl_FragColor = vec4(color, alpha * (0.25 + vGlow * 0.55));
  }
`;

function initHeroVisual() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return; // no WebGL — the CSS gradient backdrop stands on its own
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 1.4, 7.5);
  camera.lookAt(0, 0, 0);

  // Point grid
  const COLS = 160;
  const ROWS = 44;
  const positions = new Float32Array(COLS * ROWS * 3);
  const seeds = new Float32Array(COLS * ROWS);
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      positions[i * 3] = (c / (COLS - 1) - 0.5) * 22; // x
      positions[i * 3 + 1] = 0; // y (displaced in shader)
      positions[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * 9; // z
      seeds[i] = Math.random();
      i++;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: { x: 0, y: 0 } },
    uColorA: { value: new Color("#3d3591") },
    uColorB: { value: new Color("#a299ff") },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.rotation.x = -0.28;
  scene.add(points);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  function resize() {
    const { clientWidth, clientHeight } = canvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Only animate while the hero is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  let raf = null;
  const start = performance.now();

  function frame(now) {
    raf = null;
    if (visible) {
      uniforms.uTime.value = (now - start) / 1000;
      // Ease the pointer for a floaty feel
      uniforms.uPointer.value.x += (pointer.x - uniforms.uPointer.value.x) * 0.04;
      uniforms.uPointer.value.y += (pointer.y - uniforms.uPointer.value.y) * 0.04;
      renderer.render(scene, camera);
    }
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    uniforms.uTime.value = 8; // render one pleasing static frame
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!reduceMotion && !raf) {
      raf = requestAnimationFrame(frame);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroVisual);
} else {
  initHeroVisual();
}
