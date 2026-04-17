import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small persisted-state hook. Accepts a key and an initial value; returns
 * `[value, setValue]` with write-through to localStorage. Writes are wrapped
 * in try/catch so that Safari private-mode / quota errors never crash the UI.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readFromStorage(key, initialValue));

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    setValue(readFromStorage(key, initialValue));
    // We intentionally re-read whenever the key changes (e.g. mode switches
    // high-score slots). initialValue isn't part of deps to keep a stable
    // re-read behavior when callers pass a literal each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(resolved));
      } catch {
        /* ignore — persistence is best-effort */
      }
      return resolved;
    });
  }, []);

  return [value, set];
}

function readFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
