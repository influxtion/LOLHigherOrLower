import { useMemo } from 'react';
import { useChampionData } from '../../hooks/useChampionData.js';
import { useStatBuilder, PHASE, STAT_KEYS } from '../../hooks/useStatBuilder.js';
import GameOver from '../GameOver/GameOver.jsx';
import ChampionRoll from './ChampionRoll.jsx';
import StatSlotList from './StatSlotList.jsx';
import styles from './StatBuilderScreen.module.css';

/*
 * Top-level island for the Stat Builder game. Orchestrates the roll animation,
 * the rolled champion's splash, the 7-slot pick list, and the game-over
 * overlay once every slot is claimed.
 */
export default function StatBuilderScreen({ mode }) {
  const { champions, loading, error } = useChampionData(mode);
  const game = useStatBuilder(mode, champions);

  const goHome = () => {
    window.location.href = '/';
  };

  const filledCount = useMemo(
    () => STAT_KEYS.filter((k) => game.slots[k]).length,
    [game.slots],
  );

  if (error) {
    return (
      <main className={styles.screen}>
        <div className={styles.centerState}>
          <p className={styles.errorTitle}>Couldn't load champions.</p>
          <p className={styles.errorDetail}>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (loading || !champions?.length || !game.currentChampion) {
    return (
      <main className={styles.screen}>
        <div className={styles.centerState} aria-live="polite">
          <span className={styles.loadingText}>Summoning champions</span>
          <span className={styles.loadingDots} aria-hidden>
            <span /><span /><span />
          </span>
        </div>
      </main>
    );
  }

  const isRolling = game.phase === PHASE.rolling;
  const isPicking = game.phase === PHASE.picking;
  const isRevealing = game.phase === PHASE.revealing;
  const isGameOver = game.phase === PHASE.gameOver;

  const showIdentity = isPicking;

  return (
    <main className={styles.screen}>
      <div className={styles.arena}>
        <div className={styles.scoreStrip}>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Round</span>
            <span className={styles.scoreValue}>
              {Math.min(game.round, 7)} / 7
            </span>
          </div>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Running Avg</span>
            <span className={styles.scoreValue}>
              {filledCount > 0 ? `${Math.round(game.runningAverage)}%` : '—'}
            </span>
          </div>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Best</span>
            <span className={styles.scoreValue}>
              {game.highScore ? `${Math.round(game.highScore)}%` : '—'}
            </span>
          </div>
        </div>

        <div className={styles.stage}>
          <div className={styles.rollColumn}>
            <div className={styles.rollWrap}>
              <ChampionRoll
                target={game.currentChampion}
                pool={champions}
                runKey={game.round + ':' + game.currentChampion?.id}
                onSettle={game.onRollSettle}
              />
              {showIdentity ? (
                <div className={styles.identity}>
                  <span className={styles.identityName}>
                    {game.currentChampion.name}
                  </span>
                  <span className={styles.identityHint}>
                    Pick a stat to claim
                  </span>
                </div>
              ) : null}
            </div>
            <p className={styles.rollCaption}>
              {isRolling
                ? 'Rolling champion…'
                : isPicking
                  ? `Blind-pick one stat for ${game.currentChampion.name}`
                  : isRevealing
                    ? 'Stat claimed — rolling next champion'
                    : 'Build complete'}
            </p>
          </div>

          <div className={styles.slotsColumn}>
            <StatSlotList
              slots={game.slots}
              canPick={isPicking}
              highlightKey={isRevealing ? game.lastPick?.statKey : null}
              onPick={game.onSlotPick}
            />
          </div>
        </div>

        <section className={styles.howTo} aria-label="How to play Stat Builder">
          <h2 className={styles.howToTitle}>How Stat Builder Works</h2>
          <p>
            Each round a random champion rolls. You see their name, not their
            numbers. Pick one of seven stat slots (Health, Magic Power, AD,
            Attack Speed, Range, Armor, Magic Resist) to claim their value
            for. Slots lock once filled.
          </p>
          <p>
            After seven rolls your build is scored. Each claimed value is
            ranked against the full roster for that stat. Your final score is
            the average percentile across all seven slots, from 0 to 100.
          </p>
          <p>
            Tip: the best scores come from reading a champion by name. Give
            HP to tanks, range to ADCs, AD to fighters. Guess well and you
            clear 70 easily.
          </p>
        </section>
      </div>

      {isGameOver ? (
        <GameOver
          score={Math.round(game.finalScore)}
          highScore={Math.round(game.highScore)}
          modeLabel="Avg Percentile"
          scoreLabel="Your Build"
          highScoreLabel="All-Time Best"
          scoreSuffix="%"
          isNewHighScore={game.beatHighScore}
          onPlayAgain={game.onPlayAgain}
          onChangeMode={goHome}
        />
      ) : null}
    </main>
  );
}
