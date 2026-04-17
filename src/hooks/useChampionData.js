import { useEffect, useRef, useState } from 'react';
import { fetchChampionsForMode } from '../utils/api.js';

/**
 * Fetches the champion list for the given mode exactly once per mode and
 * caches the result across mode switches. Returns `{ champions, loading, error }`.
 *
 * The cache lives in a ref so that switching back to a previously loaded
 * mode is instant with no re-fetch.
 */
export function useChampionData(mode) {
  const cacheRef = useRef(new Map());
  const [state, setState] = useState(() => toInitial(cacheRef.current, mode));

  useEffect(() => {
    const cache = cacheRef.current;
    const hit = cache.get(mode);
    if (hit) {
      setState({ champions: hit, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ champions: [], loading: true, error: null });

    fetchChampionsForMode(mode)
      .then((champions) => {
        if (cancelled) return;
        cache.set(mode, champions);
        setState({ champions, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ champions: [], loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return state;
}

function toInitial(cache, mode) {
  const hit = cache.get(mode);
  if (hit) return { champions: hit, loading: false, error: null };
  return { champions: [], loading: true, error: null };
}
