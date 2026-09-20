"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { IconPlus } from "./icons";
import styles from "./faq.module.css";

/**
 * Section 6. The questions people actually ask before signing up.
 *
 * Native <details> would be fewer lines, but its open state cannot be
 * animated and the marker is inconsistent across browsers. Controlled
 * state keeps one panel open at a time, which is what makes a list this
 * length readable.
 */

const QA = [
  {
    q: "Is any of this paid?",
    a: "No. Every problem, the judge, the AI coach, contests and the mock interviewer are free. Gems are earned by solving and spent on hints — they are a budget, not a currency you top up.",
  },
  {
    q: "Which languages can I use?",
    a: "Python, C++, JavaScript and TypeScript, each with starter code for the problem you are on. Submissions run on a real judge, not a simulation, so the timing you see is the timing that counts.",
  },
  {
    q: "Do the hints just give me the answer?",
    a: "Deliberately not. Tier one asks a question, tier two describes the approach, tier three gets close. The worked solution only unlocks after you have solved it yourself — before that it would just be the answer key.",
  },
  {
    q: "What does the AI actually look at?",
    a: "Your submitted code, not the problem statement. That is how it can tell you the complexity you actually wrote rather than the one the problem intended, and why the refactor it suggests is a version of yours.",
  },
  {
    q: "Is a contest different from practice?",
    a: "Only in who is watching. Same judge, same hidden tests, same verdicts — with a clock, penalty time for wrong submissions, and a board that moves while you type.",
  },
  {
    q: "I am new to this. Where do I start?",
    a: "Sign in and the library suggests one: an easy problem in a topic you have not touched, or whatever you left half-finished. You never have to pick from forty titles on your own.",
  },
] as const;

export function Faq() {
  const head = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className={styles.section}>
      <div className="section-shell">
        <div ref={head.ref} className={`${styles.head} ${head.className}`}>
          <p className={styles.kicker}>Before you start</p>
          <h2>Questions people ask.</h2>
        </div>

        <div className={styles.list}>
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`${styles.item} ${isOpen ? styles.isOpen : ""}`}>
                <button
                  type="button"
                  className={styles.q}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <i className={styles.mark} aria-hidden="true"><IconPlus size={14} /></i>
                </button>
                {/* Kept mounted and collapsed by grid rows so the height can
                    animate; display:none cannot be transitioned. */}
                <div className={styles.aWrap} hidden={!isOpen}>
                  <p className={styles.a}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
