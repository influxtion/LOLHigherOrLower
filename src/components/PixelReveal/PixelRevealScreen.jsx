import { useState } from 'react';
import { useChampionData } from '../../hooks/useChampionData.js';
import { usePixelReveal, PIXEL_PHASE } from '../../hooks/usePixelReveal.js';
import { MINIGAMES } from '../../utils/constants.js';
import PixelCanvas from './PixelCanvas.jsx';
import ChampionSearchInput from './ChampionSearchInput.jsx';
import styles from './PixelRevealScreen.module.css';

export default function PixelRevealScreen({ onChangeMode }) {
  const { champions, loading, error } = useChampionData(MINIGAMES.PIXEL_REVEAL);
  const game = usePixelReveal(champions);
  const [flash, setFlash] = useState(false);

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
      <main className={styles.screen}>
        <div className={styles.message}>
          <p className={styles.messageTitle}>Couldn't load champions.</p>
          <p className={styles.messageBody}>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (loading || !game.champion) {
    return (
      <main className={styles.screen}>
        <div className={styles.message} aria-live="polite">
          <span className={styles.loadingText}>Summoning champions</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Fog of War</h1>
          <p className={styles.subtitle}>
            Identify the champion. Each wrong guess lifts the fog.
          </p>
        </div>
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
              onClick={onChangeMode}
            >
              Change Mode
            </button>
          </div>
        </div>
      ) : (
        <ChampionSearchInput
          champions={champions}
          onSubmit={handleSubmit}
          resetKey={game.champion.id}
        />
      )}
    </main>
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
