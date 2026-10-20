/*
 * Hero background: "Luminous Silt" — dense drifting particle clouds flowing
 * through a noise field, re-paletted to CineMon's violet family and thinned
 * out for a background role.
 *
 * Adapted from Radiant Shaders (https://radiant-shaders.com, MIT license,
 * Paul Bakaus). Canvas 2D, no dependencies.
 */

function initHeroVisual() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Tunables (softened from the original for a background role) ──
  const DRIFT_SPEED = 0.5;
  const DENSITY = 0.7;
  const BASE_COUNT = 18000;

  // DPR capped for perf with thousands of particles
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0;
  let H = 0;
  let particleCount = 0;

  let posX, posY, velScale, brightnessIdx, isSparkle;

  // ── Perlin-style hash-based 2D value noise ──
  const PERM = new Uint8Array(512);
  const GRAD = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  (function initNoise(seed) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })(42);

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  function noise2D(x, y) {
    let xi = Math.floor(x);
    let yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    xi &= 255;
    yi &= 255;
    const u = fade(xf);
    const v = fade(yf);

    const g00 = GRAD[PERM[PERM[xi] + yi] & 7];
    const g10 = GRAD[PERM[PERM[xi + 1] + yi] & 7];
    const g01 = GRAD[PERM[PERM[xi] + yi + 1] & 7];
    const g11 = GRAD[PERM[PERM[xi + 1] + yi + 1] & 7];

    const n00 = g00[0] * xf + g00[1] * yf;
    const n10 = g10[0] * (xf - 1) + g10[1] * yf;
    const n01 = g01[0] * xf + g01[1] * (yf - 1);
    const n11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);

    const nx0 = n00 + u * (n10 - n00);
    const nx1 = n01 + u * (n11 - n01);
    return nx0 + v * (nx1 - nx0);
  }

  // ── Color gradient corners — CineMon violet family ──
  const CORNER_TL = [55, 60, 200];    // cobalt indigo
  const CORNER_TR = [162, 153, 255];  // brand lavender
  const CORNER_BL = [65, 130, 210];   // muted cyan-blue
  const CORNER_BR = [102, 93, 239];   // brand violet
  const CENTER_C = [205, 200, 240];   // soft lavender-white

  // Softer than the original — this sits behind hero copy
  const ALPHA_LEVELS = [0.02, 0.03, 0.04, 0.06, 0.12, 0.18];
  const NUM_ALPHAS = ALPHA_LEVELS.length;
  const NUM_NORMAL_ALPHAS = 4; // first 4 are normal, last 2 are sparkle-only

  const COLOR_GRID_SIZE = 12;
  const NUM_COLORS = COLOR_GRID_SIZE * COLOR_GRID_SIZE;
  const NUM_BUCKETS = NUM_COLORS * NUM_ALPHAS;
  const COLOR_STRINGS = new Array(NUM_BUCKETS);

  function gradientColor(nx, ny, rotAngle) {
    const cosR = Math.cos(rotAngle);
    const sinR = Math.sin(rotAngle);
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    let rx = cx * cosR - cy * sinR + 0.5;
    let ry = cx * sinR + cy * cosR + 0.5;
    rx = rx < 0 ? 0 : rx > 1 ? 1 : rx;
    ry = ry < 0 ? 0 : ry > 1 ? 1 : ry;

    let r = CORNER_TL[0] * (1 - rx) * (1 - ry) + CORNER_TR[0] * rx * (1 - ry) + CORNER_BL[0] * (1 - rx) * ry + CORNER_BR[0] * rx * ry;
    let g = CORNER_TL[1] * (1 - rx) * (1 - ry) + CORNER_TR[1] * rx * (1 - ry) + CORNER_BL[1] * (1 - rx) * ry + CORNER_BR[1] * rx * ry;
    let b = CORNER_TL[2] * (1 - rx) * (1 - ry) + CORNER_TR[2] * rx * (1 - ry) + CORNER_BL[2] * (1 - rx) * ry + CORNER_BR[2] * rx * ry;

    const distFromCenter = Math.sqrt(cx * cx + cy * cy) * 2;
    let centerWeight = 1 - Math.min(distFromCenter, 1);
    centerWeight *= centerWeight;
    r += (CENTER_C[0] - r) * centerWeight;
    g += (CENTER_C[1] - g) * centerWeight;
    b += (CENTER_C[2] - b) * centerWeight;

    return [(r + 0.5) | 0, (g + 0.5) | 0, (b + 0.5) | 0];
  }

  function rebuildColorStrings(rotAngle) {
    for (let gy = 0; gy < COLOR_GRID_SIZE; gy++) {
      for (let gx = 0; gx < COLOR_GRID_SIZE; gx++) {
        const nx = (gx + 0.5) / COLOR_GRID_SIZE;
        const ny = (gy + 0.5) / COLOR_GRID_SIZE;
        const c = gradientColor(nx, ny, rotAngle);
        const ci = gy * COLOR_GRID_SIZE + gx;
        for (let ai = 0; ai < NUM_ALPHAS; ai++) {
          COLOR_STRINGS[ci * NUM_ALPHAS + ai] = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + ALPHA_LEVELS[ai] + ")";
        }
      }
    }
  }

  rebuildColorStrings(0);

  // ── Bucketing: fixed-size typed arrays to avoid GC ──
  let bucketData;
  let bucketLen;
  let MAX_PER_BUCKET;

  function allocBuckets() {
    MAX_PER_BUCKET = Math.ceil((particleCount / NUM_BUCKETS) * 8) + 32;
    bucketData = new Uint32Array(NUM_BUCKETS * MAX_PER_BUCKET);
    bucketLen = new Uint32Array(NUM_BUCKETS);
  }

  function initParticles() {
    particleCount = Math.round(BASE_COUNT * DENSITY);
    posX = new Float32Array(particleCount);
    posY = new Float32Array(particleCount);
    velScale = new Float32Array(particleCount);
    brightnessIdx = new Uint8Array(particleCount);
    isSparkle = new Uint8Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      posX[i] = Math.random() * W;
      posY[i] = Math.random() * H;
      velScale[i] = 0.3 + Math.random() * 0.7;
      brightnessIdx[i] = (Math.random() * NUM_NORMAL_ALPHAS) | 0;
      isSparkle[i] = Math.random() < 0.05 ? 1 : 0;
    }
    allocBuckets();
  }

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    initParticles();
    if (reduceMotion) drawStatic();
  }

  // Pointer gently repels the silt (tracked on window — canvas sits behind content)
  let mouseX = 0;
  let mouseY = 0;
  let mouseActive = false;
  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) {
      mouseActive = false;
      return;
    }
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    mouseActive = true;
  }, { passive: true });

  let time = 0;
  let frameCount = 0;

  // ── Dither tiles for the trail fade ──
  // The gentle multiplicative fade stalls at low alpha (8-bit rounding:
  // alpha*0.975 rounds back to itself), which would leave permanent ghost
  // streaks. These 4x4 tiles each erase ONE pixel of every 4x4 block at
  // 60% — strong enough to always round down a step — and cycle so every
  // pixel gets a decisive erase once per 16 frames. Trails fade fully.
  const ditherTiles = [];
  for (let i = 0; i < 16; i++) {
    const t = document.createElement("canvas");
    t.width = 4;
    t.height = 4;
    const tc = t.getContext("2d");
    tc.fillStyle = "rgba(0,0,0,0.6)";
    tc.fillRect(i % 4, (i / 4) | 0, 1, 1);
    ditherTiles.push(ctx.createPattern(t, "repeat"));
  }

  const COLOR_REBUILD_INTERVAL = 8;

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  let raf = null;

  function drawStatic() {
    // One quiet frame: the silt at rest
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particleCount; i++) {
      const gx = Math.min(((posX[i] / W) * COLOR_GRID_SIZE) | 0, COLOR_GRID_SIZE - 1);
      const gy = Math.min(((posY[i] / H) * COLOR_GRID_SIZE) | 0, COLOR_GRID_SIZE - 1);
      const ci = gy * COLOR_GRID_SIZE + gx;
      ctx.fillStyle = COLOR_STRINGS[ci * NUM_ALPHAS + 3];
      ctx.fillRect(posX[i], posY[i], 2, 2);
    }
  }

  function draw() {
    raf = null;
    if (!visible) {
      raf = requestAnimationFrame(draw);
      return;
    }

    time += 0.0006 * DRIFT_SPEED;
    frameCount++;

    const rotAngle = time * 0.1;
    if (frameCount % COLOR_REBUILD_INTERVAL === 0) {
      rebuildColorStrings(rotAngle);
    }

    // Trail fade: erase canvas alpha each frame (destination-out), so the
    // page background shows through between the flows. Two passes:
    // 1) a gentle whole-canvas fade that shapes the trail length, and
    // 2) a cycling dither pass (see ditherTiles) that guarantees every
    //    pixel decays fully to transparent instead of stalling at low
    //    alpha from 8-bit rounding.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.025)";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // dither at device pixels, no AA dilution
    ctx.fillStyle = ditherTiles[frameCount & 15];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";

    for (let b = 0; b < NUM_BUCKETS; b++) bucketLen[b] = 0;

    const noiseScale = 0.003;
    const speed = 1.2 * DRIFT_SPEED;
    const PI2 = Math.PI * 2;
    const invW = 1 / W;
    const invH = 1 / H;
    const gridSize = COLOR_GRID_SIZE;

    for (let i = 0; i < particleCount; i++) {
      let px = posX[i];
      let py = posY[i];

      const angle = noise2D(px * noiseScale, py * noiseScale + time * 10) * PI2;

      const v = velScale[i] * speed;
      px += Math.cos(angle) * v;
      py += Math.sin(angle) * v;

      if (mouseActive) {
        const mdx = px - mouseX;
        const mdy = py - mouseY;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md > 1 && md < 150) {
          let falloff = 1 - md / 150;
          falloff *= falloff;
          px += (mdx / md) * 3.0 * falloff;
          py += (mdy / md) * 3.0 * falloff;
        }
      }

      if (px < 0) px += W;
      else if (px >= W) px -= W;
      if (py < 0) py += H;
      else if (py >= H) py -= H;

      posX[i] = px;
      posY[i] = py;

      let gx = (px * invW * gridSize) | 0;
      let gy = (py * invH * gridSize) | 0;
      if (gx >= gridSize) gx = gridSize - 1;
      if (gy >= gridSize) gy = gridSize - 1;
      const ci = gy * gridSize + gx;

      const bi = isSparkle[i] ? NUM_NORMAL_ALPHAS + (brightnessIdx[i] & 1) : brightnessIdx[i];
      const bucketId = ci * NUM_ALPHAS + bi;
      const bLen = bucketLen[bucketId];
      if (bLen < MAX_PER_BUCKET) {
        bucketData[bucketId * MAX_PER_BUCKET + bLen] = i;
        bucketLen[bucketId] = bLen + 1;
      }
    }

    // Draw particles batched by color+alpha
    for (let bid = 0; bid < NUM_BUCKETS; bid++) {
      const count = bucketLen[bid];
      if (count === 0) continue;
      ctx.fillStyle = COLOR_STRINGS[bid];
      const baseOffset = bid * MAX_PER_BUCKET;
      for (let k = 0; k < count; k++) {
        const i = bucketData[baseOffset + k];
        ctx.fillRect(posX[i], posY[i], 2, 2);
      }
    }

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (reduceMotion) {
    drawStatic();
    return;
  }

  raf = requestAnimationFrame(draw);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      raf = requestAnimationFrame(draw);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroVisual);
} else {
  initHeroVisual();
}
