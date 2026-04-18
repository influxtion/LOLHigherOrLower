import { STAT_KEYS, STAT_META } from '../../hooks/useStatBuilder.js';
import styles from './StatSlotList.module.css';

/*
 * Vertical list of 7 stat slots. Empty slots are clickable during the picking
 * phase; filled slots are locked and display the claimed champion, raw value,
 * and percentile rank.
 */
export default function StatSlotList({
  slots,
  canPick,
  highlightKey,
  onPick,
}) {
  return (
    <ul className={styles.list}>
      {STAT_KEYS.map((key) => {
        const filled = slots[key];
        const meta = STAT_META[key];
        const isHighlight = highlightKey === key;
        const clickable = canPick && !filled;

        return (
          <li key={key} className={styles.row}>
            <button
              type="button"
              className={[
                styles.slot,
                filled ? styles.slotFilled : styles.slotEmpty,
                isHighlight ? styles.slotHighlight : '',
              ].join(' ')}
              onClick={() => clickable && onPick(key)}
              disabled={!clickable}
              aria-label={
                filled
                  ? `${meta.label} — ${filled.champion.name}, ${meta.format(filled.value)}, ${Math.round(filled.percentile)} percentile`
                  : `Pick ${meta.label}`
              }
            >
              <span className={styles.labelCol}>
                <span className={styles.short}>{meta.short}</span>
                <span className={styles.full}>{meta.label}</span>
              </span>

              {filled ? (
                <span className={styles.filledCol}>
                  <span className={styles.championName}>{filled.champion.name}</span>
                  <span className={styles.statLine}>
                    <span className={styles.value}>{meta.format(filled.value)}</span>
                    <span
                      className={styles.pctBadge}
                      data-tier={tierFor(filled.percentile)}
                    >
                      {Math.round(filled.percentile)}%
                    </span>
                  </span>
                </span>
              ) : (
                <span className={styles.emptyCol}>
                  <span className={styles.emptyHint}>
                    {canPick ? 'Claim this stat' : 'Locked'}
                  </span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function tierFor(percentile) {
  if (percentile >= 75) return 'high';
  if (percentile >= 40) return 'mid';
  return 'low';
}
