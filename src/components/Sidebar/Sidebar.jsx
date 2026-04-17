import { GAME_GROUPS } from '../../utils/constants.js';
import styles from './Sidebar.module.css';

export default function Sidebar({ activeMode, onSelectMode, onHome }) {
  return (
    <aside className={styles.sidebar} aria-label="Game navigation">
      <button
        type="button"
        className={styles.brand}
        onClick={onHome}
        aria-label="Return to menu"
      >
        <span className={styles.brandMark}>S</span>
        <span className={styles.brandText}>
          <span className={styles.brandLine1}>Stat</span>
          <span className={styles.brandLine2}>Rift</span>
        </span>
      </button>

      <nav className={styles.nav}>
        {GAME_GROUPS.map((group, i) => (
          <section
            key={group.id}
            className={`${styles.group} ${i > 0 ? styles.groupDivider : ''}`}
          >
            <div className={styles.groupHead}>
              <span className={styles.groupLabel}>{group.label}</span>
              <span className={styles.groupTagline}>{group.tagline}</span>
            </div>
            <ul className={styles.modeList}>
              {group.entries.map((entry) => (
                <ModeButton
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeMode}
                  onSelect={onSelectMode}
                />
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <div className={styles.foot}>
        <span className={styles.footText}>Data: Riot Data Dragon</span>
      </div>
    </aside>
  );
}

function ModeButton({ entry, isActive, onSelect }) {
  return (
    <li>
      <button
        type="button"
        className={`${styles.modeButton} ${
          isActive ? styles.modeButtonActive : ''
        }`}
        onClick={() => onSelect(entry.id)}
        aria-pressed={isActive}
      >
        <span className={styles.modeBullet} aria-hidden />
        <span className={styles.modeLabelBlock}>
          <span className={styles.modeLabel}>{entry.label}</span>
          <span className={styles.modeDescription}>{entry.description}</span>
        </span>
      </button>
    </li>
  );
}
