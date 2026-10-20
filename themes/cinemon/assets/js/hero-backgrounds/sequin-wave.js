/*
 * Hero background: "Sequin Wave" — thousands of tiny reflective discs
 * catching cascading light, re-paletted from copper/gold to CineMon's
 * violet family.
 *
 * Adapted from Radiant Shaders (https://radiant-shaders.com, MIT license,
 * Paul Bakaus). Plain WebGL, no dependencies.
 */

const VERT = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG = `
precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform float u_waveSpeed;
uniform float u_sparkle;
uniform vec2 u_mouse;

#define TAU 6.28318530718
#define SQRT3 1.7320508

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n * 47.0));
}

// Hexagonal tiling: xy = local coords within cell, zw = cell ID
vec4 hexTile(vec2 p, float scale) {
  p *= scale;
  vec2 s = vec2(1.0, SQRT3);
  vec2 halfS = s * 0.5;

  vec2 aBase = floor(p / s);
  vec2 aLocal = mod(p, s) - halfS;

  vec2 pOff = p - halfS;
  vec2 bBase = floor(pOff / s);
  vec2 bLocal = mod(pOff, s) - halfS;

  float dA = dot(aLocal, aLocal);
  float dB = dot(bLocal, bLocal);

  float pick = step(dA, dB);
  vec2 localCoord = mix(bLocal, aLocal, pick);
  vec2 cellId = mix(bBase + vec2(0.5), aBase, pick);

  return vec4(localCoord, cellId);
}

// Wave field: multiple interfering wave sources
float waveField(vec2 cellPos, float t) {
  float w = 0.0;
  w += sin(dot(cellPos, vec2(0.7, 0.5)) * 3.5 - t * 2.8) * 0.35;
  w += sin(cellPos.x * 4.2 + t * 1.9) * 0.25;
  float r1 = length(cellPos - vec2(-0.3, 0.2));
  w += sin(r1 * 6.0 - t * 3.2) * 0.2 * smoothstep(1.2, 0.0, r1);
  w += sin(dot(cellPos, vec2(-0.4, 0.8)) * 2.8 - t * 1.5) * 0.2;
  float r2 = length(cellPos - vec2(0.4, -0.3));
  w += sin(r2 * 5.0 - t * 2.4) * 0.15 * smoothstep(1.0, 0.0, r2);
  return w;
}

// Specular for a tilted sequin disc
float sequinSpecular(float tiltAngle, float tiltDir) {
  float ct = cos(tiltAngle);
  float st = sin(tiltAngle);
  float cd = cos(tiltDir);
  float sd = sin(tiltDir);

  vec3 N = vec3(st * cd, st * sd, ct);
  vec3 L = normalize(vec3(0.4, 0.6, 0.9));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 R = reflect(-L, N);

  float spec = max(dot(R, V), 0.0);
  spec = pow(spec, 48.0);
  float sheen = pow(max(dot(R, V), 0.0), 8.0) * 0.15;

  return spec + sheen;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * u_waveSpeed;

  float sequinScale = 38.0;
  vec4 hex = hexTile(uv, sequinScale);
  vec2 localPos = hex.xy;
  vec2 cellId = hex.zw;

  vec2 rnd = hash22(cellId);
  float sizeVar = 0.85 + rnd.x * 0.3;
  float baseTilt = (rnd.y - 0.5) * 0.15;
  float reflVar = 0.7 + rnd.x * 0.3;
  float phaseOff = rnd.y * TAU;

  float discRadius = 0.42 * sizeVar;
  float dist = length(localPos);
  float disc = smoothstep(discRadius, discRadius - 0.06, dist);

  float bevel = smoothstep(discRadius, discRadius - 0.04, dist)
              - smoothstep(discRadius - 0.04, discRadius - 0.08, dist);

  vec2 worldPos = cellId / sequinScale;

  float wave = waveField(worldPos, t);
  float shimmer = sin(t * 3.0 + phaseOff) * 0.04;
  float tiltAngle = wave * 0.85 + baseTilt + shimmer;

  float waveH = waveField(worldPos + vec2(0.01, 0.0), t);
  float waveV = waveField(worldPos + vec2(0.0, 0.01), t);
  float tiltDir = atan(waveV - wave, waveH - wave);

  // Mouse light source: extra specular from cursor
  float mouseSpec = 0.0;
  if (u_mouse.x > 0.0) {
    vec2 mUV = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
    float mDist = length(worldPos - mUV);
    float mInfluence = exp(-mDist * mDist * 6.0);
    vec3 mLightDir = normalize(vec3(mUV.x - worldPos.x, mUV.y - worldPos.y, 0.5));
    float ct = cos(tiltAngle);
    float st2 = sin(tiltAngle);
    float cd = cos(tiltDir);
    float sd = sin(tiltDir);
    vec3 mN = vec3(st2 * cd, st2 * sd, ct);
    vec3 mR = reflect(-mLightDir, mN);
    float mS = pow(max(dot(mR, vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
    mouseSpec = mS * mInfluence * 1.5;
  }

  float spec = sequinSpecular(tiltAngle, tiltDir);
  spec *= reflVar * u_sparkle;
  spec += mouseSpec * reflVar;

  // ── Color composition (CineMon violet family) ──
  vec3 darkSequin = vec3(0.012, 0.010, 0.026);
  vec3 violetMid = vec3(0.46, 0.41, 0.85);   // brand violet reflection
  vec3 lavenderFlash = vec3(0.70, 0.66, 1.0); // lavender flash
  vec3 hotLavender = vec3(0.91, 0.89, 1.0);   // near-white peak

  float facing = cos(tiltAngle) * 0.5 + 0.5;
  facing = clamp(facing, 0.0, 1.0);

  vec3 ambient = mix(darkSequin, vec3(0.030, 0.026, 0.065), facing * 0.6);

  vec3 sequinColor = ambient;

  float sheenAmount = pow(max(facing, 0.0), 3.0) * 0.2 * reflVar;
  sequinColor += violetMid * sheenAmount;

  float flashLow = smoothstep(0.0, 0.3, spec);
  float flashHigh = smoothstep(0.3, 0.8, spec);
  float flashPeak = smoothstep(0.7, 1.0, spec);
  sequinColor += violetMid * flashLow * 0.5;
  sequinColor += lavenderFlash * flashHigh * 0.8;
  sequinColor += hotLavender * flashPeak * 1.2;

  sequinColor += violetMid * bevel * facing * 0.3;

  // Gaps between sequins — ink with a violet hint
  vec3 bgColor = vec3(0.008, 0.007, 0.016);

  vec3 col = mix(bgColor, sequinColor, disc);

  vec2 uvSafe = uv + vec2(0.0001);
  float globalLight = 0.85 + 0.15 * dot(normalize(uvSafe), vec2(0.4, 0.6));
  col *= globalLight;

  float vig = 1.0 - smoothstep(0.4, 1.3, length(uv));
  col *= 0.6 + 0.4 * vig;

  // Cool gamma — lean blue instead of the original's warm cast
  col = pow(max(col, vec3(0.0)), vec3(1.02, 1.0, 0.94));

  // Dim overall — this sits behind hero copy
  col *= 0.8;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function initHeroVisual() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return; // no WebGL — the CSS gradient backdrop stands on its own

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Link error:", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, "u_time");
  const uRes = gl.getUniformLocation(prog, "u_res");
  const uWaveSpeed = gl.getUniformLocation(prog, "u_waveSpeed");
  const uSparkle = gl.getUniformLocation(prog, "u_sparkle");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  const WAVE_SPEED = 0.5; // unhurried cascade
  const SPARKLE = 0.85;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let mouseX = -1.0;
  let mouseY = -1.0;
  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) {
      mouseX = -1.0;
      mouseY = -1.0;
      return;
    }
    mouseX = (e.clientX - r.left) * dpr;
    mouseY = (r.bottom - e.clientY) * dpr;
  }, { passive: true });

  let needsResize = true;
  window.addEventListener("resize", () => { needsResize = true; }, { passive: true });

  function resize() {
    needsResize = false;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  let raf = null;

  function frame(now) {
    raf = null;
    if (visible) {
      if (needsResize) resize();
      gl.uniform1f(uTime, now * 0.001);
      gl.uniform1f(uWaveSpeed, WAVE_SPEED);
      gl.uniform1f(uSparkle, SPARKLE);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  resize();

  if (reduceMotion) {
    gl.uniform1f(uTime, 7);
    gl.uniform1f(uWaveSpeed, WAVE_SPEED);
    gl.uniform1f(uSparkle, SPARKLE);
    gl.uniform2f(uMouse, -1, -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
