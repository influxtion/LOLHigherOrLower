import { useMemo } from 'react';
import { useChampionData } from '../../hooks/useChampionData.js';
import {
  useAbilityBuilder,
  PHASE,
  SLOT_KEYS,
  SLOT_META,
} from '../../hooks/useAbilityBuilder.js';
import { DDRAGON } from '../../utils/constants.js';
import ChampionRoll from '../StatBuilder/ChampionRoll.jsx';
import AbilitySlotList from './AbilitySlotList.jsx';
import styles from './AbilityBuilderScreen.module.css';

export default function AbilityBuilderScreen({ mode }) {
  const { champions, loading, error } = useChampionData(mode);
  const game = useAbilityBuilder(champions);

  const goHome = () => {
    window.location.href = '/';
  };

  const filledCount = useMemo(
    () => SLOT_KEYS.filter((k) => game.slots[k]).length,
    [game.slots],
  );

  if (error) {
    return (
      <main className={styles.screen}>
        <div className={styles.centerState}>
          <p className={styles.errorTitle}>Couldn't load champions.</p>
          <p className={styles.errorDetail}>Check your connection and try again.</p>
        </div>
      </main>
    );
  }

  if (loading || !champions?.length || !game.currentChampion) {
    return (
      <main className={styles.screen}>
        <div className={styles.centerState} aria-live="polite">
          <span className={styles.loadingText}>Summoning champions</span>
          <span className={styles.loadingDots} aria-hidden>
            <span /><span /><span />
          </span>
        </div>
      </main>
    );
  }

  const isRolling = game.phase === PHASE.rolling;
  const isPicking = game.phase === PHASE.picking;
  const isRevealing = game.phase === PHASE.revealing;
  const isGameOver = game.phase === PHASE.gameOver;
  const showIdentity = isPicking;

  return (
    <main className={styles.screen}>
      <div className={styles.arena}>
        <div className={styles.scoreStrip}>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Round</span>
            <span className={styles.scoreValue}>
              {Math.min(game.round, SLOT_KEYS.length)} / {SLOT_KEYS.length}
            </span>
          </div>
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Slots Filled</span>
            <span className={styles.scoreValue}>
              {filledCount} / {SLOT_KEYS.length}
            </span>
          </div>
        </div>

        <div className={styles.stage}>
          <div className={styles.rollColumn}>
            <div className={styles.rollWrap}>
              <ChampionRoll
                target={game.currentChampion}
                pool={champions}
                runKey={game.round + ':' + game.currentChampion?.id}
                onSettle={game.onRollSettle}
              />
              {showIdentity ? (
                <div className={styles.identity}>
                  <span className={styles.identityName}>
                    {game.currentChampion.name}
                  </span>
                  <span className={styles.identityHint}>
                    Pick a slot to claim
                  </span>
                </div>
              ) : null}
            </div>
            <p className={styles.rollCaption}>
              {isRolling
                ? 'Rolling champion…'
                : isPicking
                  ? `Blind-pick one slot from ${game.currentChampion.name}`
                  : isRevealing
                    ? 'Slot claimed — rolling next champion'
                    : 'Build complete'}
            </p>
          </div>

          <div className={styles.slotsColumn}>
            <AbilitySlotList
              slots={game.slots}
              canPick={isPicking}
              highlightKey={isRevealing ? game.lastPick?.slotKey : null}
              onPick={game.onSlotPick}
            />
          </div>
        </div>

        <section className={styles.howTo} aria-label="How to play Ability Builder">
          <h2 className={styles.howToTitle}>How Ability Builder Works</h2>
          <p>
            Each round a random champion rolls. You see their name, not their
            kit. Pick one of six slots (Q, W, E, R, passive, or character
            model) to claim from them. Slots lock once filled.
          </p>
          <p>
            After six rolls you have a custom champion stitched together from
            six real kits. There's no score. The result screen shows the
            abilities you ended up with and the model you picked.
          </p>
          <p>
            Tip: lean into the blindness. Think about which slot you'd most
            want from that champion, not which one is strongest overall.
          </p>
        </section>
      </div>

      {isGameOver ? (
        <ResultsOverlay
          slots={game.slots}
          getAbilitiesFor={game.getAbilitiesFor}
          abilitiesVersion={game.abilitiesVersion}
          onPlayAgain={game.onPlayAgain}
          onChangeMode={goHome}
        />
      ) : null}
    </main>
  );
}

/* -------- Results overlay (replaces the scored GameOver for this mode) -------- */

function ResultsOverlay({
  slots,
  getAbilitiesFor,
  abilitiesVersion,
  onPlayAgain,
  onChangeMode,
}) {
  // Rebind on abilitiesVersion bumps so lazily-fetched ability data appears
  // as it lands without the overlay having to poll.
  const rows = useMemo(
    () =>
      SLOT_KEYS.map((key) => ({
        key,
        meta: SLOT_META[key],
        slot: slots[key],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, abilitiesVersion],
  );

  const modelSlot = slots.model;
  const modelChampion = modelSlot?.champion;

  return (
    <div className={styles.resultsOverlay} role="dialog" aria-modal="true">
      <div className={styles.resultsPanel}>
        <span className={styles.resultsEyebrow}>Your Custom Champion</span>
        <h2 className={styles.resultsTitle}>Build Complete</h2>

        {modelChampion ? (
          <div className={styles.modelHero}>
            <img
              src={modelChampion.imageUrl}
              alt={modelChampion.name}
              className={styles.modelArt}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const fb = DDRAGON.loadingArtUrl(modelChampion.id);
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
              }}
            />
            <div className={styles.modelCaption}>
              <span className={styles.modelLabel}>Character Model</span>
              <span className={styles.modelName}>{modelChampion.name}</span>
            </div>
          </div>
        ) : null}

        <ul className={styles.rows}>
          {rows.map(({ key, meta, slot }) => {
            if (meta.kind === 'model') return null;
            const champion = slot?.champion;
            const abilities = champion ? getAbilitiesFor(champion.id) : null;
            const ability = abilities ? abilities[key] : null;
            const pending = champion && !abilities;

            return (
              <li key={key} className={styles.abilityRow}>
                <div className={styles.iconBox}>
                  {ability?.iconUrl ? (
                    <img
                      src={ability.iconUrl}
                      alt=""
                      className={styles.icon}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={styles.iconPlaceholder} aria-hidden />
                  )}
                  <span className={styles.slotBadge}>{meta.short}</span>
                </div>
                <div className={styles.abilityText}>
                  <div className={styles.abilityHead}>
                    <span className={styles.abilityName}>
                      {pending
                        ? 'Loading ability…'
                        : ability?.name || 'Ability unavailable'}
                    </span>
                    {champion ? (
                      <span className={styles.abilityFrom}>
                        from {champion.name}
                      </span>
                    ) : null}
                  </div>
                  {ability?.description ? (
                    <p
                      className={styles.abilityDesc}
                      // DDragon descriptions contain Riot-authored
                      // <scaleAD>…</scaleAD>-style tags plus the occasional
                      // <br />; browsers render unknown tags as text nodes,
                      // which is what we want here.
                      dangerouslySetInnerHTML={{ __html: ability.description }}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className={styles.secondary} onClick={onChangeMode}>
            Change Mode
          </button>
        </div>
      </div>
    </div>
  );
}
