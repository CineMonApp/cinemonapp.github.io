/*
 * Hero background: "Bass Ripple" — a metallic hex-grille surface rippling
 * with slow pulses, re-paletted from warm amber/copper to CineMon's
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
uniform float u_bassFreq;
uniform float u_bassIntensity;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Beat-synced displacement — combines multiple wave modes
float displacement(vec2 p, float t, float bassFreq, float intensity) {
  float period = 1.0 / max(bassFreq, 0.01);
  float phase = t / period;
  float beatFrac = fract(phase);

  float envelope = exp(-beatFrac * 3.5);
  float prevEnv = exp(-(beatFrac + 1.0) * 3.5);
  float prevEnv2 = exp(-(beatFrac + 2.0) * 3.5);

  float dist = length(p);
  float angle = atan(p.y, p.x);

  float wave1 = sin(dist * 14.0 - beatFrac * 22.0) * envelope;
  float wave2 = sin(dist * 9.0 - (beatFrac + 1.0) * 16.0) * prevEnv * 0.6;
  float wave3 = sin(dist * 6.0 - (beatFrac + 2.0) * 12.0) * prevEnv2 * 0.3;
  float standing = (sin(p.x * 18.0) * sin(p.y * 18.0)) * envelope * 0.3;

  float radialMode = sin(dist * 22.0) * cos(angle * 3.0) * envelope * 0.2;
  radialMode += sin(dist * 16.0) * cos(angle * 5.0 + 1.0) * prevEnv * 0.1;

  vec2 offCenter = vec2(0.3 * sin(t * 0.2), 0.25 * cos(t * 0.25));
  float dist2 = length(p - offCenter);
  float wave6 = sin(dist2 * 12.0 - beatFrac * 18.0) * envelope * 0.35;

  float mouseWave = 0.0;
  if (u_mouse.x > 0.0) {
    vec2 mouseNorm = (u_mouse / u_res - 0.5) * vec2(u_res.x / u_res.y, 1.0);
    float mouseDist = length(p - mouseNorm);
    mouseWave = sin(mouseDist * 16.0 - beatFrac * 20.0) * envelope * 0.7;
    mouseWave += sin(mouseDist * 10.0 - (beatFrac + 1.0) * 14.0) * prevEnv * 0.4;
    mouseWave *= 1.0 / (1.0 + mouseDist * 3.0);
  }

  float dome = (1.0 - smoothstep(0.0, 1.0, dist)) * envelope * 0.8;

  float h = (wave1 + wave2 + wave3 + standing + radialMode + wave6 + mouseWave + dome) * intensity;

  float idle = sin(dist * 8.0 + t * 3.0) * 0.03 * (1.0 - envelope);
  idle += sin(dist * 5.0 - t * 1.5) * 0.015 * (1.0 - envelope);
  h += idle * intensity;

  return h;
}

vec3 calcNormal(vec2 p, float t, float bassFreq, float intensity, float hc) {
  float eps = 0.002;
  float hx = displacement(p + vec2(eps, 0.0), t, bassFreq, intensity);
  float hy = displacement(p + vec2(0.0, eps), t, bassFreq, intensity);
  return normalize(vec3(-(hx - hc) / eps * 0.35, -(hy - hc) / eps * 0.35, 1.0));
}

// Hexagonal grid distance: x = distance to nearest hex edge, yz = cell ID
vec3 hexGrid(vec2 p, float scale) {
  p *= scale;
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 g = (dot(a, a) < dot(b, b)) ? a : b;
  float edgeDist = 0.5 - max(abs(g.x) * 1.0 + abs(g.y) * 0.577, abs(g.y) * 1.155);
  vec2 cellId = p - g;
  return vec3(edgeDist, cellId);
}

float fresnel(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  vec2 cuv = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Camera — slightly off-axis, gentle drift
  float camDriftX = sin(t * 0.15) * 0.03;
  float camDriftY = cos(t * 0.12) * 0.02;
  float foreshorten = 0.7 + camDriftY * 0.5;

  vec2 meshUV = cuv;
  meshUV.x += camDriftX;
  meshUV.y = meshUV.y / foreshorten;
  meshUV.y += 0.08;
  meshUV = rot2(0.06 + sin(t * 0.08) * 0.02) * meshUV;

  // Displacement
  float h = displacement(meshUV, t, u_bassFreq, u_bassIntensity);
  vec3 N = calcNormal(meshUV, t, u_bassFreq, u_bassIntensity, h);

  // Hexagonal mesh
  float meshScale = 45.0;
  vec3 hex = hexGrid(meshUV + N.xy * 0.003, meshScale);
  float hexEdge = hex.x;

  float wireWidth = 0.06;
  float wire = 1.0 - smoothstep(0.0, wireWidth, hexEdge);
  float hole = smoothstep(wireWidth, wireWidth + 0.02, hexEdge);

  vec2 microGrid = fract(meshUV * meshScale * 3.0 + N.xy * 0.01);
  float microWire = smoothstep(0.04, 0.0, min(microGrid.x, microGrid.y));
  microWire += smoothstep(0.04, 0.0, min(1.0 - microGrid.x, 1.0 - microGrid.y));
  microWire *= 0.15;

  // Lighting
  vec3 V = normalize(vec3(-cuv.x * 0.3, -cuv.y * 0.3 + 0.2, 1.0));

  float period = 1.0 / max(u_bassFreq, 0.01);
  float bFrac = fract(t / period);
  float bEnv = exp(-bFrac * 3.5);

  // Key light — lavender sweep
  vec3 L1 = normalize(vec3(0.4 + sin(t * 0.25) * 0.4, 0.6 + cos(t * 0.18) * 0.3, 1.0));
  float NdL1 = max(dot(N, L1), 0.0);
  vec3 H1 = normalize(L1 + V);
  float NdH1 = max(dot(N, H1), 0.0);
  float spec1 = pow(NdH1, 180.0);
  float spec1med = pow(NdH1, 50.0);
  float spec1soft = pow(NdH1, 12.0);
  vec3 lightCol1 = vec3(0.78, 0.74, 1.0);

  // Fill light — deep brand violet, from the left
  vec3 L2 = normalize(vec3(-0.8 + sin(t * 0.15) * 0.2, 0.4, 0.8));
  float NdL2 = max(dot(N, L2), 0.0);
  vec3 H2 = normalize(L2 + V);
  float NdH2 = max(dot(N, H2), 0.0);
  float spec2 = pow(NdH2, 120.0);
  float spec2soft = pow(NdH2, 25.0);
  vec3 lightCol2 = vec3(0.48, 0.40, 0.95);

  // Accent light — cool cyan, moves with the pulse
  vec3 L3 = normalize(vec3(0.3 + bEnv * 0.3, -0.6, 0.6));
  float NdL3 = max(dot(N, L3), 0.0);
  vec3 H3 = normalize(L3 + V);
  float NdH3 = max(dot(N, H3), 0.0);
  float spec3 = pow(NdH3, 90.0);
  float spec3soft = pow(NdH3, 18.0);
  vec3 lightCol3 = vec3(0.35, 0.70, 1.0);

  vec3 L4 = normalize(vec3(0.0, 0.1, 1.0));
  float NdL4 = max(dot(N, L4), 0.0);

  float NdV = max(dot(N, V), 0.0);
  float rim = pow(1.0 - NdV, 4.0);
  vec3 rimCol = vec3(0.55, 0.48, 0.95);

  // Material: cool gunmetal with a violet cast
  vec3 baseColor = vec3(0.26, 0.25, 0.36);
  baseColor += vec3(0.020, 0.020, 0.032) * noise(meshUV * 30.0);
  baseColor += vec3(0.012, 0.012, 0.020) * noise(meshUV * 80.0 + 5.0);

  float f0 = 0.75;
  float fres = fresnel(NdV, f0);

  // Wire material
  vec3 diffuse = baseColor * (NdL1 * lightCol1 * 1.0 + NdL2 * lightCol2 * 0.5 + NdL3 * lightCol3 * 0.25 + NdL4 * 0.4);
  diffuse += baseColor * 0.18;
  vec3 hemiAmb = mix(vec3(0.02, 0.018, 0.04), vec3(0.045, 0.04, 0.08), N.y * 0.5 + 0.5);
  diffuse += hemiAmb;

  vec3 specular = vec3(0.0);
  specular += spec1 * lightCol1 * 3.5;
  specular += spec1med * lightCol1 * 1.2;
  specular += spec1soft * lightCol1 * 0.25;
  specular += spec2 * lightCol2 * 2.5;
  specular += spec2soft * lightCol2 * 0.5;
  specular += spec3 * lightCol3 * 3.0;
  specular += spec3soft * lightCol3 * 0.4;
  specular *= fres;

  specular *= 1.0 + bEnv * 1.0 * u_bassIntensity;

  float wireCenter = abs(hexEdge - wireWidth * 0.5) / max(wireWidth, 0.001);
  float aniso = pow(max(1.0 - wireCenter, 0.0), 3.0);
  specular += aniso * wire * vec3(0.38, 0.33, 0.75) * fres * 0.5;

  vec3 wireCol = diffuse + specular;
  wireCol += rim * rimCol * 0.5;
  wireCol += microWire * vec3(0.09, 0.08, 0.16) * fres;

  // Hole interior — dark void, violet light leaks on the pulse
  vec3 holeCol = vec3(0.008, 0.007, 0.018);
  float coneRefl = max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0);
  holeCol += vec3(0.014, 0.012, 0.032) * coneRefl;
  float conePush = max(h * 0.4, 0.0);
  holeCol += vec3(0.028, 0.024, 0.065) * conePush;
  holeCol += vec3(0.09, 0.075, 0.22) * bEnv * 0.35 * u_bassIntensity;
  holeCol += vec3(0.04, 0.07, 0.13) * bEnv * 0.15 * u_bassIntensity;

  vec3 col = mix(holeCol, wireCol, wire);
  col += microWire * vec3(0.015, 0.014, 0.028) * (1.0 - hole * 0.7);

  // Pulse color wash — alternates violet and indigo
  vec3 beatColor = mix(vec3(0.22, 0.18, 0.55), vec3(0.14, 0.12, 0.42), sin(t * 0.4) * 0.5 + 0.5);
  col += beatColor * bEnv * 0.03 * u_bassIntensity;

  // Environment reflection — cool studio
  vec3 refl = reflect(-V, N);
  vec3 envCol = vec3(0.03, 0.03, 0.06);
  envCol += vec3(0.06, 0.055, 0.13) * pow(max(refl.y, 0.0), 2.0);
  envCol += vec3(0.07, 0.05, 0.16) * pow(max(-refl.x, 0.0), 2.0);
  envCol += vec3(0.05, 0.09, 0.20) * pow(max(-refl.y, 0.0), 3.0);
  float softbox = pow(max(dot(refl, normalize(vec3(0.2, 0.8, 0.5))), 0.0), 8.0);
  envCol += vec3(0.25, 0.24, 0.32) * softbox;
  envCol *= 1.0 + bEnv * 0.5 * u_bassIntensity;
  col += envCol * fres * wire * 0.5;

  // Post
  vec2 vc = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 2.0;
  vig = smoothstep(0.0, 1.0, vig);
  col *= vig;

  float dofDist = length(cuv);
  float dof = smoothstep(0.3, 0.8, dofDist);
  col = mix(col, col * vec3(0.7, 0.68, 0.8), dof * 0.3);

  float grain = hash(gl_FragCoord.xy + fract(t * 7.3) * 100.0);
  col += (grain - 0.5) * 0.018;

  float ca = dofDist * 0.003;
  col.r += (hash(gl_FragCoord.xy * 0.5 + 1.0) - 0.5) * ca;
  col.b += (hash(gl_FragCoord.xy * 0.5 + 2.0) - 0.5) * ca;

  // Tone mapping — Reinhard with high white point + gentle gamma lift
  col = col / (col + vec3(1.5));
  col = pow(max(col, vec3(0.0)), vec3(0.88));

  // Dim overall — this sits behind hero copy
  col *= 0.8;

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
  const uBassFreq = gl.getUniformLocation(prog, "u_bassFreq");
  const uBassIntensity = gl.getUniformLocation(prog, "u_bassIntensity");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  const BASS_FREQ = 0.28; // slow, breathing pulse
  const BASS_INTENSITY = 0.7;

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
      gl.uniform1f(uBassFreq, BASS_FREQ);
      gl.uniform1f(uBassIntensity, BASS_INTENSITY);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  resize();

  if (reduceMotion) {
    gl.uniform1f(uTime, 5);
    gl.uniform1f(uBassFreq, BASS_FREQ);
    gl.uniform1f(uBassIntensity, BASS_INTENSITY);
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
