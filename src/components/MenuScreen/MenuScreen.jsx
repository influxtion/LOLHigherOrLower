import { MODE_LIST } from '../../utils/constants.js';
import styles from './MenuScreen.module.css';

export default function MenuScreen({ onStart }) {
  return (
    <main className={styles.screen}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>League of Legends</span>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>Higher</span>
          <span className={styles.titleOr}>or</span>
          <span className={styles.titleLine2}>Lower</span>
        </h1>
        <p className={styles.subtitle}>
          Two champions. One stat. Pick the higher one. Keep the streak alive.
        </p>
      </div>

      <div className={styles.modes}>
        <span className={styles.modesHeading}>Choose a mode</span>
        <div className={styles.modeGrid}>
          {MODE_LIST.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={styles.modeCard}
              onClick={() => onStart(mode.id)}
            >
              <span className={styles.modeCardLabel}>{mode.label}</span>
              <span className={styles.modeCardDescription}>
                {mode.description}
              </span>
              <span className={styles.modeCardArrow} aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
