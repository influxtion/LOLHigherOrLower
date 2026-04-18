import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchChampionAbilities } from '../utils/api.js';
import { pickRandomExcluding } from '../utils/random.js';

/*
 * Ability Builder loop. Six rounds, six slot types — Q, W, E, R, passive, and
 * character model. Each round rolls one champion; the player blind-picks one
 * slot to claim from that champion. No scoring — the payoff is the composite
 * champion shown at the end.
 *
 * Per-champion ability data is fetched lazily as each champion is rolled and
 * cached, so the initial page load stays fast (batch roster only).
 */

export const SLOT_KEYS = ['q', 'w', 'e', 'r', 'passive', 'model'];

export const SLOT_META = {
  q:       { label: 'Q',              short: 'Q',       kind: 'ability' },
  w:       { label: 'W',              short: 'W',       kind: 'ability' },
  e:       { label: 'E',              short: 'E',       kind: 'ability' },
  r:       { label: 'R (Ultimate)',   short: 'R',       kind: 'ability' },
  passive: { label: 'Passive',        short: 'P',       kind: 'ability' },
  model:   { label: 'Character Model',short: 'MODEL',   kind: 'model' },
};

const PHASE = {
  loading: 'loading',
  rolling: 'rolling',
  picking: 'picking',
  revealing: 'revealing',
  gameOver: 'gameOver',
};

const emptySlots = () =>
  SLOT_KEYS.reduce((acc, k) => ((acc[k] = null), acc), {});

export function useAbilityBuilder(champions) {
  const [phase, setPhase] = useState(PHASE.loading);
  const [slots, setSlots] = useState(emptySlots);
  const [currentChampion, setCurrentChampion] = useState(null);
  const [round, setRound] = useState(0);
  const [lastPick, setLastPick] = useState(null); // { slotKey }
  const [abilitiesVersion, setAbilitiesVersion] = useState(0);

  // championId -> { q, w, e, r, passive } | Promise (while in-flight).
  // Stored on a ref to avoid stale-closure issues when the roll-trigger effect
  // fires before React has committed a state update.
  const abilitiesCacheRef = useRef(new Map());

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

  const ensureAbilities = useCallback((champion) => {
    if (!champion) return;
    const cache = abilitiesCacheRef.current;
    if (cache.has(champion.id)) return;
    const promise = fetchChampionAbilities(champion.version, champion.id)
      .then((abilities) => {
        cache.set(champion.id, abilities);
        setAbilitiesVersion((v) => v + 1);
        return abilities;
      })
      .catch(() => {
        // Store an empty shape so we don't retry forever; the UI will show a
        // "couldn't load" fallback rather than a loading spinner.
        const empty = { q: null, w: null, e: null, r: null, passive: null, failed: true };
        cache.set(champion.id, empty);
        setAbilitiesVersion((v) => v + 1);
        return empty;
      });
    cache.set(champion.id, promise);
  }, []);

  const rollNext = useCallback(
    (usedIds) => {
      if (!champions?.length) return;
      const next = pickRandomExcluding(champions, usedIds);
      if (!next) return;
      setCurrentChampion(next);
      setLastPick(null);
      setPhase(PHASE.rolling);
      ensureAbilities(next);
    },
    [champions, ensureAbilities],
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
    rollNext([]);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champions]);

  const onRollSettle = useCallback(() => {
    setPhase((p) => (p === PHASE.rolling ? PHASE.picking : p));
  }, []);

  const handleSlotPick = useCallback(
    (slotKey) => {
      if (phase !== PHASE.picking) return;
      if (!currentChampion) return;
      if (slots[slotKey]) return;

      const filledSlots = {
        ...slots,
        [slotKey]: { champion: currentChampion },
      };
      setSlots(filledSlots);
      setLastPick({ slotKey });
      setPhase(PHASE.revealing);

      const allFilled = SLOT_KEYS.every((k) => filledSlots[k]);
      if (allFilled) {
        scheduleTimer(() => setPhase(PHASE.gameOver), 1400);
        return;
      }

      scheduleTimer(() => {
        const usedIds = SLOT_KEYS.map((k) => filledSlots[k]?.champion?.id).filter(Boolean);
        setRound((r) => r + 1);
        rollNext(usedIds);
      }, 1400);
    },
    [phase, currentChampion, slots, rollNext, scheduleTimer],
  );

  const playAgain = useCallback(() => {
    clearTimers();
    setSlots(emptySlots());
    setRound(1);
    setLastPick(null);
    rollNext([]);
  }, [clearTimers, rollNext]);

  const getAbilitiesFor = useCallback(
    (championId) => {
      const entry = abilitiesCacheRef.current.get(championId);
      if (!entry || typeof entry.then === 'function') return null;
      return entry;
    },
    // abilitiesVersion is read implicitly; a bump re-renders consumers that
    // called this via useMemo on [abilitiesVersion].
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [abilitiesVersion],
  );

  return {
    phase,
    slots,
    currentChampion,
    round,
    lastPick,
    getAbilitiesFor,
    abilitiesVersion,
    onRollSettle,
    onSlotPick: handleSlotPick,
    onPlayAgain: playAgain,
  };
}

export { PHASE };
