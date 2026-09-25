"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MAX_STARS, TOTAL_LEVELS, WORLDS, levelHref } from "@/lib/kids/curriculum";
import {
  completedLevelCount,
  earnedBadges,
  isWorldComplete,
  isWorldUnlocked,
  levelStatus,
  nextLevelToPlay,
  totalStars,
  worldStars,
} from "@/lib/kids/progress";
import { Mascot } from "../Mascot";
import { StarIcon, StarRow } from "../StarRow";
import { BlockIcon } from "../puzzle/blockMeta";
import { useKidsProgress } from "../useKidsProgress";
import { BADGE_ICON, CheckIcon, FlagIcon, LockIcon, MapIcon, MedalIcon, PlayIcon, SparkleIcon, StarFilledIcon, WORLD_ICON } from "../icons";
import ui from "../kidsUi.module.css";
import styles from "./KidsHome.module.css";

/*
 * The map's trail is drawn, not bordered. On wide screens a world's levels
 * sit in one row and alternate high and low, like stepping stones, and an
 * SVG curve runs through their centres — the winding path Duolingo made the
 * shape of a course. The numbers below are the geometry the stylesheet
 * uses for that row (.stop and .trail); change one, change both.
 */
const NODE = 72; // node diameter
const DROP = 56; // how much lower every second stop sits

const RING_RADIUS = 88;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function trailPath(count: number) {
  const y = (i: number) => NODE / 2 + (i % 2 ? DROP : 0);
  let d = `M 50 ${y(0)}`;
  for (let i = 1; i < count; i += 1) {
    const x0 = 50 + (i - 1) * 100;
    const x1 = 50 + i * 100;
    d += ` C ${x0 + 50} ${y(i - 1)}, ${x1 - 50} ${y(i)}, ${x1} ${y(i)}`;
  }
  return d;
}

/**
 * Reveals each world and each badge as it scrolls into view.
 *
 * The hidden starting state is added by this hook rather than sitting in the
 * markup, so a browser that never runs it — or a reader with reduced motion,
 * which the stylesheet honours — sees the page fully, not a blank column.
 */
function useRevealOnScroll(enabled: boolean) {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = container.current;
    if (!root || !enabled || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    for (const target of targets) target.classList.add(styles.reveal);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [enabled]);

  return container;
}

export function KidsHome() {
  const { progress, status, error, retry } = useKidsProgress();
  const ready = status !== "loading";
  const scrolledToHash = useRef(false);

  // Links like /kids#world-caves arrive before the map exists (it renders
  // after the sign-in check), so scroll to the target once it's on screen.
  useEffect(() => {
    if (!ready || scrolledToHash.current) return;
    scrolledToHash.current = true;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [ready]);

  const revealRoot = useRevealOnScroll(ready);
  const stars = totalStars(progress);
  const done = completedLevelCount(progress);
  const badges = earnedBadges(progress);
  const next = nextLevelToPlay(progress);
  const started = done > 0;

  // Badges earned during this visit get a one-off flourish; the ones that
  // were already there when the page opened stay still.
  const baseline = useRef<Set<string> | null>(null);
  const earnedIds = badges.map((world) => world.id).join(",");
  const [justEarned, setJustEarned] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!ready) return;
    const ids = new Set(earnedIds ? earnedIds.split(",") : []);
    if (baseline.current === null) {
      baseline.current = ids;
      return;
    }
    const fresh = [...ids].filter((id) => !baseline.current?.has(id));
    baseline.current = ids;
    if (fresh.length) setJustEarned(new Set(fresh));
  }, [ready, earnedIds]);

  // Every world's share of the whole journey, for the segmented bar under the
  // statistics. Each segment is as wide as that world has levels.
  const worldProgress = useMemo(
    () =>
      WORLDS.map((world) => {
        const done = world.levels.filter((level) => levelStatus(progress, level.id) === "completed").length;
        return { world, done, fraction: done / world.levels.length };
      }),
    [progress],
  );

  const ctaHref = next ? levelHref(next.world.id, next.level.slug) : "#map";
  const ctaLabel = !next ? "Replay a level" : started ? "Continue your adventure" : "Start your adventure";
  const bubble = !ready
    ? "Hi, I'm Bolt! Let me find your stars…"
    : !started
      ? "Hi, I'm Bolt! Want to learn to code with me?"
      : next
        ? `${stars} stars already! Next up: ${next.level.title}.`
        : "You finished every level. You're a real coder!";

  return (
    <div className={styles.home} ref={revealRoot}>
      <section className={styles.hero} aria-labelledby="kq-hero-title">
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <SparkleIcon size={18} /> Kaimana Kids · ages 8–14
          </p>
          <h1 id="kq-hero-title" className={styles.title}>
            Code <span>Quest</span>
          </h1>
          <p className={styles.lead}>Help Bolt the robot explore five worlds, from simple puzzles all the way to real Python code.</p>
          <div className={styles.heroActions}>
            <Link href={ctaHref} className={`${ui.btn} ${ui.btnPrimary} ${styles.cta}`}>
              {ctaLabel} <span aria-hidden="true">→</span>
            </Link>
            <a
              href={next ? `#level-${next.level.id}` : "#map"}
              className={`${ui.btn} ${ui.btnSoft}`}
              onClick={(event) => {
                if (!next) return;
                const target = document.getElementById(`level-${next.level.id}`);
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ block: "center" });
                target.focus({ preventScroll: true });
              }}
            >
              <MapIcon size={20} /> See the map
            </a>
          </div>
          <ul className={styles.heroFacts}>
            <li><b>{TOTAL_LEVELS}</b> levels</li>
            <li><b>{WORLDS.length}</b> worlds</li>
            <li><b>Real</b> Python</li>
          </ul>
        </div>

        <div className={styles.heroArt}>
          <p className={`${ui.bubble} ${ui.bubbleDown} ${styles.heroBubble}`}>{bubble}</p>
          <div className={styles.stage}>
            {/* The blocks kids will actually snap together, in the colours
                the puzzle editor gives them — a preview, not decoration. */}
            <span className={`${styles.sticker} ${styles.stickerMove}`} aria-hidden="true">
              <BlockIcon name="forward" /> Move forward
            </span>
            <span className={`${styles.sticker} ${styles.stickerLoop}`} aria-hidden="true">
              <BlockIcon name="repeat" /> Repeat 3
            </span>
            <span className={`${styles.sticker} ${styles.stickerLogic}`} aria-hidden="true">
              <BlockIcon name="if" /> If wall ahead
            </span>
            {/* How far through Code Quest, drawn around the mascot. The dash
                offset is the part of the circle left to go. */}
            <svg className={styles.ring} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="kqRingGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffc83d" />
                  <stop offset="1" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <circle className={styles.ringTrack} cx="100" cy="100" r={RING_RADIUS} />
              <circle
                className={styles.ringFill}
                cx="100"
                cy="100"
                r={RING_RADIUS}
                transform="rotate(-90 100 100)"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * (1 - (ready ? done / TOTAL_LEVELS : 0))}
              />
            </svg>
            <Mascot mood={started ? "cheer" : "happy"} size={230} title="Bolt the robot" className={styles.heroMascot} />
            <svg className={styles.hill} viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M0 62 Q90 18 200 40 T400 34 V90 H0 Z" fill="#9be07a" />
              <path d="M0 74 Q120 44 230 62 T400 58 V90 H0 Z" fill="#6fcf4f" />
            </svg>
          </div>
        </div>
      </section>

      <section aria-label="Your progress" className={styles.progress}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <StarIcon filled className={styles.statStar} />
            <div>
              <b>
                {stars}
                <small> / {MAX_STARS}</small>
              </b>
              <span>stars</span>
            </div>
          </div>
          <div className={styles.stat}>
            <FlagIcon className={styles.statIcon} size={42} />
            <div>
              <b>
                {done}
                <small> / {TOTAL_LEVELS}</small>
              </b>
              <span>levels done</span>
            </div>
          </div>
          <div className={styles.stat}>
            <MedalIcon className={styles.statIcon} size={42} />
            <div>
              <b>
                {badges.length}
                <small> / {WORLDS.length}</small>
              </b>
              <span>badges</span>
            </div>
          </div>
        </div>
        {/* One segment per world, in the world's own colour, and each one is
            a way into that part of the map. */}
        <div className={styles.journey} role="progressbar" aria-label="Levels completed" aria-valuemin={0} aria-valuemax={TOTAL_LEVELS} aria-valuenow={done}>
          {worldProgress.map(({ world, done: worldDone, fraction }) => (
            <a
              key={world.id}
              className={`${styles.pip} ${ui[`theme_${world.id}`]}`}
              href={`#world-${world.id}`}
              style={{ flex: world.levels.length }}
              aria-label={`${world.name}: ${worldDone} of ${world.levels.length} levels done`}
            >
              <span className={styles.pipFill} style={{ width: `${Math.round(fraction * 100)}%` }} />
            </a>
          ))}
        </div>
      </section>

      {error && (
        <p className={ui.notice} role="alert">
          <span>Bolt couldn&apos;t load your saved stars right now.</span>
          <button type="button" className={`${ui.btn} ${ui.btnSoft} ${ui.btnSmall}`} onClick={retry}>
            Try again
          </button>
        </p>
      )}

      <section id="map" className={styles.mapSection} aria-labelledby="kq-map-title">
        <div className={styles.sectionHead}>
          <h2 id="kq-map-title">Adventure map</h2>
          <p>Finish a level to unlock the next one. Finish a whole world to earn its badge!</p>
        </div>

        {!ready ? (
          <div className={styles.mapLoading} role="status">
            <Mascot mood="think" size={90} />
            <p>Finding your stars…</p>
          </div>
        ) : (
          <ol className={styles.worlds}>
            {WORLDS.map((world, worldIndex) => {
              const unlocked = isWorldUnlocked(progress, world);
              const complete = isWorldComplete(progress, world);
              const count = world.levels.length;
              const WorldIcon = WORLD_ICON[world.id] ?? WORLD_ICON.meadow;
              return (
                <li key={world.id} id={`world-${world.id}`} data-reveal="" className={`${styles.world} ${ui[`theme_${world.id}`]} ${unlocked ? "" : styles.worldLocked}`}>
                  {/* A unit header in the Duolingo sense: the world's colour,
                      its number and idea, and how far into it you are. */}
                  <div className={styles.banner}>
                    <span className={styles.worldEmoji} aria-hidden="true">
                      {unlocked ? <WorldIcon size={34} /> : <LockIcon size={30} />}
                    </span>
                    <div className={styles.worldTitle}>
                      <p className={styles.worldKicker}>
                        World {world.number} · {world.concept}
                      </p>
                      <h3>{world.name}</h3>
                      <p className={styles.worldTagline}>{world.tagline}</p>
                    </div>
                    <div className={styles.worldMeta}>
                      <span className={styles.worldStars}>
                        <StarIcon filled />
                        <span>
                          {worldStars(progress, world)} / {count * 3}
                          <span className={ui.srOnly}> stars</span>
                        </span>
                      </span>
                      {complete && (
                        <span className={styles.worldBadge}>
                          <span aria-hidden="true">{world.badge.emoji}</span> {world.badge.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {!unlocked && worldIndex > 0 && (
                    <p className={styles.lockNote}>
                      <LockIcon size={20} /> Finish {WORLDS[worldIndex - 1].name} to unlock this world.
                    </p>
                  )}

                  <div className={styles.pathWrap}>
                    <svg
                      className={styles.trail}
                      viewBox={`0 0 ${count * 100} ${NODE + DROP}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path className={styles.trailBed} d={trailPath(count)} vectorEffect="non-scaling-stroke" />
                      <path className={styles.trailStep} d={trailPath(count)} vectorEffect="non-scaling-stroke" />
                    </svg>
                    <ol className={styles.path} style={{ "--count": count } as CSSProperties}>
                      {world.levels.map((level, index) => {
                        const state = levelStatus(progress, level.id);
                        const levelStars = progress[level.id]?.stars ?? 0;
                        const isNext = next?.level.id === level.id;
                        const nodeClass = `${styles.node} ${state === "completed" ? styles.nodeDone : state === "unlocked" ? styles.nodeOpen : styles.nodeLocked} ${isNext ? styles.nodeNext : ""}`;
                        return (
                          <li key={level.id} className={styles.stop}>
                            {isNext && (
                              <span className={styles.playTag} aria-hidden="true">
                                {started ? "Next!" : "Start!"}
                              </span>
                            )}
                            {state === "locked" ? (
                              <span className={nodeClass} aria-hidden="true">
                                <LockIcon size={22} />
                              </span>
                            ) : (
                              <Link
                                id={`level-${level.id}`}
                                href={levelHref(world.id, level.slug)}
                                className={nodeClass}
                                aria-label={`Level ${index + 1}: ${level.title}. ${state === "completed" ? `${levelStars} of 3 stars.` : "Ready to play!"}`}
                              >
                                {state === "completed" ? levelStars === 3 ? <StarFilledIcon size={30} /> : <CheckIcon size={28} /> : index + 1}
                                {isNext && (
                                  <span className={styles.nodeBadge} aria-hidden="true">
                                    <PlayIcon size={14} />
                                  </span>
                                )}
                              </Link>
                            )}
                            <span className={styles.stopName}>
                              {level.title}
                              {state === "locked" && <span className={ui.srOnly}> (locked)</span>}
                            </span>
                            {state === "completed" ? (
                              <StarRow stars={levelStars} size="sm" />
                            ) : (
                              <span className={styles.starSpacer} aria-hidden="true" />
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="kq-badges-title">
        <div className={styles.sectionHead}>
          <h2 id="kq-badges-title">Badge shelf</h2>
          <p>Every world has its own badge. How many can you collect?</p>
        </div>
        <ul className={styles.badgeGrid}>
          {WORLDS.map((world) => {
            const earned = isWorldComplete(progress, world);
            const BadgeIcon = BADGE_ICON[world.id] ?? BADGE_ICON.meadow;
            return (
              <li
                key={world.id}
                data-reveal=""
                tabIndex={0}
                role="group"
                aria-label={`${world.badge.name}: ${earned ? "earned" : `finish ${world.name}`}`}
                className={`${styles.badge} ${ui[`theme_${world.id}`]} ${earned ? styles.badgeEarned : styles.badgeLocked} ${justEarned.has(world.id) ? styles.justEarned : ""}`}
              >
                <span className={styles.medal} aria-hidden="true">
                  {earned ? <BadgeIcon size={44} /> : <LockIcon size={34} />}
                </span>
                <b>{world.badge.name}</b>
                <span className={styles.badgeState}>{earned ? "Earned!" : `Finish ${world.name}`}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.parents} aria-labelledby="kq-parents-title">
        <div className={styles.sectionHead}>
          <p className={styles.parentsKicker}>For grown-ups</p>
          <h2 id="kq-parents-title">For parents &amp; teachers</h2>
          <p>Code Quest takes kids from their very first instruction to small Python programs, one idea at a time.</p>
        </div>
        <div className={styles.parentGrid}>
          {WORLDS.map((world) => {
            const WorldIcon = WORLD_ICON[world.id] ?? WORLD_ICON.meadow;
            return (
            <article key={world.id} className={`${styles.parentCard} ${ui[`theme_${world.id}`]}`}>
              <p className={styles.worldKicker}>
                <WorldIcon size={20} /> World {world.number} · {world.concept}
              </p>
              <h3>{world.name}</h3>
              <p>{world.parents.summary}</p>
              <ul>
                {world.parents.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </article>
            );
          })}
        </div>
        <ul className={styles.howList}>
          <li>
            <b>Small steps.</b> Each level teaches one idea, with hints ready whenever kids get stuck.
          </li>
          <li>
            <b>Stars reward thinking.</b> Every working solution counts. Shorter programs and fewer hints earn more stars.
          </li>
          <li>
            <b>Real code.</b> From World 4, kids&apos; programs run as real Python, and errors are explained in plain words.
          </li>
          <li>
            <b>Saved progress.</b> Stars and badges are saved to the signed-in Kaimana account.
          </li>
        </ul>
      </section>
    </div>
  );
}
