/*
 * Hero background: "Liquid Gold" — molten metal flow with surface tension
 * and metallic reflections, recast as liquid violet chrome and dimmed for
 * a background role.
 *
 * Adapted from Radiant Shaders (https://radiant-shaders.com, MIT license,
 * Paul Bakaus). Plain WebGL, no dependencies.
 */

const VERT = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_flowSpeed;
uniform float u_viscosity;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM with viscosity-controlled octave decay.
// 4 octaves (original ran 6): cheaper, and the lower high-frequency detail
// reads as smooth liquid rather than rough stone.
float fbm(vec2 p, float t, float visc) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float decay = 0.45 + visc * 0.2;
  for (int i = 0; i < 4; i++) {
    val += amp * noise(p * freq + t);
    freq *= 2.0 + visc * 0.3;
    amp *= decay;
    p += vec2(1.7, 9.2);
  }
  return val;
}

// Domain warping for viscous flow
float warpedField(vec2 p, float t, float visc) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0), t * 0.5, visc),
    fbm(p + vec2(5.2, 1.3), t * 0.5, visc)
  );
  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2), t * 0.7, visc),
    fbm(p + 3.0 * q + vec2(8.3, 2.8), t * 0.7, visc)
  );
  float f = fbm(p + 2.5 * r, t * 0.4, visc);
  return f + length(q) * 0.4 + length(r) * 0.3;
}

// Metaball-like surface bumps
float metaballs(vec2 p, float t) {
  float val = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 center = vec2(
      sin(t * 0.3 + fi * 2.1) * 0.6 + cos(t * 0.2 + fi * 1.3) * 0.3,
      cos(t * 0.25 + fi * 1.7) * 0.6 + sin(t * 0.15 + fi * 2.5) * 0.3
    );
    float radius = 0.15 + 0.1 * sin(t * 0.4 + fi * 3.0);
    float d = length(p - center);
    val += radius / (d + 0.05);
  }
  return val;
}

vec3 getNormal(vec2 p, float t, float visc, float warpCenter) {
  float eps = 0.005;
  float hC = warpCenter + metaballs(p, t) * 0.08;
  float hR = warpedField(p + vec2(eps, 0.0), t, visc) + metaballs(p + vec2(eps, 0.0), t) * 0.08;
  float hU = warpedField(p + vec2(0.0, eps), t, visc) + metaballs(p + vec2(0.0, eps), t) * 0.08;
  return normalize(vec3((hC - hR) / eps, (hC - hU) / eps, 1.0));
}

float fresnel(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * u_flowSpeed;
  float visc = u_viscosity;

  // Height field (domain-warped + metaballs)
  float field = warpedField(uv * 2.0, t, visc);
  float meta = metaballs(uv, t);
  float height = field + meta * 0.08;

  vec3 normal = getNormal(uv * 2.0, t, visc, field);

  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
  vec3 lightDir1 = normalize(vec3(0.4, 0.5, 0.9));
  vec3 lightDir2 = normalize(vec3(-0.6, -0.3, 0.7));
  vec3 lightDir3 = normalize(vec3(0.0, 0.8, 0.5));

  // Pointer makes a gentle dimple with a soft specular ring
  if (u_mouse.x > 0.0) {
    vec2 mUV = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
    vec2 toMouse = uv - mUV;
    float md = length(toMouse);
    float bump = exp(-md * md * 25.0);
    normal = normalize(normal + vec3(toMouse * bump * 6.0, 0.0));
    height += bump * 0.15;
  }

  // ── Liquid violet-chrome material (was gold) ──
  vec3 metalBase = vec3(0.40, 0.36, 0.82);
  vec3 metalBright = vec3(0.70, 0.66, 1.0);
  vec3 metalDeep = vec3(0.22, 0.18, 0.52);
  vec3 metalShadow = vec3(0.045, 0.038, 0.13);
  vec3 whiteHot = vec3(0.93, 0.92, 1.0);

  float f0 = 0.8;

  float NdotL1 = max(dot(normal, lightDir1), 0.0);
  float NdotL2 = max(dot(normal, lightDir2), 0.0);
  float NdotL3 = max(dot(normal, lightDir3), 0.0);

  vec3 halfVec1 = normalize(lightDir1 + viewDir);
  vec3 halfVec2 = normalize(lightDir2 + viewDir);
  vec3 halfVec3 = normalize(lightDir3 + viewDir);

  float spec1 = pow(max(dot(normal, halfVec1), 0.0), 120.0);
  float spec2 = pow(max(dot(normal, halfVec2), 0.0), 80.0);
  float spec3 = pow(max(dot(normal, halfVec3), 0.0), 200.0);

  float NdotV = max(dot(normal, viewDir), 0.0);
  float fres = fresnel(NdotV, f0);

  float fieldNorm = smoothstep(0.3, 1.8, field);
  vec3 baseColor = mix(metalShadow, metalDeep, smoothstep(0.0, 0.3, fieldNorm));
  baseColor = mix(baseColor, metalBase, smoothstep(0.3, 0.6, fieldNorm));
  baseColor = mix(baseColor, metalBright, smoothstep(0.6, 0.9, fieldNorm));

  vec3 diffuse = baseColor * (NdotL1 * 0.5 + NdotL2 * 0.3 + NdotL3 * 0.2);

  // Softened highlights (original ran 1.2 / 0.6 / 1.5)
  vec3 specColor1 = mix(metalBright, whiteHot, spec1);
  vec3 specColor2 = mix(metalBright, whiteHot, spec2 * 0.5);
  vec3 specColor3 = mix(metalBright, whiteHot, spec3);

  vec3 specular = specColor1 * spec1 * 0.9
                + specColor2 * spec2 * 0.5
                + specColor3 * spec3 * 1.1;

  // Fake environment reflection — cool violet studio gradient
  vec2 reflUv = normal.xy * 0.5 + 0.5;
  vec3 envRefl = mix(
    vec3(0.025, 0.02, 0.07),
    vec3(0.15, 0.12, 0.36),
    reflUv.y
  );
  envRefl = mix(envRefl, vec3(0.32, 0.28, 0.60), smoothstep(0.6, 1.0, reflUv.y));

  vec3 col = diffuse * 0.4 + specular * fres + envRefl * fres * 0.5;

  col += baseColor * 0.12;

  // Surface tension ripples where blobs meet — softened
  float metaGrad = abs(meta - 3.5);
  float tensionLine = smoothstep(0.5, 0.0, metaGrad) * 0.15;
  col += metalBright * tensionLine;

  float ripple = noise(uv * 15.0 + t * 2.0);
  ripple = ripple * ripple;
  float rippleHighlight = smoothstep(0.6, 0.9, ripple) * 0.05;
  col += whiteHot * rippleHighlight * fres;

  // Radial vignette: dark edges where the metal thins
  float dist = length(uv);
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
  col *= 0.35 + vignette * 0.65;

  // Central pooling glow — softened
  float poolGlow = smoothstep(0.8, 0.0, dist) * 0.08;
  col += metalBright * poolGlow;

  // Tone mapping (ACES-like)
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);

  // Cool push (original pushed warm)
  col = pow(col, vec3(1.06, 1.04, 0.94));

  // Dim overall — this sits behind hero copy
  col *= 0.6;

  gl_FragColor = vec4(col, 1.0);
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
  const uFlowSpeed = gl.getUniformLocation(prog, "u_flowSpeed");
  const uViscosity = gl.getUniformLocation(prog, "u_viscosity");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  const FLOW_SPEED = 0.22; // molten, unhurried (original 0.4)
  const VISCOSITY = 0.65;

  // The shader is FBM-heavy (many noise samples per pixel); soft liquid
  // forms upscale invisibly, so render at half resolution to keep the GPU
  // cost from starving the rest of the page.
  const dpr = 0.5;

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
      gl.uniform1f(uFlowSpeed, FLOW_SPEED);
      gl.uniform1f(uViscosity, VISCOSITY);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  resize();

  if (reduceMotion) {
    gl.uniform1f(uTime, 10); // render one pleasing static frame
    gl.uniform1f(uFlowSpeed, FLOW_SPEED);
    gl.uniform1f(uViscosity, VISCOSITY);
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
