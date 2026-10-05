"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  Code2,
  GraduationCap,
  LockKeyhole,
  Medal,
  Star,
} from "lucide-react";
import Link from "@/components/ui/Link";
import { MotionReveal } from "@/components/ui/MotionReveal";
import {
  MAX_STARS,
  TOTAL_LEVELS,
  WORLDS,
  levelHref,
} from "@/lib/kids/curriculum";
import type { World } from "@/lib/kids/types";
import {
  completedLevelCount,
  earnedBadges,
  isWorldComplete,
  isWorldUnlocked,
  levelStatus,
  nextLevelToPlay,
  totalStars,
  type ProgressMap,
} from "@/lib/kids/progress";
import { useKidsProgress } from "../useKidsProgress";
import learner from "@/public/images/young-learner.webp";
import styles from "./KidsHome.module.css";

const ICONS = [ArrowRight, Blocks, CircleCheck, Code2, GraduationCap];

function CourseModule({
  world,
  progress,
  currentWorld,
}: {
  world: World;
  progress: ProgressMap;
  currentWorld?: string;
}) {
  const completed = world.levels.filter(
    (level) => levelStatus(progress, level.id) === "completed",
  ).length;
  const unlocked = isWorldUnlocked(progress, world);
  const complete = isWorldComplete(progress, world);
  const Icon = ICONS[world.number - 1] ?? BookOpen;
  return (
    <article id={`world-${world.id}`} className={styles.module}>
      <div className={styles.moduleHeader}>
        <span className={styles.moduleIcon}>
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className={styles.moduleTitle}>
          <p>
            Module {String(world.number).padStart(2, "0")}{" "}
            <span>
              · {world.kind === "python" ? "Python" : "Visual puzzles"}
            </span>
          </p>
          <h3>{world.concept}</h3>
        </div>
        <span className={`${styles.state} ${complete ? styles.completed : ""}`}>
          {complete ? (
            <>
              <Check size={13} aria-hidden="true" /> Completed
            </>
          ) : unlocked ? (
            "Ready to learn"
          ) : (
            <>
              <LockKeyhole size={13} aria-hidden="true" /> Locked
            </>
          )}
        </span>
      </div>
      <p className={styles.moduleDescription}>{world.parents.summary}</p>
      <div className={styles.moduleMeta}>
        <span>
          {world.levels.length} lessons · {world.name}
        </span>
        <span>
          {completed}/{world.levels.length} completed
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={`${world.concept} lessons completed`}
        aria-valuemin={0}
        aria-valuemax={world.levels.length}
        aria-valuenow={completed}
      >
        <span
          style={{ width: `${(completed / world.levels.length) * 100}%` }}
        />
      </div>
      <details className={styles.lessons} open={currentWorld === world.id}>
        <summary>
          View lessons <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <ol>
          {world.levels.map((level, index) => {
            const state = levelStatus(progress, level.id);
            const stars = progress[level.id]?.stars ?? 0;
            const content = (
              <>
                <span className={styles.lessonNumber}>
                  {state === "completed" ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <span className={styles.lessonName}>{level.title}</span>
                <span className={styles.lessonEnd}>
                  {state === "locked" ? (
                    <LockKeyhole size={14} aria-hidden="true" />
                  ) : state === "completed" ? (
                    <>
                      <Star size={12} aria-hidden="true" /> {stars}/3
                    </>
                  ) : (
                    <ArrowUpRight size={16} aria-hidden="true" />
                  )}
                </span>
              </>
            );
            return (
              <li key={level.id}>
                {state === "locked" ? (
                  <div
                    className={styles.lessonLocked}
                    aria-label={`${level.title}, locked`}
                  >
                    {content}
                  </div>
                ) : (
                  <Link
                    id={`level-${level.id}`}
                    href={levelHref(world.id, level.slug)}
                    className={styles.lessonLink}
                    aria-label={`${level.title}, ${state === "completed" ? `${stars} of 3 stars` : "start lesson"}`}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </details>
      {!unlocked && world.number > 1 && (
        <p className={styles.lockNote}>
          <LockKeyhole size={12} aria-hidden="true" /> Complete{" "}
          {WORLDS[world.number - 2].concept.toLowerCase()} to unlock this
          module.
        </p>
      )}
    </article>
  );
}

export function KidsHome() {
  const { progress, status, error, retry } = useKidsProgress();
  const ready = status !== "loading";
  const scrolledToHash = useRef(false);
  const done = completedLevelCount(progress);
  const stars = totalStars(progress);
  const badges = earnedBadges(progress);
  const next = nextLevelToPlay(progress);
  const percentage = Math.round((done / TOTAL_LEVELS) * 100);

  useEffect(() => {
    if (!ready || scrolledToHash.current) return;
    scrolledToHash.current = true;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [ready]);

  const modules = (kind: "all" | "puzzle" | "python") => (
    <div className={styles.modules}>
      {WORLDS.filter((world) => kind === "all" || world.kind === kind).map(
        (world) => (
          <CourseModule
            key={world.id}
            world={world}
            progress={progress}
            currentWorld={next?.world.id}
          />
        ),
      )}
    </div>
  );

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="kids-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>
            <GraduationCap size={16} aria-hidden="true" /> Kaimana Kids{" "}
            <span>Ages 8–14</span>
          </p>
          <h1 id="kids-title">
            A curious mind.
            <br />A first line of code.
          </h1>
          <p className={styles.lead}>
            Learn to think things through, make something work, and try a new
            idea. Start with visual puzzles. Grow into real Python.
          </p>
          <div className={styles.actions}>
            {ready ? (
              <Link
                href={next ? levelHref(next.world.id, next.level.slug) : "#map"}
                className={styles.primary}
              >
                {!next
                  ? "Revisit your lessons"
                  : done
                    ? "Continue learning"
                    : "Start your first lesson"}{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className={styles.primary} disabled>
                Preparing your lessons
              </button>
            )}
            <a href="#map" className={styles.secondary}>
              Browse the course <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
          <p className={styles.heroNote}>
            {TOTAL_LEVELS} lessons <span>·</span> Five modules <span>·</span>{" "}
            Progress saved to your account
          </p>
        </div>
        <MotionReveal className={styles.heroVisual}>
          <div className={styles.heroPhoto}>
            <Image
              src={learner}
              alt="A young learner focusing on a laptop while wearing headphones"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 500px"
              placeholder="blur"
            />
          </div>
          <div className={styles.photoCaption}>
            <BookOpen size={15} aria-hidden="true" />
            <span>Room to explore. Space to make mistakes.</span>
          </div>
        </MotionReveal>
      </section>

      <section className={styles.progress} aria-label="Your learning progress">
        <div>
          <BookOpen size={18} aria-hidden="true" />
          <span>
            <b>
              {ready ? done : "—"}
              <small> / {TOTAL_LEVELS}</small>
            </b>
            Lessons completed
          </span>
        </div>
        <div>
          <Star size={18} aria-hidden="true" />
          <span>
            <b>
              {ready ? stars : "—"}
              <small> / {MAX_STARS}</small>
            </b>
            Stars earned
          </span>
        </div>
        <div>
          <Medal size={18} aria-hidden="true" />
          <span>
            <b>
              {ready ? badges.length : "—"}
              <small> / {WORLDS.length}</small>
            </b>
            Modules completed
          </span>
        </div>
        <div className={styles.overall}>
          <span>
            <b>{ready ? percentage : "—"}%</b>Through the course
          </span>
          <div className={styles.track}>
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </section>

      {error && (
        <div className={styles.notice} role="alert">
          <p>Your saved progress could not be refreshed. {error}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      <div className={styles.courseLayout}>
        <section
          id="map"
          className={styles.catalogue}
          aria-labelledby="course-title"
        >
          <div className={styles.sectionHead}>
            <p>Your learning path</p>
            <h2 id="course-title">One idea at a time.</h2>
            <span>
              Complete each lesson to unlock the next. Take as long as you need.
            </span>
          </div>
          {!ready ? (
            <div
              className={styles.loading}
              role="status"
              aria-label="Loading saved learning progress"
            >
              <span />
              <span />
              <span />
            </div>
          ) : (
            <Tabs.Root defaultValue="all">
              <Tabs.List className={styles.tabs} aria-label="Lesson type">
                <Tabs.Trigger className={styles.tab} value="all">
                  All modules <span>5</span>
                </Tabs.Trigger>
                <Tabs.Trigger className={styles.tab} value="puzzle">
                  <Blocks size={14} aria-hidden="true" /> Visual puzzles
                </Tabs.Trigger>
                <Tabs.Trigger className={styles.tab} value="python">
                  <Code2 size={14} aria-hidden="true" /> Python
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="all" className={styles.tabContent}>
                {modules("all")}
              </Tabs.Content>
              <Tabs.Content value="puzzle" className={styles.tabContent}>
                {modules("puzzle")}
              </Tabs.Content>
              <Tabs.Content value="python" className={styles.tabContent}>
                {modules("python")}
              </Tabs.Content>
            </Tabs.Root>
          )}
        </section>
        <aside className={styles.sidebar} aria-label="Learning guidance">
          <div className={styles.nextCard}>
            <p className={styles.sideKicker}>
              {next ? "Your next step" : "Course complete"}
            </p>
            <Code2 size={23} strokeWidth={1.5} aria-hidden="true" />
            <h3>{next?.level.title ?? "Keep experimenting."}</h3>
            <p>
              {next
                ? `Module ${next.world.number} · ${next.world.concept}`
                : "Replay a lesson and see if you can find a different solution."}
            </p>
            {ready && (
              <Link
                href={next ? levelHref(next.world.id, next.level.slug) : "#map"}
              >
                {next ? "Open lesson" : "Browse lessons"}{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className={styles.guidance}>
            <p className={styles.sideKicker}>For parents &amp; teachers</p>
            <h3>Learning you can follow.</h3>
            <p>
              The course moves from instructions and patterns to decisions,
              variables, and small Python programs.
            </p>
            <ul>
              <li>
                <Check size={14} aria-hidden="true" /> Hints when a learner gets
                stuck
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Every working solution
                counts
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Best scores saved
                automatically
              </li>
            </ul>
          </div>
          <div className={styles.achievements}>
            <p className={styles.sideKicker}>Module milestones</p>
            {WORLDS.map((world) => (
              <div key={world.id}>
                <span
                  className={
                    isWorldComplete(progress, world) ? styles.earned : undefined
                  }
                >
                  <Medal size={16} aria-hidden="true" />
                </span>
                <p>
                  <b>{world.concept}</b>
                  <small>
                    {ready && isWorldComplete(progress, world)
                      ? "Completed"
                      : "Complete the module"}
                  </small>
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
