import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import { pickRandomExcluding } from '../utils/random.js';
import { PIXEL_REVEAL_STEPS, highScoreKeyFor } from '../utils/constants.js';

export const PIXEL_PHASE = {
  guessing: 'guessing',
  solved: 'solved',
};

const RECENT_RING = 20;

/**
 * Game loop for the Pixel Reveal minigame.
 *
 * - One champion per puzzle. `attempts` counts wrong guesses this puzzle.
 * - `stepIndex` indexes into PIXEL_REVEAL_STEPS and advances on wrong guesses.
 * - `bestAttempts` is persisted per-browser: the fewest wrong guesses ever
 *   taken to solve a single champion. A solve on the first try stores 0.
 */
export function usePixelReveal(champions, mode) {
  const [bestAttempts, setBestAttempts] = useLocalStorage(
    highScoreKeyFor(mode),
    null,
  );
  const [champion, setChampion] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState(PIXEL_PHASE.guessing);
  const [beatBest, setBeatBest] = useState(false);
  const recentRef = useRef([]);

  const pickNext = useCallback(
    (pool) => {
      const next = pickRandomExcluding(pool, recentRef.current);
      if (!next) return null;
      recentRef.current = [next.id, ...recentRef.current].slice(0, RECENT_RING);
      return next;
    },
    [],
  );

  useEffect(() => {
    if (!champions?.length || champion) return;
    setChampion(pickNext(champions));
  }, [champions, champion, pickNext]);

  const submitGuess = useCallback(
    (guessedId) => {
      if (!champion || phase !== PIXEL_PHASE.guessing) return 'ignored';
      if (guessedId === champion.id) {
        const isNewBest = bestAttempts == null || attempts < bestAttempts;
        if (isNewBest) setBestAttempts(attempts);
        setBeatBest(isNewBest);
        setPhase(PIXEL_PHASE.solved);
        return 'correct';
      }
      setAttempts((a) => a + 1);
      return 'wrong';
    },
    [champion, phase, attempts, bestAttempts, setBestAttempts],
  );

  const nextChampion = useCallback(() => {
    if (!champions?.length) return;
    setAttempts(0);
    setPhase(PIXEL_PHASE.guessing);
    setBeatBest(false);
    setChampion(pickNext(champions));
  }, [champions, pickNext]);

  const stepIndex = Math.min(attempts, PIXEL_REVEAL_STEPS.length - 1);
  const step =
    phase === PIXEL_PHASE.solved ? null : PIXEL_REVEAL_STEPS[stepIndex];

  return {
    champion,
    attempts,
    phase,
    step,
    bestAttempts,
    beatBest,
    submitGuess,
    nextChampion,
  };
}
