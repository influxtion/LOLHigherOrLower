import { useCallback, useEffect, useRef, useState } from 'react';
import { pickPair, pickRandomExcluding } from '../utils/random.js';
import { highScoreKeyFor, TIMINGS } from '../utils/constants.js';
import { useLocalStorage } from './useLocalStorage.js';

/*
 * Round phases:
 *   loading   — champions are still being fetched
 *   guessing  — both cards hidden, waiting on the player's click
 *   revealing — stats are being revealed; clicks are ignored
 *   gameOver  — player guessed wrong; GameOver overlay is shown
 *
 * We go through `revealing` between every correct guess too — during that
 * window we advance to the next round by replacing both cards so that the
 * winner never stays on screen (see "winner always replaced" rule below).
 */
const PHASE = {
  loading: 'loading',
  guessing: 'guessing',
  revealing: 'revealing',
  gameOver: 'gameOver',
};

const EMPTY_PAIR = { left: null, right: null };

/**
 * Encapsulates the entire game loop for a given mode.
 *
 * `champions` is the normalized list from useChampionData. `mode` determines
 * which localStorage slot is used for the high score.
 */
export function useGameState(mode, champions) {
  const [phase, setPhase] = useState(PHASE.loading);
  const [pair, setPair] = useState(EMPTY_PAIR);
  const [playerPick, setPlayerPick] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage(highScoreKeyFor(mode), 0);
  const [beatHighScore, setBeatHighScore] = useState(false);

  // The id of the champion that *must* be excluded from the next round, even
  // though they just won. This is the single non-obvious gameplay rule: a
  // dominant champion can't carry a streak because they're always swapped
  // out between rounds.
  const guardIdRef = useRef(null);

  // Track pending timers so we can clear them on unmount / mode change.
  const timersRef = useRef([]);
  const scheduleTimer = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Start or restart the game whenever the champion pool changes (mode
  // switch, initial load).
  useEffect(() => {
    clearTimers();
    if (!champions?.length) {
      setPhase(PHASE.loading);
      setPair(EMPTY_PAIR);
      setPlayerPick(null);
      setScore(0);
      guardIdRef.current = null;
      return;
    }
    startFreshRound(champions);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champions]);

  const startFreshRound = useCallback((pool) => {
    const picked = pickPair(pool);
    if (!picked) return;
    guardIdRef.current = null;
    setPair({ left: picked[0], right: picked[1] });
    setPlayerPick(null);
    setScore(0);
    setBeatHighScore(false);
    setPhase(PHASE.guessing);
  }, []);

  const handlePick = useCallback(
    (side) => {
      if (phase !== PHASE.guessing) return;
      const leftStat = pair.left?.stat;
      const rightStat = pair.right?.stat;
      if (leftStat == null || rightStat == null) return;

      setPlayerPick(side);
      setPhase(PHASE.revealing);

      const chosenStat = side === 'left' ? leftStat : rightStat;
      const otherStat = side === 'left' ? rightStat : leftStat;
      // Ties count as correct — this is generous to the player and avoids
      // unfair losses on identical values.
      const isCorrect = chosenStat >= otherStat;

      if (isCorrect) {
        scheduleTimer(() => advanceRound(side), TIMINGS.nextRoundDelayMs);
      } else {
        scheduleTimer(() => endGame(), TIMINGS.nextRoundDelayMs);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, pair],
  );

  const advanceRound = useCallback(
    (winningSide) => {
      setScore((prev) => prev + 1);

      setPair((current) => {
        const winner = winningSide === 'left' ? current.left : current.right;
        // The winner sticks for the reveal animation but is swapped out for
        // the NEXT round — this prevents endless streaks off a single
        // dominant champion and guarantees the game can always progress.
        const previousGuard = guardIdRef.current;
        const exclude = [winner.id, previousGuard].filter(Boolean);

        const newWinner = pickRandomExcluding(champions, exclude) ?? winner;
        const newChallenger =
          pickRandomExcluding(champions, [...exclude, newWinner.id]) ??
          (winningSide === 'left' ? current.right : current.left);

        guardIdRef.current = newWinner.id;

        // Preload the challenger's art so the visual swap feels instant.
        preloadImage(newChallenger.imageUrl);

        return winningSide === 'left'
          ? { left: newWinner, right: newChallenger }
          : { left: newChallenger, right: newWinner };
      });

      setPlayerPick(null);
      setPhase(PHASE.guessing);
    },
    [champions],
  );

  const endGame = useCallback(() => {
    const beat = score > highScore;
    if (beat) setHighScore(score);
    setBeatHighScore(beat);
    setPhase(PHASE.gameOver);
  }, [score, highScore, setHighScore]);

  const playAgain = useCallback(() => {
    clearTimers();
    startFreshRound(champions);
  }, [champions, clearTimers, startFreshRound]);

  return {
    phase,
    pair,
    playerPick,
    score,
    highScore,
    beatHighScore,
    onPick: handlePick,
    onPlayAgain: playAgain,
  };
}

function preloadImage(url) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

export { PHASE };
