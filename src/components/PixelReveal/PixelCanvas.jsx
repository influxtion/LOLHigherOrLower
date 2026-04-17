import { useEffect, useRef, useState } from 'react';
import { DDRAGON } from '../../utils/constants.js';
import styles from './PixelCanvas.module.css';

const CANVAS_W = 960;
const CANVAS_H = 540;

/**
 * Renders a champion splash art at a coarse pixel grid determined by `step`.
 * Downsampling is done by drawing to an offscreen low-res canvas then
 * upscaling to the visible canvas with image smoothing disabled. A null
 * `step` renders the splash at full resolution with smoothing on.
 *
 * On image load error (e.g. Community Dragon hasn't mirrored a brand-new
 * champion yet) we fall back to Data Dragon's loading art.
 */
export default function PixelCanvas({ championId, imageUrl, step }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setReady(false);
    setTriedFallback(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => {
      if (triedFallback) return;
      setTriedFallback(true);
      img.src = DDRAGON.loadingArtUrl(championId);
    };
    img.src = imageUrl;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // triedFallback intentionally not in deps — only re-run when champion changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championId, imageUrl]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (step == null) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawCover(ctx, img, CANVAS_W, CANVAS_H);
      return;
    }

    const lowW = step;
    const lowH = Math.max(1, Math.round((step * CANVAS_H) / CANVAS_W));

    const offscreen = document.createElement('canvas');
    offscreen.width = lowW;
    offscreen.height = lowH;
    const offCtx = offscreen.getContext('2d');
    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = 'medium';
    drawCover(offCtx, img, lowW, lowH);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, lowW, lowH, 0, 0, CANVAS_W, CANVAS_H);
  }, [ready, step]);

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={`${styles.canvas} ${step == null ? styles.smooth : ''}`}
        aria-label="Pixelated champion splash art"
      />
      {!ready ? <div className={styles.loading} aria-hidden /> : null}
    </div>
  );
}

/** cover-fit: scale source to cover the target, cropping overflow. */
function drawCover(ctx, img, targetW, targetH) {
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const targetAspect = targetW / targetH;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (srcAspect > targetAspect) {
    sw = img.naturalHeight * targetAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetAspect;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
}
