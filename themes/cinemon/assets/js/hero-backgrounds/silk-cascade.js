/*
 * Hero background: "Silk Cascade" — multi-layered translucent silk with
 * anisotropic sheen, re-paletted to CineMon's violet family.
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
uniform float u_sheenIntensity;
uniform vec2 u_mouse;

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float vnoise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash12(i);
  float b=hash12(i+vec2(1.0,0.0));
  float c=hash12(i+vec2(0.0,1.0));
  float d=hash12(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

float fbm3(vec2 p){
  float v=0.0, a=0.5;
  mat2 rot=mat2(0.8,-0.6,0.6,0.8);
  for(int i=0;i<3;i++){
    v+=a*vnoise(p);
    p=rot*p*2.0;
    a*=0.5;
  }
  return v;
}

float fbm2(vec2 p){
  float v=0.5*vnoise(p);
  p=mat2(0.8,-0.6,0.6,0.8)*p*2.0;
  v+=0.25*vnoise(p);
  return v;
}

vec2 domainWarp(vec2 p, float t, float scale, float seed){
  return vec2(
    fbm3(p*scale+vec2(1.7+seed,9.2)+t*0.15),
    fbm3(p*scale+vec2(8.3,2.8+seed)-t*0.12)
  );
}

vec2 domainWarpLite(vec2 p, float t, float scale, float seed){
  return vec2(
    fbm2(p*scale+vec2(1.7+seed,9.2)+t*0.15),
    fbm2(p*scale+vec2(8.3,2.8+seed)-t*0.12)
  );
}

// Per-layer fold: returns vec3(height, gradient.xy)
vec3 fabricFold(vec2 p, float t, float seed, float freq, float flow){
  float ts=t*flow;
  vec2 warp=domainWarp(p+seed*3.7, ts, 1.2, seed);
  vec2 wp=p+warp*0.55;
  float h=0.0; vec2 g=vec2(0.0);

  float f1x=freq*0.7, f1y=freq*0.4;
  float ph1=wp.x*f1x+wp.y*f1y+ts*0.3+seed*2.1;
  h+=sin(ph1)*0.35; g+=cos(ph1)*0.35*vec2(f1x,f1y);

  float f2x=-freq*0.3, f2y=freq*0.9;
  float ph2=wp.x*f2x+wp.y*f2y+ts*0.25+seed*1.3;
  h+=sin(ph2)*0.25; g+=cos(ph2)*0.25*vec2(f2x,f2y);

  float f3=freq*0.6;
  float ph3=(wp.x+wp.y)*f3+ts*0.2+seed*4.5;
  h+=sin(ph3)*0.18; g+=cos(ph3)*0.18*vec2(f3,f3);

  float f4x=freq*1.8, f4y=freq*1.2;
  float ph4=wp.x*f4x+wp.y*f4y-ts*0.35+seed*0.7;
  h+=sin(ph4)*0.08; g+=cos(ph4)*0.08*vec2(f4x,f4y);

  h+=vnoise(wp*freq*0.9+seed*10.0+ts*0.04)*0.12-0.06;
  return vec3(h, g);
}

vec3 fabricFoldLite(vec2 p, float t, float seed, float freq, float flow){
  float ts=t*flow;
  vec2 warp=domainWarpLite(p+seed*3.7, ts, 1.2, seed);
  vec2 wp=p+warp*0.55;
  float h=0.0; vec2 g=vec2(0.0);
  float f1x=freq*0.7, f1y=freq*0.4;
  float ph1=wp.x*f1x+wp.y*f1y+ts*0.3+seed*2.1;
  h+=sin(ph1)*0.35; g+=cos(ph1)*0.35*vec2(f1x,f1y);
  float f2x=-freq*0.3, f2y=freq*0.9;
  float ph2=wp.x*f2x+wp.y*f2y+ts*0.25+seed*1.3;
  h+=sin(ph2)*0.25; g+=cos(ph2)*0.25*vec2(f2x,f2y);
  float f3=freq*0.6;
  float ph3=(wp.x+wp.y)*f3+ts*0.2+seed*4.5;
  h+=sin(ph3)*0.18; g+=cos(ph3)*0.18*vec2(f3,f3);
  float f4x=freq*1.8, f4y=freq*1.2;
  float ph4=wp.x*f4x+wp.y*f4y-ts*0.35+seed*0.7;
  h+=sin(ph4)*0.08; g+=cos(ph4)*0.08*vec2(f4x,f4y);
  return vec3(h, g);
}

// Kajiya-Kay anisotropic specular
float kajiyaSpec(vec2 grad, vec3 L, vec3 V, float shine){
  float gl2=dot(grad,grad);
  if(gl2<0.0001) return 0.0;
  vec2 tg=vec2(-grad.y, grad.x)/sqrt(gl2);
  vec3 T=normalize(vec3(tg, 0.0));
  vec3 H=normalize(L+V);
  float TdH=dot(T,H);
  return pow(sqrt(max(1.0-TdH*TdH, 0.0)), shine);
}

vec4 shadeLayer(
  vec2 p, float t,
  float seed, float freq, float flow,
  vec3 darkCol, vec3 midCol, vec3 brightCol, vec3 specCol,
  float opacity, float shine,
  vec3 L1, vec3 L2, vec3 V,
  float sheenMul
){
  vec3 fold=opacity<0.35 ? fabricFoldLite(p, t, seed, freq, flow) : fabricFold(p, t, seed, freq, flow);
  float h=fold.x;
  vec2 grad=fold.yz;
  vec3 N=normalize(vec3(-grad*1.8, 1.0));

  float NdL1=max(dot(N, L1), 0.0);
  float NdL2=max(dot(N, L2), 0.0);
  float lit=NdL1*0.75+NdL2*0.12;

  float depth=smoothstep(-0.8, 0.4, h);

  float shade=lit*depth;
  float midBlend=smoothstep(0.0, 0.35, shade);
  float brightBlend=smoothstep(0.25, 0.7, shade);
  vec3 fabric=mix(darkCol, midCol, midBlend);
  fabric=mix(fabric, brightCol, brightBlend*0.5);

  float sp=kajiyaSpec(grad, L1, V, shine)*0.9;
  sp+=kajiyaSpec(grad, L2, V, shine*0.6)*0.15;
  sp*=sheenMul;
  float specPow=sp*sp*sp;
  fabric+=specCol*specPow*0.9;

  // Translucent backlight at peaks — cool violet instead of amber
  float trans=smoothstep(0.3, 0.9, depth)*lit*0.08;
  fabric+=vec3(0.26, 0.22, 0.52)*trans;

  float sparkle=hash12(floor(p*500.0+t*0.7));
  sparkle=step(0.9992, sparkle)*specPow*20.0*sheenMul;
  fabric+=specCol*min(sparkle, 2.0);

  float alpha=opacity*(0.65+depth*0.35);
  return vec4(fabric, alpha);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 p=(uv-0.5)*vec2(aspect, 1.0);

  float t=u_time*u_flowSpeed;

  vec3 L1=normalize(vec3(
    0.4+sin(t*0.07)*0.3,
    0.9+cos(t*0.09)*0.15,
    0.8
  ));
  if (u_mouse.x > 0.0) {
    vec2 mUV = u_mouse / u_res - 0.5;
    L1 = normalize(vec3(mUV.x * 2.0, mUV.y * 2.0 + 0.5, 0.8));
  }
  vec3 L2=normalize(vec3(
    -0.7+cos(t*0.06)*0.2,
    -0.3+sin(t*0.08)*0.15,
    0.6
  ));
  vec3 V=vec3(0.0, 0.0, 1.0);

  // Background — CineMon ink with a violet-tinted core glow
  float bgD=length(p);
  vec3 bg=mix(
    vec3(0.045, 0.035, 0.085),
    vec3(0.014, 0.011, 0.030),
    smoothstep(0.0, 1.0, bgD)
  );
  bg+=vec3(0.020, 0.016, 0.045)*exp(-bgD*bgD*2.0);

  // Layer 1: Deep — indigo (slowest, most transparent)
  vec4 ly1=shadeLayer(
    p*0.8+vec2(0.15, t*0.015), t,
    0.0, 2.0, 0.5,
    vec3(0.020, 0.015, 0.055),
    vec3(0.130, 0.105, 0.360),
    vec3(0.260, 0.220, 0.620),
    vec3(0.720, 0.680, 1.0),
    0.30, 26.0,
    L1, L2, V,
    u_sheenIntensity*0.7
  );

  // Layer 2: Middle — brand violet (#665DEF family)
  vec4 ly2=shadeLayer(
    p*1.0+vec2(t*0.012, -0.1), t,
    1.0, 3.2, 0.75,
    vec3(0.030, 0.020, 0.070),
    vec3(0.190, 0.155, 0.500),
    vec3(0.360, 0.310, 0.780),
    vec3(0.820, 0.780, 1.0),
    0.38, 40.0,
    L1, L2, V,
    u_sheenIntensity*0.9
  );

  // Layer 3: Front — lavender (#A299FF family; fastest, most opaque)
  vec4 ly3=shadeLayer(
    p*1.2+vec2(-t*0.008, t*0.02), t,
    2.0, 4.5, 1.0,
    vec3(0.040, 0.032, 0.085),
    vec3(0.255, 0.225, 0.520),
    vec3(0.480, 0.435, 0.800),
    vec3(0.930, 0.910, 1.0),
    0.50, 55.0,
    L1, L2, V,
    u_sheenIntensity
  );

  // Composite back-to-front (inter-layer glow shifted to violet)
  vec3 col=bg;
  col=mix(col, ly1.rgb, ly1.a);
  col+=vec3(0.14, 0.11, 0.30)*ly1.a*ly2.a*0.08;
  col=mix(col, ly2.rgb, ly2.a);
  col+=vec3(0.16, 0.13, 0.32)*ly2.a*ly3.a*0.06;
  col+=vec3(0.18, 0.15, 0.36)*ly1.a*ly2.a*ly3.a*0.04;
  col=mix(col, ly3.rgb, ly3.a);

  float cov=(ly1.a+ly2.a+ly3.a)*0.333;
  col+=vec3(0.14, 0.11, 0.30)*cov*0.04;

  // Vignette
  float vig=1.0-smoothstep(0.25, 1.15, length(p*vec2(0.85,1.0)));
  col*=0.6+0.4*vig;

  // Gentle saturation lift
  float lum=dot(col, vec3(0.299, 0.587, 0.114));
  col=mix(vec3(lum), col, 1.2);

  // Tone mapping (ACES) + gamma
  col=col*(2.51*col+0.03)/(col*(2.43*col+0.59)+0.14);
  col=pow(max(col,0.0), vec3(0.4545));

  // Dim overall — this sits behind hero copy
  col*=0.52;

  // Film grain
  float grain=hash12(gl_FragCoord.xy+fract(u_time*7.13)*100.0);
  col+=(grain-0.5)*0.015;

  gl_FragColor=vec4(clamp(col,0.0,1.0), 1.0);
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
  const uSheen = gl.getUniformLocation(prog, "u_sheenIntensity");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  const FLOW_SPEED = 0.25; // slow, stately drift
  const SHEEN = 0.6;

  // Soft folds look identical upscaled — render at 1x CSS pixels
  const dpr = 1.0;

  // Pointer tracked on window (the canvas sits behind the hero content)
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

  // Only animate while the hero is on screen and the tab is visible
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  let raf = null;

  function frame(now) {
    raf = null;
    if (visible) {
      if (needsResize) resize();
      gl.uniform1f(uTime, now * 0.001);
      gl.uniform1f(uFlowSpeed, FLOW_SPEED);
      gl.uniform1f(uSheen, SHEEN);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  resize();

  if (reduceMotion) {
    gl.uniform1f(uTime, 12); // render one pleasing static frame
    gl.uniform1f(uFlowSpeed, FLOW_SPEED);
    gl.uniform1f(uSheen, SHEEN);
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
