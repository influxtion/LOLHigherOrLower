import styles from './VersusDivider.module.css';

export default function VersusDivider() {
  return (
    <div className={styles.divider} role="presentation">
      <span className={styles.line} aria-hidden />
      <span className={styles.label}>VS</span>
      <span className={styles.line} aria-hidden />
    </div>
  );
}
