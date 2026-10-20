/*
 * Smaller Waterfall, adapted from mrange's ShaderToy shader NXjGRy.
 * https://www.shadertoy.com/view/NXjGRy (accessed 2026-09-20)
 * Original shader: CC0 1.0 Universal (Public Domain Dedication).
 * https://creativecommons.org/publicdomain/zero/1.0/
 * mrange waived copyright and related/neighboring rights where possible.
 *
 * Port: WebGL 2, explicit initialization, defined smoothstep bounds and safe
 * tone mapping. Original hues and motion are retained, with brightness reduced for hero
 * copy; the existing scrims provide additional contrast. No textures or external runtime required.
 */

const vertexSource = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentSource = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
out vec4 color;

void main() {
  float z = 0.0;
  float T = 0.025 * time + 9.0; // Quarter of the original playback speed.
  float d = T;
  vec2 r = resolution;
  vec2 P = (2.0 * gl_FragCoord.xy - r) / r.x;
  vec2 Y = vec2(0.005, 1.0);
  vec4 U = vec4(0.0, 1.0, 2.0, 4.0);
  vec4 O = vec4(0.0);
  vec4 ray = normalize(vec4(P, 2.0, 0.0));

  for (int step = 0; step < 38; ++step) {
    if (d <= 0.0001) break;
    O = z * ray - U.xwyx / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }

  vec2 C = vec2(O.x, atan(O.z, O.y));
  P = U.zy * P - r / r.x * U.xy;
  O = vec4(4.0, 16.0, 99.0, 0.0) / (1000.0 * dot(P, P) + 6.0);
  z = 0.0005;
  // Evaluate derivatives outside the loop, as in the source shader.
  r = vec2(max(length(fwidth(C)), 0.000001));
  for (int layer = 1; layer < 9; ++layer) {
    float j = float(layer);
    float i = fract(sin(dot(vec2(j, round(C.x / Y.x)), 7.0 + U.xw) * 73.0));
    P = C - (T + T * i) * U.xy;
    P -= round(P / Y) * Y;
    vec4 o = 1.0 + sin(T + 7.0 * fract(8663.0 * i) + U);
    vec2 distanceToTrail = vec2(length(max(P, -U.yx)), length(P) - z) - z;
    vec2 coverage = 1.0 - smoothstep(-r, r, distanceToTrail);
    O += dot(coverage, vec2(exp(19.0 * P.y), 3.0)) * o * o.w;
    C.x += Y.x / 8.0;
  }
  const float HERO_BRIGHTNESS = 0.4;
  color = vec4(HERO_BRIGHTNESS * sqrt(max(tanh(O.rgb - 0.02 * U.zwy), vec3(0.0))), 1.0);
}
`;

function initHeroVisual() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false,
  });
  if (!gl) return; // The CSS hero background remains available.

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const MAX_PIXELS = 1500000;
  const FRAME_INTERVAL = 1000 / 30;
  let program, buffer, timeLocation, resolutionLocation;
  let raf = 0, lastFrame = null, elapsed = 0;
  let visible = true, suspended = false, ready = false;

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(result);
      gl.deleteShader(result);
      throw new Error(message);
    }
    return result;
  }

  function setup() {
    let vertex, fragment;
    try {
      vertex = shader(gl.VERTEX_SHADER, vertexSource);
      fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      }
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      timeLocation = gl.getUniformLocation(program, 'time');
      resolutionLocation = gl.getUniformLocation(program, 'resolution');
      ready = true;
      canvas.style.opacity = '';
    } catch (error) {
      ready = false;
      canvas.style.opacity = '0';
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      console.warn('Smaller Waterfall could not initialize:', error.message);
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  function draw() {
    if (!ready || gl.isContextLost()) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, motion.matches ? 0 : elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const scale = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(MAX_PIXELS / (width * height)));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    draw();
  }

  function tick(now) {
    raf = 0;
    if (lastFrame === null) lastFrame = now;
    if (now - lastFrame >= FRAME_INTERVAL) {
      elapsed += Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      draw();
    }
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = null;
    if (!ready || suspended || document.hidden || !visible || gl.isContextLost()) return;
    draw();
    if (!motion.matches) raf = requestAnimationFrame(tick);
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    ready = false;
    sync();
  });
  canvas.addEventListener('webglcontextrestored', () => { setup(); resize(); sync(); });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { suspended = true; sync(); });
  window.addEventListener('pageshow', () => { suspended = false; sync(); });
  // The canvas scrolls away with the hero; stop drawing once it is off screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio > 0;
    sync();
  }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  setup();
  resize();
  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroVisual, { once: true });
} else {
  initHeroVisual();
}
