import { useEffect, useRef, useState } from 'react';
import { fetchChampionTiles } from '../../utils/api.js';
import styles from './ChampionOrbit.module.css';

/*
 * Cinematic "galaxy of champions" background for the menu screen.
 *
 * Three tilted elliptical rings of champion tile portraits rotate at different
 * speeds and directions. Depth is faked per-particle with scale, opacity, and
 * blur; particles are z-sorted every frame so closer portraits occlude farther
 * ones. A CSS vignette (see module.css) keeps the title readable.
 */

const CONFIG = {
  ringCount: 3,
  particlesPerRing: [20, 26, 24],
  radii: [0.75, 1.1, 1.45],        // outer ring spills well past the viewport
  radiusJitter: 0.4,               // ±40% per particle — fully scatters the ring
  tiltsDeg: [50, 44, 56],           // flatter tilts spread tiles vertically too
  periodsS: [90, 120, 150],
  directions: [1, -1, 1],
  tileSizePx: 56,
  depthScale: [0.5, 1.3],
  depthOpacity: [0.38, 0.95],
  dprCap: 1.5,
  parallaxPx: 10,
  tileSampleCount: 64,
  readyThreshold: 0.4,             // fade in sooner so the menu doesn't feel empty
  cachedTilePx: 128,                // offscreen circular tile cache size
};

export default function ChampionOrbit() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const tilesRef = useRef(new Map()); // key -> pre-rendered circular HTMLCanvasElement
  const particlesRef = useRef([]);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const viewRef = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  // Preload a random subset of tile images. We hold the live refs so the draw
  // loop can draw whatever has loaded so far — tiles keep popping in until the
  // subset is complete, which is fine (canvas already faded in by then).
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    let readyFired = false;

    // Defer until the menu has painted — orbit assets must not block first
    // meaningful paint. requestIdleCallback where available, rAF otherwise.
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? (fn) => window.requestIdleCallback(fn, { timeout: 500 })
        : (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

    const cancelSchedule =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : cancelAnimationFrame;

    const scheduleId = schedule(() => {
      if (cancelled) return;

      fetchChampionTiles()
      .then((champions) => {
        if (cancelled || !champions.length) return;
        const sample = pickSample(champions, CONFIG.tileSampleCount);
        particlesRef.current = buildParticles(sample);

        sample.forEach((c) => {
          const img = new Image();
          let triedFallback = false;
          img.onload = () => {
            if (cancelled) return;
            tilesRef.current.set(c.key, bakeCircularTile(img));
            loadedCount += 1;
            if (
              !readyFired &&
              loadedCount >= Math.floor(sample.length * CONFIG.readyThreshold)
            ) {
              readyFired = true;
              setReady(true);
            }
          };
          img.onerror = () => {
            if (cancelled || triedFallback) return;
            triedFallback = true;
            img.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${c.id}_0.jpg`;
          };
          img.src = c.tileUrl;
        });
      })
      .catch(() => {
        /* Silent — the orbit is decorative; menu still works. */
      });
    });

    return () => {
      cancelled = true;
      cancelSchedule(scheduleId);
    };
  }, []);

  // Canvas lifecycle: sizing, rAF loop, visibility gating, reduced-motion.
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      viewRef.current = { w: rect.width, h: rect.height, dpr };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'low';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    let rafId = 0;
    let lastT = performance.now();
    let paused = false;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastT) / 1000); // clamp large gaps
      lastT = now;
      draw(ctx, dt, parallaxRef.current, particlesRef.current, tilesRef.current, viewRef.current);
      if (!paused && !reducedMotion) {
        rafId = requestAnimationFrame(frame);
      }
    };

    // Kick off; if reduced motion, draw one still frame and stop.
    if (reducedMotion) {
      // Advance once so positions aren't all at theta=0.
      draw(ctx, 0.001, { x: 0, y: 0 }, particlesRef.current, tilesRef.current, viewRef.current);
    } else {
      rafId = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        paused = true;
        cancelAnimationFrame(rafId);
      } else if (paused && !reducedMotion) {
        paused = false;
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Parallax — desktop only.
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const onPointer = (e) => {
      const rect = root.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      parallaxRef.current = {
        x: nx * CONFIG.parallaxPx * 2,
        y: ny * CONFIG.parallaxPx * 2,
      };
    };
    if (!coarse) window.addEventListener('pointermove', onPointer);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (!coarse) window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${ready ? styles.canvasReady : ''}`}
      />
      <div className={styles.vignette} />
    </div>
  );
}

/* ---------- pure helpers ---------- */

function pickSample(list, n) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function buildParticles(sample) {
  const out = [];
  let cursor = 0;
  const j = CONFIG.radiusJitter;
  for (let ring = 0; ring < CONFIG.ringCount; ring++) {
    const count = CONFIG.particlesPerRing[ring];
    const tiltRad = (CONFIG.tiltsDeg[ring] * Math.PI) / 180;
    const period = CONFIG.periodsS[ring];
    const dir = CONFIG.directions[ring];
    const omega = (dir * 2 * Math.PI) / period;
    for (let i = 0; i < count; i++) {
      const champion = sample[cursor % sample.length];
      cursor += 1;
      out.push({
        ring,
        theta: (i / count) * Math.PI * 2 + Math.random() * 0.6,
        radiusJitter: 1 + (Math.random() * 2 - 1) * j,
        sizeJitter: 0.85 + Math.random() * 0.4,
        omega,
        cosTilt: Math.cos(tiltRad),
        sinTilt: Math.sin(tiltRad),
        key: champion.key,
      });
    }
  }
  return out;
}

/* Bake a source image into a circular offscreen canvas. Doing the clip once
   on load means the hot draw loop is a single drawImage per particle — no
   save/clip/restore and no blur filter per frame. */
function bakeCircularTile(img) {
  const size = CONFIG.cachedTilePx;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const cx = c.getContext('2d');
  cx.imageSmoothingQuality = 'high';
  cx.beginPath();
  cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  cx.closePath();
  cx.clip();
  // cover-fit the source into the circle
  const srcAspect = img.naturalWidth / img.naturalHeight;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcAspect > 1) {
    sw = img.naturalHeight;
    sx = (img.naturalWidth - sw) / 2;
  } else if (srcAspect < 1) {
    sh = img.naturalWidth;
    sy = (img.naturalHeight - sh) / 2;
  }
  cx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  return c;
}

/* draw is a hot path. Transform is set once per resize; tiles are baked into
   circular offscreen canvases at load time. Per-particle cost is: a handful
   of sin/cos, one drawImage, and (for front particles only) one arc+stroke. */
function draw(ctx, dt, parallax, particles, tiles, view) {
  const { w, h } = view;
  if (!w || !h) return;
  ctx.clearRect(0, 0, w, h);

  if (!particles || !particles.length) return;

  const cx = w / 2 + parallax.x;
  const cy = h / 2 + parallax.y;
  const baseR = Math.min(w, h) * 0.55;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.theta += p.omega * dt;
    const ringR = baseR * CONFIG.radii[p.ring] * p.radiusJitter;
    const lx = Math.cos(p.theta) * ringR;
    const ly = Math.sin(p.theta) * ringR;
    p._x = cx + lx;
    p._y = cy + ly * p.cosTilt;
    p._z = ly * p.sinTilt;
    p._depth01 = (p._z + ringR) / (2 * ringR);
  }

  particles.sort(byZ);

  const minScale = CONFIG.depthScale[0];
  const maxScale = CONFIG.depthScale[1];
  const minAlpha = CONFIG.depthOpacity[0];
  const maxAlpha = CONFIG.depthOpacity[1];

  // Cull to a generous bbox so off-screen particles (outer ring can exceed the
  // viewport by design) don't pay for drawImage.
  const pad = CONFIG.tileSizePx;
  const minX = -pad, minY = -pad;
  const maxX = w + pad, maxY = h + pad;

  let prevAlpha = -1;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const tile = tiles.get(p.key);
    if (!tile) continue;
    if (p._x < minX || p._x > maxX || p._y < minY || p._y > maxY) continue;

    const d = p._depth01;
    const size = CONFIG.tileSizePx * p.sizeJitter * lerp(minScale, maxScale, d);
    const r = size / 2;
    const alpha = lerp(minAlpha, maxAlpha, d);
    if (alpha !== prevAlpha) {
      ctx.globalAlpha = alpha;
      prevAlpha = alpha;
    }
    ctx.drawImage(tile, p._x - r, p._y - r, size, size);

    if (d > 0.82) {
      ctx.globalAlpha = (d - 0.82) * 5 * 0.55;
      prevAlpha = -1;
      ctx.strokeStyle = '#c8a25a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p._x, p._y, r + 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function byZ(a, b) {
  return a._z - b._z;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
