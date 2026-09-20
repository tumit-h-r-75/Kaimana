"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecommendations, type Recommendations, type Suggestion } from "@/lib/api/problems";
import { useAuth } from "@/providers/AuthProvider";
import styles from "./NextUpCard.module.css";

/**
 * Answers "what should I open?" before the learner has to scan forty titles
 * and decide for themselves — which is where most sessions quietly end.
 *
 * Two cards, because they serve different moods: something half-finished to
 * go back to, and something new aimed at the topic they have covered least.
 * Each carries the sentence explaining the pick; a suggestion with no
 * visible reasoning is indistinguishable from a shuffle, and gets trusted
 * about as much.
 *
 * Renders nothing at all when signed out, still loading, or when there is
 * genuinely nothing to suggest. An empty box that says "no recommendations"
 * is worse than no box.
 */
export default function NextUpCard() {
  const { user, isLoading } = useAuth();
  const [data, setData] = useState<Recommendations | null>(null);

  useEffect(() => {
    if (!user) { setData(null); return; }
    let cancelled = false;
    getRecommendations()
      .then((result) => { if (!cancelled) setData(result); })
      // Silent: this is a helper above the real list, and the list is what
      // the page is for. A failed suggestion should not become an error
      // banner over a perfectly working problem library.
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading || !user || !data) return null;
  if (!data.resume && !data.next) return null;

  return (
    <section className={styles.wrap} aria-label="Suggested next steps">
      {data.resume && <Card kind="resume" item={data.resume} attempts={data.resume.attempts} />}
      {data.next && <Card kind="next" item={data.next} />}
      <p className={styles.stats}>
        {data.stats.solved} solved
        {data.focusTag && <> · thinnest topic: <b>{data.focusTag}</b></>}
        {" · "}working at <b>{data.stats.readyFor.toLowerCase()}</b>
      </p>
    </section>
  );
}

function Card({ kind, item, attempts }: { kind: "resume" | "next"; item: Suggestion; attempts?: number }) {
  return (
    <Link href={`/problems/${item.slug}`} className={`${styles.card} ${kind === "resume" ? styles.resume : ""}`}>
      <span className={styles.kicker}>
        {kind === "resume" ? "Pick up where you left off" : "Next up"}
        {attempts !== undefined && attempts > 1 && <i className={styles.count}>{attempts} tries</i>}
      </span>
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.reason}>{item.reason}</p>
      <div className={styles.meta}>
        <span className={`${styles.diff} ${styles[item.difficulty.toLowerCase()]}`}>{item.difficulty}</span>
        {item.tags.slice(0, 3).map((t) => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
        <span className={styles.go} aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
