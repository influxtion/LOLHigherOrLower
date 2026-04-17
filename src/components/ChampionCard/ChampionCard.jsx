import { useEffect, useState } from 'react';
import { DDRAGON } from '../../utils/constants.js';
import { formatStat } from '../../utils/format.js';
import styles from './ChampionCard.module.css';

/**
 * Visual states:
 *   hidden     — stat not yet revealed, shows "?"
 *   correct    — revealed, player was right about this card (or other card)
 *   incorrect  — revealed, player was wrong
 *
 * The component is intentionally dumb: parent decides state + onClick behavior.
 */
export default function ChampionCard({
  champion,
  mode,
  statLabel,
  revealed,
  outcome,
  disabled,
  onClick,
}) {
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
  }, [champion?.id]);

  if (!champion) {
    return <div className={`${styles.card} ${styles.empty}`} aria-hidden />;
  }

  const stateClass = revealed
    ? outcome === 'correct'
      ? styles.correct
      : styles.incorrect
    : styles.hidden;

  return (
    <button
      type="button"
      className={`${styles.card} ${stateClass}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Choose ${champion.name}`}
    >
      <img
        key={champion.id}
        src={champion.imageUrl}
        alt=""
        className={`${styles.art} ${imageReady ? styles.artReady : ''}`}
        onLoad={() => setImageReady(true)}
        draggable="false"
        referrerPolicy="no-referrer"
        onError={(event) => {
          // Data Dragon sometimes lags behind for a brand-new champion's
          // loading art — fall back to splash art which has wider coverage.
          const fallback = `${DDRAGON.loadingArtUrl(champion.id).replace(
            '/loading/',
            '/splash/',
          )}`;
          if (event.currentTarget.src !== fallback) {
            event.currentTarget.src = fallback;
          }
        }}
      />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.content}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{champion.name}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{statLabel}</span>
          <span className={styles.statValue}>
            {revealed ? formatStat(mode, champion.stat) : '?'}
          </span>
        </div>
      </div>
    </button>
  );
}
