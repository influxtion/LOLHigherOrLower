import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { highScoreKeyFor } from '../utils/constants.js';
import { pickRandomExcluding } from '../utils/random.js';
import { useLocalStorage } from './useLocalStorage.js';

/*
 * Stat Builder loop. Each round rolls one champion; the player blind-picks
 * one of seven unlocked stat slots to claim that champion's value for. After
 * 7 rounds the build is scored: each slot's value is ranked against the whole
 * roster for that stat (percentile), and the final score is the average.
 */

export const STAT_KEYS = ['hp', 'mp', 'ad', 'as', 'range', 'armor', 'mr'];

export const STAT_META = {
  hp: { label: 'Health', short: 'HP', format: (v) => Math.round(v).toLocaleString('en-US') },
  mp: { label: 'Magic Power', short: 'MP', format: (v) => Math.round(v).toLocaleString('en-US') },
  ad: { label: 'Attack Damage', short: 'AD', format: (v) => Math.round(v).toLocaleString('en-US') },
  as: { label: 'Attack Speed', short: 'AS', format: (v) => v.toFixed(3) },
  range: { label: 'Range', short: 'RNG', format: (v) => Math.round(v).toLocaleString('en-US') },
  armor: { label: 'Armor', short: 'AR', format: (v) => Math.round(v).toLocaleString('en-US') },
  mr: { label: 'Magic Resist', short: 'MR', format: (v) => Math.round(v).toLocaleString('en-US') },
};

const PHASE = {
  loading: 'loading',
  rolling: 'rolling',
  picking: 'picking',
  revealing: 'revealing',
  gameOver: 'gameOver',
};

const emptySlots = () =>
  STAT_KEYS.reduce((acc, k) => ((acc[k] = null), acc), {});

/**
 * Precompute the sorted value arrays for every stat so that percentile lookups
 * during play are O(log n) per slot instead of O(n). Ties use a midrank
 * formula: (strictly_lower + 0.5 * equal) / n * 100.
 */
function buildPercentileTables(champions) {
  const tables = {};
  for (const key of STAT_KEYS) {
    const values = champions
      .map((c) => c.stats[key])
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => a - b);
    tables[key] = values;
  }
  return tables;
}

function percentileFor(tables, key, value) {
  const values = tables[key];
  if (!values || !values.length || !Number.isFinite(value)) return 0;
  const n = values.length;
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  const strictlyLower = lo;
  let equal = 0;
  for (let i = strictlyLower; i < n && values[i] === value; i++) equal++;
  return ((strictlyLower + equal / 2) / n) * 100;
}

export function useStatBuilder(mode, champions) {
  const [phase, setPhase] = useState(PHASE.loading);
  const [slots, setSlots] = useState(emptySlots);
  const [currentChampion, setCurrentChampion] = useState(null);
  const [round, setRound] = useState(0);
  const [lastPick, setLastPick] = useState(null); // { statKey, value, percentile }
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage(highScoreKeyFor(mode), 0);
  const [beatHighScore, setBeatHighScore] = useState(false);

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

  const percentileTables = useMemo(
    () => (champions?.length ? buildPercentileTables(champions) : null),
    [champions],
  );

  const rollNext = useCallback(
    (usedIds) => {
      if (!champions?.length) return;
      const next = pickRandomExcluding(champions, usedIds);
      if (!next) return;
      setCurrentChampion(next);
      setLastPick(null);
      setPhase(PHASE.rolling);
    },
    [champions],
  );

  useEffect(() => {
    clearTimers();
    if (!champions?.length) {
      setPhase(PHASE.loading);
      setSlots(emptySlots());
      setCurrentChampion(null);
      setRound(0);
      return;
    }
    setSlots(emptySlots());
    setRound(1);
    setBeatHighScore(false);
    setFinalScore(0);
    rollNext([]);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champions]);

  const onRollSettle = useCallback(() => {
    setPhase((p) => (p === PHASE.rolling ? PHASE.picking : p));
  }, []);

  const handleSlotPick = useCallback(
    (statKey) => {
      if (phase !== PHASE.picking) return;
      if (!currentChampion || !percentileTables) return;
      if (slots[statKey]) return; // slot already filled

      const value = currentChampion.stats[statKey];
      const percentile = percentileFor(percentileTables, statKey, value);
      const filledSlots = {
        ...slots,
        [statKey]: { champion: currentChampion, value, percentile },
      };
      setSlots(filledSlots);
      setLastPick({ statKey, value, percentile });
      setPhase(PHASE.revealing);

      const allFilled = STAT_KEYS.every((k) => filledSlots[k]);
      if (allFilled) {
        const avg =
          STAT_KEYS.reduce((sum, k) => sum + filledSlots[k].percentile, 0) /
          STAT_KEYS.length;
        scheduleTimer(() => {
          const rounded = Math.round(avg * 10) / 10;
          setFinalScore(rounded);
          const beat = rounded > highScore;
          if (beat) setHighScore(rounded);
          setBeatHighScore(beat);
          setPhase(PHASE.gameOver);
        }, 1400);
        return;
      }

      scheduleTimer(() => {
        const usedIds = STAT_KEYS.map((k) => filledSlots[k]?.champion?.id).filter(Boolean);
        setRound((r) => r + 1);
        rollNext(usedIds);
      }, 1400);
    },
    [phase, currentChampion, percentileTables, slots, highScore, setHighScore, rollNext, scheduleTimer],
  );

  const playAgain = useCallback(() => {
    clearTimers();
    setSlots(emptySlots());
    setRound(1);
    setBeatHighScore(false);
    setFinalScore(0);
    setLastPick(null);
    rollNext([]);
  }, [clearTimers, rollNext]);

  const runningAverage = useMemo(() => {
    const filled = STAT_KEYS.map((k) => slots[k]).filter(Boolean);
    if (!filled.length) return 0;
    return filled.reduce((sum, s) => sum + s.percentile, 0) / filled.length;
  }, [slots]);

  return {
    phase,
    slots,
    currentChampion,
    round,
    lastPick,
    finalScore,
    highScore,
    beatHighScore,
    runningAverage,
    onRollSettle,
    onSlotPick: handleSlotPick,
    onPlayAgain: playAgain,
  };
}

export { PHASE };
