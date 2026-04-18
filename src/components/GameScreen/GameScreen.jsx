import { useMemo } from 'react';
import ChampionCard from '../ChampionCard/ChampionCard.jsx';
import VersusDivider from '../VersusDivider/VersusDivider.jsx';
import ScoreDisplay from '../ScoreDisplay/ScoreDisplay.jsx';
import GameOver from '../GameOver/GameOver.jsx';
import { useChampionData } from '../../hooks/useChampionData.js';
import { useGameState, PHASE } from '../../hooks/useGameState.js';
import { MODE_LIST } from '../../utils/constants.js';
import styles from './GameScreen.module.css';

export default function GameScreen({ mode }) {
  const goHome = () => {
    window.location.href = '/';
  };

  const modeDef = useMemo(
    () => MODE_LIST.find((m) => m.id === mode) ?? MODE_LIST[0],
    [mode],
  );

  const { champions, loading, error } = useChampionData(mode);
  const game = useGameState(mode, champions);

  const isRevealing = game.phase === PHASE.revealing;
  const isGameOver = game.phase === PHASE.gameOver;
  const canClick = game.phase === PHASE.guessing;

  // After the conveyor belt has moved at least once (score > 0), the left
  // card is a known anchor and its stat stays visible. On the very first
  // round both cards are hidden until the player commits.
  const conveyorActive = game.score > 0;
  const leftRevealed = conveyorActive || isRevealing || isGameOver;
  const rightRevealed = isRevealing || isGameOver;

  const leftOutcome = outcomeFor('left', game.pair, game.playerPick);
  const rightOutcome = outcomeFor('right', game.pair, game.playerPick);

  return (
    <section className={styles.screen}>
      {error ? (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>Couldn't load champions.</p>
          <p className={styles.errorDetail}>
            Check your connection and try again.
          </p>
        </div>
      ) : loading || !game.pair.left || !game.pair.right ? (
        <div className={styles.loadingState} aria-live="polite">
          <span className={styles.loadingText}>Summoning champions</span>
          <span className={styles.loadingDots} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </div>
      ) : (
        <>
          <div className={styles.arena}>
            <ChampionCard
              champion={game.pair.left}
              mode={mode}
              statLabel={modeDef.statLabel}
              revealed={leftRevealed}
              outcome={leftOutcome}
              disabled={!canClick}
              onClick={() => game.onPick('left')}
              side="left"
            />
            <ChampionCard
              champion={game.pair.right}
              mode={mode}
              statLabel={modeDef.statLabel}
              revealed={rightRevealed}
              outcome={rightOutcome}
              disabled={!canClick}
              onClick={() => game.onPick('right')}
              side="right"
            />
            <div className={styles.dividerOverlay} aria-hidden>
              <VersusDivider />
            </div>
            <div className={styles.scoreOverlay}>
              <ScoreDisplay
                score={game.score}
                highScore={game.highScore}
                modeLabel={modeDef.statLabel}
              />
            </div>
          </div>

          {isGameOver ? (
            <GameOver
              score={game.score}
              highScore={game.highScore}
              modeLabel={modeDef.statLabel}
              isNewHighScore={game.beatHighScore}
              onPlayAgain={game.onPlayAgain}
              onChangeMode={goHome}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * Which reveal outcome does a given side deserve?
 *
 * The side the player picked carries the "player got it right / wrong" signal;
 * the opposite side shows the opposite. Ties are treated as correct for the
 * player (see useGameState).
 */
function outcomeFor(side, pair, playerPick) {
  if (!playerPick || !pair.left || !pair.right) return null;
  const leftStat = pair.left.stat;
  const rightStat = pair.right.stat;
  const pickedStat = playerPick === 'left' ? leftStat : rightStat;
  const otherStat = playerPick === 'left' ? rightStat : leftStat;
  const playerCorrect = pickedStat >= otherStat;

  if (side === playerPick) return playerCorrect ? 'correct' : 'incorrect';
  return playerCorrect ? 'incorrect' : 'correct';
}
