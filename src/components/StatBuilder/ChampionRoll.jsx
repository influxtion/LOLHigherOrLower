import { useEffect, useRef } from 'react';
import { DDRAGON } from '../../utils/constants.js';
import styles from './ChampionRoll.module.css';

/*
 * "Rolling the dice" animation in the style of elo.rip: a box filled with
 * circular champion tile icons bouncing off the walls. Every ~130ms one of
 * the decoys fades out, until only the pre-chosen target remains. That one
 * champion is the rolled pick.
 *
 * Pre-determining the winner (via the `target` prop) lets the game logic
 * drive the roll instead of the animation — the hook already committed to a
 * champion before this component mounts.
 */

const CONFIG = {
  decoyCount: 17,           // total particles = decoyCount + 1 (the target)
  tilePx: 64,
  minSpeed: 120,            // px/s
  maxSpeed: 240,
  eliminationStartMs: 650,
  eliminationIntervalMs: 130,
  eliminationFadeMs: 260,
  winnerHoldMs: 420,        // final pause after last decoy fades
  cachedTilePx: 128,
  dprCap: 1.5,
};

export default function ChampionRoll({ target, pool, runKey, onSettle }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const tilesRef = useRef(new Map()); // championId -> baked circular canvas
  const viewRef = useRef({ w: 0, h: 0, dpr: 1 });
  const stateRef = useRef({ startedAt: 0, settled: false });

  // Rebuild particles + preload tiles whenever the round key changes.
  useEffect(() => {
    if (!target || !pool?.length) return;
    let cancelled = false;

    stateRef.current = { startedAt: performance.now(), settled: false };

    const decoys = pickDistinct(pool, CONFIG.decoyCount, [target.id]);
    const roster = [target, ...decoys];

    particlesRef.current = roster.map((champion, i) => ({
      champion,
      isTarget: i === 0,
      x: Math.random(),       // normalized 0..1 until viewport is sized
      y: Math.random(),
      vx: randSign() * rand(CONFIG.minSpeed, CONFIG.maxSpeed),
      vy: randSign() * rand(CONFIG.minSpeed, CONFIG.maxSpeed),
      opacity: 1,
      fadingFrom: null,       // ms timestamp when fade began
    }));

    roster.forEach((champion) => {
      if (tilesRef.current.has(champion.id)) return;
      const img = new Image();
      let triedFallback = false;
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (cancelled) return;
        tilesRef.current.set(champion.id, bakeCircularTile(img));
      };
      img.onerror = () => {
        if (cancelled || triedFallback) return;
        triedFallback = true;
        img.src = DDRAGON.loadingArtUrl(champion.id);
      };
      img.src = champion.tileUrl || DDRAGON.loadingArtUrl(champion.id);
    });

    return () => {
      cancelled = true;
    };
  }, [runKey, target, pool]);

  // Canvas rAF loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    let lastElim = 0;

    const frame = (now) => {
      const { w, h } = viewRef.current;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      const particles = particlesRef.current;
      const state = stateRef.current;
      const elapsed = now - state.startedAt;
      const r = CONFIG.tilePx / 2;

      // Spawn positions for particles still in their initial [0..1] form.
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.x <= 1 && p.y <= 1 && p.x >= 0 && p.y >= 0 && p._spawned !== true) {
          p.x = r + p.x * Math.max(1, w - 2 * r);
          p.y = r + p.y * Math.max(1, h - 2 * r);
          p._spawned = true;
        }
      }

      // Elimination scheduler: every interval, start fading one non-target
      // particle that isn't already fading.
      if (
        elapsed >= CONFIG.eliminationStartMs &&
        now - lastElim >= CONFIG.eliminationIntervalMs
      ) {
        const candidates = particles.filter(
          (p) => !p.isTarget && p.opacity > 0 && p.fadingFrom == null,
        );
        if (candidates.length > 0) {
          const victim = candidates[Math.floor(Math.random() * candidates.length)];
          victim.fadingFrom = now;
          lastElim = now;
        }
      }

      // Update physics + fades.
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p._spawned !== true) continue;

        if (p.fadingFrom != null) {
          const t = (now - p.fadingFrom) / CONFIG.eliminationFadeMs;
          p.opacity = Math.max(0, 1 - t);
        }

        if (p.opacity <= 0) continue;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < r) {
          p.x = r;
          p.vx = Math.abs(p.vx);
        } else if (p.x > w - r) {
          p.x = w - r;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < r) {
          p.y = r;
          p.vy = Math.abs(p.vy);
        } else if (p.y > h - r) {
          p.y = h - r;
          p.vy = -Math.abs(p.vy);
        }
      }

      // Once only the target is alive, ease it toward the center and emit
      // onSettle after a brief hold.
      const aliveDecoys = particles.filter((p) => !p.isTarget && p.opacity > 0);
      if (aliveDecoys.length === 0 && !state.settled) {
        const targetP = particles.find((p) => p.isTarget);
        if (targetP) {
          const cx = w / 2;
          const cy = h / 2;
          const k = 6 * dt; // easing rate
          targetP.x += (cx - targetP.x) * Math.min(1, k);
          targetP.y += (cy - targetP.y) * Math.min(1, k);
          targetP.vx = 0;
          targetP.vy = 0;
          if (!state.winnerReachedAt) state.winnerReachedAt = now;
          if (now - state.winnerReachedAt >= CONFIG.winnerHoldMs) {
            state.settled = true;
            try { onSettle && onSettle(); } catch { /* ignore */ }
          }
        }
      }

      // Draw.
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p._spawned !== true || p.opacity <= 0) continue;
        const tile = tilesRef.current.get(p.champion.id);
        ctx.globalAlpha = p.opacity;
        if (tile) {
          ctx.drawImage(tile, p.x - r, p.y - r, CONFIG.tilePx, CONFIG.tilePx);
        } else {
          // Not loaded yet: draw a placeholder disc so the roll never looks empty.
          ctx.fillStyle = '#1f2a3a';
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.isTarget && aliveDecoys.length === 0) {
          ctx.globalAlpha = p.opacity;
          ctx.strokeStyle = '#c8a25a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [runKey, onSettle]);

  return (
    <div ref={rootRef} className={styles.root} aria-label="Rolling champion">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

/* ---------- helpers ---------- */

function pickDistinct(pool, n, excludeIds) {
  const exclude = new Set(excludeIds);
  const copy = pool.filter((c) => !exclude.has(c.id));
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

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
