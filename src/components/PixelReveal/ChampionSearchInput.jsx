import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChampionSearchInput.module.css';

const MAX_RESULTS = 6;

/**
 * Typed autocomplete over the champion roster. Submits the highlighted
 * suggestion on Enter; arrow keys move the highlight. If the query matches
 * no champion, submission is rejected without advancing the game.
 */
export default function ChampionSearchInput({
  champions,
  disabled,
  onSubmit,
  resetKey,
}) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Clear on champion change (resetKey changes) or disabled toggle.
  useEffect(() => {
    setQuery('');
    setHighlight(0);
  }, [resetKey]);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, resetKey]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return champions
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [champions, query]);

  const submit = (champion) => {
    if (!champion) {
      triggerShake();
      return;
    }
    onSubmit(champion);
    setQuery('');
    setHighlight(0);
  };

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit(suggestions[highlight]);
    }
  };

  return (
    <div
      className={`${styles.wrap} ${shake ? styles.shake : ''}`}
      onAnimationEnd={() => setShake(false)}
    >
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Type a champion name…"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
        aria-label="Champion name"
      />
      {suggestions.length > 0 ? (
        <ul className={styles.list} role="listbox">
          {suggestions.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`${styles.item} ${
                  i === highlight ? styles.itemActive : ''
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(c);
                }}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
