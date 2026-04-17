import { useMemo } from 'react';
import ChampionCard from '../ChampionCard/ChampionCard.jsx';
import VersusDivider from '../VersusDivider/VersusDivider.jsx';
import ScoreDisplay from '../ScoreDisplay/ScoreDisplay.jsx';
import GameOver from '../GameOver/GameOver.jsx';
import { useChampionData } from '../../hooks/useChampionData.js';
import { useGameState, PHASE } from '../../hooks/useGameState.js';
import { MODE_LIST } from '../../utils/constants.js';
import styles from './GameScreen.module.css';

export default function GameScreen({ mode, onChangeMode }) {
  const modeDef = useMemo(
    () => MODE_LIST.find((m) => m.id === mode) ?? MODE_LIST[0],
    [mode],
  );

  const { champions, loading, error } = useChampionData(mode);
  const game = useGameState(mode, champions);

  const isRevealing = game.phase === PHASE.revealing;
  const isGameOver = game.phase === PHASE.gameOver;
  const canClick = game.phase === PHASE.guessing;

  const leftOutcome = outcomeFor('left', game.pair, game.playerPick);
  const rightOutcome = outcomeFor('right', game.pair, game.playerPick);

  return (
    <main className={styles.screen}>
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
          <div className={styles.scoreRow}>
            <ScoreDisplay
              score={game.score}
              highScore={game.highScore}
              modeLabel={modeDef.statLabel}
            />
          </div>

          <div className={styles.arena}>
            <ChampionCard
              champion={game.pair.left}
              mode={mode}
              statLabel={modeDef.statLabel}
              revealed={isRevealing || isGameOver}
              outcome={leftOutcome}
              disabled={!canClick}
              onClick={() => game.onPick('left')}
            />
            <VersusDivider />
            <ChampionCard
              champion={game.pair.right}
              mode={mode}
              statLabel={modeDef.statLabel}
              revealed={isRevealing || isGameOver}
              outcome={rightOutcome}
              disabled={!canClick}
              onClick={() => game.onPick('right')}
            />
          </div>

          {isGameOver ? (
            <GameOver
              score={game.score}
              highScore={game.highScore}
              modeLabel={modeDef.statLabel}
              isNewHighScore={game.beatHighScore}
              onPlayAgain={game.onPlayAgain}
              onChangeMode={onChangeMode}
            />
          ) : null}
        </>
      )}
    </main>
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
