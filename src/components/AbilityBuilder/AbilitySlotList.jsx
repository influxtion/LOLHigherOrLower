import { SLOT_KEYS, SLOT_META } from '../../hooks/useAbilityBuilder.js';
import styles from './AbilitySlotList.module.css';

/*
 * Vertical list of 6 blind-pick slots. No scoring — a filled slot just shows
 * the claimed champion's name beside the slot letter. The actual ability
 * reveal happens on the final results panel.
 */
export default function AbilitySlotList({
  slots,
  canPick,
  highlightKey,
  onPick,
}) {
  return (
    <ul className={styles.list}>
      {SLOT_KEYS.map((key) => {
        const filled = slots[key];
        const meta = SLOT_META[key];
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
                meta.kind === 'model' ? styles.slotModel : '',
              ].join(' ')}
              onClick={() => clickable && onPick(key)}
              disabled={!clickable}
              aria-label={
                filled
                  ? `${meta.label} — claimed from ${filled.champion.name}`
                  : `Pick ${meta.label}`
              }
            >
              <span className={styles.labelCol}>
                <span className={styles.short}>{meta.short}</span>
                <span className={styles.full}>{meta.label}</span>
              </span>

              <span className={styles.contentCol}>
                {filled ? (
                  <span className={styles.claimedFrom}>
                    <span className={styles.claimedLabel}>From</span>
                    <span className={styles.championName}>{filled.champion.name}</span>
                  </span>
                ) : (
                  <span className={styles.emptyHint}>
                    {canPick ? 'Claim this slot' : 'Locked'}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
