import { useMemo, useState } from 'react';
import { useChampionData } from '../../hooks/useChampionData.js';
import { usePixelReveal, PIXEL_PHASE } from '../../hooks/usePixelReveal.js';
import { MINIGAMES } from '../../utils/constants.js';
import PixelCanvas from './PixelCanvas.jsx';
import ChampionSearchInput from './ChampionSearchInput.jsx';
import styles from './PixelRevealScreen.module.css';

export default function PixelRevealScreen({ mode = MINIGAMES.PIXEL_REVEAL }) {
  const goHome = () => {
    window.location.href = '/';
  };

  const isSkins = mode === MINIGAMES.PIXEL_REVEAL_SKINS;
  const { champions, loading, error } = useChampionData(mode);
  const game = usePixelReveal(champions, mode);
  const [flash, setFlash] = useState(false);

  // Skins mode: the pool has multiple entries per champion (one per skin), all
  // sharing the champion's id. The search autocomplete needs unique champions.
  const searchChampions = useMemo(() => {
    if (!isSkins) return champions;
    const seen = new Set();
    const out = [];
    for (const c of champions) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, name: c.name });
    }
    return out;
  }, [champions, isSkins]);

  const isSolved = game.phase === PIXEL_PHASE.solved;

  const handleSubmit = (champion) => {
    const result = game.submitGuess(champion.id);
    if (result === 'wrong') {
      setFlash(false);
      requestAnimationFrame(() => setFlash(true));
    }
  };

  if (error) {
    return (
      <section className={styles.screen}>
        <div className={styles.message}>
          <p className={styles.messageTitle}>Couldn't load champions.</p>
          <p className={styles.messageBody}>Check your connection and try again.</p>
        </div>
      </section>
    );
  }

  if (loading || !game.champion) {
    return (
      <section className={styles.screen}>
        <div className={styles.message} aria-live="polite">
          <span className={styles.loadingText}>Summoning champions</span>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.stats}>
          <Stat label="Attempts" value={game.attempts} />
          <Stat
            label="Best"
            value={game.bestAttempts == null ? '—' : game.bestAttempts}
          />
        </div>
      </header>

      <div
        className={`${styles.canvasFrame} ${flash ? styles.flashWrong : ''}`}
        onAnimationEnd={() => setFlash(false)}
      >
        <PixelCanvas
          championId={game.champion.id}
          imageUrl={game.champion.imageUrl}
          step={game.step}
        />
      </div>

      {isSolved ? (
        <div className={styles.solved}>
          <p className={styles.solvedName}>{game.champion.name}</p>
          {isSkins && game.champion.skinName ? (
            <p className={styles.solvedSkin}>{game.champion.skinName}</p>
          ) : null}
          <p className={styles.solvedMeta}>
            Solved in {game.attempts}{' '}
            {game.attempts === 1 ? 'wrong guess' : 'wrong guesses'}
            {game.beatBest ? (
              <span className={styles.newBest}> · new best!</span>
            ) : null}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={game.nextChampion}
            >
              Next Champion
            </button>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={goHome}
            >
              Change Mode
            </button>
          </div>
        </div>
      ) : (
        <ChampionSearchInput
          champions={searchChampions}
          onSubmit={handleSubmit}
          resetKey={game.champion.id}
        />
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
