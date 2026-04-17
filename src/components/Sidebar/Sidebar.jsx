import { MODE_LIST } from '../../utils/constants.js';
import styles from './Sidebar.module.css';

export default function Sidebar({ activeMode, onSelectMode, onHome }) {
  return (
    <aside className={styles.sidebar} aria-label="Game mode navigation">
      <button
        type="button"
        className={styles.brand}
        onClick={onHome}
        aria-label="Return to menu"
      >
        <span className={styles.brandMark}>L</span>
        <span className={styles.brandText}>
          <span className={styles.brandLine1}>Higher</span>
          <span className={styles.brandLine2}>or Lower</span>
        </span>
      </button>

      <nav className={styles.nav}>
        <span className={styles.navHeading}>Mode</span>
        <ul className={styles.modeList}>
          {MODE_LIST.map((mode) => {
            const isActive = mode.id === activeMode;
            return (
              <li key={mode.id}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    isActive ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => onSelectMode(mode.id)}
                  aria-pressed={isActive}
                >
                  <span className={styles.modeBullet} aria-hidden />
                  <span className={styles.modeLabelBlock}>
                    <span className={styles.modeLabel}>{mode.label}</span>
                    <span className={styles.modeDescription}>
                      {mode.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.foot}>
        <span className={styles.footText}>Data: Riot Data Dragon</span>
      </div>
    </aside>
  );
}
