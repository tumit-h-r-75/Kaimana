"use client";

// The same problem for everybody, until midnight UTC.
//
// A library of four hundred problems is a hard place to start: "which one"
// is its own decision, and one that ends a lot of sessions before they
// begin. This removes the decision once a day, and — for anyone signed in —
// ties it to the streak they are already keeping, because a streak is the
// one reason people come back on a day they had not planned to.

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDailyProblem, type DailyProblem } from "@/lib/api/problems";
import styles from "./DailyProblemCard.module.css";

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON = {
  calendar: icon(<><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>),
  flame: icon(<path d="M12 3s5 4 5 8.5a5 5 0 0 1-10 0C7 9 9 8 9.5 6.5 10 8 12 8.5 12 3Z" />),
  check: icon(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  arrow: icon(<path d="M5 12h13m-5-5 5 5-5 5" />),
};

export function DailyProblemCard() {
  const [daily, setDaily] = useState<DailyProblem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDailyProblem()
      .then((next) => !cancelled && setDaily(next))
      // Silent on failure: this sits above the library, and the library is
      // what the page is for.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!daily?.problem) return null;
  const { problem } = daily;

  return (
    <section className={styles.card} aria-labelledby="daily-title">
      <div className={styles.head}>
        <span className={styles.icon}>{ICON.calendar}</span>
        <div>
          <p className={styles.kicker}>Problem of the day</p>
          <h2 id="daily-title">
            <Link href={`/problems/${problem.slug}`}>{problem.title}</Link>
          </h2>
        </div>
        {daily.streakDays > 0 && (
          <span className={`${styles.streak}${daily.solvedToday ? ` ${styles.streakOn}` : ""}`}>
            {ICON.flame} {daily.streakDays}-day streak
          </span>
        )}
      </div>

      {problem.excerpt && <p className={styles.excerpt}>{problem.excerpt}</p>}

      <div className={styles.facts}>
        <span className={`${styles.level} ${styles[`level_${problem.difficulty}`]}`}>{problem.difficulty.toLowerCase()}</span>
        {problem.tags.slice(0, 3).map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
        <span className={styles.rate}>
          {problem.acceptanceRate}% of {problem.submissionCount.toLocaleString()} attempts passed
        </span>
      </div>

      <div className={styles.actions}>
        {daily.solved ? (
          <>
            <span className={styles.done}>{ICON.check} You have solved this one</span>
            <Link className="button-outline button-small" href={`/problems/${problem.slug}`}>
              Open it again {ICON.arrow}
            </Link>
          </>
        ) : (
          <>
            <Link className="button button-small" href={`/problems/${problem.slug}`}>
              Solve today&apos;s problem {ICON.arrow}
            </Link>
            {daily.solvedToday ? (
              <span className={styles.note}>Today is already counted towards your streak.</span>
            ) : (
              <span className={styles.note}>Solve anything today to keep your streak.</span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
