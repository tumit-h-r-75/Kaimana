"use client";

// One world, on its own page.
//
// /kids/[worldId] used to bounce straight back to the map, which meant a
// world had no address of its own — nothing to link a child to, nothing for
// a parent to look at, and no place to say what this part of Code Quest
// actually teaches. It has one now: the levels with their stars, what the
// world is for, and what is still worth going back for.

import Link from "next/link";
import { useMemo } from "react";
import { WORLDS, levelHref } from "@/lib/kids/curriculum";
import { isWorldComplete, isWorldUnlocked, levelStatus, worldStars } from "@/lib/kids/progress";
import { useKidsProgress } from "../useKidsProgress";
import { Mascot } from "../Mascot";
import { StarRow } from "../StarRow";
import { BADGE_ICON, CheckIcon, LockIcon, PlayIcon, StarFilledIcon, WORLD_ICON } from "../icons";
import ui from "../kidsUi.module.css";
import styles from "./WorldScreen.module.css";

export function WorldScreen({ worldId }: { worldId: string }) {
  const world = WORLDS.find((entry) => entry.id === worldId);
  const { progress, status } = useKidsProgress();
  const ready = status !== "loading";

  const summary = useMemo(() => {
    if (!world) return null;
    const done = world.levels.filter((level) => Boolean(progress[level.id])).length;
    const perfect = world.levels.filter((level) => (progress[level.id]?.stars ?? 0) === 3).length;
    // What is worth going back for: finished, but not for full marks.
    const polish = world.levels.filter((level) => progress[level.id] && (progress[level.id]?.stars ?? 0) < 3);
    const next = world.levels.find((level) => !progress[level.id]);
    return { done, perfect, polish, next };
  }, [world, progress]);

  if (!world) {
    return (
      <section className={`${ui.card} ${styles.missing}`}>
        <Mascot mood="oops" size={120} />
        <h1>Bolt cannot find that world</h1>
        <Link href="/kids" className={`${ui.btn} ${ui.btnPrimary}`}>
          Back to the map
        </Link>
      </section>
    );
  }

  const WorldIcon = WORLD_ICON[world.id] ?? WORLD_ICON.meadow;
  const BadgeIcon = BADGE_ICON[world.id] ?? BADGE_ICON.meadow;
  const unlocked = isWorldUnlocked(progress, world);
  const complete = isWorldComplete(progress, world);
  const stars = worldStars(progress, world);
  const maxStars = world.levels.length * 3;

  return (
    <div className={`${styles.page} ${ui[`theme_${world.id}`]}`}>
      <p className={styles.crumbs}>
        <Link href="/kids">Adventure map</Link> <span aria-hidden="true">/</span> {world.name}
      </p>

      <header className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <WorldIcon size={44} />
        </span>
        <div className={styles.headText}>
          <p className={styles.kicker}>
            World {world.number} · {world.concept}
          </p>
          <h1>{world.name}</h1>
          <p className={styles.tagline}>{world.tagline}</p>
        </div>
        <div className={styles.headStats}>
          <span className={styles.stat}>
            <StarFilledIcon size={18} />
            <b>
              {stars}
              <small> / {maxStars}</small>
            </b>
          </span>
          <span className={styles.stat}>
            <CheckIcon size={18} />
            <b>
              {summary?.done ?? 0}
              <small> / {world.levels.length}</small>
            </b>
          </span>
        </div>
      </header>

      {!unlocked && (
        <p className={`${ui.notice} ${styles.locked}`}>
          <LockIcon size={20} /> Finish the world before this one to open {world.name}.
        </p>
      )}

      <div className={styles.columns}>
        <section className={styles.levels} aria-labelledby="world-levels">
          <h2 id="world-levels">The levels</h2>
          <ol className={styles.levelList}>
            {world.levels.map((level, index) => {
              const state = ready ? levelStatus(progress, level.id) : "locked";
              const earned = progress[level.id]?.stars ?? 0;
              const isNext = summary?.next?.id === level.id;
              return (
                <li key={level.id} className={state === "locked" ? styles.levelLocked : undefined}>
                  {state === "locked" ? (
                    <span className={styles.level}>
                      <span className={styles.levelNumber}>
                        <LockIcon size={18} />
                      </span>
                      <span className={styles.levelText}>
                        <b>{level.title}</b>
                        <small>Finish the level before it to open this one</small>
                      </span>
                    </span>
                  ) : (
                    <Link className={`${styles.level}${isNext ? ` ${styles.levelNext}` : ""}`} href={levelHref(world.id, level.slug)}>
                      <span className={styles.levelNumber}>{state === "completed" ? <CheckIcon size={18} /> : index + 1}</span>
                      <span className={styles.levelText}>
                        <b>{level.title}</b>
                        <small>{state === "completed" ? `${earned} of 3 stars` : isNext ? "Play this next" : "Ready to play"}</small>
                      </span>
                      {state === "completed" ? <StarRow stars={earned} size="sm" /> : <PlayIcon size={20} />}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className={styles.side}>
          <section className={`${ui.card} ${styles.badgeCard}`} aria-labelledby="world-badge">
            <h2 id="world-badge">{world.badge.name}</h2>
            <span className={`${styles.medal}${complete ? ` ${styles.medalEarned}` : ""}`} aria-hidden="true">
              {complete ? <BadgeIcon size={56} /> : <LockIcon size={40} />}
            </span>
            <p>{complete ? "Earned — every level in this world is finished." : world.badge.description}</p>
          </section>

          {summary && summary.polish.length > 0 && (
            <section className={`${ui.card} ${styles.polish}`} aria-labelledby="world-polish">
              <h2 id="world-polish">Worth another go</h2>
              <p>These are finished, but not for three stars. Shorter programs and fewer hints earn more.</p>
              <ul>
                {summary.polish.map((level) => (
                  <li key={level.id}>
                    <Link href={levelHref(world.id, level.slug)}>
                      {level.title} <StarRow stars={progress[level.id]?.stars ?? 0} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${ui.card} ${styles.learn}`} aria-labelledby="world-learn">
            <p className={styles.learnKicker}>For grown-ups</p>
            <h2 id="world-learn">What this world teaches</h2>
            <p>{world.parents.summary}</p>
            <ul>
              {world.parents.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
