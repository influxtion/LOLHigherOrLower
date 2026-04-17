import { formatInteger } from '../../utils/format.js';
import styles from './ScoreDisplay.module.css';

export default function ScoreDisplay({ score, highScore, modeLabel }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.streakBox}>
        <span className={styles.streakLabel}>Current Streak</span>
        <span className={styles.streakValue}>{formatInteger(score)}</span>
        {modeLabel ? <span className={styles.mode}>{modeLabel}</span> : null}
      </div>
      <div className={styles.highScoreLine}>
        <span className={styles.highScoreLabel}>All-Time High</span>
        <span className={styles.highScoreValue}>{formatInteger(highScore)}</span>
      </div>
    </div>
  );
}
