/*
 * Hero background: "Kinetic Grid" — a spring-mesh of neon lines that ripples
 * with slow impulses, re-paletted to CineMon's violet family.
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

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;

  // ── Tunables (softened from the original for a background role) ──
  const IMPULSE_RATE = 0.45;
  const SPRING_TENSION = 1.0;
  const IMPULSE_STRENGTH = 0.8;
  const COLS = 40;
  const ROWS = 25;
  const DAMPING = 0.978;
  const RETURN_FORCE = 0.003;
  const SPRING_K_BASE = 0.12;

  const nodeCount = COLS * ROWS;
  const posX = new Float32Array(nodeCount);
  const posY = new Float32Array(nodeCount);
  const velX = new Float32Array(nodeCount);
  const velY = new Float32Array(nodeCount);
  const restX = new Float32Array(nodeCount);
  const restY = new Float32Array(nodeCount);

  let springs = [];
  const flashes = [];
  let screenFlash = 0;

  let lastTime = 0;
  let timeSinceImpulse = 0;

  let spacingX = 0;
  let spacingY = 0;
  let marginX = 0;
  let marginY = 0;

  const idx = (col, row) => row * COLS + col;

  function buildGrid() {
    marginX = W * 0.04;
    marginY = H * 0.04;
    spacingX = (W - marginX * 2) / (COLS - 1);
    spacingY = (H - marginY * 2) / (ROWS - 1);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        const x = marginX + c * spacingX;
        const y = marginY + r * spacingY;
        restX[i] = x;
        restY[i] = y;
        posX[i] = x;
        posY[i] = y;
        velX[i] = 0;
        velY[i] = 0;
      }
    }

    springs = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        if (c < COLS - 1) springs.push(i, idx(c + 1, r), spacingX);
        if (r < ROWS - 1) springs.push(i, idx(c, r + 1), spacingY);
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
    ctx.fillStyle = "#06050d";
    ctx.fillRect(0, 0, W, H);
  }

  // Gentle impulses from the pointer as it moves across the hero
  let lastPointerImpulse = 0;
  window.addEventListener("pointermove", (e) => {
    if (reduceMotion) return;
    const now = performance.now();
    if (now - lastPointerImpulse < 180) return;
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    lastPointerImpulse = now;
    injectRadialImpulse(e.clientX - r.left, e.clientY - r.top, 5, false);
  }, { passive: true });

  function injectRadialImpulse(mx, my, strength, withFlash) {
    const radius = 4;
    const reach = radius * Math.max(spacingX, spacingY);
    for (let i = 0; i < nodeCount; i++) {
      const dx = restX[i] - mx;
      const dy = restY[i] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < reach && dist > 0.1) {
        let falloff = 1 - dist / reach;
        falloff *= falloff;
        velX[i] += (dx / dist) * strength * falloff;
        velY[i] += (dy / dist) * strength * falloff;
      }
    }
    if (withFlash) flashes.push({ x: mx, y: my, life: 1.0, ring: 1.0 });
  }

  function injectEdgeImpulse() {
    const strength = (18 + Math.random() * 12) * IMPULSE_STRENGTH;
    const edge = Math.floor(Math.random() * 4);
    const regionSize = 4 + Math.floor(Math.random() * 6);
    let flashX, flashY;

    if (edge === 0 || edge === 2) {
      const row = edge === 0 ? 0 : ROWS - 1;
      const dir = edge === 0 ? 1 : -1;
      const start = Math.floor(Math.random() * Math.max(1, COLS - regionSize));
      flashX = marginX + (start + regionSize * 0.5) * spacingX;
      flashY = marginY + row * spacingY;
      for (let c = start; c < start + regionSize && c < COLS; c++) {
        const falloff = 1 - Math.abs(c - start - regionSize * 0.5) / (regionSize * 0.5);
        velY[idx(c, row)] += dir * strength * falloff * falloff;
      }
    } else {
      const col = edge === 1 ? COLS - 1 : 0;
      const dir = edge === 1 ? -1 : 1;
      const start = Math.floor(Math.random() * Math.max(1, ROWS - regionSize));
      flashX = marginX + col * spacingX;
      flashY = marginY + (start + regionSize * 0.5) * spacingY;
      for (let r = start; r < start + regionSize && r < ROWS; r++) {
        const falloff = 1 - Math.abs(r - start - regionSize * 0.5) / (regionSize * 0.5);
        velX[idx(col, r)] += dir * strength * falloff * falloff;
      }
    }

    flashes.push({ x: flashX, y: flashY, life: 1.0, ring: 1.0 });
    screenFlash = 0.03;
  }

  function simulate() {
    const springK = SPRING_K_BASE * SPRING_TENSION;
    const springCount = springs.length / 3;

    for (let s = 0; s < springCount; s++) {
      const s3 = s * 3;
      const a = springs[s3];
      const b = springs[s3 + 1];
      const restLen = springs[s3 + 2];
      const dx = posX[b] - posX[a];
      const dy = posY[b] - posY[a];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) continue;
      const force = (springK * (dist - restLen)) / dist;
      const fx = dx * force;
      const fy = dy * force;
      velX[a] += fx;
      velY[a] += fy;
      velX[b] -= fx;
      velY[b] -= fy;
    }

    for (let i = 0; i < nodeCount; i++) {
      velX[i] += (restX[i] - posX[i]) * RETURN_FORCE;
      velY[i] += (restY[i] - posY[i]) * RETURN_FORCE;
      velX[i] *= DAMPING;
      velY[i] *= DAMPING;
      posX[i] += velX[i];
      posY[i] += velY[i];
    }
  }

  // Tension color ramp: resting deep violet → brand violet → lavender → white-hot
  function tensionColor(tension) {
    const t = tension < 0 ? 0 : tension > 1 ? 1 : tension;
    let r, g, b, a, f;

    if (t < 0.1) {
      f = t / 0.1;
      r = 26 + f * 14; g = 22 + f * 12; b = 62 + f * 24;
      a = 0.25 + f * 0.1;
    } else if (t < 0.3) {
      f = (t - 0.1) / 0.2;
      r = 40 + f * 40; g = 34 + f * 34; b = 86 + f * 90;
      a = 0.35 + f * 0.2;
    } else if (t < 0.55) {
      f = (t - 0.3) / 0.25;
      r = 80 + f * 50; g = 68 + f * 50; b = 176 + f * 63;
      a = 0.55 + f * 0.2;
    } else if (t < 0.8) {
      f = (t - 0.55) / 0.25;
      r = 130 + f * 60; g = 118 + f * 65; b = 239 + f * 16;
      a = 0.75 + f * 0.15;
    } else {
      f = (t - 0.8) / 0.2;
      r = 190 + f * 55; g = 183 + f * 62; b = 255;
      a = 0.9 + f * 0.1;
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
  }

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  let raf = null;

  function drawStaticGrid() {
    ctx.fillStyle = "#06050d";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const springCount = springs.length / 3;
    for (let s = 0; s < springCount; s++) {
      const s3 = s * 3;
      const a = springs[s3];
      const b = springs[s3 + 1];
      ctx.beginPath();
      ctx.moveTo(posX[a], posY[a]);
      ctx.lineTo(posX[b], posY[b]);
      ctx.strokeStyle = "rgba(102,93,239,0.14)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function render(now) {
    raf = null;
    if (!visible) {
      if (!reduceMotion) raf = requestAnimationFrame(render);
      return;
    }

    const time = now * 0.001;
    let dt = lastTime === 0 ? 0.016 : time - lastTime;
    if (dt > 0.1) dt = 0.016;
    lastTime = time;

    timeSinceImpulse += dt;
    const impulseInterval = 1.8 / IMPULSE_RATE;
    if (timeSinceImpulse >= impulseInterval) {
      injectEdgeImpulse();
      timeSinceImpulse -= impulseInterval;
      timeSinceImpulse -= Math.random() * impulseInterval * 0.3;
    }

    simulate();

    // Trail persistence toward ink
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(6, 5, 13, 0.35)";
    ctx.fillRect(0, 0, W, H);

    if (screenFlash > 0.001) {
      ctx.fillStyle = "rgba(120, 105, 255, " + screenFlash.toFixed(4) + ")";
      ctx.fillRect(0, 0, W, H);
      screenFlash *= 0.88;
    }

    const avgSpacing = (spacingX + spacingY) * 0.5;
    const tensionScale = 1.0 / (avgSpacing * 0.35);
    const breathe = 0.85 + 0.15 * Math.sin(time * 0.8);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    const springCount = springs.length / 3;

    // Layer 1: soft wide glow
    for (let s = 0; s < springCount; s++) {
      const s3 = s * 3;
      const a = springs[s3];
      const b = springs[s3 + 1];
      const restLen = springs[s3 + 2];
      const ax = posX[a], ay = posY[a];
      const bx = posX[b], by = posY[b];
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tension = Math.abs(dist - restLen) * tensionScale;
      const col = tensionColor(tension);
      const glowAlpha = (0.04 + tension * 0.18) * breathe;
      if (glowAlpha > 0.005) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = "rgba(" + col.r + "," + col.g + "," + col.b + "," + glowAlpha.toFixed(4) + ")";
        ctx.lineWidth = 3.5 + tension * 8;
        ctx.stroke();
      }
    }

    // Layer 2: sharp core lines
    for (let s = 0; s < springCount; s++) {
      const s3 = s * 3;
      const a = springs[s3];
      const b = springs[s3 + 1];
      const restLen = springs[s3 + 2];
      const ax = posX[a], ay = posY[a];
      const bx = posX[b], by = posY[b];
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tension = Math.abs(dist - restLen) * tensionScale;
      const col = tensionColor(tension);
      let coreAlpha = (0.12 + tension * 0.6) * breathe;
      if (coreAlpha > 1) coreAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = "rgba(" + col.r + "," + col.g + "," + col.b + "," + coreAlpha.toFixed(4) + ")";
      ctx.lineWidth = 0.6 + tension * 1.6;
      ctx.stroke();
    }

    // Layer 3: nodes + wavefront bloom (violet → lavender → white)
    const velocityThreshold = 3.0;
    for (let i = 0; i < nodeCount; i++) {
      const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
      let brightness = speed * 0.2;
      if (brightness < 0.02) continue;
      if (brightness > 1) brightness = 1;

      let nr, ng, nb, nf;
      if (brightness < 0.25) {
        nf = brightness / 0.25;
        nr = 45 + nf * 57; ng = 38 + nf * 55; nb = 110 + nf * 129;
      } else if (brightness < 0.6) {
        nf = (brightness - 0.25) / 0.35;
        nr = 102 + nf * 60; ng = 93 + nf * 60; nb = 239 + nf * 16;
      } else {
        nf = (brightness - 0.6) / 0.4;
        nr = 162 + nf * 80; ng = 153 + nf * 90; nb = 255;
      }

      const nodeAlpha = 0.12 + brightness * 0.75;
      const nodeRadius = 0.8 + brightness * 2.0;

      if (speed > velocityThreshold) {
        let bloom = (speed - velocityThreshold) / 15.0;
        if (bloom > 1) bloom = 1;
        ctx.beginPath();
        ctx.arc(posX[i], posY[i], 4 + bloom * 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,105,255," + (bloom * 0.35).toFixed(3) + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(posX[i], posY[i], 2 + bloom * 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(225,220,255," + (bloom * 0.6).toFixed(3) + ")";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(posX[i], posY[i], nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + Math.round(nr) + "," + Math.round(ng) + "," + Math.round(nb) + "," + nodeAlpha.toFixed(3) + ")";
      ctx.fill();
    }

    // Layer 4: impulse flashes
    for (let fi = flashes.length - 1; fi >= 0; fi--) {
      const flash = flashes[fi];
      flash.life -= dt * 2.0;
      if (flash.ring !== undefined) flash.ring -= dt * 1.8;
      if (flash.life <= 0) {
        flashes.splice(fi, 1);
        continue;
      }
      const fl = flash.life;
      const flashRadius = (1 - fl) * 100 + 20;
      const flashAlpha = fl * fl * 0.7;

      const grad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flashRadius);
      grad.addColorStop(0, "rgba(210,205,255," + flashAlpha.toFixed(3) + ")");
      grad.addColorStop(0.2, "rgba(130,118,255," + (flashAlpha * 0.6).toFixed(3) + ")");
      grad.addColorStop(0.5, "rgba(80,68,200," + (flashAlpha * 0.25).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(40,32,120,0)");
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flashRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (flash.ring !== undefined && flash.ring > 0) {
        const ringRadius = 15 + (1 - flash.ring) * 120;
        const ringAlpha = flash.ring * flash.ring * 0.45;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(140,128,255," + ringAlpha.toFixed(3) + ")";
        ctx.lineWidth = 2.0 * flash.ring;
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = "source-over";

    // Vignette toward ink
    const maxDim = Math.max(W, H);
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, maxDim * 0.25, W * 0.5, H * 0.5, maxDim * 0.72);
    vignette.addColorStop(0, "rgba(6, 5, 13, 0)");
    vignette.addColorStop(1, "rgba(6, 5, 13, 0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    raf = requestAnimationFrame(render);
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) drawStaticGrid();
  }, { passive: true });
  resize();

  if (reduceMotion) {
    drawStaticGrid();
    return;
  }

  injectEdgeImpulse();
  raf = requestAnimationFrame(render);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      lastTime = 0;
      raf = requestAnimationFrame(render);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroVisual);
} else {
  initHeroVisual();
}
