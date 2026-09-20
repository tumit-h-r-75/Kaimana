"use client";

import { useReveal } from "@/hooks/useReveal";
import styles from "./loop.module.css";

/**
 * Section 2. The cycle, laid out as a cycle.
 *
 * A problem list is a list. What makes this different is what happens after
 * you submit, so the page shows that as a loop you come back around rather
 * than a feature grid you read once.
 */

const STEPS = [
  {
    n: "01",
    title: "Write it",
    body: "Four languages, starter code in each, and an editor that knows the problem you are on.",
    tag: "editor",
  },
  {
    n: "02",
    title: "Run it",
    body: "Check the samples as often as you like. Running costs nothing and tells you nothing you have not earned.",
    tag: "samples",
  },
  {
    n: "03",
    title: "Get judged",
    body: "Submit and every hidden test resolves one by one — with the failing case, the runtime, and a plain reason.",
    tag: "verdict",
  },
  {
    n: "04",
    title: "Hear why",
    body: "A nudge if you want one, the complexity you actually wrote, and a cleaner version of your own code.",
    tag: "coach",
  },
  {
    n: "05",
    title: "Go again",
    body: "Gems for the solve, a place on the board, and the next problem picked from whatever you are thinnest at.",
    tag: "repeat",
  },
] as const;

export function Loop() {
  const head = useReveal<HTMLDivElement>();

  return (
    <section className={styles.section} id="loop">
      <div className="section-shell">
        <div ref={head.ref} className={`${styles.head} ${head.className}`}>
          <p className={styles.kicker}>The loop</p>
          <h2>
            Solving is the easy half.
            <br />
            <span className={styles.accent}>Knowing why is the rest.</span>
          </h2>
          <p className={styles.lede}>
            Most sites stop at pass or fail. Everything interesting happens in the four steps
            after that, so this is built around them.
          </p>
        </div>

        <ol className={styles.rail}>
          {STEPS.map((s) => (
            <li key={s.n} className={styles.step}>
              <span className={styles.n}>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className={styles.tag}>{s.tag}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
