import { formatInteger } from '../../utils/format.js';
import styles from './GameOver.module.css';

export default function GameOver({
  score,
  highScore,
  modeLabel,
  isNewHighScore,
  onPlayAgain,
  onChangeMode,
}) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <span className={styles.eyebrow}>{modeLabel}</span>
        <h2 className={styles.title}>Game Over</h2>

        <div className={styles.scores}>
          <div className={styles.scoreBlock}>
            <span className={styles.scoreLabel}>Your Streak</span>
            <span className={styles.scoreValue}>{formatInteger(score)}</span>
          </div>
          <div className={styles.divider} aria-hidden />
          <div className={styles.scoreBlock}>
            <span className={styles.scoreLabel}>All-Time High</span>
            <span className={styles.scoreValue}>{formatInteger(highScore)}</span>
          </div>
        </div>

        {isNewHighScore ? (
          <span className={styles.badge}>New Personal Best</span>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onChangeMode}
          >
            Change Mode
          </button>
        </div>
      </div>
    </div>
  );
}
