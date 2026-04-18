import { GAME_GROUPS } from '../../utils/constants.js';
import ChampionOrbit from './ChampionOrbit.jsx';
import styles from './MenuScreen.module.css';

export default function MenuScreen({ onStart }) {
  return (
    <main className={styles.screen}>
      <ChampionOrbit />
      <div className={`${styles.hero} ${styles.foreground}`}>
        <span className={styles.eyebrow}>League of Legends</span>
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>Stat</span>
          <span className={styles.titleLine2}>Rift</span>
        </h1>
        <p className={styles.subtitle}>
          A collection of small League of Legends challenges.
          Know the roster — prove it.
        </p>
      </div>

      <div className={`${styles.groups} ${styles.foreground}`}>
        {GAME_GROUPS.map((group) => (
          <section key={group.id} className={styles.group}>
            <header className={styles.groupHead}>
              <h2 className={styles.groupLabel}>{group.label}</h2>
              <p className={styles.groupTagline}>{group.tagline}</p>
            </header>
            <div className={styles.modeGrid}>
              {group.entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.modeCard}
                  onClick={() => onStart(entry.id)}
                >
                  <span className={styles.modeCardLabel}>{entry.label}</span>
                  <span className={styles.modeCardDescription}>
                    {entry.description}
                  </span>
                  <span className={styles.modeCardArrow} aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
